# ADR-0001：AI Native Learning OS V1 应用技术选型与架构

## 状态

**Accepted — 2026-08-29 已批准进入最小工程骨架阶段。业务页面、真实索引适配与安全写回仍须按实施门禁另行评审。**

| 字段 | 值 |
|---|---|
| 日期 | 2026-08-29 |
| 决策范围 | V1 应用运行时、前端、Local 服务、测试、部署边界与维护策略 |
| 上游 | 产品、设计、验收、需求追踪、信息架构、高保真和数据契约 V1.0 |
| 不改变 | Markdown 权威、目录 V1.0、状态枚举、L0—L4、受控材料和 P0 闭环 |
| 不引入 | 数据库、账号、云服务、模型供应商、遥测平台 |

## 1. 背景与硬约束

V1 是单用户、本地优先的学习执行系统。完整能力包括生成索引读取、安全写回 Markdown、差异确认、冲突检测、原子提交、草稿恢复和受控材料隔离。浏览器不能被直接授予仓库任意文件权限。

硬约束：

1. Markdown 是唯一正式学习内容与状态权威。
2. 页面只读取生成索引；索引不可反向成为权威。
3. 正式写回必须符合数据契约的 path/revision/diff/confirm/conflict/atomic/recovery。
4. 受控内容不进入普通索引、搜索、日志或错误正文。
5. 无数据库、账号、默认云服务或模型集成。
6. 桌面和 320px 响应式；WCAG 2.2 AA。
7. Windows、macOS、Linux 可重复安装和测试。
8. V1 规模小，优先清晰边界、少依赖、可退出，而非平台化。

现有仓库已有 Python 内容发现、frontmatter 解析、校验和索引构建工具；尚无 `package.json`、锁文件、应用运行时或前端框架。

## 2. 决策驱动因素

按优先级排序：

1. Markdown 写回安全和受控材料零泄露。
2. 草稿可恢复、冲突可解释、失败不丢输入。
3. P0 流程与可访问性可自动和人工重复验证。
4. 本地启动简单；跨平台行为可复现。
5. 数据契约在浏览器、服务和 Python 索引器间不漂移。
6. 依赖和认知负担适合单人长期维护。
7. 可提供无写回的静态只读出口。
8. 不把 V1 锁进桌面打包、云平台或私有数据层。

## 3. 候选方案

### 方案 A：Node/TypeScript 本地 Web 应用（推荐）

- 浏览器：React + TypeScript strict + Vite。
- 本地服务：Node.js LTS + Fastify；同源提供 UI 和受限 API。
- 内容工具：保留现有 Python 校验/索引器，通过单一适配器调用。
- 草稿：浏览器 `localStorage`，只存非权威草稿和偏好。
- 测试：Vitest、Testing Library、Fastify inject、Playwright、axe；保留 Python unittest。
- 部署：本地读写为默认；可选静态只读构建，不提供远程写回。

### 方案 B：Python/FastAPI 本地服务 + React/Vite

- 浏览器同方案 A。
- 本地服务使用 FastAPI/Pydantic，直接复用 Python 内容工具。
- 浏览器契约由 OpenAPI/JSON Schema 生成 TypeScript 类型。
- 测试使用 pytest/TestClient + Playwright。

### 方案 C：Tauri 桌面应用 + React/Vite

- WebView 前端 + Rust 命令层直接访问文件。
- 能以 capability/permission 限制文件命令。
- 需要 Rust、Node、平台打包工具；现有 Python 索引器仍需嵌入、调用或重写。
- 交付为各平台桌面包，不再是普通本地网站。

浏览器直接使用 File System Access API 的纯静态方案未进入候选：`showDirectoryPicker()` 仍是 limited availability、需要安全上下文和用户瞬时激活，不能满足本 ADR 的浏览器支持与稳定写回基线。

## 4. 方案比较

评分：5 最优，1 最弱。分数用于解释取舍，不替代安全门禁。

