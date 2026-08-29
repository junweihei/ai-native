# AI Native Learning OS V1 技术验证与实施计划

## 文档控制

| 字段 | 值 |
|---|---|
| 状态 | Active；ADR-0001 已批准，最小工程骨架实施中 |
| 日期 | 2026-08-29 |
| 架构 | `docs/architecture/adr-0001-learning-os-v1-application-architecture.md` |
| 上游门禁 | 数据契约 CP-01/02/04 评审、CP-06 受控隔离、V1 最小样例 |
| 当前阶段 | Stage 0 最小工程骨架；不实现业务页面、真实内容读取或写回 |

## 1. 实施原则

1. 先验证最高风险假设，再搭建应用。
2. 先完成受控隔离和索引 V1 最小样例，再让 UI 消费真实数据。
3. 按 P0 纵向闭环交付，不按“先做完所有页面”推进。
4. 每个行为变化同时补测试；每个契约变化同时改配置、模板、工具和文档。
5. 每阶段结束必须能从 fresh clone/Worktree 通过 setup/check 重现。
6. 不在任何阶段引入数据库、账号、云服务或模型供应商。

## 2. 评审前置门禁

在创建 `package.json` 前必须：

- [ ] ADR-0001 状态改为 Accepted 或 Accepted with amendments。
- [ ] 产品/内容治理批准数据契约 CP-01、CP-02、CP-04。
- [ ] 冻结 V1 index 最小 fixture：D01—04、C02、R1/R2、一个日 Review、一个 Controlled Policy。
- [ ] 确认普通索引受控零泄露规则是实现 Blocker。
- [ ] 确认 Tier 1/2 支持矩阵与性能预算。
- [ ] 每个 TV 任务有独立分支/Worktree、时间盒和结论记录。

## 3. 小型技术验证任务

验证代码只能存在于独立 `spike/*` 分支或临时目录；结论进入 `docs/architecture/validation/`。未被 ADR 接受的验证代码不得复制到生产目录。

### TV-01 跨平台原子写回与中断恢复

| 项目 | 内容 |
|---|---|
| 假设 | Node 可在允许目录内完成单/多 Markdown 目标的 all-or-none 行为，并在进程中断、占用文件和索引失败后判定权威结果 |
| 范围 | 临时 Git 仓库；Windows 必验，macOS/Linux 在独立环境验证 |
| 场景 | 新建、替换、append、多目标、目标被改、权限拒绝、文件占用、写中断、校验失败、index 失败 |
| 通过 | 无半完成状态；冲突不覆盖；恢复可判定；无 repo 外写入 |
| 产出 | 决策记录、失败矩阵、选定原子/恢复算法；不保留生产实现 |
| 时间盒 | 1—2 天 |

若失败：评估把 Write Coordinator 下沉到 Python/FastAPI（方案 B），而不是削弱原子契约。

### TV-02 Loopback 信任边界

| 项目 | 内容 |
|---|---|
| 假设 | loopback-only + same-origin + launch token + Host/Origin 检查可阻止第三方网页调用本地写 API |
| 场景 | 非 loopback 绑定、恶意 Origin、伪造 Host、缺/错 token、重放确认、超限 body、CORS preflight |
| 通过 | 写 API 全部拒绝；读 API 不泄露受控信息；token 不入 URL/日志/仓库 |
| 产出 | 请求守卫规范和安全测试样例 |
| 时间盒 | 1 天 |

### TV-03 Node → Python 内容工具适配

| 项目 | 内容 |
|---|---|
| 假设 | Node 可跨 Windows/macOS/Linux 用固定参数数组调用现有 Python 校验/索引器，并得到结构化、可超时、可取消的结果 |
| 场景 | `py -3`、`python3`、`python` 发现；非 ASCII 路径；warning/error；进程退出；超时；modified worktree |
| 通过 | 无 shell 注入；UTF-8 正确；错误可分类；source_revision 可追踪 |
| 产出 | Adapter 行为契约和平台结果 |
| 时间盒 | 1 天 |

若失败：方案 B 升为推荐，或为现有工具增加稳定 CLI 契约；不复制索引规则到 UI。

### TV-04 受控材料零泄露

| 项目 | 内容 |
|---|---|
| 假设 | V1 普通 index、静态 bundle、source map、搜索、错误和日志可完全排除受控内容派生值 |
| 场景 | 两份现有参考答案、D18/D19 动态受控组、错误路径、unknown/stale、构建 source map |
| 通过 | CT-CTL-01—08 全部通过；已知敏感词/路径扫描零命中 |
| 产出 | leak fixture、扫描策略、fail-closed 结论 |
| 时间盒 | 1—2 天 |

