# 个人 AI Native Learning OS

本仓库服务于一个明确目标：按能力门禁形成企业级 AI Native 解决方案架构能力，并通过知识地图、案例、练习、统一成长树实践和验证证据证明能力已经形成。Markdown 是唯一权威编辑源；Word / PDF 用于阅读和发布；学习界面只投影这些数据，不反向维护另一套内容。

## 当前学习状态

- 当前能力阶段：S1（整体认知与机制判断）。
- D1 已完成：知识地图与学习会话均有仓库证据。
- D2、D3 已完成学习总结，但指定成果仍为 `learning` 且未填写，任务待补证。
- 当前执行入口为 S1 极简入口；本次计划收敛不扩建 Learning OS 网站。

## 权威入口

1. [Learning OS 产品与学习运行模型](content/system/个人_AI_Native_Learning_OS_产品与学习运行模型_V0.1.md)：上位运行原则与长期共识。
2. [AI Native 系统学习与统一成长树实践路线 V3.0](content/plans/AI_Native_系统学习与统一成长树实践路线_V3.0.md)：唯一 canonical 战略总纲，定义 S1～S7、统一成长树和阶段门禁。
3. [S1 开始这里](content/plans/S1/开始这里.md)：当前马上做什么。
4. [S1 整体认知与机制判断执行计划 V1.0](content/plans/S1/S1_整体认知与机制判断_执行计划_V1.0.md)：S1 唯一阶段执行源，包含任务、资源、门禁、状态与证据关系。
5. [学习执行规则 V0.1](content/system/AI_Native_Learning_OS_学习执行规则_V0.1.md)：状态、提交和验收规则。
6. [统一模板规范 V0.1](content/system/AI_Native_Learning_OS_统一模板规范_V0.1.md) 与 [模板库说明](00-templates/README.md)：每天怎样形成标准交付件。

## 数据与网页关系

正式数据链路是：

```text
Markdown 学习资产
→ Frontmatter 元数据
→ 内容校验
→ learning-index.json
→ Learning OS 网页
```

网页 V3 已冻结为参考原型，位于 `web/prototypes/`；早期原型位于 `archive/web-prototypes/`。下一阶段优化网站时，应读取统一索引，不再在 HTML 中硬编码学习计划和状态。

## 协作架构

- **GitHub**：唯一权威代码源，负责提交、分支、Pull Request 和设备间交接。
- **Local**：主工作区，用于共工作模式、本机应用、真实浏览器和集成验证。
- **Worktree**：同一电脑上的并行工作区；一个任务对应一个独立 Worktree。
- **Cloud**：基于已推送分支执行远程或后台任务，完成后通过独立分支和 PR 交付。

> 核心规则：Local 是前台，Worktree 是本机后台，Cloud 是远程后台，GitHub 是唯一交接中心。

## 当前仓库结构

目录契约版本：V1.0。正式学习内容只能进入 `content/`；网站通过生成索引读取内容，不直接把文件路径硬编码进页面。

```text
.
├─ content/
│  ├─ system/              # Learning OS 上位共识、规则、规范与资产盘点
│  ├─ plans/
│  │  ├─ V3.0 总纲       # 当前唯一 canonical 战略总纲（位于 plans/ 根）
│  │  └─ S1/              # S1 唯一执行计划与极简入口
│  ├─ knowledge/           # 知识地图和节点成果
│  ├─ cases/               # 案例拆解
│  ├─ practice/            # 练习、首测、复测和错因
│  ├─ projects/            # 真实任务和项目成果
│  ├─ evidence/            # 闭卷、迁移、Eval 和复盘证据
│  └─ sessions/            # 每日学习会话与续接记录
├─ 00-templates/           # 任务、学习、证据和复盘模板
├─ config/                 # 内容边界和状态契约
├─ tools/content_index/    # 内容校验、索引生成和测试
├─ web/                    # 网站边界、冻结原型和生成数据
├─ docs/operations/        # Codex、多设备和工程操作说明
├─ scripts/                # 初始化、检查和文档生成入口
├─ exports/word/           # 从 Markdown 生成的 Word 发布版
└─ archive/                # 历史规划、原始资料、旧模板和旧网页
```

详细内容职责见 [content/README.md](content/README.md)，迁移记录见 [目录迁移 V1.0](docs/operations/content-directory-migration-v1.0.md)。
## 首次使用

### Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-repo.ps1
```

### macOS / Linux / Cloud

```bash
bash ./scripts/setup.sh
bash ./scripts/check-repo.sh
```

初始化脚本会在检测到 `package.json`、`pyproject.toml`、`requirements.txt` 或 Gradle/Maven 配置后安装对应依赖。当前没有技术栈配置时，只检查环境并安全结束。

## 每日工作流

1. 开始前执行 `git status` 和 `git fetch origin`。
2. 每个任务使用独立分支：`feature/*`、`fix/*`、`refactor/*`、`test/*` 或 `cloud/*`。
3. 同机并行任务选择独立 **Worktree**，不要让多个任务同时修改 Local。
4. 跨设备继续前先提交并推送；另一台设备先执行 `git fetch origin`，再切换分支并 `git pull --ff-only`。
5. Cloud 只从已推送的分支或提交启动，完成后创建 PR，不直接合并 `main`。
6. 需要本机浏览器、桌面软件、内网或设备时，使用 Handoff 回到 Local 验证。

详细操作与验收清单见 [多端协同工作流](docs/operations/multi-device-workflow.md)。

## AI Coding Agent 设置

在 AI 编码助手中打开项目后，配置以下命令用于环境初始化和检查：

- Windows setup：`powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`
- macOS/Linux setup：`bash ./scripts/setup.sh`
- Check action（Windows）`powershell -ExecutionPolicy Bypass -File .\scripts\check-repo.ps1`
- Check action（macOS/Linux）：`bash ./scripts/check-repo.sh`

具体 AI 工具的项目配置方式请参考对应工具的文档。

## 当前开发边界

Learning OS 网站继续通过 `web/public/data/learning-index.json` 投影 Markdown 权威数据；知识承载网站的继续开发目前暂停。恢复开发须另行审查，不因 V3.0 基线切换自动进入下一阶段或新增功能。
