import { useState } from "react";
import type { WriteResult, WriteTargetInput } from "../../shared/data-contract";

export function WriteSubmissionPanel({
  taskId,
  sourceRevision,
  targetPath,
  content,
  completionRules,
  allChecksComplete,
  readOnly,
  objectType = "artifact",
  requestedTaskStatus,
  onCommitted,
}: {
  taskId: string;
  sourceRevision: string | null;
  targetPath: string | undefined;
  content: string;
  completionRules: string[];
  allChecksComplete: boolean;
  readOnly: boolean;
  objectType?: WriteTargetInput["objectType"];
  requestedTaskStatus?: "learning" | "blocked" | "completed" | "verified";
  onCommitted?: () => void;
}) {
  const [result, setResult] = useState<WriteResult | null>(null);
  const [busy, setBusy] = useState(false);

  const preview = async () => {
    if (!sourceRevision || !targetPath || !content.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/v1/writes/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          sourceRevision,
          targets: [
            {
              objectType,
              path: targetPath,
              content,
              baseRevision: null,
            },
          ],
          completionChecks: allChecksComplete ? completionRules : [],
          requestedTaskStatus:
            requestedTaskStatus ??
            (allChecksComplete ? "completed" : undefined),
        }),
      });
      setResult((await response.json()) as WriteResult);
    } catch {
      setResult({
        code: "temporarily_unavailable",
        message: "预览服务暂时不可用；草稿仍保留在本机。",
        intentId: null,
        authoritativeChanged: false,
        taskStatusChanged: false,
        capabilityChanged: false,
        draftPreserved: true,
        recovery: ["copy", "retry"],
        targets: [],
        sourceRevision: null,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!result?.intentId) return;
    setBusy(true);
    try {
      const response = await fetch(
        "/api/v1/writes/" + encodeURIComponent(result.intentId) + "/confirm",
        { method: "POST" },
      );
      const nextResult = (await response.json()) as WriteResult;
      setResult(nextResult);
      if (nextResult.code === "committed" || nextResult.code === "no_changes") {
        onCommitted?.();
      }
    } catch {
      setResult({
        code: "temporarily_unavailable",
        message:
          "确认服务暂时不可用；权威文件是否改变尚未确认，请重新加载索引后重试。",
        intentId: null,
        authoritativeChanged: false,
        taskStatusChanged: false,
        capabilityChanged: false,
        draftPreserved: true,
        recovery: ["copy", "retry", "reload"],
        targets: [],
        sourceRevision: null,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="write-submission" aria-label="成果安全写回">
      <h2>提交成果</h2>
      <p>目标：{targetPath ?? "当前任务未指定主要成果路径"}</p>
      <p>
        结构：当前任务指定的主要成果及其
        frontmatter；提交前会校验路径、差异与完成规则。
      </p>
      <button
        className="secondary-action"
        type="button"
        disabled={readOnly || busy || !targetPath || !content.trim()}
        onClick={preview}
      >
        {busy ? "正在生成预览…" : "预览成果差异"}
      </button>
      {result ? (
        <div className="write-result" role="status">
          <strong>{result.message}</strong>
          <p>
            权威文件：{result.authoritativeChanged ? "已改变" : "未改变"}
            ；任务状态：{result.taskStatusChanged ? "已按规则更新" : "未更新"}
            ；能力等级不会自动改变。
          </p>
          {result.targets.map((target) => (
            <p key={target.path}>
              {target.path} · 新增 {target.addedLines} 行，移除{" "}
              {target.removedLines} 行 · {target.templateRequirement}
            </p>
          ))}
          {result.intentId && result.code === "preview_ready" ? (
            <button
              className="primary-action"
              type="button"
              disabled={busy}
              onClick={confirm}
            >
              确认写入成果
            </button>
          ) : null}
          {result.recovery.length ? (
            <p>恢复方式：{result.recovery.join("、")}</p>
          ) : null}
          {result.draftPreserved ? (
            <button
              className="secondary-action"
              type="button"
              onClick={() => navigator.clipboard.writeText(content)}
            >
              复制当前草稿
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
