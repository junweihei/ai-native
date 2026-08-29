# AI Native Learning OS 网站数据契约 V1.0

## 文档控制

| 字段 | 值 |
|---|---|
| 版本 / 日期 | V1.0 / 2026-08-29 |
| 状态 | 数据契约设计完成，待产品与内容治理评审 |
| 性质 | 与技术无关的逻辑数据、索引、受控访问和写回行为契约 |
| 上游 | 产品、设计、验收、追踪、IA、线框与高保真 V1.0 |
| 权威 | Markdown 是正式学习内容、关系和状态的权威；模板注册表和内容配置分别是模板与边界/枚举权威；生成索引只是可重建投影 |
| 本轮范围 | 仅新增本文；不改配置、模板、frontmatter、索引工具、生成索引或学习结论 |
| 明确排除 | 技术栈、API、数据库、锁/事务实现、部署和批量内容迁移 |

## 1. 不可变原则

1. 网站正式读模型来自生成索引，不硬编码内容路径，不维护第二套学习状态。
2. 正式写操作只改变允许范围内的权威 Markdown；索引和草稿不得反向成为权威。
3. `completed` 只表示对象自身规则满足；`verified` 必须有后续独立证据。
4. 运行状态与 L0—L4 是正交维度，分别保存、溯源和显示。
5. 缺失、未知、歧义、过期、只读、冲突和失败必须显式，不用默认值掩盖。
6. 受控材料默认不可见；条件不完整、索引过期或关系不唯一时一律不开放。
7. 草稿、差异预览、确认和冲突是临时操作状态，不是学习运行状态。
8. 本契约规定行为与结果，不规定实现技术。

## 2. 基线审计

审计范围：`config/learning-content.json`、模板注册表与 13 个模板、内容 frontmatter、`tools/content_index/`、当前生成索引、首月运行映射、产品运行模型和学习执行规则。审计提交为 `c2b7e43992a5179d94a071768f209dd67ab97c16`。

| 审计项 | 当前事实 | 契约结论 |
|---|---|---|
| 内容边界 / 状态 | 配置已有内容根、根文档、排除项、9 个状态和索引路径 | 继续作为发现边界与状态全集权威 |
| 模板 | 13 个稳定 `template_id`，含输出目录和命名模式 | 继续作为正式创建约束 |
| frontmatter | 40 个文档中 16 个完整，24 个 legacy 缺 frontmatter | legacy 可只读；不能靠推测参与 P0 |
| 索引 | V0.1 为文档级扁平投影，只有 `generated_at`，无来源提交/关系诊断 | V1.0 增加对象集合、来源版本、新鲜度和完整性 |
| Task | D1—D20 仅在运行映射表格中 | 必须成为一等对象 |
| Goal / 周 / 门禁 | 六个月、M01、W01—04 和门禁存在于 Markdown | 结构化投影，仍以原 Markdown 为权威 |
| Resource | R1—R13 与任务关系只在正文 | 成为一等对象和任务关系 |
| Knowledge Node | 当前 `nodes` 均为空；M01-C01—05 是能力目标 | Node 与 Capability 分开建模 |
| Artifact | 成果存在，但索引 `artifact_id` 无有效值 | 通用 `id` 为唯一身份；兼容旧别名 |
| Evidence | `evidence_for` 仅少量存在 | 缺证据不得验证或升级能力 |
| Review / Session | 模板和 D1—D3 会话存在，续接/调整未结构化 | 分别成为一等对象 |
| 当前任务 | 运行映射已有 `current_task/current_status/next_action`，索引未输出 | V1.0 必须投影并诊断唯一性 |
| 状态语义 | D2/D3 Session=completed，Artifact=learning | 合法；禁止按 `task_id` 聚合成“任务完成” |
| 受控材料 | 普通索引含两份参考答案的路径、标题、章节和摘要 | AC-P0-05 Blocker；实现前必须隔离 |
| 解析器 | 只支持顶层标量和顶层列表 | 内容表达变化需单独提案，不能偷迁移 |

## 3. 通用逻辑类型

| 类型 | 规则 |
|---|---|
| `Id` | 非空、稳定、对象类型内唯一；改名保留别名 |
| `Text` | 非空人类文本；空白按缺失 |
| `Date` / `DateTime` | YYYY-MM-DD / 带时区 ISO 8601 |
| `DurationMinutes` | 正整数或 `{min,max}`；不是超时 |
| `RepoPath` | 仓库相对 POSIX 路径；无 `..`；解析后仍在允许根 |
| `IdList` | 去重 ID 数组；来源没表达顺序时不赋予顺序语义 |
| `OpaqueRevision` | 非空内容版本标识；不规定算法 |

