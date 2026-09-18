# Task: Content Governance R2 — Obsidian Tasks & Daily Execution Governance

## Context

R1 已完成并关闭。当前权威链已建立：V3.0 → S1 执行计划 → Start Page → 当前任务 S1-D02。本轮治理目标：建立"一个任务、一个定义、一个 checkbox"的执行工作流，确保 Obsidian Tasks 从权威源读取，本周看板为查询投影，每日模板去重。

## Goal

1. S1 执行计划成为任务定义和 checkbox 的唯一权威源
2. Obsidian Tasks 从权威任务读取，不复制任务
3. 本周看板转为 Tasks 查询投影，不存储任务定义
4. Reminder 只负责开始提醒，不创建第二套任务状态
5. 每日学习会话模板合并日收尾字段，成为正式日执行记录
6. 每日任务卡模板限制为临时/ad-hoc 任务专用
7. Scheduled / Due / Reminder 职责明确

## Allowed Changes

- `TASK.md` - 更新任务边界
- `content/plans/S1/S1_整体认知与机制判断_执行计划_V1.0.md` - 添加正式 task checkbox syntax
- `content/tasks/` - 重构本周看板为查询投影
- `00-templates/01-task/每日任务卡模板.md` - 限制 scope 为 ad-hoc 任务
- `00-templates/02-learning/每日学习会话模板.md` - 合并日收尾字段
- `00-templates/04-review/日收尾模板.md` - 标记 deprecated
- `00-templates/template-registry.yaml` - 更新模板职责描述
- `EXECUTION_REPORT_CONTENT_GOVERNANCE_R2.md` - 生成本轮治理报告
- 暂存并提交上述修改

## Forbidden Changes

- `content/plans/S1/开始这里.md` - 不修改（除非修正文档职责引用）
- `content/knowledge/` - 不修改知识地图和学习成果
- `content/cases/` - 不修改案例拆解
- `content/practice/` - 不修改练习和测试
- `content/projects/` - 不修改项目成果
- `content/evidence/` - 不修改证据记录
- `content/sessions/` - 不修改已有历史会话
- `archive/` - 不修改已归档的历史文件
- `V3.0 战略总纲` - 不修改核心正文
- `AGENTS.md` - 不修改执行协议
- 不批量修改 frontmatter（属于 R3）
- 不批量补 23 个 historical frontmatter warnings（属于 R3）
- 不自动完成当前 S1-D02 任务

## Inputs

- 当前仓库状态（通过 git status 和文件扫描确认）
- S1 执行计划中的任务定义（D1-D20）
- content/tasks/ 中的本周执行看板
- 00-templates/ 中的每日任务卡、学习会话、日收尾模板
- R1 和 R1 Final Patch 执行报告

## Acceptance Criteria

- [ ] AC-01: TASK.md 已更新为 R2 治理任务边界
- [ ] AC-02: S1 执行计划包含正式 task checkbox（S1-D01 [x]，S1-D02 [ ] #ai-native/current，S1-D03-D20 [ ]）
- [ ] AC-03: 本周看板转为 Tasks 查询投影，无重复任务定义
- [ ] AC-04: 每日学习会话模板已合并日收尾字段
- [ ] AC-05: 每日任务卡模板限制为 ad-hoc 任务专用
- [ ] AC-06: 日收尾模板标记 deprecated
- [ ] AC-07: template-registry.yaml 已更新模板职责
- [ ] AC-08: 所有修改通过 content validation 检查
- [ ] AC-09: 所有修改通过 pytest 测试套件
- [ ] AC-10: 学习状态保持不变（S1-D02 learning/current）
- [ ] AC-11: EXECUTION_REPORT_CONTENT_GOVERNANCE_R2.md 已生成
- [ ] AC-12: Git 提交完成

## Verification

1. 运行 `python tools/content_index/validate_learning_content.py` 确认内容验证通过
2. 运行 `python -m pytest tools/content_index/tests/ -v` 确认测试套件通过
3. 全仓扫描确认每个 S1-Dxx 只有一个权威 checkbox（archive/ 除外）
4. 确认本周看板使用 Tasks query 语法
5. 使用 `git diff` 确认修改范围符合 Allowed Changes
6. 使用 `git status` 确认工作区干净

## Output

- 更新的 TASK.md
- 添加 checkbox 的 S1 执行计划
- 重构的本周执行看板
- 更新的每日学习会话模板
- 限制 scope 的每日任务卡模板
- 标记 deprecated 的日收尾模板
- 更新的 template-registry.yaml
- EXECUTION_REPORT_CONTENT_GOVERNANCE_R2.md
- Git commit: `refactor: establish single-source Obsidian task workflow (R2)`

## Stop Conditions

- 如果 S1 执行计划无法安全承载 Tasks checkbox
- 如果 Tasks query 必须复制第二套任务才能运行
- 如果必须修改知识成果才能继续
- 如果必须进入 R3 元数据治理才能继续
- 如果模板合并会破坏大量历史 session
- 如果需要修改 V3.0 核心正文
- 如果 Git 出现大量与本任务无关的变化
- 如果无法判断某模板是否仍有正式用途

## Learning State Invariant

治理前后必须保持：
- S1-D01 = completed [x]
- S1-D02 = learning/current [ ] #ai-native/current
- S1-D03 = learning/evidence incomplete [ ]
- S1-D04-D20 = not_started [ ]

不得因为 session completed、文件已存在、模板非空而自动勾选任务。