| 维度 | A Node/TS Web | B FastAPI + React | C Tauri |
|---|---:|---:|---:|
| 初始开发复杂度 | 4 | 3 | 2 |
| 安全写回表达力 | 5 | 5 | 5 |
| 浏览器限制 | 5：不依赖浏览器文件 API | 5 | 3：依赖系统 WebView 差异 |
| 本地运行 | 5：单一启动入口 | 4：前后端 + Python | 4：安装后简单，构建复杂 |
| 可选部署 | 5：可静态只读 | 5：可静态只读 | 2：桌面包为主 |
| 测试能力 | 5 | 5 | 3 |
| 生产依赖规模 | 4 | 3 | 2 |
| 运行性能 | 5 | 4 | 4 |
| 跨平台验证成本 | 5 | 5 | 3 |
| 长期维护 | 5：应用层一门语言 | 4：API/前端跨语言 | 2：三类工具链 |
| 退出成本 | 5：静态 UI 与标准 HTTP/JSON | 4 | 2 |

### 4.1 开发复杂度

- A：应用 UI、服务和共享契约主要用 TypeScript；Python 只保留为内容工具边界。两个运行时已是仓库现实，不新增第三门生产语言。
- B：直接复用 Python 最自然，但 UI/服务类型需跨 OpenAPI 生成；开发时仍要 Node 构建前端，运行与依赖管理分成两套。
- C：文件能力强，但 Rust、WebView、平台安装器、签名/更新和 Python 处理方式会把 V1 变成桌面产品工程。

### 4.2 写回与信任

- A/B 都通过 loopback 服务隔离浏览器与文件系统，可完整实现路径白名单、revision、diff、confirm 和原子写回。
- C 能用桌面 capability，但前端漏洞仍可能调用被暴露命令；正确性最终仍依赖命令层的路径和状态校验。

### 4.3 浏览器与跨平台

- A/B 使用普通现代浏览器，不依赖 File System Access API；同一服务模型覆盖 Windows/macOS/Linux。
- C 在 Windows 使用 WebView2、macOS 使用 WKWebView、Linux 使用 WebKitGTK，渲染和辅助功能需分别验证。

### 4.4 测试与维护

- A 的 Vitest 与 Vite 共用解析/配置；Fastify 支持无真实 socket 的 inject 测试；Playwright 可覆盖 Chromium、Firefox、WebKit 和 axe。
- B 的 FastAPI TestClient 很成熟，但需要维护 Python 模型、生成契约和 TypeScript 消费三者的一致性。
- C 除 Web 测试外还需要 Rust 单测、命令集成、桌面 WebView 和打包矩阵。

### 4.5 退出成本

- A 的 React UI、JSON Schema 和 HTTP 行为可迁移到其他本地服务或静态只读模式；Markdown 与 Python 工具不受影响。
- B 同样可退出，但前端生成契约依赖 FastAPI/OpenAPI 形态。
- C 的命令、capability、构建与发布均绑定桌面壳；退出需要重建服务边界。

## 5. 决策

选择 **方案 A：Node.js 24 LTS + TypeScript strict + React + Vite 8 + Fastify 5 的本地 Web 架构**。

具体边界：

- 运行时：Node.js 24 LTS；Python 3.11+ 继续运行现有内容工具。
- 包管理：npm + `package-lock.json`；不额外要求全局包管理器。
- UI：React 当前稳定主版本、React DOM、React Router；不引入全局状态库。
- 构建：Vite 8。
- 服务：Fastify 5；只绑定 loopback，同源提供静态资源与 `/api/v1`。
- 契约：JSON Schema 2020-12 为传输契约来源，生成/检查 TypeScript 类型；不把 UI 类型当权威。
- Markdown 展示：`react-markdown` + GFM 扩展；默认不解析原始 HTML，不远程加载脚本。
- 差异：采用成熟的文本 diff 库；正式写回逻辑仍自行执行数据契约校验。
- 草稿/偏好：`localStorage`；不建数据库。超额或不可用时提供复制/导出与持久告警。
- 样式：设计令牌 + 原生 CSS；不引入 UI 组件库或 CSS 框架。
- 测试：Vitest、Testing Library、Fastify inject、Playwright、`@axe-core/playwright`、现有 Python unittest。
- 质量：TypeScript `strict`、lint、format、依赖审计和构建预算进入 check。

