# Task: Content Governance R1 — Canonical Authority Chain & S1 Integration

## Context

AI Native 项目已完成 V3.0 战略总纲迁移和 month-01 目录归档。当前需要建立正式的内容治理权威链，确保：
- V3.0 作为唯一战略总纲的引用完整性
- S1 执行计划作为当前阶段唯一权威
- 历史 month-01 路径不再产生误导性引用
- 内容工具链与新的 S1 结构对齐

## Goal

完成 Content Governance R1 治理，建立从 V3.0 → S1 → 执行细节的完整权威链，修复所有过时引用，确保内容验证工具和测试套件与新结构一致。

## Allowed Changes

- `TASK.md` - 更新任务边界
- `content/plans/AI_Native_系统学习与统一成长树实践路线_V3.0.md` - 修复 frontmatter 中的过时迁移源引用
- `content/system/个人_AI_Native_Learning_OS_文档资产盘点_V0.1.md` - 如需要，更新资产清单
- `tools/content_index/tests/` - 更新测试中的路径引用
- `content/tasks/` - 处理本周执行看板文件（如存在）
- `EXECUTION_REPORT_CONTENT_GOVERNANCE_R1.md` - 生成本轮治理报告
- 暂存并提交上述修改

## Forbidden Changes

- `content/plans/S1/` - 不修改 S1 执行计划内容
- `content/plans/month-01/` - 不修改已归档文件（如仍存在）
- `archive/` - 不修改已归档的历史文件
- `content/knowledge/` - 不修改知识地图和学习成果
- `content/sessions/` - 不修改会话记录
- 不创建新的执行计划或战略文档
- 不修改网站前端代码
- 不修改 AGENTS.md 或 .gitignore

## Inputs

- 当前仓库状态（通过 git status 和文件扫描确认）
- V3.0 frontmatter 中的 migration_sources 字段
- content/tasks/ 目录中的执行看板文件
- tools/content_index/tests/ 中的测试套件
- 前序会话的审计报告（QWEN_PROJECT_ONBOARDING_REPORT.md, EXECUTION_REPORT_S1_PLAN_CONSOLIDATION.md）

## Acceptance Criteria

- [ ] AC-01: TASK.md 已更新为 R1 治理任务边界
- [ ] AC-02: V3.0 frontmatter 中的 migration_sources 不再引用已归档的 month-01 路径
- [ ] AC-03: content/tasks/ 目录已处理（归档或更新引用）
- [ ] AC-04: tools/content_index/tests/ 中的测试路径已更新为 S1 结构
- [ ] AC-05: 所有修改通过 content validation 检查
- [ ] AC-06: 所有修改通过 pytest 测试套件
- [ ] AC-07: EXECUTION_REPORT_CONTENT_GOVERNANCE_R1.md 已生成并包含完整治理记录
- [ ] AC-08: Git 工作区干净，所有修改已提交

## Verification

1. 运行 `python tools/content_index/validate_learning_content.py` 确认内容验证通过
2. 运行 `python -m pytest tools/content_index/tests/ -v` 确认测试套件通过
3. 使用 `git grep "month-01"` 确认活跃文件中无过时引用（archive/ 除外）
4. 使用 `git diff` 确认修改范围符合 Allowed Changes
5. 使用 `git status` 确认工作区干净

## Output

- 更新的 TASK.md
- 修复的 V3.0 frontmatter
- 更新的测试文件（如需要）
- 处理的 content/tasks/ 目录
- EXECUTION_REPORT_CONTENT_GOVERNANCE_R1.md
- Git commit: `docs: complete Content Governance R1 - canonical authority chain`

## Stop Conditions

- 如果发现 V3.0 或 S1 执行计划存在结构性问题（非引用问题）
- 如果发现 content/tasks/ 包含不应归档的活跃任务
- 如果验证工具报告无法修复的内容损坏
- 如果需要修改 Forbidden Changes 中列出的文件
