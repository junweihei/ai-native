import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Item = {
  id: string;
  path: string;
  title: string;
  type: string;
  status: string;
  updated: string;
  task_id?: string | null;
  week?: string | null;
  milestone?: string | null;
  nodes?: string[];
  evidence_for?: string[];
  category?: string;
  capability_level?: string | null;
};
type Archive = {
  documents: Item[];
  generatedAt?: string;
  sourceRevision?: string | null;
  currentTaskId?: string | null;
  freshness: { status: string; reason?: string | null };
};
type Filters = {
  month: string;
  week: string;
  task: string;
  node: string;
  type: string;
  capability: string;
  evidence: string;
  status: string;
};

const emptyFilters: Filters = {
  month: "",
  week: "",
  task: "",
  node: "",
  type: "",
  capability: "",
  evidence: "",
  status: "",
};

function evidenceState(item: Item) {
  if (item.type === "evidence")
    return item.status === "verified" ? "verified" : "recorded";
  return item.evidence_for?.length ? "supported" : "missing";
}

function options(
  items: Item[],
  field: "milestone" | "week" | "type" | "capability_level",
) {
  return [
    ...new Set(
      items
        .map((item) => item[field])
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
}

export function ArchivePage() {
  const [data, setData] = useState<Archive | null>(null);
  const [view, setView] = useState<"artifact" | "time">("artifact");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  useEffect(() => {
    fetch("/api/v1/archive")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<Archive>;
      })
      .then(setData)
      .catch(() =>
        setData({
          documents: [],
          freshness: { status: "unknown", reason: "档案索引不可用" },
        }),
      );
  }, []);

  const documents = useMemo(() => data?.documents ?? [], [data]);
  const rows = useMemo(
    () =>
      documents
        .filter((item) => {
          const nodeText = item.nodes?.join(" ") ?? "";
          return (
            (!filters.month || item.milestone === filters.month) &&
            (!filters.week || item.week === filters.week) &&
            (!filters.task ||
              item.task_id
                ?.toLowerCase()
                .includes(filters.task.toLowerCase())) &&
            (!filters.node ||
              nodeText.toLowerCase().includes(filters.node.toLowerCase())) &&
            (!filters.type || item.type === filters.type) &&
            (!filters.capability ||
              item.capability_level === filters.capability) &&
            (!filters.evidence || evidenceState(item) === filters.evidence) &&
            (!filters.status || item.status === filters.status)
          );
        })
        .sort((left, right) =>
          view === "time"
            ? right.updated.localeCompare(left.updated) ||
              left.path.localeCompare(right.path)
            : left.type.localeCompare(right.type) ||
              left.title.localeCompare(right.title),
        ),
    [documents, filters, view],
  );

  const updateFilter = (name: keyof Filters, value: string) =>
    setFilters((current) => ({ ...current, [name]: value }));
  if (!data)
    return (
      <article className="paper" aria-busy="true">
        正在读取学习档案…
      </article>
    );

  const partialCount = documents.filter(
    (item) => !item.task_id || !item.nodes?.length || !item.capability_level,
  ).length;
  return (
    <article className="paper today-paper" aria-labelledby="archive-title">
      <p className="eyebrow">学习档案 · 同源 Markdown 投影</p>
      <h1 id="archive-title">成果与证据档案</h1>
      {data.freshness.status !== "fresh" ? (
        <div className="notice notice-warning" role="alert">
          索引状态：{data.freshness.status}。
          {data.freshness.reason || "原因未知"}；生成时间：
          {data.generatedAt || "未知"}。
          <button type="button" onClick={() => window.location.reload()}>
            重新加载档案
          </button>
        </div>
      ) : null}
      <p>
        成果视图和时间视图来自同一次生成投影；切换与筛选只改变本页展示。归档记录明确标为
        archived，且不计入当前任务或进度。
      </p>
      {partialCount ? (
        <p className="missing-value" role="status">
          部分数据：{partialCount}{" "}
          条记录缺少任务、节点或能力等级关系；系统不会补造。
        </p>
      ) : null}
      <fieldset>
        <legend>视图与筛选</legend>
        <label>
          视图
          <select
            value={view}
            onChange={(event) =>
              setView(event.target.value as "artifact" | "time")
            }
          >
            <option value="artifact">成果视图</option>
            <option value="time">时间视图</option>
          </select>
        </label>
        <label>
          月度里程碑
          <select
            value={filters.month}
            onChange={(event) => updateFilter("month", event.target.value)}
          >
            <option value="">全部月份</option>
            {options(documents, "milestone").map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          周计划
          <select
            value={filters.week}
            onChange={(event) => updateFilter("week", event.target.value)}
          >
            <option value="">全部周</option>
            {options(documents, "week").map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          任务 ID
          <input
            value={filters.task}
            onChange={(event) => updateFilter("task", event.target.value)}
          />
        </label>
        <label>
          知识节点
          <input
            value={filters.node}
            onChange={(event) => updateFilter("node", event.target.value)}
          />
        </label>
        <label>
          成果类型
          <select
            value={filters.type}
            onChange={(event) => updateFilter("type", event.target.value)}
          >
            <option value="">全部类型</option>
            {options(documents, "type").map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          能力等级
          <select
            value={filters.capability}
            onChange={(event) => updateFilter("capability", event.target.value)}
          >
            <option value="">全部等级</option>
            {options(documents, "capability_level").map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          证据状态
          <select
            value={filters.evidence}
            onChange={(event) => updateFilter("evidence", event.target.value)}
          >
            <option value="">全部证据状态</option>
            <option value="verified">独立验证</option>
            <option value="recorded">已有记录</option>
            <option value="supported">有关联证据</option>
            <option value="missing">证据缺口</option>
          </select>
        </label>
        <label>
          运行状态
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="">全部状态</option>
            {[...new Set(documents.map((item) => item.status))]
              .sort()
              .map((value) => (
                <option key={value}>{value}</option>
              ))}
          </select>
        </label>
        <button type="button" onClick={() => setFilters(emptyFilters)}>
          清空全部筛选
        </button>
      </fieldset>
      <p aria-live="polite">
        当前显示 {rows.length} / {documents.length} 条；来源修订：
        {data.sourceRevision || "未知"}。
      </p>
      {rows.length ? (
        <ol aria-label="档案记录">
          {rows.map((item) => (
            <li key={item.path}>
              <strong>
                <Link to={"/archive/" + encodeURIComponent(item.id)}>
                  {item.title}
                </Link>
              </strong>
              <p>
                {item.path} · {item.updated} · {item.type} · {item.status}
              </p>
              <p>
                月/周：{item.milestone || "部分数据"} /{" "}
                {item.week || "部分数据"}；任务：
                {item.task_id || "部分数据"}；节点：
                {item.nodes?.join("、") || "断链"}；能力：
                {item.capability_level || "部分数据"}；证据：
                {evidenceState(item)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="missing-value" role="status">
          <p>当前组合筛选无结果；没有修改任何权威状态。</p>
          <button type="button" onClick={() => setFilters(emptyFilters)}>
            重置筛选并恢复完整档案
          </button>
        </div>
      )}
    </article>
  );
}

export function ArchiveRecordPage({ recordId }: { recordId?: string }) {
  const [data, setData] = useState<Archive | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch("/api/v1/archive")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<Archive>;
      })
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  if (failed)
    return (
      <article className="paper state-panel">
        <h1>档案记录暂不可用</h1>
        <p>权威文件没有改变；可返回档案重试或重新加载。</p>
        <Link className="secondary-action" to="/archive">
          返回档案
        </Link>
      </article>
    );
  if (!data)
    return (
      <article className="paper" aria-busy="true">
        正在读取档案关系…
      </article>
    );

  const item = data.documents.find((candidate) => candidate.id === recordId);
  if (!item)
    return (
      <article className="paper state-panel">
        <h1>档案记录不存在或不可公开</h1>
        <p>
          该记录可能断链、已移出投影，或属于尚未开放的受控内容；系统不会展示正文摘要。
        </p>
        <Link className="secondary-action" to="/archive">
          返回安全档案列表
        </Link>
      </article>
    );

  return (
    <article className="paper today-paper" aria-labelledby="record-title">
      <p className="eyebrow">档案关系详情 · 安全元数据投影</p>
      <h1 id="record-title">{item.title}</h1>
      <p>权威相对路径：{item.path}</p>
      <p>
        更新时间：{item.updated} · 类型：{item.type} · 状态：{item.status}
      </p>
      {item.status === "archived" ? (
        <p className="notice notice-warning">
          归档记录只用于历史追溯，不计入当前任务或进度。
        </p>
      ) : null}
      <section aria-label="双向追溯关系">
        <h2>关联对象</h2>
        <p>
          任务：
          {item.task_id ? (
            <Link
              to={
                item.task_id === data.currentTaskId
                  ? "/tasks/" + item.task_id
                  : "/roadmap#" + item.task_id
              }
            >
              {item.task_id}
            </Link>
          ) : (
            <span className="missing-value">断链</span>
          )}
        </p>
        <p>
          知识节点：
          {item.nodes?.length ? (
            item.nodes.map((node, index) => (
              <span key={node}>
                {index ? "、" : ""}
                <Link to={"/knowledge/" + node}>{node}</Link>
              </span>
            ))
          ) : (
            <span className="missing-value">断链</span>
          )}
        </p>
        <p>
          里程碑：
          {item.milestone ? (
            <Link to={"/roadmap#" + item.milestone}>{item.milestone}</Link>
          ) : (
            <span className="missing-value">断链</span>
          )}
        </p>
        <p>能力或验收对象：{item.evidence_for?.join("、") || "关系缺失"}</p>
        <p>能力等级：{item.capability_level || "未评估"}</p>
      </section>
      <p className="context-note">
        为防止受控答案或闭卷材料泄露，本页只显示索引允许的元数据，不加载正文或搜索摘要。
      </p>
      <Link className="secondary-action" to="/archive">
        返回档案列表
      </Link>
    </article>
  );
}