依赖版本在工程落地 PR 中锁到评审时的稳定 patch，主版本不得偏离本 ADR。Node 官方建议生产应用使用 Active/Maintenance LTS；截至本次评审 Node 24 为 LTS。Vite 8 默认生产浏览器下限为 Chrome/Edge 111、Firefox 114、Safari 16.4。

## 6. 不选其他方案

### 不选 B

FastAPI 可行且测试友好，但没有减少前端 Node 工具链；反而使应用 API 模型和浏览器类型跨两门语言维护。现有 Python 工具可以作为窄而稳定的内容适配器继续复用，不需要把整个应用服务扩成 Python 框架。若 TV-03 证明 Node 调用 Python 的可靠性无法满足要求，B 是首选回退方案。

### 不选 C

Tauri 的 capability 和桌面文件能力有价值，但 V1 不需要安装器、窗口系统、系统菜单或自动更新。它会引入 Rust、平台 WebView 和三平台打包验证，增加依赖规模与退出成本。只有未来明确需要离线桌面分发、系统集成或浏览器无法满足的权限能力时才重新评估。

### 不采用纯浏览器文件访问

浏览器文件系统接口尚非 Baseline，权限、支持范围和安全上下文限制会让 Firefox/Safari 与自动化验收出现功能差异；也难以稳定实现多文件原子写回。因此不作为回退写入路径。

## 7. 逻辑架构

```text
Browser UI（不可信输入）
  ├─ 页面/路由/响应式/可访问性
  ├─ Index Query（只读）
  ├─ Draft Store（localStorage，非权威）
  └─ Intent / Diff / Confirm API
          │ same-origin + launch token
          ▼
Local Application Service（loopback 信任边界）
  ├─ Request Guard：Host/Origin/token/size/schema
  ├─ Query Service：只读 V1 index
  ├─ Write Coordinator：path/revision/diff/confirm/conflict/atomic
  ├─ Controlled Access Broker：fail closed
  └─ Content Tool Adapter
          │ explicit command + structured result
          ▼
Existing Python Content Tools
  ├─ validate
  ├─ build sanitized index
  └─ contract diagnostics
          │
          ▼
Repository Filesystem
  ├─ content/**/*.md              authoritative
  ├─ 00-templates/registry        template authority
  ├─ config/learning-content.json boundary/status authority
  ├─ protected control manifest   restricted projection
  └─ web/public/data/index        generated, non-authoritative
```

### 7.1 模块边界

| 模块 | 负责 | 不负责 |
|---|---|---|
| UI Shell | 七页、导航、状态、focus、responsive | 文件读写、状态推断 |
| Index Client | 加载/校验 schema、查询对象、显示 freshness | 修补缺失关系 |
| Draft Store | 草稿、base revision、保存时间、恢复 | 正式状态 |
| Request Guard | loopback/same-origin/token/schema/限额 | 产品完成判断 |
| Query Service | 只读索引和安全文档视图 | 直接扫描 content 作为页面读模型 |
| Write Coordinator | intent、diff、confirm、path、conflict、atomic、result | 绕过数据契约 |
| Controlled Broker | 策略判断、精确材料读取、审计 | 普通索引摘要 |
| Content Adapter | 调用校验/索引工具并规范化结果 | 长期复制 Python 规则到 Node |

### 7.2 仓库建议结构（评审后才创建）

```text
web/
  src/                 React UI
  server/              Fastify local service
  contracts/           JSON Schema + generated TS types
  tests/               UI/integration/e2e fixtures
  public/data/         generated sanitized index
tools/content_index/   existing Python authority projection tools
package.json
package-lock.json
tsconfig*.json
vite.config.ts
playwright.config.ts
```