失败即停止真实数据 UI 实施。

### TV-05 草稿恢复与容量

| 项目 | 内容 |
|---|---|
| 假设 | localStorage 足以保存 V1 文本草稿、base revision 和恢复元数据 |
| 场景 | 刷新、前进后退、崩溃重开、隐私模式、禁用存储、配额耗尽、两标签页、过期草稿 |
| 浏览器 | Chromium、Firefox、WebKit |
| 通过 | 普通草稿可恢复；失败时输入仍可复制/导出；不改变正式状态 |
| 产出 | 单草稿上限、保留策略、降级文案 |
| 时间盒 | 1 天 |

失败：改用服务侧、非数据库的忽略目录草稿文件，并单独评审信任/清理边界。

### TV-06 响应式与 WCAG

| 项目 | 内容 |
|---|---|
| 假设 | React + 原生 HTML/CSS 可在无 UI 库下满足七页、高风险对话框、320px、200% 和键盘 P0 |
| 场景 | UF-01—03；未保存、错误、只读、过期、阻塞；运行状态 vs L0—L4 |
| 通过 | axe 无阻断；键盘无陷阱；focus 返回正确；320px 无双向页面滚动；200% 无功能损失 |
| 产出 | 组件原语清单和需人工验证项 |
| 时间盒 | 2 天 |

### TV-07 性能与数据规模

| 项目 | 内容 |
|---|---|
| 假设 | 无数据库、无搜索引擎时，六个月索引仍满足 ADR 预算 |
| Fixture | 500 objects、2,000 relations、200 文档摘要、1 MiB 单文档 diff |
| 通过 | index、解析、LCP/INP/CLS、API、diff 和 RSS 均达预算 |
| 产出 | 基准结果；是否需按路由分片 |
| 时间盒 | 1 天 |

### TV-08 支持矩阵与只读出口

| 项目 | 内容 |
|---|---|
| 假设 | 同一构建能在 Tier 1/2 浏览器运行；静态模式可明确只读且不打包受控清单 |
| 场景 | Windows Edge/Chrome；macOS Safari/Chrome；Linux Firefox/Chrome；无 Local 服务 |
| 通过 | 读模式一致；写动作不可见/明确禁用；无外部启动请求；受控信息零泄露 |
| 产出 | 冻结 OS/browser 最低版本和降级边界 |
| 时间盒 | 1—2 天 |

### TV-09 Markdown 渲染与 CSP

| 项目 | 内容 |
|---|---|
| 假设 | 禁止 raw HTML 的 renderer + CSP 可安全展示仓库 Markdown，不破坏必要表格/列表/链接 |
| 场景 | script、事件属性、javascript URL、远程图片、嵌套 HTML、长表格、中文路径 |
| 通过 | 无脚本执行；外链/远程资源遵守策略；内容仍可读 |
| 产出 | 允许 Markdown 子集与 CSP 草案 |
| 时间盒 | 0.5—1 天 |

## 4. 分阶段实施

### Phase 0：ADR 与数据门禁

交付：

- ADR 评审结论。
- CP-01/02/04 的批准表达。
- CP-06 设计和 V1 最小 fixture。
- TV-01—09 结果及 ADR 修订。

退出标准：所有 Blocker 假设通过或有被评审接受的方案切换；仍不要求生产 UI。

### Phase 1：可重复工程基线

仅在 ADR Accepted 后：

- 创建单一根 `package.json`、`package-lock.json` 和 Node 版本声明。
- 建立 TypeScript strict、Vite、React、Fastify 的空壳边界。
- 建立 JSON Schema、lint/format/typecheck/unit/build/check。
- 保留 Python 工具与测试入口。
- setup/check 在 Windows、macOS/Linux 一致。
- 首个页面只验证健康状态，不接真实内容、不写 Markdown。

退出标准：fresh clone 运行 setup/check；无数据库/云/模型依赖；依赖审计完成。

### Phase 2：V1 索引与只读 P0

- 实施数据契约 CP-01/02/04/05/06 的最小范围。
- 生成 sanitized index V1；旧 V0.1 只读兼容。
- UI 实现今日 → 任务工作台只读、来源/新鲜度/关系诊断。
- 实现默认、加载、空、部分、错误、只读、过期、阻塞。

退出标准：CT-SCH/OBJ/STA/IDX/CTL；AC-P0-01—05 的只读部分；受控扫描零命中。

### Phase 3：草稿与未保存保护

