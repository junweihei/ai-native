import { createHash, randomUUID } from "node:crypto";
import { glob, readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import type {
  ControlledOpenResult,
  FirstVersionReceipt,
} from "../shared/data-contract.js";

interface FirstVersionRecord {
  taskId: string;
  sourceRevision: string;
}
interface MaterialPolicy {
  control_id: string;
  safe_category: string;
  task_id: string;
  condition: string;
  paths: string[];
}

export interface ControlledBroker {
  registerFirstVersion(input: {
    taskId: string;
    sourceRevision: string;
    content: string;
  }): Promise<FirstVersionReceipt>;
  open(input: {
    controlId: string;
    taskId: string;
    sourceRevision: string;
    firstVersionId: string;
  }): Promise<ControlledOpenResult>;
}

export class RepositoryControlledBroker implements ControlledBroker {
  private readonly firstVersions = new Map<string, FirstVersionRecord>();

  constructor(private readonly repoRoot = process.cwd()) {}

  async registerFirstVersion(input: {
    taskId: string;
    sourceRevision: string;
    content: string;
  }): Promise<FirstVersionReceipt> {
    if (!input.taskId || !input.sourceRevision || !input.content.trim()) {
      throw new Error("invalid_first_version");
    }
    const versionId = randomUUID();
    const recordedAt = new Date().toISOString();
    const contentHash = createHash("sha256")
      .update(input.content)
      .digest("hex");
    this.firstVersions.set(versionId, {
      taskId: input.taskId,
      sourceRevision: input.sourceRevision,
    });
    return { versionId, recordedAt, contentHash };
  }

  async open(input: {
    controlId: string;
    taskId: string;
    sourceRevision: string;
    firstVersionId: string;
  }): Promise<ControlledOpenResult> {
    const decidedAt = new Date().toISOString();
    const locked = (reason: string): ControlledOpenResult => ({
      decision: "locked",
      reason,
      decidedAt,
      items: [],
    });
    const first = this.firstVersions.get(input.firstVersionId);
    if (
      !first ||
      first.taskId !== input.taskId ||
      first.sourceRevision !== input.sourceRevision
    ) {
      return locked("首次独立版本未在当前来源版本登记");
    }
    const config = JSON.parse(
      await readFile(
        resolve(this.repoRoot, "config/learning-content.json"),
        "utf8",
      ),
    ) as { generated_index: string; controlled_materials_manifest: string };
    const index = JSON.parse(
      await readFile(resolve(this.repoRoot, config.generated_index), "utf8"),
    ) as { source_revision?: string; freshness?: { status?: string } };
    if (
      index.source_revision !== input.sourceRevision ||
      index.freshness?.status !== "fresh"
    ) {
      return locked("索引不是最新版本，受控材料保持锁定");
    }
    const manifest = JSON.parse(
      await readFile(
        resolve(this.repoRoot, config.controlled_materials_manifest),
        "utf8",
      ),
    ) as { materials: MaterialPolicy[] };
    const policy = manifest.materials.find(
      (item) =>
        item.control_id === input.controlId && item.task_id === input.taskId,
    );
    if (!policy) return locked("未找到与当前任务匹配的开放策略");
    const paths: string[] = [];
    for (const pattern of policy.paths) {
      for await (const match of glob(pattern, { cwd: this.repoRoot }))
        paths.push(match);
    }
    const items = [];
    for (const [index, path] of [...new Set(paths)].entries()) {
      const absolute = resolve(this.repoRoot, path);
      const local = relative(this.repoRoot, absolute);
      if (local.startsWith("..") || isAbsolute(local))
        return locked("受控材料定位超出仓库边界");
      items.push({
        label: policy.safe_category + " " + String(index + 1),
        content: await readFile(absolute, "utf8"),
      });
    }
    return items.length
      ? {
          decision: "available",
          reason: "开放条件已按当前来源版本验证",
          decidedAt,
          items,
        }
      : locked("策略允许的材料当前不可用");
  }
}