### 3.1 SourceRef

| 字段 | 类型 | 必填 | 缺失行为 |
|---|---|---:|---|
| `path` | RepoPath | 是 | 受控普通视图例外，见第 9 节 |
| `fragment` | Text | 否 | 无稳定区段时仅文档级追溯 |
| `document_id` / `document_version` | Id / Text | 否 | 显示“未声明”，不补造 |
| `updated` | Date/DateTime | 否 | 不得替代内容版本 |
| `revision` | OpaqueRevision | 是 | 缺失则来源不可用于写回/开放 |
| `authority` | markdown/config/template_registry | 是 | 缺失则对象无权威来源 |

### 3.2 RelationRef

| 字段 | 类型 | 必填 | 规则 |
|---|---|---:|---|
| `relation` | Enum | 是 | 如 parent_of、depends_on、produces、evidence_for |
| `target_type` / `target_id` | 对象类型 / Id | 是 | 不用目录名代替对象 |
| `required` | Boolean | 是 | 指明缺失是否阻断当前行为 |
| `integrity` | resolved/missing/ambiguous/forbidden | 是 | 不伪装成布尔“有/无” |
| `source` | SourceRef | 是 | 关系自身可追溯 |

missing 保留源对象并标影响；ambiguous 不任意选目标；forbidden 表示违反契约，例如普通索引指向未开放受控正文。

### 3.3 CapabilityStatement

| 字段 | 类型 | 必填 | 规则 |
|---|---|---:|---|
| `capability_id` | Id | 是 | 例如 M01-C02 |
| `target_level` | L0—L4/null | 是 | 计划目标；null=未定义 |
| `assessed_level` | L0—L4/null | 是 | 无足够证据必须为 null |
| `assessment_status` | unassessed/supported/disputed/stale | 是 | 不使用运行状态枚举 |
| `evidence_ids` | IdList | 是 | 空数组不能 supported |
| `assessed_at` | DateTime/null | 是 | 未评估为 null |
| `source` | SourceRef | 是 | 目标或判断来源 |

等级固定：L0 未进入、L1 能解释、L2 能判断、L3 能实践、L4 能验证并改进。Task completed 不直接改变能力；只有满足标准与独立性的 Evidence 可以支持判断。

## 4. 通用对象字段与状态

八类对象都包含：

| 字段 | 类型 | 必填 | 来源 / 缺失行为 |
|---|---|---:|---|
| `id` | Id | 是 | 缺失则不进入可执行集合，记 error |
| `object_type` | 核心类型 | 是 | 未知时只进 diagnostics，不推断为 Artifact |
| `title` | Text | 是 | 缺失保留 ID 并记 error |
| `status` | 运行状态/null | 是 | 未知/缺失为 null，不默认 not_started |
| `status_raw` | Text/null | 是 | 保留来源原值 |
| `created` / `updated` | Date/null | 否/是 | 不补造；兼容期文件时间必须标 derived |
| `relations` | RelationRef[] | 是 | 必需关系缺失时不可执行 |
| `source_refs` | SourceRef[] | 是 | 为空则不输出正式对象 |
| `completeness` | complete/partial/invalid | 是 | 决定可读、可执行、可写 |
| `issues` | IssueRef[] | 是 | 可为空；不删除原事实 |

运行状态全集原样来自配置：`draft`、`active`、`not_started`、`learning`、`review_pending`、`completed`、`verified`、`blocked`、`archived`。

- Goal/Milestone：draft/active/completed/verified/blocked/archived。
- Task：draft/not_started/learning/review_pending/completed/verified/blocked/archived。
- Resource：draft/active/archived；访问性另存。
- Artifact/Evidence/Review/Session：按自身生命周期使用；Session completed 只代表该次会话收尾完整。
- Knowledge Node 可有维护状态，但能力只用 CapabilityStatement。
- 枚举内但对象不适用的值：`status=null`、保留 raw，记 `status_not_allowed_for_object`。

## 5. 核心对象最小契约

下表只列通用字段之外的字段。

### 5.1 Goal / Milestone

| 字段 | 类型 | 必填 | 来源 / 缺失行为 |
|---|---|---:|---|
| `plan_level` | goal/month/week | 是 | 未知不能进入路线图树 |
| `parent_id` | Id/null | 是 | Goal 为 null；月/周缺失时标上层关系缺失 |
| `outcome` | Text | 是 | 不能用标题替代验收结果 |
| `acceptance_rules` | Text[] | 是 | 空时不能 completed/verified |
| `child_ids` | IdList | 是 | 只做反向投影，不补造 |
| `capability_targets` | CapabilityStatement[] | 是 | 月里程碑为空记 warning |
| `time_range` | {start,end}/null | 否 | 无日期显示“未绑定日历” |

