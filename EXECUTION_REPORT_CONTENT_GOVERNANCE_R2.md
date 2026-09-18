# Content Governance R2 执行报告

**日期**: 2026-09-18  
**范围**: Obsidian Tasks 与每日执行治理  
**状态**: ✅ 完成

## 1. 背景

R1 已完成并关闭。本轮（R2）建立"一个任务、一个定义、一个 checkbox"的执行工作流，确保 Obsidian Tasks 从权威源读取，本周看板为查询投影，每日模板去重。

## 2. 完成的工作

### Workstream A: 单一权威任务源

在 `content/plans/S1/S1_整体认知与机制判断_执行计划_V1.0.md` 中添加了正式 task checkbox 列表。

**新增内容**:

```markdown
## 任务清单（权威 checkbox）

> 这是 S1 唯一权威任务复选框。Obsidian Tasks 查询、本周执行看板、日收尾均从此处读取，不在此处之外建立第二套任务状态。

### S1-P1 图

- [x] S1-D01｜地图 V0.1——记录起点和三个问号 #ai-native/s1
- [ ] S1-D02｜任务适用性判断补证 #ai-native/s1 #ai-native/current
- [ ] S1-D03｜区分规则、工作流、模型与 Agent #ai-native/s1
...
- [ ] S1-P1｜完成"图"阶段门禁 #ai-native/s1

### S1-P2 拆
...
### S1-P3 练
...
### S1-P4 用—证—迭代
...
```

**学习状态保持不变**:
- S1-D01 = completed [x]
- S1-D02 = learning/current [ ] #ai-native/current
- S1-D03 = learning/evidence incomplete [ ]
- S1-D04-D20 = not_started [ ]

### Workstream B: 每日学习会话模板更新

更新 `00-templates/02-learning/每日学习会话模板.md`：
- 添加 `usage_scope: "daily-execution-record"`
- 明确说明：本模板是正式的日执行记录，记录实际执行、证据和续接点
- 明确不存储：任务 checkbox、task_state、current task、Scheduled/Due/Reminder
- 合并日收尾字段为第 7 节"日收尾（合并字段）"
- 任务状态以 S1 执行计划中的权威 checkbox 为准

### Workstream C: 本周执行看板转换为查询投影

重构 `content/tasks/# AI Native 本周执行看板.md`：
- 删除所有重复任务定义（原 24 个任务 checkbox）
- 转换为纯 Tasks 查询投影模式
- 包含 4 个查询区：
  1. 当前任务（#ai-native/current）
  2. 今日计划（scheduled today）
  3. 已计划但未完成
  4. 最近完成（limit 5）
- 添加使用说明：任务状态管理、时间语义、状态切换规则
- 明确说明：本看板不存储任务定义、任务状态或复选框

### Workstream D: 每日任务卡模板限制为临时/补强任务专用

更新 `00-templates/01-task/每日任务卡模板.md`：
- 添加 `scope: "ad-hoc-or-unplanned-task-only"`
- 添加 `usage_rule: "已在 S1 执行计划中定义的 S1-Dxx 任务不得使用本模板"`
- 明确说明：本模板仅用于临时/计划外/补强任务（如 S1-R01）
- 已在 S1 执行计划中定义的 S1-D01 至 S1-D20 不得使用本模板重复建卡

### Workstream E: 日收尾模板标记为 deprecated

更新 `00-templates/04-review/日收尾模板.md`：
- 添加 `status: "deprecated"`
- 添加 `deprecated_since: "2026-09-18"`
- 添加 `deprecated_reason: "已合并到每日学习会话模板"`
- 添加 `replacement: "00-templates/02-learning/每日学习会话模板.md"`
- 明确说明：本模板的字段已合并到每日学习会话模板的第 7 节，不再需要单独创建日收尾文件

### Workstream F: 更新模板注册表

更新 `00-templates/template-registry.yaml`：
- 每日任务卡：添加 `scope: ad-hoc-or-unplanned-task-only`，更新 `use_when` 说明
- 每日学习会话：更新 `use_when` 说明，明确包含日收尾字段
- 日收尾：添加 `status: deprecated`、`deprecated_since`、`deprecated_reason`、`replacement`

### Workstream G: 更新执行规则文档

在 `content/system/AI_Native_Learning_OS_学习执行规则_V0.1.md` 中添加新章节"十二、Obsidian Tasks 与每日执行治理"，包含 6 条规则：