- Draft Store、base revision、节流保存、恢复和清理。
- 未保存离开保护、复制/导出降级。
- 任务输入、日复盘输入；仍不正式写回。

退出标准：CT-WRT-01—03；AC-P0-03/07/09 的草稿部分；Chromium/Firefox/WebKit 恢复测试。

### Phase 4：预览、确认与安全写回

- Intent、path allowlist、revision、frontmatter/body diff。
- confirmation expiry、conflict、all-or-none、写后验证。
- index rebuild 和 committed_index_stale。
- Task/Artifact/Session/Review 对象级状态转换。

退出标准：CT-WRT 全集；DT-04/05；AC-P0-06/07/09/11/12；失败注入零草稿丢失。

### Phase 5：受控材料闭环

- Controlled Broker、首次版本快照、精确开放、审计结果。
- 首版与参考后修订分区，不进普通缓存/日志。
- UF-02 桌面与 320px 完整 E2E。

退出标准：CT-CTL 全集；AC-P0-05 零泄露 Blocker；stale/unknown/readonly/conflict 均 fail closed。

### Phase 6：复盘、证据与完整 P0

- Artifact/Evidence/Review/Session 关系。
- 日复盘生成续接点；Evidence 不自动升级能力。
- UF-01 与 UF-03 正常/异常全路径。

退出标准：AC-P0-01—12、DT-01—05；D01—04/C02 真实 fixture 语义一致。

### Phase 7：P1/P2 七页完成

- 路线图、知识地图、节点详情、学习档案。
- 中宽、320px、200%、键盘、返回上下文。
- 搜索只针对 sanitized index；不引入搜索服务。

退出标准：AC-P1/P2；UI-01—10；AX-01—06。

### Phase 8：发布候选硬化

- Tier 1/2 支持矩阵。
- 性能预算、依赖和许可证审计。
- fresh clone/Worktree、Windows/macOS/Linux setup/check。
- 静态只读构建验证。
- 发布验收报告和已知风险。

退出标准：P0 全通过；Blocker/Critical=0；受控泄露=0；草稿不可恢复丢失=0。

## 5. 测试映射

| 交付能力 | 最低测试 |
|---|---|
| Index V1 | Python 单元 + JSON Schema fixture + CT-SCH/OBJ/IDX |
| 状态/能力 | 纯函数单元 + CT-STA + D01/D02/C02 fixture |
| 页面/组件 | Testing Library + user-event + axe |
| Local API | Fastify inject：Origin/token/schema/size/错误 |
| Path/revision/diff | 临时仓库集成 + property/边界样例 |
| Atomic/recovery | 多文件失败注入 + 进程中断恢复 |
| Controlled | leak scan + negative search + UF-02 E2E |
| P0 | Playwright Chromium/Firefox/WebKit |
| AX | axe + 键盘 + 200% + 屏幕阅读人工清单 |
| Performance | 合成六个月 fixture + bundle/API/browser budgets |

任何行为修改无测试时必须在 PR 中说明为何无法测试、风险和补测期限。

## 6. 落地时必须同步修改的文件

### 6.1 仓库规则与入口

| 文件 | 必须修改 |
|---|---|
| `AGENTS.md` | 栈版本、目录边界、禁止直接文件写、正式 dev/build/test/e2e 命令、依赖变更规则、浏览器/Handoff 要求 |
| `README.md` | 本地启动、读写/只读模式、前置运行时、数据流和故障恢复 |
| `web/README.md` | 选型结论、页面/服务/contracts 目录、索引 V1、受控边界、静态只读限制 |
| `content/README.md` | 仅当 CP 实际改变内容契约时同步；不得提前修改 |
| `tools/content_index/README.md` | V1 schema、结构化 CLI、来源版本、受控隔离、错误码 |

### 6.2 Setup / Check

`scripts/setup.ps1` 与 `scripts/setup.sh`：

- 验证 Node 24 LTS、npm、Python 3.11+。
- `npm ci`，不得 fallback 到无锁 `npm install`。
- 安装 Playwright 所需浏览器的明确流程；CI/Local 是否默认安装由 TV-08 冻结。
- 不创建 `.env`、数据库或仓库内运行数据。

`scripts/check-repo.ps1` 与 `scripts/check-repo.sh`：

1. 现有秘密/禁止文件扫描。
2. Python 内容校验和 unittest。
3. index schema/contract/controlled leak 检查。
4. npm lockfile 一致性。
5. format/lint/typecheck。
6. TS unit/component/server integration。
7. production build + bundle budget。
8. Playwright P0/AX；若拆分快/全检查，AGENTS 和 CI 必须明确两者，发布必须运行全检查。

