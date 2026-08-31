import { createHash, randomUUID } from "node:crypto";
import { glob, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import type {
  WritePreviewRequest,
  WriteResult,
  WriteTargetPreview,
} from "../shared/data-contract.js";

const runFile = promisify(execFile);
const ACTIVE_ROOTS = [
  "content/knowledge/",
  "content/cases/",
  "content/practice/",
  "content/projects/",
  "content/evidence/",
  "content/sessions/",
];
const INTENT_TTL_MS = 10 * 60 * 1000;

interface StoredTarget {
  preview: WriteTargetPreview;
  content: string;
  before: string | null;
}

interface StoredIntent {
  request: WritePreviewRequest;
  targets: StoredTarget[];
  expiresAt: number;
  sourceRevision: string;
  taskStatusPath: string | null;
  taskStatusBefore: string | null;
  taskStatusContent: string | null;
}

interface IndexTask {
  primary_artifacts?: string[];
  completion_rules?: string[];
  evidence_requirements?: string[];
}

interface IndexShape {
  source_revision?: string;
  freshness?: { status?: string };
  current_context?: {
    resolution?: string;
    source_path?: string;
    task?: IndexTask;
  };
}

class WriteProblem extends Error {
  constructor(
    readonly code: WriteResult["code"],
    message: string,
    readonly recovery: WriteResult["recovery"],
  ) {
    super(message);
  }
}

export function classifyWriteFailure(
  error: unknown,
): "permission_denied" | "write_failed" {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return code === "EACCES" || code === "EPERM"
    ? "permission_denied"
    : "write_failed";
}

function revision(content: string | null) {
  return content === null
    ? null
    : "sha256:" + createHash("sha256").update(content).digest("hex");
}

function countDiff(before: string, after: string) {
  const left = new Set(before.split("\n"));
  const right = new Set(after.split("\n"));
  return {
    addedLines: [...right].filter((line) => !left.has(line)).length,
    removedLines: [...left].filter((line) => !right.has(line)).length,
  };
}

function frontmatterValue(content: string, field: string) {
  const match = content.match(
    new RegExp("^" + field + ":[ \\t]*(.*)[ \\t]*$", "m"),
  );
  return match?.[1]?.trim() || null;
}

function updateFrontmatterStatus(content: string, status: string) {
  if (!content.startsWith("---\n")) {
    throw new WriteProblem(
      "validation_failed",
      "任务映射缺少 frontmatter，未写入。",
      ["reload"],
    );
  }
  if (/^current_status:\s*.+$/m.test(content)) {
    return content.replace(
      /^current_status:\s*.+$/m,
      "current_status: " + status,
    );
  }
  return content.replace(/^---$/m, "---\ncurrent_status: " + status);
}

export interface SafeWriteCoordinatorOptions {
  repoRoot?: string;
  rebuildIndex?: () => Promise<void>;
  now?: () => number;
}

export class SafeWriteCoordinator {
  private readonly intents = new Map<string, StoredIntent>();
  private readonly repoRoot: string;
  private readonly rebuildIndex: () => Promise<void>;
  private readonly now: () => number;

  constructor(options: SafeWriteCoordinatorOptions = {}) {
    this.repoRoot = options.repoRoot ?? process.cwd();
    this.now = options.now ?? Date.now;
    this.rebuildIndex =
      options.rebuildIndex ??
      (async () => {
        await runFile(
          "python",
          ["tools/content_index/build_learning_index.py"],
          {
            cwd: this.repoRoot,
          },
        );
      });
  }

  private async index(): Promise<IndexShape> {
    const config = JSON.parse(
      await readFile(
        resolve(this.repoRoot, "config/learning-content.json"),
        "utf8",
      ),
    ) as { generated_index: string };
    return JSON.parse(
      await readFile(resolve(this.repoRoot, config.generated_index), "utf8"),
    ) as IndexShape;
  }

  private async protectedPaths() {
    const config = JSON.parse(
      await readFile(
        resolve(this.repoRoot, "config/learning-content.json"),
        "utf8",
      ),
    ) as { controlled_materials_manifest: string };
    const manifest = JSON.parse(
      await readFile(
        resolve(this.repoRoot, config.controlled_materials_manifest),
        "utf8",
      ),
    ) as { materials?: Array<{ paths?: string[] }> };
    const paths = new Set<string>();
    for (const material of manifest.materials ?? []) {
      for (const pattern of material.paths ?? []) {
        for await (const match of glob(pattern, { cwd: this.repoRoot })) {
          paths.add(match.replaceAll("\\", "/"));
        }
      }
    }
    return paths;
  }

  private resolvePath(path: string) {
    const normalized = path.replaceAll("\\", "/");
    const absolute = resolve(this.repoRoot, normalized);
    const local = relative(this.repoRoot, absolute).replaceAll("\\", "/");
    if (
      !normalized ||
      normalized !== local ||
      isAbsolute(normalized) ||
      local.startsWith("../") ||
      !ACTIVE_ROOTS.some((root) => local.startsWith(root))
    ) {
      throw new WriteProblem(
        "path_forbidden",
        "目标路径不在允许的活动内容目录中。",
        ["copy", "repreview"],
      );
    }
    return { absolute, local };
  }

  private async readOptional(path: string) {
    try {
      return await readFile(path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  private validateContent(
    target: WritePreviewRequest["targets"][number],
    taskId: string,
  ) {
    if (!target.content.startsWith("---\n")) {
      throw new WriteProblem(
        "validation_failed",
        "成果必须包含 frontmatter。",
        ["copy", "repreview"],
      );
    }
    if (frontmatterValue(target.content, "type") !== target.objectType) {
      throw new WriteProblem(
        "validation_failed",
        "成果类型与目标对象不匹配。",
        ["copy", "repreview"],
      );
    }
    if (frontmatterValue(target.content, "task_id") !== taskId) {
      throw new WriteProblem("validation_failed", "成果必须绑定当前任务。", [
        "copy",
        "repreview",
      ]);
    }
    if (
      !frontmatterValue(target.content, "status") ||
      !frontmatterValue(target.content, "updated")
    ) {
      throw new WriteProblem(
        "validation_failed",
        "成果缺少 status 或 updated 字段。",
        ["copy", "repreview"],
      );
    }
  }

  private validateWorkflowTarget(
    target: WritePreviewRequest["targets"][number],
    location: string,
    currentTaskId: string,
  ) {
    const required = (fields: string[], message: string) => {
      if (fields.some((field) => !frontmatterValue(target.content, field)))
        throw new WriteProblem("validation_failed", message, [
          "copy",
          "repreview",
        ]);
    };
    if (target.objectType === "session") {
      if (!location.startsWith("content/sessions/"))
        throw new WriteProblem(
          "path_forbidden",
          "会话只能写入 content/sessions/。",
          ["copy", "repreview"],
        );
      required(
        [
          "produces",
          "passed_criteria",
          "failed_criteria",
          "unresolved_issue",
          "capability_change_evidence_ids",
          "next_action",
        ],
        "结束会话必须记录成果路径、通过/未通过标准、未解决问题、能力证据和下一续接点。",
      );
      if (
        target.content.includes("capability_change_evidence_ids: []") ||
        target.content.includes("capability_change_evidence_ids: null")
      )
        throw new WriteProblem(
          "validation_failed",
          "能力变化证据缺失；会话草稿保留，任务状态不会提前更新。",
          ["copy", "repreview"],
        );
    }
    if (target.objectType === "review") {
      if (!location.startsWith("content/evidence/"))
        throw new WriteProblem(
          "path_forbidden",
          "复盘只能写入 content/evidence/。",
          ["copy", "repreview"],
        );
      const scope = frontmatterValue(target.content, "review_scope");
      if (!scope || !["daily", "weekly", "monthly"].includes(scope))
        throw new WriteProblem(
          "validation_failed",
          "复盘必须声明 daily、weekly 或 monthly 范围。",
          ["copy", "repreview"],
        );
      required(["next_action"], "复盘没有下一行动，不能完成。");
      if (
        !frontmatterValue(target.content, "adjustment") &&
        !frontmatterValue(target.content, "no_change_rationale")
      )
        throw new WriteProblem(
          "validation_failed",
          "复盘必须有计划调整，或提供不调整及其证据。",
          ["copy", "repreview"],
        );
      if (scope === "weekly")
        required(["primary_gap"], "周复盘必须指出一个最大差距。");
      if (scope === "monthly") {
        const coverage =
          frontmatterValue(target.content, "monthly_coverage") || "";
        if (
          !["draw", "explain", "do", "transfer", "iterate"].every((item) =>
            coverage.includes(item),
          )
        )
          throw new WriteProblem(
            "validation_failed",
            "月复盘必须覆盖能画、能讲、能做、能迁移、能迭代。",
            ["copy", "repreview"],
          );
      }
      const nextTask = frontmatterValue(target.content, "next_task_id");
      if (nextTask && nextTask !== currentTaskId)
        throw new WriteProblem(
          "validation_failed",
          "证据缺口只能链接当前已计划任务，系统不会自动创建任务。",
          ["copy", "repreview"],
        );
    }
  }
  private result(
    code: WriteResult["code"],
    message: string,
    intentId: string | null,
    targets: WriteTargetPreview[],
    sourceRevision: string | null,
    recovery: WriteResult["recovery"],
    authoritativeChanged = false,
    taskStatusChanged = false,
  ): WriteResult {
    return {
      code,
      message,
      intentId,
      authoritativeChanged,
      taskStatusChanged,
      capabilityChanged: false,
      draftPreserved: code !== "committed" && code !== "no_changes",
      recovery,
      targets,
      sourceRevision,
    };
  }

  async preview(request: WritePreviewRequest): Promise<WriteResult> {
    try {
      const index = await this.index();
      const context = index.current_context;
      const task = context?.task;
      if (
        index.freshness?.status !== "fresh" ||
        !index.source_revision ||
        index.source_revision !== request.sourceRevision ||
        context?.resolution !== "resolved" ||
        !task
      ) {
        throw new WriteProblem(
          "validation_failed",
          "索引已过期、未知或任务关系不完整。",
          ["reload", "copy"],
        );
      }
      if (!request.targets.length || request.targets.length > 2) {
        throw new WriteProblem(
          "validation_failed",
          "一次确认必须包含一到两个成果目标。",
          ["copy", "repreview"],
        );
      }

      const protectedPaths = await this.protectedPaths();
      const previews: StoredTarget[] = [];
      let includesArtifact = false;
      let includesIndependentEvidence = false;
      for (const target of request.targets) {
        const location = this.resolvePath(target.path);
        if (protectedPaths.has(location.local)) {
          throw new WriteProblem(
            "path_forbidden",
            "受控材料不能通过普通写回修改。",
            ["copy", "repreview"],
          );
        }
        this.validateContent(target, request.taskId);
        if (target.objectType === "artifact") {
          includesArtifact = true;
          if (!(task.primary_artifacts ?? []).includes(location.local)) {
            throw new WriteProblem(
              "path_forbidden",
              "成果路径不是当前任务指定的主要成果。",
              ["copy", "repreview"],
            );
          }
        } else if (target.objectType === "evidence") {
          if (!location.local.startsWith("content/evidence/")) {
            throw new WriteProblem(
              "path_forbidden",
              "证据必须写入 content/evidence/。",
              ["copy", "repreview"],
            );
          }
          const independence = frontmatterValue(target.content, "independence");
          includesIndependentEvidence = Boolean(
            independence && independence !== "self_check",
          );
        }
        this.validateWorkflowTarget(target, location.local, request.taskId);
        if (
          request.requestedTaskStatus === "blocked" &&
          target.objectType === "session" &&
          [
            "blocker_type",
            "unlock_condition",
            "degraded_path",
            "safe_action",
          ].some((field) => !frontmatterValue(target.content, field))
        ) {
          throw new WriteProblem(
            "validation_failed",
            "blocked 必须记录卡点类型、解除条件、降级路径和可继续的安全动作。",
            ["copy", "repreview"],
          );
        }
        const before = await this.readOptional(location.absolute);
        if (
          target.baseRevision !== null &&
          revision(before) !== target.baseRevision
        ) {
          throw new WriteProblem(
            "conflict",
            "目标内容已变化，请重新加载后预览。",
            ["reload", "copy", "repreview"],
          );
        }
        const difference = countDiff(before ?? "", target.content);
        previews.push({
          before,
          content: target.content,
          preview: {
            objectType: target.objectType,
            path: location.local,
            baseRevision: target.baseRevision,
            currentRevision: revision(before),
            addedLines: difference.addedLines,
            removedLines: difference.removedLines,
            templateRequirement:
              target.objectType === "artifact"
                ? "当前任务指定的主要成果与其 frontmatter 结构"
                : "Evidence frontmatter，且 verified 需要独立性说明",
          },
        });
      }

      const rules = task.completion_rules ?? [];
      const allRulesChecked =
        rules.length > 0 &&
        rules.every((rule) => request.completionChecks.includes(rule));
      if (
        request.requestedTaskStatus === "completed" &&
        (!includesArtifact || !allRulesChecked)
      ) {
        throw new WriteProblem(
          "validation_failed",
          "completed 需要主要成果存在并通过全部完成规则。",
          ["copy", "repreview"],
        );
      }
      if (
        request.requestedTaskStatus === "verified" &&
        !includesIndependentEvidence
      ) {
        throw new WriteProblem(
          "validation_failed",
          "verified 需要后续独立证据，self_check 不足以验证。",
          ["copy", "repreview"],
        );
      }

      const noChanges = previews.every(
        (item) =>
          item.preview.addedLines === 0 && item.preview.removedLines === 0,
      );
      if (noChanges && !request.requestedTaskStatus) {
        return this.result(
          "no_changes",
          "内容没有变化，未写入权威文件。",
          null,
          previews.map((item) => item.preview),
          index.source_revision,
          ["copy"],
        );
      }

      const intentId = randomUUID();
      const mappingPath = context.source_path
        ? resolve(this.repoRoot, context.source_path)
        : null;
      const mapping = mappingPath ? await this.readOptional(mappingPath) : null;
      this.intents.set(intentId, {
        request,
        targets: previews,
        expiresAt: this.now() + INTENT_TTL_MS,
        sourceRevision: index.source_revision,
        taskStatusPath: mappingPath,
        taskStatusBefore: mapping,
        taskStatusContent:
          mapping && request.requestedTaskStatus
            ? updateFrontmatterStatus(mapping, request.requestedTaskStatus)
            : null,
      });
      return this.result(
        "preview_ready",
        "差异预览已生成；确认后才会写入。",
        intentId,
        previews.map((item) => item.preview),
        index.source_revision,
        ["copy", "repreview"],
      );
    } catch (error) {
      if (error instanceof WriteProblem) {
        return this.result(
          error.code,
          error.message,
          null,
          [],
          null,
          error.recovery,
        );
      }
      return this.result(
        "temporarily_unavailable",
        "预览服务暂时不可用，草稿未丢失。",
        null,
        [],
        null,
        ["copy", "retry"],
      );
    }
  }

  async confirm(intentId: string): Promise<WriteResult> {
    const intent = this.intents.get(intentId);
    if (!intent || intent.expiresAt < this.now()) {
      this.intents.delete(intentId);
      return this.result(
        "confirmation_expired",
        "确认已失效，请重新预览。",
        null,
        [],
        null,
        ["copy", "repreview"],
      );
    }
    try {
      const index = await this.index();
      if (
        index.freshness?.status !== "fresh" ||
        index.source_revision !== intent.sourceRevision
      ) {
        throw new WriteProblem(
          "conflict",
          "来源版本已变化，请重新加载并预览。",
          ["reload", "copy", "repreview"],
        );
      }
      const writes: Array<{
        path: string;
        before: string | null;
        after: string;
      }> = [];
      for (const item of intent.targets) {
        const absolute = resolve(this.repoRoot, item.preview.path);
        const current = await this.readOptional(absolute);
        if (revision(current) !== item.preview.currentRevision) {
          throw new WriteProblem("conflict", "目标内容已被其他操作修改。", [
            "reload",
            "copy",
            "repreview",
          ]);
        }
        writes.push({ path: absolute, before: current, after: item.content });
      }
      if (intent.taskStatusPath && intent.taskStatusContent !== null) {
        const current = await this.readOptional(intent.taskStatusPath);
        if (current === null)
          throw new WriteProblem("conflict", "任务映射不可用。", [
            "reload",
            "copy",
          ]);
        if (current !== intent.taskStatusBefore)
          throw new WriteProblem("conflict", "任务映射已被其他操作修改。", [
            "reload",
            "copy",
            "repreview",
          ]);
        writes.push({
          path: intent.taskStatusPath,
          before: current,
          after: intent.taskStatusContent,
        });
      }

      const staged: Array<{
        temp: string;
        path: string;
        before: string | null;
      }> = [];
      try {
        for (const write of writes) {
          const temp = write.path + ".learning-os-" + randomUUID() + ".tmp";
          await writeFile(temp, write.after, "utf8");
          staged.push({ temp, path: write.path, before: write.before });
        }
        for (const file of staged) await rename(file.temp, file.path);
      } catch (error) {
        for (const file of staged) {
          try {
            if (file.before === null) await unlink(file.path);
            else await writeFile(file.path, file.before, "utf8");
            await unlink(file.temp).catch(() => undefined);
          } catch {
            // Preserve the original write error after best-effort rollback.
          }
        }
        throw error;
      }

      try {
        await this.rebuildIndex();
      } catch {
        this.intents.delete(intentId);
        return this.result(
          "committed_index_stale",
          "Markdown 已写入，但索引重建失败；网站应保持只读。",
          intentId,
          intent.targets.map((item) => item.preview),
          intent.sourceRevision,
          ["retry", "reload"],
          true,
          Boolean(
            intent.taskStatusContent &&
            intent.taskStatusContent !== intent.taskStatusBefore,
          ),
        );
      }
      this.intents.delete(intentId);
      return this.result(
        "committed",
        "成果已写入并重建索引。",
        intentId,
        intent.targets.map((item) => item.preview),
        intent.sourceRevision,
        [],
        true,
        Boolean(
          intent.taskStatusContent &&
          intent.taskStatusContent !== intent.taskStatusBefore,
        ),
      );
    } catch (error) {
      if (error instanceof WriteProblem) {
        return this.result(
          error.code,
          error.message,
          intentId,
          intent.targets.map((item) => item.preview),
          intent.sourceRevision,
          error.recovery,
        );
      }
      if (classifyWriteFailure(error) === "permission_denied") {
        return this.result(
          "permission_denied",
          "权限不足，权威文件未改变；请修复目录权限后重试。",
          intentId,
          intent.targets.map((item) => item.preview),
          intent.sourceRevision,
          ["copy", "retry", "reload"],
        );
      }
      return this.result(
        "write_failed",
        "写入失败，权威文件已回滚；草稿仍可复制或重试。",
        intentId,
        intent.targets.map((item) => item.preview),
        intent.sourceRevision,
        ["copy", "retry", "reload"],
      );
    }
  }
}
