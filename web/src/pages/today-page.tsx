import { Link } from "react-router-dom";
import type {
  TodayWorkspaceSnapshot,
  TraceNode,
} from "../../shared/data-contract";
import { useDataSourceStatus } from "../data/data-source-context";
import {
  resumeHref,
  todayActionEnabled,
  todayActionLabel,
} from "./today-workspace-model";
import "../styles/today.css";

const statusLabel: Record<string, string> = {
  not_started: "未开始",
  learning: "学习中",
  completed: "已完成",
  verified: "已验证",
  blocked: "阻塞",
  active: "进行中",
};

function value(value: string | null | undefined) {
  return value || <span className="missing-value">未提供</span>;
}

function TraceItem({ label, node }: { label: string; node: TraceNode }) {
  return (
    <li>
      <span>{label}</span>
      <strong>{value(node.title || node.id)}</strong>
      <small>
        {node.status ? statusLabel[node.status] || node.status : "状态未提供"}
      </small>
      {"acceptance_relation" in node ? (
        <small>{node.acceptance_relation || "验收关系缺失"}</small>
      ) : null}
    </li>
  );
}

export function TodayWorkbenchView({
  snapshot,
  loading = false,
  error = false,
  onRefresh = () => undefined,
}: {
  snapshot: TodayWorkspaceSnapshot | null;
  loading?: boolean;
  error?: boolean;
  onRefresh?: () => void;
}) {
  if (loading) {
    return (
      <article
        className="paper today-paper"
        aria-busy="true"
        aria-labelledby="page-title"
      >
        <p className="eyebrow">今日工作台</p>
        <h1 id="page-title">正在读取今日任务</h1>
        <div className="loading-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </article>
    );
  }
  if (error || !snapshot) {
    return (
      <article
        className="paper today-paper state-panel"
        aria-labelledby="page-title"
      >
        <p className="eyebrow">今日工作台</p>
        <h1 id="page-title">无法读取今日任务</h1>
        <p>生成索引不可用；未以零进度或默认任务替代。</p>
        <button className="primary-action" type="button" onClick={onRefresh}>
          重试读取
        </button>
      </article>
    );
  }

  const context = snapshot.context;
  if (!context || context.resolution === "missing") {
    return (
      <article
        className="paper today-paper state-panel"
        aria-labelledby="page-title"
      >
        <p className="eyebrow">今日工作台</p>
        <h1 id="page-title">没有可确定的当前任务</h1>
        <p>索引没有提供唯一的当前任务；系统不会猜测或补造。</p>
        <SourceMeta snapshot={snapshot} onRefresh={onRefresh} />
      </article>
    );
  }
  if (context.resolution === "ambiguous") {
    return (
      <article
        className="paper today-paper state-panel"
        aria-labelledby="page-title"
      >
        <p className="eyebrow">今日工作台</p>
        <h1 id="page-title">发现多个候选任务</h1>
        <p>需要先在权威内容中确认唯一当前任务，系统不会自动选择。</p>
        <ul className="candidate-list">
          {context.candidates.map((item) => (
            <li key={item.id}>
              <strong>{item.id}</strong> {value(item.title)} ·{" "}
              {value(item.status)}
            </li>
          ))}
        </ul>
        <SourceMeta snapshot={snapshot} onRefresh={onRefresh} />
      </article>
    );
  }

  const task = context.task;
  const trace = context.trace;
  if (!task || !trace) {
    return (
      <article
        className="paper today-paper state-panel"
        aria-labelledby="page-title"
      >
        <p className="eyebrow">今日工作台</p>
        <h1 id="page-title">当前任务关系不完整</h1>
        <p>保留已解析信息，但不补造主任务字段。</p>
        <IssueList issues={context.issues} />
        <SourceMeta snapshot={snapshot} onRefresh={onRefresh} />
      </article>
    );
  }

  const actionEnabled = todayActionEnabled(snapshot);
  const href = resumeHref(snapshot);
  return (
    <article className="paper today-paper" aria-labelledby="page-title">
      {snapshot.freshness.status === "stale" ? (
        <div className="notice notice-warning" role="alert">
          <strong>索引已过期</strong>
          <span>{snapshot.freshness.reason || "未提供过期原因"}</span>
          <button type="button" onClick={onRefresh}>
            刷新索引
          </button>
        </div>
      ) : null}
      {snapshot.access.mode === "read-only" ? (
        <div className="notice" role="status">
          <strong>只读</strong>
          <span>{snapshot.access.reason}</span>
          <span>{snapshot.access.recovery}</span>
        </div>
      ) : null}
      <ol className="trace" aria-label="月周日与上层目标位置">
        <TraceItem label="六个月目标" node={trace.goal} />
        <TraceItem label="月" node={trace.month} />
        <TraceItem label="周" node={trace.week} />
        <TraceItem label="日" node={trace.day} />
      </ol>

      <header className="today-hero">
        <div>
          <p className="eyebrow">唯一可执行主任务 · {task.id}</p>
          <h1 id="page-title">{value(task.title)}</h1>
          <p className="task-objective">{value(task.objective)}</p>
        </div>
        <dl className="hero-meta">
          <div>
            <dt>预计时间</dt>
            <dd>{value(task.duration_text)}</dd>
          </div>
          <div>
            <dt>上层能力目标</dt>
            <dd>
              {task.capability_targets.length
                ? task.capability_targets
                    .map(
                      (item) =>
                        `${item.id} ${item.title || "名称缺失"} ${item.target_level || "等级缺失"}`,
                    )
                    .join("；")
                : value(null)}
            </dd>
          </div>
        </dl>
        {actionEnabled && href ? (
          <Link className="primary-action today-primary" to={href}>
            {todayActionLabel(snapshot)}
          </Link>
        ) : task.gate.status === "blocked" && href ? (
          <Link className="primary-action today-primary" to={href}>
            查看阻塞与解除条件
          </Link>
        ) : (
          <button
            className="primary-action today-primary"
            type="button"
            disabled
          >
            {todayActionLabel(snapshot)}
          </button>
        )}
      </header>

      {context.issues.length ? <IssueList issues={context.issues} /> : null}
      <div className="today-details">
        <Detail title="完成条件" items={task.completion_rules} />
        <Detail title="主要成果" items={task.primary_artifacts} />
        <Detail title="证据" items={task.evidence_requirements} />
        <section>
          <h2>门禁</h2>
          <p>
            <span className={`status-tag status-${task.gate.status}`}>
              {statusLabel[task.gate.status] || task.gate.status}
            </span>{" "}
            {task.gate.label}
          </p>
          {task.dependencies.map((item) => (
            <p key={item.id}>
              {item.id} · {value(item.status)}
            </p>
          ))}
        </section>
        <section>
          <h2>上次中断点</h2>
          {task.last_session ? (
            <>
              <p>更新时间：{value(task.last_session.updated)}</p>
              <p>
                记录步骤：
                {value(task.last_session.current_step || task.current_step)}
              </p>
              <p>未解决问题：{value(task.last_session.unresolved_issue)}</p>
            </>
          ) : (
            <p className="missing-value">没有记录到上次会话</p>
          )}
        </section>
        <section>
          <h2>下一动作</h2>
          <p>{value(task.next_action)}</p>
        </section>
      </div>
      <SourceMeta snapshot={snapshot} onRefresh={onRefresh} />
    </article>
  );
}