Windows 与 shell 脚本必须产生等价结论和退出码。

### 6.3 依赖和配置文件

评审通过后的首次工程 PR 预计新增：

- `package.json`、`package-lock.json`
- `.nvmrc` 或等效 Node 版本声明
- `tsconfig.json` 与浏览器/服务分配置
- `vite.config.ts`
- `playwright.config.ts`
- lint/format 配置
- `web/contracts/index-v1.schema.json` 及 fixture
- CI workflow（若当前仓库启用 CI）

若 Python 工具引入第三方依赖，必须同时新增唯一的 Python 依赖声明和锁文件；当前建议保持标准库，不为了应用服务引入 Python Web 框架。

`.gitignore` 需复核：

- 保持 `node_modules/`、`dist/`、`coverage/`、Playwright 报告/截图、临时事务文件和本地日志不跟踪。
- 生成 index 是否继续不跟踪由 CP-05 评审决定；普通/受控投影绝不能混放。
- 不忽略必须审查的 schema fixture 或 lockfile。

### 6.4 环境变量示例

新增 `.env.example`，只含非秘密可覆盖项：

```dotenv
LEARNING_OS_HOST=127.0.0.1
LEARNING_OS_PORT=4173
LEARNING_OS_REPO_ROOT=.
LEARNING_OS_MODE=read-write
LEARNING_OS_LOG_LEVEL=info
LEARNING_OS_PYTHON=
```

规则：

- 所有项都有安全默认值，普通本地运行不要求 `.env`。
- HOST 非 loopback 时启动失败，除非未来另立 ADR。
- launch token、草稿、受控路径和内容不得进入环境变量示例。
- 浏览器可见配置使用单独 allowlist；不得把任意服务环境变量注入前端。
- `.env` 继续禁止提交，`.env.example` 必须提交且无秘密。

### 6.5 产品、数据和验收文档

实施 CP 时同步：

- `docs/product/website-data-contract-v1.0.md` 及版本变更说明。
- `docs/product/website-requirements-traceability-v1.0.md` 的实现/验收状态。
- `docs/product/website-acceptance-criteria-v1.0.md` 的支持矩阵和实际命令。
- 高保真规格中只补实际实现偏差，不改变设计原则。
- 新增 `docs/architecture/validation/*.md`、运维/故障恢复说明和发布验收报告。

## 7. 首次依赖清单评审

首次工程 PR 必须把每个生产依赖列入评审表：

| 类别 | 预期选择 | 必须证明 |
|---|---|---|
| UI | react、react-dom、router | 体积、许可证、无状态库需求 |
| Service | fastify、static adapter | loopback、安全测试、退出到 node:http 的成本 |
| Markdown | react-markdown、GFM | raw HTML 默认禁用、CSP 测试 |
| Diff | 文本 diff 库 | 无原生绑定、1 MiB 性能 |
| Schema | Fastify/Ajv 能力 | Draft 2020-12 支持与契约一致 |

开发依赖包括 TypeScript、Vite、React plugin、Vitest、Testing Library、Playwright、axe、lint/format。不得用“常用”作为依赖理由。

## 8. 分支与交付

- 每个 Phase 或 TV 使用独立 `feature/`、`test/` 或 `docs/` 分支及 Worktree。
- lockfile、schema、central route 和写回协调器避免并发编辑。
- Cloud 只从已推送提交工作；真实浏览器、OS 文件行为和可访问性通过 Handoff 在 Local 验证。
- 不直接合并 main；每个 PR 提供改动、命令、结果、风险和回滚方式。

## 9. 停止条件

任一条件出现即停止扩展功能：

1. 普通索引或日志泄露受控信息。
2. 写回可能越过允许路径、静默覆盖或产生半完成状态。
3. 草稿失败后无复制/恢复路径。
4. Session/Artifact 状态被聚合成 Task 完成，或 Task 完成升级 L0—L4。
5. P0 在 320px、键盘或 200% 下不可完成。
6. setup/check 在 fresh clone 不可复现。
7. 为解决性能问题准备默认引入数据库/云服务而尚无预算证据。

## 10. 计划结论

推荐顺序不是“先搭框架再补安全”，而是：

`ADR 评审 → 小型技术验证 → 受控隔离与 V1 fixture → 可重复工程基线 → 只读 P0 → 草稿 → 安全写回 → 受控闭环 → 七页 → 发布硬化`。

在 ADR 通过前，本计划不授权创建应用工程或安装依赖。
