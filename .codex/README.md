# Codex project environment

此目录用于保存 Codex 桌面应用为本项目生成的 Local environment 配置。根据官方机制，配置应通过桌面应用的项目设置创建，以保证格式与当前应用版本一致；生成后将配置文件提交到仓库，让其他设备和 Worktree 复用。

## 推荐设置

### Setup scripts

- Windows：`powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`
- macOS / Linux：`bash ./scripts/setup.sh`

### Actions

- 名称：`Check repository`
- Windows：`powershell -ExecutionPolicy Bypass -File .\scripts\check-repo.ps1`
- macOS / Linux：`bash ./scripts/check-repo.sh`

未来确定技术栈后，可以增加 `Run app`、`Test` 和 `Build` actions，并将真实命令同步写入根目录 `AGENTS.md`。

## Cloud environment

Cloud environment 在 Codex 设置中创建，不由本目录中的占位文件替代。配置时：

1. 连接 `junweihei/ai-native` 仓库并仅授予所需权限。
2. 固定项目实际使用的运行时版本。
3. setup script 使用 `bash ./scripts/setup.sh`。
4. 不在仓库中保存密钥；敏感值使用 Cloud secrets。
5. Agent 阶段互联网访问默认关闭，仅按任务最小化开启。

## Local ignored files

仓库根目录已提供默认空白的 `.worktreeinclude`。如果未来 Worktree 必须使用本地忽略文件，仅在其中列出确实需要复制的路径。密钥文件默认不复制；优先提供安全的 `.env.example` 并让每个环境分别配置秘密值。