function Detail({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2>{title}</h2>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="missing-value">未提供</p>
      )}
    </section>
  );
}
function IssueList({
  issues,
}: {
  issues: Array<{ code: string; message: string; impact: string }>;
}) {
  return (
    <section className="issue-list" aria-label="数据缺口">
      <h2>数据缺口</h2>
      {issues.map((item) => (
        <p key={item.code}>
          <strong>{item.message}</strong>
          <span>{item.impact}</span>
        </p>
      ))}
    </section>
  );
}
function SourceMeta({
  snapshot,
  onRefresh,
}: {
  snapshot: TodayWorkspaceSnapshot;
  onRefresh: () => void;
}) {
  return (
    <footer className="source-meta">
      <span>数据来源：Markdown 权威内容 → {snapshot.source.indexPath}</span>
      <span>生成时间：{snapshot.generatedAt}</span>
      <span>来源版本：{snapshot.source.revision || "未提供"}</span>
      <button type="button" onClick={onRefresh}>
        重新读取
      </button>
    </footer>
  );
}
export function TodayPage() {
  const { today, loading, error, refresh } = useDataSourceStatus();
  return (
    <TodayWorkbenchView
      snapshot={today}
      loading={loading}
      error={error}
      onRefresh={refresh}
    />
  );
}
