import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { RoadmapSnapshot } from "../../shared/data-contract";

const statusLabel: Record<string, string> = {
  not_started: "未开始",
  learning: "学习中",
  review_pending: "待复盘",
  completed: "已完成",
  verified: "已验证",
  blocked: "阻塞",
};

export function RoadmapPage() {
  const [snapshot, setSnapshot] = useState<RoadmapSnapshot | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch("/api/v1/roadmap")
      .then((response) => {
        if (!response.ok) throw new Error("roadmap unavailable");
        return response.json() as Promise<RoadmapSnapshot>;
      })
      .then(setSnapshot)
      .catch(() => setError(true));
  }, []);
  if (error)
    return (
      <article className="paper state-panel">
        <h1>无法读取路线图</h1>
        <p>生成索引不可用；未以客户端顺序替代权威计划。</p>
      </article>
    );
  if (!snapshot)
    return (
      <article className="paper" aria-busy="true">
        正在读取权威路线图…
      </article>
    );
  return (
    <article className="paper today-paper" aria-labelledby="page-title">
      <p className="eyebrow">六个月路线图 · Markdown 权威计划</p>
      <h1 id="page-title">当前路径与阶段门禁</h1>
      <p>
        顺序、依赖和状态均来自六个月总纲及月度运行映射；不会根据知识树、最近浏览或本机偏好重新排序。
      </p>
      {snapshot.freshness.status !== "fresh" ? (
        <div className="notice notice-warning" role="alert">
          索引状态：{snapshot.freshness.status}。{snapshot.freshness.reason}
        </div>
      ) : null}
      {snapshot.relationIssues.length ? (
        <section className="issue-list" aria-label="路线图关系问题">
          <h2>关系与部分数据</h2>
          {snapshot.relationIssues.map((issue, index) => (
            <p key={`${issue.code}-${index}`}>{issue.message}</p>
          ))}
        </section>
      ) : null}
      <ol className="roadmap-list" aria-label="六个月阶段到每日任务">
        {snapshot.months.map((month) => (
          <li key={month.id}>
            <section id={month.id}>
              <h2>
                {month.id} · {month.title}
              </h2>
              <p>
                {month.capabilityRange || "能力范围缺失"} ·{" "}
                {month.projectIncrement || "项目增量缺失"}
              </p>
              <p>
                <span
                  className={`status-tag status-${month.status || "unknown"}`}
                >
                  {statusLabel[month.status || ""] || "状态未知"}
                </span>{" "}
                · 验收：{month.acceptance || "验收关系缺失"}
              </p>
              {month.partial ? (
                <p className="missing-value">
                  该月尚未提供周/日权威执行计划；系统不补造任务。
                </p>
              ) : null}
              {month.weeks.map((week) => (
                <details key={week.id} open={month.id === "M01"}>
                  <summary>
                    <strong>
                      {week.id} · {week.title}
                    </strong>
                    {week.gate ? ` · 门禁：${week.gate}` : " · 门禁信息缺失"}
                  </summary>
                  <ol>
                    {week.tasks.map((task) => (
                      <li key={task.id}>
                        <article id={task.id}>
                          <h3>
                            {task.current ? "当前 · " : ""}
                            {task.id} · {task.title}
                          </h3>
                          <p>
                            {task.timeRange || "时间范围缺失"} ·{" "}
                            <span
                              className={`status-tag status-${task.status || "unknown"}`}
                            >
                              {statusLabel[task.status || ""] || "状态未知"}
                            </span>
                          </p>
                          <p>
                            依赖：
                            {task.dependencies.length
                              ? task.dependencies.join("、")
                              : "无"}
                            ；验收：{task.acceptance || "缺失"}
                          </p>
                          {task.blockedReason ? (
                            <p className="notice notice-warning">
                              {task.blockedReason}。解除条件：
                              {task.unlockCondition || "未提供"}
                            </p>
                          ) : null}
                          {task.relationIssues.map((issue) => (
                            <p className="missing-value" key={issue}>
                              {issue}
                            </p>
                          ))}
                          <Link
                            className="secondary-action"
                            to={`/tasks/${task.id}`}
                          >
                            进入任务详情
                          </Link>
                        </article>
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </section>
          </li>
        ))}
      </ol>
    </article>
  );
}