示例：`M01` 是 month milestone，parent 为六个月 Goal，包含 W01—04；M01-C02 target=L2、assessed=null/unassessed。

### 5.2 Task

| 字段 | 类型 | 必填 | 缺失行为 |
|---|---|---:|---|
| `milestone_id` / `week_id` | Id | 是 | 缺任一不可成为唯一今日任务 |
| `duration_minutes` | 正整数或范围 | 是 | 缺失可读但开始前警告 |
| `objective` | Text | 是 | 缺失不可执行 |
| `step_protocol` | Enum[] | 是 | 空=协议缺失，不自动填满 |
| `depends_on` / `gate_ids` | IdList | 是 | 未满足依赖不可执行 |
| `knowledge_node_ids` / `resource_ids` | IdList | 是 | 指定输入任务无资源不可执行 |
| `primary_artifact_ids` / `supporting_artifact_ids` | IdList | 是 | 无主要成果不能 completed |
| `completion_rules` | Text[] | 是 | 空时禁止 completed |
| `evidence_requirements` | Text[] | 是 | 空时禁止 verified 并警告 |
| `next_task_ids` | IdList | 是 | 多个合法候选不自动选择 |
| `current_step` / `next_action` | Text/null | 否 | 缺失时恢复到任务概览 |
| `blocker` | {reason,unblock_conditions,safe_fallback}/null | 否 | status=blocked 时必填 |

示例：`M01-D02` status=learning，依赖 D01，资源 R1/R2，主要成果 `ART-M01-D02-task-fit`，当前步骤 closed_book_first_pass，下一行动为闭卷补齐 8 个判断。

### 5.3 Knowledge Node

| 字段 | 类型 | 必填 | 缺失行为 |
|---|---|---:|---|
| `node_kind` | concept/mechanism/pattern/capability_point/safeguard | 是 | 未知不能参与结构筛选 |
| `summary/problem/use_when/avoid_when/proof_rule` | Text/null | 是 | null 显示四问/证据缺口 |
| `parent_ids/related_ids/prerequisite_ids` | IdList | 是 | 缺失不推断“无关系” |
| `task_ids/artifact_ids/evidence_ids` | IdList | 是 | 空数组是真实空状态 |
| `capability` | CapabilityStatement | 是 | 无证据 assessed_level=null |

示例：`KN-task-fit` 关联 D02/D09/D15/D19 与 M01-C02；目标 L2，当前待证据判断。

### 5.4 Resource

| 字段 | 类型 | 必填 | 缺失行为 |
|---|---|---:|---|
| `resource_kind` | internal/external/controlled | 是 | 未知不可作为指定输入 |
| `locator` | RepoPath/Uri/null | 是 | 普通资源缺失不可打开；受控普通视图必须 null |
| `allowed_scope` | Text | 是 | 缺失不可声称限定阅读范围 |
| `task_ids` | IdList | 是 | 空时不出现在任务工作台 |
| `access_policy_id` | Id/null | 是 | controlled 必填，普通资源为 null |
| `access_state` | available/locked/unavailable/unknown | 是 | unknown 按 locked |
| `source_attribution` | Text/null | 否 | 外部资源缺失时 partial |

示例：`R2` 是 internal，定位到每日资源映射的 R2 范围，关联 D02/D03/D09，access_state=available。

### 5.5 Artifact

| 字段 | 类型 | 必填 | 缺失行为 |
|---|---|---:|---|
| `task_id` | Id | 是 | 缺失不能支持 Task 完成 |
| `artifact_kind` | Text | 是 | 缺失按通用成果只读、标 partial |
| `path` | RepoPath | 是 | 不存在为 error |
| `template_id/template_version` | Id/null、Text/null | 是 | 专用既有成果可 null；新成果缺失不可提交 |
| `version/predecessor_id` | Text/null、Id/null | 是 | 版本链要求时缺失为 invalid |
| `evidence_for` | IdList | 是 | 空时不能支持能力判断 |
| `completion_check` | {result,rule_results,checked_at}/null | 是 | null 时不能 completed |

`artifact_id` 是 V0.x 兼容别名；V1.0 只要求通用 `id`。示例：`ART-M01-D02-task-fit`、path=`content/knowledge/任务适用性判断_D2.md`、status=learning、evidence_for=M01-C02。

### 5.6 Evidence

