# 个人 AI Native Learning OS

本仓库服务于一个明确目标：在六个月内系统掌握 AI Native，并通过知识地图、案例、练习、真实任务和验证证据证明能力已经形成。Markdown 是唯一权威内容源；Word 用于阅读和发布；未来网页只投影这些数据，不反向维护另一套内容。

## 当前学习状态

- 第 1 月正在执行。
- D1 已完成。
- D2、D3 学习中。
- 当前阶段只稳定学习数据、目录契约和校验机制，不重做网页。

## 权威入口

1. [六个月系统学习与实践总纲 V2.0](content/plans/six-month/AI_Native_六个月系统学习与实践总纲_V2.0.md)：六个月目标、能力路线和阶段门禁。
2. [Learning OS 产品与学习运行模型 V0.1](content/system/个人_AI_Native_Learning_OS_产品与学习运行模型_V0.1.md)：整个学习系统如何运行。
3. [第 1 月开始这里](content/plans/month-01/第1月_开始这里.md)：当前执行入口。
4. [第 1 月 Learning OS 运行映射 V0.1](content/plans/month-01/第1月_Learning_OS_运行映射_V0.1.md)：计划、任务、成果和证据的对应关系。
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
│  │  ├─ six-month/       # 六个月权威总纲
│  │  └─ month-01/        # 第一个月入口、手册、资源与运行映射
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
3. 同机并行任务选择 Codex **Worktree**，不要让多个任务同时修改 Local。
4. 跨设备继续前先提交并推送；另一台设备先执行 `git fetch origin`，再切换分支并 `git pull --ff-only`。
5. Cloud 只从已推送的分支或提交启动，完成后创建 PR，不直接合并 `main`。
6. 需要本机浏览器、桌面软件、内网或设备时，使用 Handoff 回到 Local 验证。

详细操作与验收清单见 [多端协同工作流](docs/operations/multi-device-workflow.md)。

## Codex 桌面应用设置

打开项目后，在 Codex 的 Local environment 设置中配置：

- Windows setup：`powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`
- macOS/Linux setup：`bash ./scripts/setup.sh`
- Check action（Windows）：`powershell -ExecutionPolicy Bypass -File .\scripts\check-repo.ps1`
- Check action（macOS/Linux）：`bash ./scripts/check-repo.sh`

应用生成的项目环境配置应保存在根目录 `.codex` 中并提交到 GitHub。配置说明见 [.codex/README.md](.codex/README.md)。

## 下一阶段

目录和内容契约稳定后，下一阶段进入 Learning OS 网站设计与实现。网站必须从 `web/public/data/learning-index.json` 读取内容；选择技术栈时，再同步更新 `AGENTS.md`、`scripts/setup.*`、测试、构建命令和环境变量示例。