保持一个 npm package，V1 不建立多包 monorepo。

## 8. 数据流

### 8.1 启动与读取

1. 启动器确认 Node/Python 版本、仓库根和配置存在。
2. Python 工具校验内容并生成普通 V1 索引；受控泄露测试失败则不启动读写模式。
3. 服务只绑定 `127.0.0.1` / `::1`，生成仅存内存的 launch token。
4. 浏览器从同源加载 UI 和 index；校验 schema_version/source_revision/freshness。
5. stale/unknown 时进入只读，允许草稿，不允许正式写回或受控开放。

### 8.2 草稿、预览与确认

1. UI 以 object ID、target path、base revision 创建 draft。
2. 每次输入后节流保存至 localStorage；保存结果有可感知文本。
3. 预览请求只携带 schema 校验后的 intent。
4. 服务解析规范路径、重读 revision、计算 frontmatter/正文 diff 和状态影响。
5. UI 展示 diff；确认绑定 intent + paths + revisions + diff revision。
6. 任一草稿或来源变化使确认失效。

### 8.3 写回

1. Request Guard 验证同源 token、请求大小和 JSON Schema。
2. Write Coordinator 重新检查 path、current revision、关系、状态和受控规则。
3. 在仓库内同一确认的全部目标执行 all-or-none 写回；任何预检失败都不写。
4. 写后读取、内容校验并生成索引。
5. 全部成功返回 committed；Markdown 已成功但索引失败返回 committed_index_stale，服务切只读。
6. UI 保留草稿直到确认成功且新索引可见；不得仅因 HTTP 2xx 删除草稿。

### 8.4 受控访问

普通索引只给 control_id/category/condition/state。Controlled Broker 在每次访问时重验 fresh、首版 revision、Policy 和精确目标；失败即 locked。受控正文不缓存到普通 index/localStorage/日志；显示会话结束时清除内存引用。

## 9. 信任边界与安全

| 边界 | 威胁 | 必须控制 |
|---|---|---|
| Browser → Local Service | 恶意页面、CSRF、伪造请求 | loopback-only；无 CORS；严格 Host/Origin；每次启动随机 token；SameSite；请求限额 |
| UI 输入 → Markdown | 路径穿越、状态绕过、覆盖冲突 | canonical path、允许根、对象规则、revision、diff、二次确认 |
| Markdown → UI | 脚本/HTML 注入、恶意链接 | 默认禁 raw HTML；sanitize；CSP；外链明确标识；禁止远程脚本 |
| Service → Python | 命令注入、输出歧义 | 固定可执行和参数数组；不经 shell；结构化 stdout；超时/退出码 |
| 普通索引 → 受控内容 | 标题/摘要/路径泄露 | 独立受保护清单；普通索引 leak scan；fail closed |
| Filesystem → Repo 外 | symlink/junction、`..`、绝对路径 | resolve 后再次检查 root；拒绝越界和禁止目录 |
| 日志/错误 | 草稿或答案泄露 | 结构化事件 ID；正文、diff、token、受控定位不入日志 |

服务不监听局域网地址，不提供远程写 API，不信任“只有一个用户”作为安全控制。launch token 不写入 `.env`、仓库或日志。

## 10. 错误恢复

| 故障 | 权威状态 | UI/服务行为 | 恢复 |
|---|---|---|---|
| Index 校验失败 | 未变 | 只读；显示 diagnostics | 修复源后刷新 |
| Index stale/unknown | 未变 | 保留草稿；禁写/禁开放 | 重建并比较 revision |
| localStorage 不可用/超额 | 未变 | 持久错误；输入仍可复制 | 导出/复制；清理旧草稿 |
| Preview 失败 | 未变 | 草稿保留 | 重试或复制 |
| Confirm 过期 | 未变 | 禁用旧确认 | 重新预览 |
| Revision 冲突 | 未变 | 不覆盖；展示冲突范围 | 重载并保留草稿 |
| 多目标写前失败 | 全部未变 | validation_failed | 修复输入 |
| 写回中断 | 由写后审计确定 | 启动恢复检查，禁止重复确认 | 根据 transaction journal/文件 revision 判定 |
| Markdown 成功、index 失败 | Markdown 已变 | committed_index_stale；全局只读 | 重建 index，不重复写 |
| Controlled 判定错误/不全 | 未变 | locked | 修复 Policy/证据/新鲜度 |

