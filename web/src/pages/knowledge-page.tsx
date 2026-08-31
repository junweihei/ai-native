import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type RecordLink = {
  id: string;
  path: string;
  title: string;
  status: string;
  taskId?: string | null;
  capabilityLevel?: string | null;
};
type Node = {
  id: string;
  title: string;
  nodeKind: string;
  summary: string;
  problem: string;
  useWhen: string;
  avoidWhen: string;
  proofRule: string;
  formationTasks: string[];
  artifacts: string[];
  evidence: string[];
  artifactRecords: RecordLink[];
  evidenceRecords: RecordLink[];
  targetLevel: string;
  assessedLevel: string | null;
  assessmentStatus: string;
  runtimeStatus: string;
  gap: string | null;
  predecessors: string[];
  related: string[];
  successors: string[];
  milestones: string[];
  relationIssues: string[];
  sourcePath: string;
};
type Knowledge = {
  layers: Array<{ id: string; title: string; problem: string }>;
  flows: string[];
  safeguards: string[];
  nodes: Node[];
  issues: Array<{ message: string }>;
  currentTaskId?: string | null;
  sourcePath?: string;
};

function NodeLinks({ ids, empty = "无" }: { ids: string[]; empty?: string }) {
  if (!ids.length) return <>{empty}</>;
  return (
    <>
      {ids.map((id, index) => (
        <span key={id}>
          {index ? "、" : ""}
          <Link to={"/knowledge/" + id}>{id}</Link>
        </span>
      ))}
    </>
  );
}

function RecordLinks({
  records,
  empty,
}: {
  records: RecordLink[];
  empty: string;
}) {
  if (!records.length) return <>{empty}</>;
  return (
    <ul>
      {records.map((record) => (
        <li key={record.id}>
          <Link to={"/archive/" + encodeURIComponent(record.id)}>
            {record.title}
          </Link>{" "}
          · {record.status} · {record.path}
        </li>
      ))}
    </ul>
  );
}

export function KnowledgePage({ nodeId }: { nodeId?: string }) {
  const [data, setData] = useState<Knowledge | null>(null);
  const [selected, setSelected] = useState<string | undefined>(nodeId);
  useEffect(() => {
    fetch("/api/v1/knowledge")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<Knowledge>;
      })
      .then((value) => {
        setData(value);
        setSelected(nodeId || value.nodes[0]?.id);
      })
      .catch(() =>
        setData({
          layers: [],
          flows: [],
          safeguards: [],
          nodes: [],
          issues: [{ message: "知识投影不可用" }],
        }),
      );
  }, [nodeId]);
  if (!data)
    return (
      <article className="paper" aria-busy="true">
        正在读取知识地图…
      </article>
    );
  const node = data.nodes.find((item) => item.id === selected) || null;
  const continueTask =
    node &&
    data.currentTaskId &&
    node.formationTasks.includes(data.currentTaskId)
      ? data.currentTaskId
      : null;
  return (
    <article className="paper today-paper" aria-labelledby="page-title">
      <p className="eyebrow">知识地图 · 结构导航，不决定今日任务</p>
      <h1 id="page-title">六层、三条流与横向保障</h1>
      <section>
        <h2>六层功能架构</h2>
        <ul>
          {data.layers.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>：{item.problem || "问题说明缺失"}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>三条运行流</h2>
        <ul>
          {data.flows.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>两类横向保障</h2>
        <ul>
          {data.safeguards.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      {data.issues.map((item, index) => (
        <p className="missing-value" key={index}>
          {item.message}
        </p>
      ))}
      <section aria-label="知识节点">
        <h2>知识节点</h2>
        <ul>
          {data.nodes.map((item) => (
            <li key={item.id}>
              <Link
                className="secondary-action"
                to={"/knowledge/" + item.id}
                onClick={() => setSelected(item.id)}
                aria-current={item.id === node?.id ? "page" : undefined}
              >
                {item.id} · {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {node ? (
        <section aria-label="知识节点详情">
          <p className="eyebrow">
            {node.nodeKind} · {node.id}
          </p>
          <h2>{node.title}</h2>
          <h3>是什么</h3>
          <p>{node.summary || "权威摘要缺失。"}</p>
          <h3>解决什么问题</h3>
          <p>{node.problem || "问题说明缺失。"}</p>
          <h3>何时使用或不用</h3>
          <p>适用：{node.useWhen || "适用条件缺失。"}</p>
          <p>不用或更简单替代：{node.avoidWhen || "替代边界缺失。"}</p>
          <h3>怎样证明有效</h3>
          <p>{node.proofRule || "证明规则缺失。"}</p>
          <p>
            运行状态：
            <span className={"status-tag status-" + node.runtimeStatus}>
              {node.runtimeStatus}
            </span>
          </p>
          <p>
            能力等级：目标 {node.targetLevel || "缺失"}；当前评估{" "}
            {node.assessedLevel || "未评估"}；证据评估{" "}
            {node.assessmentStatus === "verified" ? "已独立验证" : "未评估"}
          </p>
          <p>
            计划任务：
            {node.formationTasks.map((taskId, index) => (
              <span key={taskId}>
                {index ? "、" : ""}
                <Link
                  to={
                    taskId === data.currentTaskId
                      ? "/tasks/" + taskId
                      : "/roadmap#" + taskId
                  }
                >
                  {taskId}
                  {taskId === data.currentTaskId ? "（当前）" : ""}
                </Link>
              </span>
            ))}
            {!node.formationTasks.length ? "断链" : ""}
          </p>
          <p>
            前置节点：
            <NodeLinks ids={node.predecessors} />
            ；相关节点：
            <NodeLinks ids={node.related} />
            ；后续节点：
            <NodeLinks ids={node.successors} />
          </p>
          <p>
            里程碑：
            {node.milestones.map((milestone, index) => (
              <span key={milestone}>
                {index ? "、" : ""}
                <Link to={"/roadmap#" + milestone}>{milestone}</Link>
              </span>
            ))}
            {!node.milestones.length ? "断链" : ""}
          </p>
          {node.relationIssues.map((issue) => (
            <p className="missing-value" key={issue}>
              断链提示：{issue}
            </p>
          ))}
          <h3>成果</h3>
          <RecordLinks records={node.artifactRecords} empty="无可追溯成果" />
          <h3>证据</h3>
          <RecordLinks records={node.evidenceRecords} empty="无独立证据记录" />
          {node.gap ? (
            <div className="missing-value">
              <p>具体缺口：{node.gap}</p>
              {node.formationTasks.length ? (
                <p>
                  允许的补强动作：
                  {node.formationTasks.map((taskId, index) => (
                    <span key={taskId}>
                      {index ? "、" : ""}
                      <Link to={"/roadmap#" + taskId}>{taskId}</Link>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          ) : null}
          {continueTask ? (
            <Link className="primary-action" to={"/tasks/" + continueTask}>
              继续学习（回到当前权威计划任务）
            </Link>
          ) : (
            <Link className="primary-action" to="/roadmap">
              返回权威计划选择当前任务
            </Link>
          )}
          <p className="context-note">
            节点定义来源：{node.sourcePath || data.sourcePath || "关系缺失"}
          </p>
        </section>
      ) : (
        <p className="missing-value">节点详情缺失或节点 ID 不存在。</p>
      )}
    </article>
  );
}
