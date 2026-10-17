# Task: S1 Daily Submission Templates

## Context

S1-D01–D20 已经指定专业成果文档，但提交入口、必答问题、验收清单和多文件主次关系不统一，学习者无法从执行计划直接进入每天唯一的提交件。

## Goal

让 S1 每一天都通过一个明确入口完成：打开指定主提交件，回答任务专属问题，完成专业成果，按标准自检并记录提交结论；不建立平行任务状态或重复的每日总结。

## Allowed Changes

- `content/plans/S1/S1_整体认知与机制判断_执行计划_V1.0.md`
- `content/plans/S1/开始这里.md`
- S1-D02–D20 在 `content/knowledge/`、`content/cases/`、`content/practice/`、`content/projects/`、`content/evidence/` 中的主提交件
- `content/system/AI_Native_Learning_OS_学习执行规则_V0.1.md`
- `content/system/AI_Native_Learning_OS_统一模板规范_V0.1.md`
- `TASK.md`
- `EXECUTION_REPORT_S1_DAILY_SUBMISSION_TEMPLATES.md`

## Forbidden Changes

- 已完成的 D1 成果正文
- S1 checkbox、当前任务或任务状态
- 新建平行每日总结、第二套任务状态或重复专业成果
- 网站实现、应用代码、生成出版物、归档或无关工作区修改

## Acceptance Criteria

- [x] AC-01: 执行计划的 D01–D20 均提供可点击的“当天提交文档”，且每一天只有一个主提交件。
- [x] AC-02: D02–D20 主提交件均明确任务身份、今日必须回答、提交前验收和提交结论。
- [x] AC-03: D14、D15、D18、D20 明确主提交件与支撑件的关系。
- [x] AC-04: “开始这里”可直接进入当前 D2 主提交件。
- [x] AC-05: 执行规则和模板规范确立“一任务一主提交件”，并明确权威任务状态只在执行计划维护。
- [x] AC-06: 不新增重复每日总结或第二套任务 checkbox。
- [x] AC-07: D1=completed、D2/D3=learning、D4–D20=not_started 保持不变，内容校验和内容索引测试通过。

## Verification

- 检查 D01–D20 提交链接、主/支撑关系和模板四要素。
- 比较任务 checkbox 与状态不变量。
- 运行内容校验、内容索引测试和仓库检查；无关既有失败单独记录。

## Output

- 可直接执行和提交的 S1 计划及 D02–D20 专业成果模板。
- 学习执行规则与模板规范的每日提交契约。
- `EXECUTION_REPORT_S1_DAILY_SUBMISSION_TEMPLATES.md`。

## Stop Conditions

- 如果整改需要改动已完成 D1 正文或当前学习状态，停止并报告。
- 如果某日已有专业成果能承载提交，不得另建重复的每日文档。
