import type { TodayWorkspaceSnapshot } from "../../shared/data-contract";

function task(id: "M01-D01" | "M01-D02" | "M01-D04") {
  const status =
    id === "M01-D01"
      ? "not_started"
      : id === "M01-D04"
        ? "blocked"
        : "learning";
  return {
    id,
    title:
      id === "M01-D02"
        ? "证据补链"
        : id === "M01-D01"
          ? "建立学习入口"
          : "复杂度判断",
    status,
    duration_text: id === "M01-D02" ? "原 75 分钟；补链 30—45 分钟" : "45 分钟",
    objective: "用任务机制与复杂度判断形成可验收成果",
    capability_targets: [
      { id: "M01-C02", title: "任务机制判断", target_level: "L2" },
    ],
    primary_artifacts: [`content/artifacts/${id}.md`],
    supporting_artifacts: [`content/sessions/${id}.md`],
    completion_rules: ["完成闭卷判断并记录依据"],
    evidence_requirements: ["写出任务机制", "说明复杂度判断", "保存可定位证据"],
    dependencies:
      id === "M01-D04" ? [{ id: "M01-D03", status: "not_started" }] : [],
    gate: {
      status: id === "M01-D04" ? "blocked" : "satisfied",
      label: "依赖任务门禁",
      details: id === "M01-D04" ? ["M01-D03"] : [],
    },
    current_step: id === "M01-D02" ? "D2 证据补链" : null,
    next_action:
      id === "M01-D02" ? "闭卷补齐 8 个个人任务的机制与复杂度判断" : "开始任务",
    last_session:
      id === "M01-D02"
        ? {
            id: "SESSION-M01-D02",
            updated: "2026-08-28",
            current_step: null,
            unresolved_issue: "8 个个人任务尚未闭卷判断",
          }
        : null,
    executable: id !== "M01-D04",
  };
}

export function todayScenario(
  id: "M01-D01" | "M01-D02" | "M01-D04" = "M01-D02",
): TodayWorkspaceSnapshot {
  const selected = task(id);
  return {
    schemaVersion: "V1.0-test",
    generatedAt: "2026-08-28T08:00:00.000Z",
    source: {
      authority: "markdown",
      revision: "fixture-revision",
      indexPath: "web/public/data/learning-index.json",
    },
    freshness: { status: "fresh", reason: null },
    access: {
      mode: "read-only",
      reason: "测试环境只读。",
      recovery: "完成安全写回后启用。",
    },
    context: {
      resolution: "resolved",
      task_id: id,
      candidates: [],
      source_path: "content/plans/month-01/第1月_Learning_OS_运行映射_V0.1.md",
      issues: [],
      trace: {
        goal: {
          id: "GOAL-AI-NATIVE-6M",
          title: "六个月能力目标",
          status: "active",
          acceptance_relation: "以月末证据验收",
        },
        month: {
          id: "M01",
          title: "第1月 Learning OS 运行映射",
          status: "active",
          acceptance_relation: "月末证据门禁",
        },
        week: {
          id: "M01-W01",
          title: "第1周：图",
          status: "active",
          acceptance_relation: "通过第1周口头关卡",
        },
        day: { id, title: selected.title, status: selected.status },
      },
      task: selected,
    },
  };
}

export const ambiguousToday: TodayWorkspaceSnapshot = {
  ...todayScenario(),
  context: {
    resolution: "ambiguous",
    candidates: [task("M01-D02"), task("M01-D04")].map(
      ({ id, title, status }) => ({ id, title, status }),
    ),
    source_path: "content/plans/month-01/第1月_Learning_OS_运行映射_V0.1.md",
    issues: [
      {
        code: "multiple_current_tasks",
        message: "多个候选任务",
        impact: "无法确定唯一主任务。",
      },
    ],
  },
};