| 字段 | 类型 | 必填 | 缺失行为 |
|---|---|---:|---|
| `evidence_kind` | artifact_review/closed_book/retest/transfer/eval/feedback/gate | 是 | 未知不能升级能力 |
| `subject_ids` | IdList | 是 | 空则 invalid |
| `artifact_ids/task_ids/node_ids/milestone_ids` | IdList | 是 | 至少一类非空 |
| `standard` | Text | 是 | 缺失不能判定 |
| `result` | pass/fail/partial/inconclusive | 是 | 未知为 invalid |
| `independence` | first_pass/closed_book/external_feedback/test/user_feedback/self_check | 是 | self_check 可支持完成，不能单独支持 verified |
| `recorded_at` / `path` | Date(Time) / RepoPath | 是 | 缺失或不存在为 invalid |
| `limitations` | Text/null | 是 | null 不代表无限适用 |

示例：`EV-M01-D19-transfer` 指向 M01-C02、D19 和迁移题作答，标准“至少 2 个判断合理，3 个理由完整”；未执行时 result=inconclusive。

### 5.7 Review

| 字段 | 类型 | 必填 | 缺失行为 |
|---|---|---:|---|
| `review_scope` | daily/weekly/monthly | 是 | 未知不能进入复盘导航 |
| `period_id` | Id | 是 | 缺失 invalid |
| `task_ids/evidence_ids` | IdList | 是 | 空时必须解释 |
| `outcome` / `primary_gap` | Text / Text|null | 是 | 缺 outcome 不能 completed |
| `adjustment` | {action,reason,target_ids}/null | 是 | null 时必须有 no_change_rationale |
| `no_change_rationale` | Text/null | 是 | 与 adjustment 至少一个非空 |
| `next_action` / `next_task_id` | Text / Id|null | 是 | 无 next_action 不能 completed |
| `path` | RepoPath | 是 | 不存在 invalid |

示例：日复盘指向 D02，primary_gap 是“8 个任务尚未全部形成可复查理由”，next_action 继续闭卷首做，next_task_id=M01-D02。

### 5.8 Session

| 字段 | 类型 | 必填 | 缺失行为 |
|---|---|---:|---|
| `task_id` | Id | 是 | 缺失不能作为续接来源 |
| `started_at/ended_at` | DateTime/null | 是 | 不补造，不能计算时长 |
| `current_step` | Text/null | 是 | 缺失恢复到任务概览 |
| `artifact_ids/evidence_ids` | IdList | 是 | 可为空 |
| `criteria_results` | {rule,result}[] | 是 | 空时不能证明 Task 完成 |
| `unresolved_issue` | Text/null | 是 | 必须显式 |
| `capability_change_evidence_ids` | IdList | 是 | 空时不推断能力变化 |
| `next_action` | Text/null | 是 | 学习中任务为空则 partial |
| `task_status_at_end` | 运行状态/null | 是 | 与 Session 自身 status 分开 |
| `path` | RepoPath | 是 | 不存在 invalid |

示例：`S-M01-D02` 自身 status=completed，task_status_at_end=learning，关联 D2 成果，Evidence 为空；这不改变 Task、Artifact 或 M01-C02。

## 6. 关系与唯一当前任务

`Goal → Month → Week → Task → Node/Resource/Artifact/Session → Evidence → Capability/Milestone；Session → Review → next Task/plan adjustment`。

关系只在一侧权威声明；索引可生成反向关系，但必须标 `derived=true` 并保留原 SourceRef，不回写为第二份权威。

当前任务解析：

1. 显式 `current_task` 可解析且未归档时优先。
2. 依赖/门禁未满足仍显示该 Task，但 `executable=false`；不自动跳到别的任务。
3. 显式值缺失时，仅在恰好一个 learning/review_pending/blocked Task 合法匹配计划时采用。
4. 多候选、无候选或关系不完整输出 ambiguous/missing/partial；不按更新时间、最近浏览或文件数量猜测。
5. Session/Artifact 状态与能力等级不得替代 Task 状态。

## 7. 索引 V1.0

### 7.1 顶层 schema

| 字段 | 类型 | 规则 |
|---|---|---|
| `schema_version` | 语义版本 | 首版 `1.0.0`；不复用内容版本 |
| `generated_at` | DateTime | 带时区；只表示投影时间 |
| `source_of_truth` | 固定 `markdown` | 缺失则索引无效 |
| `source_revision` | 对象 | 提交、工作区状态、源集合/配置/模板/文档版本 |
| `freshness` | 对象 | fresh/stale/unknown、原因、checked_at、可选 expires_at |
| `compatibility` | 对象 | 支持版本、legacy 窗口、弃用字段 |
| `stats` | 对象 | 各集合 complete/partial/invalid 与 errors/warnings；不得作为能力进度 |
| `objects` | 对象 | 八类数组始终存在 |
| `relations` | RelationRef[] | 规范化关系 |
| `relation_integrity` | 对象 | complete/partial/invalid 与 resolved/missing/ambiguous/forbidden |
| `current_context` | 对象 | Goal/Month/Week/Task 解析和 next_action |
| `controlled_placeholders` | 数组 | 仅安全占位 |
| `diagnostics` | 数组 | 可定位 issue |
| `templates` | 数组 | 模板投影与注册表版本 |

