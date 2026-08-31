import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  ControlledOpenResult,
  FirstVersionReceipt,
} from "../../shared/data-contract";
import { useDataSourceStatus } from "../data/data-source-context";
import {
  clearLocalDraft,
  readLocalDraft,
  saveLocalDraft,
} from "../data/local-draft";
import { WriteSubmissionPanel } from "./write-submission-panel";

const protocolLabels = {
  locate: "定位任务与结果",
  closed_book_first_pass: "闭卷首做并保留首次版本",
  specified_input: "只读指定输入",
  active_processing: "主动加工",
  artifact: "形成成果",
  self_check: "按标准自检",
  single_issue_revision: "只修一个问题",
  close: "收尾并记录续接点",
} as const;

function initialArtifact(taskId: string) {
  const updated = new Date().toISOString().slice(0, 10);
  return [
    "---",
    `id: ART-${taskId}`,
    "type: artifact",
    `task_id: ${taskId}`,
    "status: learning",
    `updated: ${updated}`,
    "---",
    "",
    "在这里填写成果正文。",
    "",
  ].join("\n");
}

export function TaskWorkspacePage({
  taskId,
  resume,
  next,
}: {
  taskId: string | undefined;
  resume: string | null;
  next: string | null;
}) {
  const { today, loading, error, refresh } = useDataSourceStatus();
  const task =
    today?.context?.resolution === "resolved" ? today.context.task : null;
  const matchesTask = Boolean(task && task.id === taskId);
  const targetPath = matchesTask ? task?.primary_artifacts[0] : undefined;
  const draftKey =
    matchesTask && targetPath
      ? `learning-os:draft:artifact:${taskId}:${targetPath}`
      : null;
  const checksKey = matchesTask ? `learning-os:draft:checks:${taskId}` : null;
  const [draft, setDraft] = useState("");
  const [checks, setChecks] = useState<string[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [controlledResults, setControlledResults] = useState<
    Record<
      string,
      {
        receipt?: FirstVersionReceipt;
        result?: ControlledOpenResult;
        error?: string;
      }
    >
  >({});
  const [controlledBusy, setControlledBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!task || !draftKey || !checksKey) return;
    setDraft(readLocalDraft(draftKey, initialArtifact(task.id)));
    try {
      const savedChecks = window.localStorage.getItem(checksKey);
      setChecks(savedChecks ? (JSON.parse(savedChecks) as string[]) : []);
    } catch {
      setChecks([]);
    }
    setLoadedKey(draftKey);
  }, [checksKey, draftKey, task]);

  useEffect(() => {
    if (draftKey && loadedKey === draftKey) saveLocalDraft(draftKey, draft);
  }, [draft, draftKey, loadedKey]);

  useEffect(() => {
    if (!checksKey || !draftKey || loadedKey !== draftKey) return;
    try {
      window.localStorage.setItem(checksKey, JSON.stringify(checks));
    } catch {
      // The visible controls remain usable when browser storage is unavailable.
    }
  }, [checks, checksKey, draftKey, loadedKey]);

  const registerAndOpen = async (controlId: string) => {
    if (!task || !today?.source.revision || !draft.trim()) return;
    setControlledBusy(controlId);
    try {
      const receiptResponse = await fetch("/api/v1/drafts/first-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          sourceRevision: today.source.revision,
          content: draft,
        }),
      });
      if (!receiptResponse.ok) throw new Error("首次版本登记失败");
      const receipt = (await receiptResponse.json()) as FirstVersionReceipt;
      saveLocalDraft(`learning-os:first-version:${receipt.versionId}`, draft);
      const openResponse = await fetch(
        `/api/v1/controlled/${encodeURIComponent(controlId)}/open`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: task.id,
            sourceRevision: today.source.revision,
            firstVersionId: receipt.versionId,
          }),
        },
      );
      const result = (await openResponse.json()) as ControlledOpenResult;
      setControlledResults((current) => ({
        ...current,
        [controlId]: { receipt, result },
      }));
    } catch {
      setControlledResults((current) => ({
        ...current,
        [controlId]: {
          error: "受控材料仍保持锁定；首次版本草稿未写入权威状态，可重试。",
        },
      }));
    } finally {
      setControlledBusy(null);
    }
  };

  if (loading) {
    return (
      <article className="paper" aria-busy="true">
        正在读取任务工作台…
      </article>
    );
  }
  if (error || !today || !task || !matchesTask) {
    return (
      <article className="paper state-panel">
        <p className="eyebrow">任务工作台</p>
        <h1>无法安全打开此任务</h1>
        <p>
          任务必须与当前生成索引中的唯一任务一致；系统不会猜测或使用过期上下文。
        </p>
        <button className="primary-action" type="button" onClick={refresh}>
          重新读取
        </button>
      </article>
    );
  }

  const readOnly =
    today.access.mode === "read-only" || today.freshness.status !== "fresh";
  return (
    <article className="paper today-paper" aria-labelledby="page-title">
      <p className="eyebrow">任务工作台 · {task.id}</p>
      <h1 id="page-title">{task.title || "未命名任务"}</h1>
      <p>{task.objective || "任务目标未提供"}</p>
      <p className="context-note">
        {resume ? `续接步骤 ${resume}` : "从任务协议开始"}
        {next ? ` · 下一动作 ${next}` : ""}
      </p>
      {readOnly ? (
        <div className="notice notice-warning" role="alert">
          当前为只读：
          {today.access.reason || today.freshness.reason || "索引不可写"}
        </div>
      ) : null}
      <section aria-label="任务协议">
        <h2>八步学习协议</h2>
        <ol>
          {(task.step_protocol || []).map((step) => (
            <li
              key={step}
              aria-current={task.current_step === step ? "step" : undefined}
            >
              {protocolLabels[step]}
              {task.not_applicable_steps?.includes(step)
                ? "（本任务不适用）"
                : ""}
            </li>
          ))}
        </ol>
        <p>时间盒：{task.duration_text || "未提供"}</p>
        <p>
          依赖：
          {task.dependencies
            .map((item) => `${item.id}（${item.status || "状态未知"}）`)
            .join("、") || "无"}
        </p>
        <p>
          指定资源：
          {task.resources?.map((item) => item.id).join("、") || "关系缺失"}
        </p>
        <p>
          关联节点：
          {task.knowledge_nodes?.length
            ? task.knowledge_nodes.map((item, index) => (
                <span key={item.id}>
                  {index ? "、" : ""}
                  <Link to={"/knowledge/" + item.id}>{item.id}</Link>
                </span>
              ))
            : "关系缺失"}
        </p>
        <p>主要成果：{task.primary_artifacts.join("、") || "路径缺失"}</p>
        <p>证据要求：{task.evidence_requirements.join("；") || "要求缺失"}</p>
      </section>
      {task.controlled_materials?.length ? (
        <section aria-label="受控材料">
          <h2>受控材料</h2>
          {task.controlled_materials.map((material) => {
            const state = controlledResults[material.control_id];
            return (
              <div className="notice notice-warning" key={material.control_id}>
                <div>
                  <strong>{material.safe_category}</strong>
                  <p>开放条件：{material.condition}</p>
                  <p>
                    {state?.result?.reason ||
                      state?.error ||
                      "当前锁定；内容不会进入导航、搜索或关联摘要。"}
                  </p>
                  {state?.receipt ? (
                    <p>首次版本已单独保留：{state.receipt.versionId}</p>
                  ) : null}
                  {state?.result?.decision === "available"
                    ? state.result.items.map((item) => (
                        <details key={item.label}>
                          <summary>{item.label}（首次版本之后开放）</summary>
                          <pre>{item.content}</pre>
                        </details>
                      ))
                    : null}
                </div>
                <button
                  className="secondary-action"
                  type="button"
                  disabled={
                    readOnly ||
                    controlledBusy === material.control_id ||
                    !draft.trim()
                  }
                  onClick={() => registerAndOpen(material.control_id)}
                >
                  {controlledBusy === material.control_id
                    ? "正在检查开放条件…"
                    : "登记首次版本并检查开放"}
                </button>
              </div>
            );
          })}
        </section>
      ) : null}
      {task.gate.status === "blocked" ? (
        <section className="issue-list" aria-label="阻塞处理">
          <h2>任务已阻塞，不计入完成</h2>
          <p>已有成果：{task.primary_artifacts.join("、") || "尚无成果路径"}</p>
          <p>
            解除条件：先完成或修复依赖关系
            {task.gate.details.length
              ? `（${task.gate.details.join("、")}）`
              : "（具体条件缺失）"}
            。
          </p>
          <p>降级路径：保留当前草稿，只记录卡点和续接点，不提交 completed。</p>
          <p>
            可继续的安全动作：检查依赖状态、复制草稿，或结束会话并记录阻塞。
          </p>
          <Link className="secondary-action" to="/review">
            记录阻塞和续接点
          </Link>
        </section>
      ) : null}
      <section aria-label="成果草稿">
        <h2>成果草稿</h2>
        <p>
          草稿自动保存在本机浏览器；预览和确认前不会更改任何权威文件或任务状态。
        </p>
        <textarea
          aria-label="成果 Markdown 草稿"
          rows={18}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={readOnly}
        />
      </section>
      <section aria-label="完成规则">
        <h2>完成规则</h2>
        {task.completion_rules.map((rule) => (
          <label key={rule}>
            <input
              type="checkbox"
              checked={checks.includes(rule)}
              disabled={readOnly}
              onChange={(event) =>
                setChecks((current) =>
                  event.target.checked
                    ? [...current, rule]
                    : current.filter((item) => item !== rule),
                )
              }
            />
            {rule}
          </label>
        ))}
      </section>
      <WriteSubmissionPanel
        taskId={task.id}
        sourceRevision={today.source.revision}
        targetPath={targetPath}
        content={draft}
        completionRules={task.completion_rules}
        allChecksComplete={
          task.completion_rules.length > 0 &&
          task.completion_rules.every((rule) => checks.includes(rule))
        }
        readOnly={readOnly || task.gate.status === "blocked"}
        onCommitted={() => {
          if (draftKey) clearLocalDraft(draftKey);
          if (checksKey) window.localStorage.removeItem(checksKey);
          setLoadedKey(null);
        }}
      />
      <p>
        <Link className="secondary-action" to="/review">
          结束会话并记录复盘
        </Link>
      </p>
    </article>
  );
}