原子替换、跨平台占用文件和中断恢复方式必须由 TV-01 验证后冻结。

## 11. 测试分层

| 层 | 工具 | 范围 | 门禁 |
|---|---|---|---|
| L0 静态 | tsc strict、lint、format、schema check | 类型、边界、无漂移 | 每次 check |
| L1 Python 单元 | unittest | frontmatter、发现、索引、校验 | 每次 check |
| L1 TS 单元 | Vitest | query、状态语义、路径纯函数、draft reducer | 每次 check |
| L2 组件 | Testing Library + user-event + axe | 七页、状态、焦点、错误、320px 结构 | PR |
| L2 服务 | Fastify inject | Origin/token/schema、diff、冲突、结果枚举 | PR |
| L2 契约 | JSON fixtures + 双端验证 | CT-SCH/OBJ/STA/IDX/CTL/WRT | PR；受控为 Blocker |
| L3 文件集成 | 临时仓库 fixture | path、revision、多文件、失败注入、index rebuild | PR |
| L4 E2E | Playwright Chromium/Firefox/WebKit | UF-01—03、键盘、200%、320、恢复 | PR/发布 |
| L4 AX | axe + 人工 | WCAG 2.2 AA、屏幕阅读、颜色外信息 | 发布 |
| L4 性能 | 浏览器与服务基准 | budgets、较大索引、长文档 | 发布 |

自动 axe 只能发现部分问题；键盘、焦点、语义、缩放和屏幕阅读仍需人工验收。

## 12. 性能预算

以下为 V1 预算，不是技术营销指标：

| 指标 | 预算 | 测量条件 |
|---|---:|---|
| 本地服务冷启动到可读取 | ≤ 3 s | fresh 索引，标准 P0 fixture |
| LCP / INP / CLS | ≤2.5 s / ≤200 ms / ≤0.1 | 75th percentile，支持浏览器 |
| 初始应用 JS | ≤ 200 KiB gzip | 不含 index |
| 初始 CSS | ≤ 50 KiB gzip | 全局 + 当前路由 |
| 普通 V1 index | ≤ 1 MiB raw、≤ 250 KiB gzip | 六个月合成数据 |
| Index 解析 + schema 校验 | ≤ 100 ms | 参考桌面设备 |
| 普通只读 API p95 | ≤ 150 ms | loopback，warm |
| 1 MiB 文档 diff p95 | ≤ 300 ms | loopback，warm |
| 服务空闲 RSS | ≤ 150 MiB | 不含浏览器/Python 子进程 |
| 启动网络请求 | 0 个外部请求 | 字体、脚本、数据均本地 |

超过 index 预算先减少普通摘要/按路由分片；未测量前不引入数据库、搜索服务、Worker 或虚拟列表。Core Web Vitals 阈值采用官方 good 基线。

## 13. 支持矩阵

| 模式 | Windows | macOS | Linux | 移动浏览器 |
|---|---|---|---|---|
| 本地完整读写 | Tier 1：Edge/Chrome 当前及前一稳定版 | Tier 2：Safari/Chrome 当前稳定版 | Tier 2：Firefox/Chrome 当前稳定版 | 不支持仓库写回 |
| 本地只读 | 同上 | 同上 | 同上 | 响应式只读可用 |
| 静态只读构建 | Chrome/Edge ≥111 | Safari ≥16.4 | Firefox ≥114 | 同浏览器下限；320px 必验 |
| 自动 E2E | Chromium | WebKit | Firefox | 320px 仿真，不替代真机 |

