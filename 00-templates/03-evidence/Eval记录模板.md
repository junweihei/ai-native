---
template_id: tpl-evidence-eval-v0.1
template_version: V0.1
id: "{{evidence_id}}"
title: "Eval {{artifact_id}}"
type: evidence
evidence_type: eval
status: learning
created: "{{date}}"
updated: "{{date}}"
goal: G6M
milestone: "{{milestone}}"
task_id: "{{task_id}}"
artifact_id: "{{artifact_id}}"
artifact_path: "{{artifact_path}}"
evidence_for:
  - "{{capability_id}}"
output_path: "{{output_path}}"
---

# Eval：{{artifact_id}}

## 1. 要验证的决策

- 系统或功能：____
- 核心假设：____
- 本轮只验证：____
- 不验证：____

## 2. 基线和目标

| 指标 | 当前基线 | 目标 | 获取方式 | 停止条件 |
|---|---:|---:|---|---|
| ____ | ____ | ____ | ____ | ____ |

## 3. 测试集

- 数据来源与权限：____
- 样例数量：____
- 正常 / 边界 / 失败分布：____
- 是否包含敏感数据：是 / 否；处理方式：____
- 测试集路径：`____`

## 4. 执行结果

| 样例 | 预期 | 实际 | 通过/失败 | 失败类型 |
|---|---|---|---|---|
| ____ | ____ | ____ | ____ | ____ |

## 5. 结果解释

- 总体结果：____
- 最常见失败模式：____
- 失败来自：提示词 / Context / 数据 / 工具 / Workflow / 模型 / 权限 / 评测标准 / 其他
- 一个最重要问题：____

## 6. 决策

- 结论：通过 / 调整后再测 / 停止 / 回退简单机制
- 本轮只修改：____
- 下一次复测标准：____
- 任务状态：review_pending / completed / verified / blocked