`objects` 固定键：`goals_and_milestones`、`tasks`、`knowledge_nodes`、`resources`、`artifacts`、`evidence`、`reviews`、`sessions`。

### 7.2 来源提交 / 版本

`source_revision` 必含：

- `repository_commit`：来源基线提交，可为 null。
- `repository_state`：clean/modified/unknown。
- `source_set_revision`：实际参与生成的全部源内容版本。
- `config_revision`、`template_registry_revision`、`documents_revision`。

modified 时不能只展示 Git 提交；源集合版本必须覆盖实际内容。任一必需版本未知时索引允许只读，但正式写回和受控开放暂停。

### 7.3 过期

判为 stale：

1. 当前源集合与 `source_set_revision` 不同；
2. 配置、注册表或任一投影文档版本不同；
3. 声明 `expires_at` 且已超过；
4. 权威写回成功，但尚无包含新版本的索引。

无法读取/比较版本或 V0.1 无版本字段时为 unknown。stale/unknown 都可浏览、保存临时草稿；禁止正式提交、冲突覆盖和受控开放。只因年龄超过建议周期、但版本相同，不自动等于冲突；时间阈值由配置声明。

### 7.4 关系完整性

- complete：所有 required 关系 resolved。
- partial：只有非阻断关系缺失，保留可用内容。
- invalid：当前任务、主要成果、完成规则、受控规则或写回目标 missing/ambiguous/forbidden。
- 所有统计有分母与生成时间，不包装成能力进度。

### 7.5 未知状态

输出 `{"status":null,"status_raw":"done","status_valid":false,"issues":["unknown_status"]}`。对象可进入只读诊断/档案，但不进入当前任务、完成统计、门禁、能力判断或写回目标。

### 7.6 向后兼容

1. major.minor.patch：新增可选字段为 minor；修正文案为 patch；删改字段/含义/必填为 major。
2. 消费方声明支持版本；未知 major 拒绝执行并保留原始 Markdown 入口。
3. V0.1 `documents` 可作为 `legacy_documents` 只读输出一个 minor 周期，不驱动 P0、受控搜索或写回。
4. `artifact_id` 是 `id` 的兼容别名；两者不一致时 invalid。
5. legacy path hash ID 只读；迁移后用 `legacy_ids` 保留跳转。
6. 未知对象/关系/枚举保留 raw 并诊断，不改写 Markdown。

## 8. 来源优先级与缺失

事实优先级：

1. 学习原则：运行模型 / 执行规则。
2. 六个月方向：六个月总纲。
3. 月内动作与验收：执行手册。
4. 资源范围：每日资源与产出路径。
5. 运行关系与当前上下文：运行映射及对象自身 Markdown。
6. 实际状态：对象自身成果与证据；汇总必须可追溯。
7. 模板身份/输出：模板注册表。
8. 目录边界/状态全集：内容配置。

同优先级权威值冲突为 ambiguous，不按修改时间覆盖。

| 缺失 | 读取 | 正式行为 |
|---|---|---|
| 当前任务 | 保留计划 | 不选择、不开始 |
| 依赖/门禁 | 保留问题 | 禁止推进受影响任务 |
| 完成规则/主要成果 | 可读 | 禁止 completed |
| Evidence | 可自检 | 禁止 verified/能力升级 |
| 能力判断 | 显示目标 | assessed_level=null |
| 来源版本 | 只读 | 禁止写回/受控开放 |
| 受控规则 | 只显示安全类别 | locked |

## 9. 受控材料隔离

Resource 可声明 `resource_kind=controlled` 并引用 AccessPolicy。普通索引只允许：不可逆的 `control_id`、安全类别（如“首测参考材料”）、关联 Task、开放条件描述、locked/available/unknown、决定时间和安全诊断。

开放前，普通索引、搜索、关联卡、摘要、日志和诊断不得含：

- 真实路径、文件名、真实标题、正文、摘要、标题列表、答案字母或核心判断；
- token、片段、embedding、可逆摘要、内容长度、正文派生值；
- 指向受控正文的普通 RelationRef。

`control_id` 不得由路径/文件名可逆生成。真实定位和内容版本只在独立受保护清单中，不参与普通搜索；本契约不决定其载体。

开放必须同时满足：

1. 前置断言由 fresh 的 Artifact/Evidence 支持；
2. 首次独立版本已保存并有独立版本 ID；
3. Policy、Task、材料关系全部 resolved；
4. 索引 fresh、来源已知、环境非只读/冲突；
5. 授权视图只返回本策略允许的精确材料。