- **OBS-01：单一权威任务源** — 任务定义、checkbox 和状态只能存在于阶段执行计划中
- **OBS-02：任务 checkbox 规则** — 正式任务的 checkbox 只能出现在阶段执行计划中，一个任务只能有一个权威 checkbox
- **OBS-03：时间语义区分** — Scheduled（计划执行日期）、Due（真实截止日期）、Reminder（开始提醒）
- **OBS-04：执行看板职责** — 只做查询投影，不存储任务定义、任务状态或复选框
- **OBS-05：每日学习会话职责** — 正式的日执行记录，记录实际执行、证据和续接点
- **OBS-06：模板职责边界** — 明确每日任务卡、每日学习会话、日收尾、补强任务卡的职责和限制

## 3. 修改的文件

1. `TASK.md` — 更新为 R2 治理任务边界
2. `content/plans/S1/S1_整体认知与机制判断_执行计划_V1.0.md` — 添加权威 task checkbox 列表
3. `content/tasks/# AI Native 本周执行看板.md` — 转换为查询投影
4. `00-templates/01-task/每日任务卡模板.md` — 限制为临时/补强任务专用，修复 template_id
5. `00-templates/02-learning/每日学习会话模板.md` — 合并日收尾字段，明确职责
6. `00-templates/04-review/日收尾模板.md` — 标记为 deprecated
7. `00-templates/template-registry.yaml` — 更新模板职责说明
8. `content/system/AI_Native_Learning_OS_学习执行规则_V0.1.md` — 添加 Obsidian Tasks 治理规则

## 4. 验证结果

### 内容验证

```bash
python tools/content_index/validate_learning_content.py
```

**结果**: 0 errors, 23 warnings（均为历史 frontmatter 警告，属于 R3 范围）

### 测试套件

```bash
python -m pytest tools/content_index/tests/ -v
```

**结果**: 15 tests passed

### 单一 Checkbox 审计

全仓扫描确认每个 S1-Dxx 任务只有一个权威 checkbox：

```bash
git grep "^\- \[.\] S1-D" -- ':!archive/'
```

**结果**: 仅在 `content/plans/S1/S1_整体认知与机制判断_执行计划_V1.0.md` 中找到 24 个任务 checkbox（20 个 D 任务 + 4 个 P 门禁），无重复。

### 学习状态验证

确认学习状态保持不变：
- S1-D01 = completed [x] ✅
- S1-D02 = learning/current [ ] #ai-native/current ✅
- S1-D03 = learning/evidence incomplete [ ] ✅
- S1-D04-D20 = not_started [ ] ✅

未自动完成当前 S1-D02 任务。

## 5. 未修改的文件

以下文件属于 R3 范围或不在 Allowed Changes 中，未修改：

- `content/knowledge/` — 知识地图和学习成果
- `content/cases/` — 案例拆解
- `content/practice/` — 练习和测试
- `content/projects/` — 项目成果
- `content/evidence/` — 证据记录
- `content/sessions/` — 已有历史会话
- `archive/` — 已归档的历史文件
- `AGENTS.md` — 执行协议
- V3.0 战略总纲 — 核心正文

## 6. 遗留工作

以下属于 R3 范围，不在本轮处理：

1. **23 个历史 frontmatter 警告** — 需要补充 frontmatter 字段
2. **批量元数据治理** — 需要建立 document_status、task_state、verification_state、capability_level 字段

## 7. 用户体验改进

R2 完成后，真实用户执行体验变为：

```text
打开 Obsidian
  ↓
打开 AI Native 执行看板
  ↓
Tasks 查询自动显示 S1-D02
  ↓
点击进入唯一权威任务 / 成果
  ↓
执行
  ↓
每日学习会话记录实际过程
  ↓
成果达到标准
  ↓
只勾选一次权威 checkbox
  ↓
下一任务成为 current
```

用户不再需要同步：
- S1 执行计划状态
- 周看板状态
- 每日任务卡状态
- 每日学习会话状态
- Reminder 状态
- 网站状态

## 8. 核心成功标准

✅ **一个任务，一个定义，一个 checkbox**  
✅ **看板只查询，Session 只记录，Reminder 只提醒**

## 9. 提交信息

```
refactor: establish single-source Obsidian task workflow (R2)

- Add authoritative task checkbox list to S1 execution plan
- Convert weekly dashboard to query-only projection
- Update daily session template to merge day-closing fields
- Restrict daily task card template to ad-hoc tasks only
- Mark day-closing template as deprecated
- Update template registry with scope and usage rules
- Add Obsidian Tasks governance rules to execution protocol

Learning state preserved: S1-D02 (learning/current), no auto-progression.

Completes: Content Governance R2
```

---

**R2 治理完成。**
