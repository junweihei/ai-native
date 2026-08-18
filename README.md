# ai-native

面向 AI-native 实践的长期演进项目。当前仓库先建立可跨设备、可并行、可交接的协作基线，具体产品形态与技术栈将在后续迭代中确定。

## 协作架构

- **GitHub**：唯一权威代码源，负责提交、分支、Pull Request 和设备间交接。
- **Local**：主工作区，用于共工作模式、本机应用、真实浏览器和集成验证。
- **Worktree**：同一电脑上的并行工作区；一个任务对应一个独立 Worktree。
- **Cloud**：基于已推送分支执行远程或后台任务，完成后通过独立分支和 PR 交付。

> 核心规则：Local 是前台，Worktree 是本机后台，Cloud 是远程后台，GitHub 是唯一交接中心。

## 当前仓库基线

```text
.
├─ .codex/                 # Codex Local/Worktree 初始化入口和配置说明
├─ .github/                # PR 模板与基础仓库检查
├─ .worktreeinclude        # Worktree 本地忽略文件复制白名单（默认空）
├─ docs/                   # 多端协同操作说明
├─ scripts/                # 跨平台初始化与健康检查
├─ AGENTS.md               # Local、Worktree、Cloud 共用的代理指令
├─ .gitignore              # 密钥、依赖和本地产物隔离
└─ README.md
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