任一 missing/ambiguous/stale/unknown 时 fail closed。开放记录条件快照、用户动作、时间和来源版本。“曾开放”不自动代表未来永久开放。

当前 `web/public/data/learning-index.json` 已暴露两份参考答案信息，不符合本契约。真实数据实现前必须先隔离并通过 CT-CTL；本轮不删除、不重建索引。

## 10. 草稿与写回行为

### 10.1 Draft（非权威）

必填：`draft_id`、`target_object_type`、`target_id`、`target_path`、`base_revision`、`content`、`created_at`、`updated_at`、`draft_state`、`recovery_hint`。

`draft_state`：editing/previewed/confirmation_required/conflict/write_failed/committed/abandoned。它不是九个运行状态。跨会话保存时长留技术设计，但当前会话内导航、失败和冲突后必须可恢复或复制。

### 10.2 差异预览

确认前必须显示：

- 目标对象、相对路径、对象类型；
- base 与当前 revision；
- frontmatter 和正文新增/删除/修改；
- 预计状态变化，以及明确不会变化的能力/其他对象；
- 多目标完整清单；
- 受控首版与参考后修订的版本边界。

差异不可计算、目标已变或路径不允许时不能正式确认。

### 10.3 用户确认

确认绑定 `intent_id + target_paths + current_revisions + diff_revision`。草稿、来源、路径或版本变化后旧确认失效，必须重做预览。动作使用“提交成果”等具体文案。

### 10.4 允许路径

1. 必须是规范化仓库相对路径，并落在 `content/` 活动目录。
2. 必须符合对象类别、模板 default_output_dir、任务指定成果或明确 append 规则。
3. `archive/`、`exports/`、`00-templates/`、`config/`、生成索引、网站代码和仓库外路径不可由普通学习写回修改。
4. 绝对、含 `..`、解析越界、受控或类型不符路径拒绝。
5. 已有专用成果更新原路径，不因模板存在复制成果。

### 10.5 冲突

确认前重读目标 revision，以及会影响状态转换的配置、模板、Policy、Artifact、Evidence、Task、Review 版本。任一必需版本变化即冲突；禁止静默覆盖。返回冲突对象、草稿安全、权威未改变和“重新加载并保留草稿 / 复制草稿 / 重新预览”。

### 10.6 原子写回

原子边界是一次确认中的全部权威 Markdown 目标：

1. 先验证路径、版本、字段、状态、模板和受控规则；
2. 任一预检失败则全部不写；
3. 全部提交或全部未提交，不允许 Task 状态已变而 Artifact/Review 未写；
4. 写后重新读取并验证，失败不能宣称成功；
5. 索引是写后的派生步骤。若 Markdown 成功而索引失败，结果为 `committed_index_stale`：列出已变权威文件，网站进入只读/过期，禁止重复同一确认，并提供重建投影入口。

不规定锁、临时文件、事务或版本控制实现。

### 10.7 状态转换

- Task → completed：主要 Artifact 存在，全部完成规则通过，用户确认写入。
- Task/Artifact → verified：有符合标准和独立范围的后续 Evidence。
- Session → completed：收尾字段齐全；不改变 Task。
- Review → completed：有 next_action/adjustment，或有证据的不调整理由。
- blocked：必须有原因、解除条件和安全降级。
- 未知、过期或 P0 关系 invalid 时禁止正式转换。

### 10.8 失败恢复

结果枚举：`preview_ready`、`confirmation_expired`、`validation_failed`、`conflict`、`path_forbidden`、`write_failed`、`committed`、`committed_index_stale`。

结果必须返回 intent、目标、权威是否改变、新 revision、Task/能力是否改变、草稿是否保留、索引新鲜度和恢复动作。失败时输入保持可见且可复制；重进以 draft_id 恢复，无法恢复必须在离开前告警。

## 11. FR / AC / DT 追踪

