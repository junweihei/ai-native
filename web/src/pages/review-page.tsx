import { useEffect, useState } from "react";
import { useDataSourceStatus } from "../data/data-source-context";
import {
  clearLocalDraft,
  readLocalDraft,
  saveLocalDraft,
} from "../data/local-draft";
import { WriteSubmissionPanel } from "./write-submission-panel";

function sessionDraft(taskId: string, artifactPath: string | undefined) {
  return [
    "---",
    `id: S-${taskId}-${Date.now()}`,
    "type: session",
    "status: learning",
    `task_id: ${taskId}`,
    `updated: ${new Date().toISOString().slice(0, 10)}`,
    `produces: ${artifactPath || ""}`,
    "passed_criteria: ",
    "failed_criteria: ",
    "unresolved_issue: ",
    "capability_change_evidence_ids: []",
    "next_action: ",
    "current_step: ",
    "blocker_type: ",
    "unlock_condition: ",
    "degraded_path: ",
    "safe_action: ",
    "---",
    "",
    "填写结束会话记录。未完成任务只能保持 learning 或明确 blocked。",
  ].join("\n");
}

function reviewDraft(taskId: string, scope: string) {
  return [
    "---",
    `id: R-${taskId}-${scope}-${Date.now()}`,
    "type: review",
    "status: draft",
    `task_id: ${taskId}`,
    `review_scope: ${scope}`,
    `updated: ${new Date().toISOString().slice(0, 10)}`,
    "next_task_id: ",
    "next_action: ",
    scope === "weekly" ? "primary_gap: " : null,
    scope === "monthly"
      ? "monthly_coverage: draw, explain, do, transfer, iterate"
      : null,
    "---",
    "",
    "补充 adjustment，或以 no_change_rationale 说明不调整及其证据。",
  ]
    .filter(Boolean)
    .join("\n");
}

export function ReviewPage() {
  const { today, loading, error, refresh } = useDataSourceStatus();
  const task =
    today?.context?.resolution === "resolved" ? today.context.task : null;
  const [scope, setScope] = useState("daily");
  const [sessionStatus, setSessionStatus] = useState<"learning" | "blocked">(
    "learning",
  );
  const [session, setSession] = useState("");
  const [review, setReview] = useState("");
  const sessionKey = task ? `learning-os:draft:session:${task.id}` : null;
  const reviewKey = task
    ? `learning-os:draft:review:${task.id}:${scope}`
    : null;
  const [loadedSessionKey, setLoadedSessionKey] = useState<string | null>(null);
  const [loadedReviewKey, setLoadedReviewKey] = useState<string | null>(null);

  useEffect(() => {
    if (!task || !sessionKey) return;
    setSession(
      readLocalDraft(
        sessionKey,
        sessionDraft(task.id, task.primary_artifacts[0]),
      ),
    );
    setLoadedSessionKey(sessionKey);
  }, [sessionKey, task]);

  useEffect(() => {
    if (!task || !reviewKey) return;
    setReview(readLocalDraft(reviewKey, reviewDraft(task.id, scope)));
    setLoadedReviewKey(reviewKey);
  }, [reviewKey, scope, task]);

  useEffect(() => {
    if (sessionKey && loadedSessionKey === sessionKey)
      saveLocalDraft(sessionKey, session);
  }, [loadedSessionKey, session, sessionKey]);

  useEffect(() => {
    if (reviewKey && loadedReviewKey === reviewKey)
      saveLocalDraft(reviewKey, review);
  }, [loadedReviewKey, review, reviewKey]);
  if (loading)
    return (
      <article className="paper" aria-busy="true">
        正在读取复盘上下文…
      </article>
    );
  if (error || !today || !task)
    return (
      <article className="paper state-panel">
        <h1>无法读取复盘上下文</h1>
        <button className="primary-action" type="button" onClick={refresh}>
          重新读取
        </button>
      </article>
    );
  const readOnly =
    today.access.mode === "read-only" || today.freshness.status !== "fresh";
  const sessionContent =
    session || sessionDraft(task.id, task.primary_artifacts[0]);
  const reviewContent = review || reviewDraft(task.id, scope);
  return (
    <article className="paper today-paper" aria-labelledby="page-title">
      <p className="eyebrow">结束会话与复盘 · {task.id}</p>
      <h1 id="page-title">记录续接点，而非猜测完成</h1>
      <p>
        草稿自动保存在本机浏览器；预览和确认成功前，任务状态、今日页和索引均不改变。
      </p>
      <section>
        <h2>结束会话</h2>
        <label>
          会话后任务状态
          <select
            aria-label="会话后任务状态"
            value={sessionStatus}
            disabled={readOnly}
            onChange={(event) =>
              setSessionStatus(event.target.value as "learning" | "blocked")
            }
          >
            <option value="learning">保持学习中</option>
            <option value="blocked">明确阻塞</option>
          </select>
        </label>
        {sessionStatus === "blocked" ? (
          <p className="notice notice-warning">
            blocked 记录必须填写 blocker_type、unlock_condition、degraded_path
            和 safe_action；不会计入完成。
          </p>
        ) : null}
        <textarea
          aria-label="结束会话 Markdown 草稿"
          rows={14}
          value={sessionContent}
          disabled={readOnly}
          onChange={(event) => setSession(event.target.value)}
        />
        <WriteSubmissionPanel
          taskId={task.id}
          sourceRevision={today.source.revision}
          targetPath={`content/sessions/${task.id}-session.md`}
          content={sessionContent}
          completionRules={[]}
          allChecksComplete={false}
          readOnly={readOnly}
          objectType="session"
          requestedTaskStatus={sessionStatus}
          onCommitted={() => {
            if (sessionKey) clearLocalDraft(sessionKey);
            setLoadedSessionKey(null);
          }}
        />
      </section>
      <section>
        <h2>复盘</h2>
        <label>
          范围{" "}
          <select
            aria-label="复盘范围"
            value={scope}
            disabled={readOnly}
            onChange={(event) => {
              setScope(event.target.value);
              setReview("");
            }}
          >
            <option value="daily">日复盘</option>
            <option value="weekly">周复盘</option>
            <option value="monthly">月复盘</option>
          </select>
        </label>
        <textarea
          aria-label="复盘 Markdown 草稿"
          rows={14}
          value={reviewContent}
          disabled={readOnly}
          onChange={(event) => setReview(event.target.value)}
        />
        <WriteSubmissionPanel
          taskId={task.id}
          sourceRevision={today.source.revision}
          targetPath={`content/evidence/${task.id}-${scope}-review.md`}
          content={reviewContent}
          completionRules={[]}
          allChecksComplete={false}
          readOnly={readOnly}
          objectType="review"
          onCommitted={() => {
            if (reviewKey) clearLocalDraft(reviewKey);
            setLoadedReviewKey(null);
          }}
        />
      </section>
    </article>
  );
}
