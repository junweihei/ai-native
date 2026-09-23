# Task: Content Governance R3 — Metadata Model & Historical Frontmatter

## Context

R1 和 R2 已完成并通过验收。当前权威链已建立，Obsidian Tasks 工作流已治理。本轮目标：建立清晰的四字段元数据模型，分离文档有效性、任务状态、验证状态和能力等级，解决 23 个 legacy-frontmatter warnings。

## Goal

1. 建立四字段元数据模型：
   - `document_status`: draft | active | archived | deprecated（文档有效性）
   - `task_state`: not_started | learning | completed | blocked（任务执行状态）
   - `verification_state`: unverified | verified（验证状态）
   - `capability_level`: L0 | L1 | L2 | L3 | L4（能力等级）
2. 保留 `status` 字段作为兼容层，映射到 `document_status`
3. 更新 validation/index/tests 支持新字段
4. 迁移 23 个 legacy-frontmatter 文件，使用四字段模型
5. 消除所有 legacy-frontmatter warnings

## Allowed Changes

- `config/learning-content.json` - 扩展 schema 定义，新增四字段枚举
- `tools/content_index/validate_learning_content.py` - 更新 validation 逻辑
- `tools/content_index/build_learning_index.py` - 更新 index builder 提取新字段
- `tools/content_index/common.py` - 更新 common 工具函数
- `tools/content_index/tests/` - 更新测试用例
- `content/cases/*.md` - 迁移 5 个案例文件的 frontmatter
- `content/evidence/*.md` - 迁移 3 个证据文件的 frontmatter
- `content/knowledge/*.md` - 迁移 3 个知识地图文件的 frontmatter
- `content/practice/*.md` - 迁移 8 个练习文件的 frontmatter
- `content/projects/*.md` - 迁移 4 个项目文件的 frontmatter
- `EXECUTION_REPORT_CONTENT_GOVERNANCE_R3.md` - 生成本轮治理报告

## Forbidden Changes

- `content/plans/S1/` - 不修改 S1 执行计划或 checkbox
- `content/sessions/` - 不修改已有会话记录
- `content/system/` - 不修改系统规则文档
- `archive/` - 不修改归档文件
- `00-templates/` - 不修改模板文件
- V3.0 战略总纲
- AGENTS.md 执行协议
- 不自动完成 S1-D02 任务
- 不修改学习状态（D1=completed, D2=learning, D3=learning）
- 不删除任何文件
- 不重构目录结构

## Metadata Model

### document_status（文档有效性）
- `draft`: 草稿，尚未正式生效
- `active`: 当前有效，属于正式体系
- `archived`: 已归档，仅作历史参考
- `deprecated`: 已废弃，有替代方案

映射规则：原 `status: completed` → `document_status: active`

### task_state（任务执行状态）
- `not_started`: 任务尚未开始
- `learning`: 任务进行中，尚未完成
- `completed`: 任务已完成
- `blocked`: 任务被阻塞

映射规则：原 `status: not_started` → `task_state: not_started`

### verification_state（验证状态）
- `unverified`: 尚未通过独立验证
- `verified`: 已通过独立验证（闭卷、迁移、门禁等）

默认值：`unverified`

### capability_level（能力等级）
- `L0`: 未开始学习
- `L1`: 能解释基本概念
- `L2`: 能判断适用边界
- `L3`: 能独立应用
- `L4`: 能验证和改进

默认值：根据 task_state 推断（not_started → L0, learning → L1, completed → L2）

## Acceptance Criteria

- [ ] AC-01: config/learning-content.json 包含四字段枚举定义
- [ ] AC-02: validation 支持四字段，不强制要求但提供警告
- [ ] AC-03: index builder 提取四字段到 learning-index.json
- [ ] AC-04: 测试套件通过（15/15）
- [ ] AC-05: 23 个 legacy-frontmatter 文件已迁移
- [ ] AC-06: validation 输出 0 errors, 0 warnings
- [ ] AC-07: 学习状态保持不变（D1=completed, D2=learning, D3=learning）
- [ ] AC-08: EXECUTION_REPORT_CONTENT_GOVERNANCE_R3.md 已生成
- [ ] AC-09: Git 提交完成

## Verification

1. 运行 `python tools/content_index/validate_learning_content.py` 确认 0 errors, 0 warnings
2. 运行 `python -m unittest discover -s tools/content_index/tests -v` 确认测试通过
3. 运行 `python tools/content_index/build_learning_index.py` 确认索引生成
4. 使用 `git diff` 确认修改范围符合 Allowed Changes
5. 使用 `git status` 确认工作区干净

## Output

- 更新的 config/learning-content.json
- 更新的 validate_learning_content.py
- 更新的 build_learning_index.py
- 更新的 common.py
- 更新的测试文件
- 迁移的 23 个 content 文件
- EXECUTION_REPORT_CONTENT_GOVERNANCE_R3.md
- Git commit: `chore: implement four-field metadata model (R3)`

## Stop Conditions

- 如果 schema 扩展需要大规模重构 validation/index 逻辑
- 如果测试套件需要大量重写
- 如果迁移文件时意外修改正文内容
- 如果学习状态发生变化
- 如果 Git 出现大量与本任务无关的变化
- 如果需要修改 S1 执行计划或 checkbox

## Learning State Invariant

治理前后必须保持：
- S1-D01 = completed（知识地图已完成）
- S1-D02 = learning（任务适用性判断进行中）
- S1-D03 = learning（机制边界草稿进行中）
- S1-D04-D20 = not_started

不得因为 frontmatter 迁移而自动改变任务状态。