| 契约能力 | FR | AC | DT | 条款 |
|---|---|---|---|---|
| 当前任务与计划追溯 | FR-01—03、09 | AC-P0-01—03；P1-01 | DT-01、03 | 5.1/5.2、6、7 |
| 任务协议、资源、门禁 | FR-03、04、09 | AC-P0-03、04、12 | DT-01、02 | 5.2/5.4、6 |
| 受控材料 | FR-04、07 | AC-P0-05、07 | DT-01、03—05 | 9、10 |
| 成果、完成与状态 | FR-05、06 | AC-P0-06、08 | DT-01、02、04 | 4、5.5、10.7 |
| 草稿与失败恢复 | FR-06、07、14 | AC-P0-07、11 | DT-03—05 | 7、10 |
| Session 与续接 | FR-03、07、08 | AC-P0-03、09 | DT-01、05 | 5.8、6 |
| Review 与计划反馈 | FR-08、12 | AC-P0-09、10、12；P1-05 | DT-01、04 | 5.7、6、10.7 |
| Evidence 与能力 | FR-05、10—12 | AC-P0-06、08、10；P1-03—05 | DT-01、02 | 3.3、5.3/5.6 |
| 路线图 | FR-02、09 | AC-P0-02；P1-01 | DT-01—03 | 5.1、6、7 |
| 知识图/节点 | FR-10—12 | AC-P1-02—05 | DT-01、02 | 3.3、5.3 |
| 档案/筛选 | FR-13、14 | AC-P2-01—03 | DT-01、03 | 4、5、7 |
| 来源、未知、过期、部分 | FR-06、07 | AC-P0-11、12 | DT-01—03 | 3、7、8 |
| 路径、diff、confirm、conflict、atomic | FR-05—07、14 | AC-P0-06、07、11 | DT-04、05 | 10 |

DT-01 由 SourceRef 和单一 Markdown 权威满足；DT-02 由状态全集、未知值和能力分离满足；DT-03 由 generated_at + source_revision + freshness 满足；DT-04 由允许路径、差异、确认、冲突和原子行为满足；DT-05 由 Draft 和恢复满足。

## 12. 契约测试清单

### Schema / 来源

- [ ] CT-SCH-01 schema_version 为受支持的 major.minor.patch。
- [ ] CT-SCH-02 顶层字段与八集合始终存在。
- [ ] CT-SCH-03 正式对象至少一个有 revision 的 SourceRef。
- [ ] CT-SCH-04 commit 与 modified/source_set_revision 不互相冒充。
- [ ] CT-SCH-05 未知 major 拒绝执行。
- [ ] CT-SCH-06 legacy ID 不成为正式关系目标。

### 对象 / 关系

- [ ] CT-OBJ-01 ID 唯一，别名无冲突。
- [ ] CT-OBJ-02 M01、W01—04、D01—20、C01—05、R1—13 可投影。
- [ ] CT-OBJ-03 缺失关系产生 partial/invalid，不补造。
- [ ] CT-OBJ-04 ambiguous 不按时间或首项选择。
- [ ] CT-OBJ-05 反向关系标 derived 且可溯源。
- [ ] CT-OBJ-06 多当前候选返回 ambiguous。
- [ ] CT-OBJ-07 D04 依赖未满足时不可执行。
- [ ] CT-OBJ-08 八类路径/目标可解析。

### 状态 / 能力

- [ ] CT-STA-01 持久状态只来自配置。
- [ ] CT-STA-02 未知状态输出 null + raw + issue。
- [ ] CT-STA-03 不适用状态被拒绝。
- [ ] CT-STA-04 Session completed 不改变 Task/Artifact。
- [ ] CT-STA-05 Task completed 不改变 assessed_level。
- [ ] CT-STA-06 verified 必须有独立 Evidence。
- [ ] CT-STA-07 无 Evidence 时能力为 null/unassessed。
- [ ] CT-STA-08 blocked 有原因、解除条件和降级路径。

### 索引 / 过期

- [ ] CT-IDX-01 generated_at 带时区。
- [ ] CT-IDX-02 任一权威源改变使旧索引 stale。
- [ ] CT-IDX-03 版本不可比为 unknown，写回/开放暂停。
- [ ] CT-IDX-04 写回后索引失败为 committed_index_stale。
- [ ] CT-IDX-05 完整性统计与 diagnostics 一致。
- [ ] CT-IDX-06 缺失/加载不输出假 0 能力或完成率。
- [ ] CT-IDX-07 legacy_documents 不驱动 P0。

### 受控材料

- [ ] CT-CTL-01 普通索引无受控路径、文件名、标题、headings、正文或 summary。
- [ ] CT-CTL-02 普通搜索/关系无法命中正文。
- [ ] CT-CTL-03 control_id 不可由路径/文件名推导。
- [ ] CT-CTL-04 missing/ambiguous/stale/unknown 均 locked。
- [ ] CT-CTL-05 首次独立版本未保存时 locked。
- [ ] CT-CTL-06 只开放策略允许的精确材料。
- [ ] CT-CTL-07 开放决定记录条件、时间和源版本。
- [ ] CT-CTL-08 两份现有参考答案不再进入普通索引内容字段。

### 草稿 / 写回

