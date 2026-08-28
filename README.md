# 个人 AI Native Learning OS

本仓库服务于一个明确目标：在六个月内系统掌握 AI Native，并通过知识地图、案例、练习、真实任务和验证证据证明能力已经形成。Markdown 是唯一权威内容源；Word 用于阅读和发布；未来网页只投影这些数据，不反向维护另一套内容。

## 当前学习状态

- 第 1 月正在执行。
- D1 已完成。
- D2、D3 学习中。
- 当前阶段只稳定学习数据、目录契约和校验机制，不重做网页。

## 权威入口

1. [六个月系统学习与实践总纲 V2.0](AI_Native_六个月系统学习与实践总纲_V2.0.md)：六个月目标、能力路线和阶段门禁。
2. [Learning OS 产品与学习运行模型 V0.1](个人_AI_Native_Learning_OS_产品与学习运行模型_V0.1.md)：整个学习系统如何运行。
3. [第 1 月开始这里](第1月_开始这里.md)：当前执行入口。
4. [第 1 月 Learning OS 运行映射 V0.1](第1月_Learning_OS_运行映射_V0.1.md)：计划、任务、成果和证据的对应关系。
5. [学习执行规则 V0.1](AI_Native_Learning_OS_学习执行规则_V0.1.md)：状态、提交和验收规则。
6. [统一模板规范 V0.1](AI_Native_Learning_OS_统一模板规范_V0.1.md) 与 [模板库说明](00-templates/README.md)：每天怎样形成标准交付件。

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

```text
.
├─ 00-templates/           # 每日任务、学习、证据和复盘模板
├─ 01-map/                # 知识地图与节点成果
├─ 02-cases/              # 案例拆解
├─ 03-practice/           # 判定练习、首测、复测和错因
├─ 04-use/                # 真实任务应用
├─ 05-evidence/           # 闭卷、迁移、Eval 和复盘证据
├─ daily-task/            # 每日学习会话与续接记录
├─ config/                # 内容边界和状态契约
├─ tools/content_index/   # 内容校验、索引生成和测试
├─ web/prototypes/        # 冻结的当前网页参考原型
├─ archive/web-prototypes/# 更早网页原型
├─ docs/                  # 多端协同说明
├─ scripts/               # 初始化与完整仓库检查
├─ .github/               # PR 与自动检查
└─ .codex/                # Codex 项目环境说明
```
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

详细操作与验收清单见 [多端协同工作流](docs/multi-device-workflow.md)。

## Codex 桌面应用设置

打开项目后，在 Codex 的 Local environment 设置中配置：

- Windows setup：`powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`
- macOS/Linux setup：`bash ./scripts/setup.sh`
- Check action（Windows）：`powershell -ExecutionPolicy Bypass -File .\scripts\check-repo.ps1`
- Check action（macOS/Linux）：`bash ./scripts/check-repo.sh`

应用生成的项目环境配置应保存在根目录 `.codex` 中并提交到 GitHub。配置说明见 [.codex/README.md](.codex/README.md)。

## 下一阶段

确定首个产品目标和技术栈后，需要同步更新：

- `AGENTS.md` 中的项目结构、安装、启动、测试和构建命令；
- `scripts/setup.*` 的依赖安装策略；
- GitHub Actions 中的真实 lint、test 和 build 步骤；
- `.env.example`，仅记录变量名和非敏感示例值。