Tier 1 必须在每个 PR 验证；Tier 2 在发布候选验证。V1 不承诺 IE、旧版浏览器、局域网多设备写入或移动端文件写回。操作系统具体最低版本由 TV-08 依据 Node/Python/浏览器支持结果冻结。

## 14. 依赖边界

### 14.1 允许的最小生产依赖类别

- UI：React、React DOM、路由。
- 构建产物不含 Vite 开发服务。
- Local 服务：Fastify 与静态文件适配。
- Markdown：安全 renderer + GFM，不启用 raw HTML。
- Schema：JSON Schema validator；优先复用 Fastify 已有能力。
- Diff：纯文本 diff。

禁止默认加入：ORM、数据库驱动、认证、云 SDK、模型 SDK、遥测/错误 SaaS、状态管理框架、UI 组件库、CSS 框架、全文搜索引擎、桌面壳、容器编排。

### 14.2 依赖治理

- 精确 lockfile；setup 只用 `npm ci`。
- 新生产依赖必须说明用途、许可证、维护状态、体积和退出方式。
- 每季度或发布前更新依赖；Node 只用 LTS。
- `npm audit` 结果分级处理，不以自动强制升级破坏锁文件。
- 依赖生成内容不得进入 Git，除明确权威 schema fixture。

## 15. 官方依据

- [Node.js Releases](https://nodejs.org/en/about/previous-releases)：生产使用 LTS；本次选择 Node 24。
- [Vite browser compatibility](https://vite.dev/guide/build.html#browser-compatibility)：Vite 8 默认生产浏览器下限。
- [Fastify testing](https://fastify.dev/docs/v5.7.x/Guides/Testing/)：`fastify.inject()` 支持无 socket 服务测试。
- [Vitest guide](https://vitest.dev/guide/)：与 Vite 共用转换和配置。
- [Playwright browsers](https://playwright.dev/docs/browsers) 与 [accessibility testing](https://playwright.dev/docs/accessibility-testing)：多浏览器和 axe 自动检测；人工 AX 仍必需。
- [TypeScript strict](https://www.typescriptlang.org/tsconfig/strict.html)：开启严格类型检查。
- [Tauri architecture](https://v2.tauri.app/concept/architecture/) 与 [capabilities](https://v2.tauri.app/security/capabilities/)：桌面 WebView/Rust 与权限模型。
- [MDN showDirectoryPicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)：文件系统目录选择仍为 limited availability。
- [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)：LCP/INP/CLS good 阈值。

## 16. 后果

### 正面

- 完整本地写回不受浏览器文件 API 支持差异限制。
- 应用层类型、UI 和服务使用同一语言，测试链清楚。
- 保留并隔离已有 Python 内容工具，无需立即重写。
- 没有数据库、账号或云依赖；静态只读出口明确。
- 未来可替换 Fastify、React 或本地服务而不改变 Markdown/索引契约。

### 代价

- 开发/CI 同时需要 Node 和 Python。
- loopback 服务必须按本地高权限边界认真防护，不能当普通前端 dev server。
- localStorage 草稿容量与持久性需实测并提供失败出口。
- 原子替换、WebKit 可访问性和 Python 子进程跨平台行为尚待小型验证。

## 17. 重新评估触发条件

出现任一条件重新评审本 ADR：

1. 需要移动端完整写回或多设备同步。
2. 需要多用户、账号、远程访问或团队协作。
3. 浏览器无法可靠实现所需可访问性/草稿体验。
4. Node 调用 Python 在支持矩阵上不能稳定运行。
5. V1 数据规模超过预算且无索引分片可解决。
6. 明确需要系统级能力，桌面壳收益超过打包成本。

## 18. 评审结论格式

只允许：

- Accepted：按本 ADR 进入技术验证和工程搭建。
- Accepted with amendments：列出不改变硬约束的修订后进入。
- Rejected：说明被否决的驱动因素，并选择 B/C 或重新提案。

在状态改为 Accepted 之前，只允许文档审计和不进入生产目录的验证设计，不创建应用工程。