- [ ] CT-WRT-01 Draft 不改变正式状态。
- [ ] CT-WRT-02 差异含路径、版本、正文/frontmatter 和状态影响。
- [ ] CT-WRT-03 草稿或来源变化使旧确认失效。
- [ ] CT-WRT-04 越界、绝对、..、受控、类型不符路径拒绝。
- [ ] CT-WRT-05 冲突不覆盖，草稿可恢复/复制。
- [ ] CT-WRT-06 多目标全部成功或全部不写。
- [ ] CT-WRT-07 写后校验失败不宣称成功。
- [ ] CT-WRT-08 completed 前主要成果和规则通过。
- [ ] CT-WRT-09 verified 前有独立 Evidence。
- [ ] CT-WRT-10 Session completed 与 Task 分离。
- [ ] CT-WRT-11 Review completed 有下一行动/调整或不调整证据。
- [ ] CT-WRT-12 失败返回权威变化、草稿与恢复动作。
- [ ] CT-WRT-13 committed_index_stale 不重复写同一确认。

### 真实样例

- [ ] CT-DAT-01 D01 完成不推断能力 verified。
- [ ] CT-DAT-02 D02 Task/Artifact learning、Session completed、可续接。
- [ ] CT-DAT-03 D03 会话存在但正式证据待补。
- [ ] CT-DAT-04 D04 not_started 且依赖 D03。
- [ ] CT-DAT-05 C02 target L2、assessed_level=null。
- [ ] CT-DAT-06 24 个 legacy 可只读但关系 partial。
- [ ] CT-DAT-07 覆盖未知、缺失、过期、只读、冲突、权限与索引失败。

## 13. 内容契约变更提案（本轮不执行）

| ID | 方案 | 影响 | 迁移边界 |
|---|---|---|---|
| CP-01 | 配置 V1.0：schema、对象适用状态、允许写入根、freshness、受控默认拒绝 | config、文档、校验测试 | 保留 9 个状态原值；配置/工具/测试/文档同改 |
| CP-02 | 运行映射 V0.2：在现有权威 Markdown 增加可机器读取的 Goal/Month/Week/Task/Resource/Capability/门禁关系区 | 运行映射、执行手册/资源引用、索引工具 | 不新建平行计划；结构区与人类表格需同源校验 |
| CP-03 | 新内容强制最小 frontmatter；legacy 按需分批补齐 | content、模板、规范、校验器 | 本轮不批量迁移；先 P0 和受控相关 |
| CP-04 | 模板注册表 V1.0：可创建对象、必填关系、允许输出、append、别名 | 注册表、13 模板、README、测试 | 注册表与模板同改；既有专用成果允许 template_id=null |
| CP-05 | 索引 V1.0：八集合、关系、源版本、新鲜度、诊断与兼容 | 工具、生成索引、README、测试、网站读契约 | major 变更；先冻结样例 |
| CP-06 | 受控隔离：安全策略声明 + 受保护定位；普通索引移除所有内容派生字段 | 运行映射、受控最小元数据、工具/测试 | 实现 Blocker；先隔离再消费真实索引 |
| CP-07 | Evidence 独立性、Review 下一行动、Session 续接字段 | 模板、P0 内容、工具/测试 | 不改学习结论；缺失先 partial |
| CP-08 | 落实 Draft/revision/diff/confirm/path/conflict/atomic/recovery | 后续技术设计 | 技术不得削弱第 10 节 |

建议顺序：冻结 CP-01/02/04 → 先实施 CP-06 并通过 CT-CTL → 用 D01—04、C02、R1/R2、一个日复盘和一个 Policy 冻结 P0 样例 → 实施 CP-05 → 按 P0 需要执行 CP-03/07；24 个 legacy 分批迁移。

实际变更必须同步检查：配置、模板注册表及模板、两份 README、执行规则/模板规范/首月映射、索引构建器/校验器/README/测试、生成索引、产品规格/追踪/验收/本文，以及检查入口说明。

## 14. 决策与门禁

本契约关闭：索引读 / Markdown 写的权威关系、WeeklyPlan 作为 week milestone、Guide 仅作来源、对象状态适用性、L0—L4 独立、唯一任务解析、普通索引零泄露、来源版本/过期、多候选不临时改计划、档案不复制正文、无计划关系不创建任务。

**结论：数据契约 V1.0 可进入“契约评审与最小样例冻结”，但不能直接进入真实数据驱动实现。**

实现前 Blocker：

1. 批准 CP-01、CP-02、CP-04 的字段表达与权威区段；
2. 完成 CP-06，使现有参考答案及动态受控材料不进入普通索引；
3. 冻结符合第 7 节的 V1.0 最小样例并通过 CT-SCH、CT-STA、CT-CTL。

这些门禁不要求批量迁移 24 个 legacy 文档，也不改变现有 Markdown 学习结论。
