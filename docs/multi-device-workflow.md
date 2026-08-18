# 多端协同工作流

## 1. 环境职责

| 环境 | 使用场景 | 交付方式 |
| --- | --- | --- |
| Local | 共工作模式、本机浏览器、桌面应用、内网与真实设备验证 | 本地分支和提交 |
| Worktree | 同机多个独立任务并行 | 独立分支、提交或 PR |
| Cloud | 跨设备、后台长任务、纯代码修改与自动检查 | 远程分支和 PR |
| GitHub | 权威代码、分支、PR 与设备间交接 | `fetch` / `push` / PR |

## 2. 新设备接入

```powershell
git clone https://github.com/junweihei/ai-native.git
cd ai-native
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-repo.ps1
```

每台设备保持独立克隆。不要把工作目录放入 OneDrive 等同步盘并让多台设备同时写入。

## 3. 开始任务

```powershell
git status
git fetch origin
git switch main
git pull --ff-only
git switch -c feature/<task-name>
```

如果同机已有另一个修改任务，在 Codex 新任务中选择 **Worktree**。选择起始分支并提交范围明确的任务描述；默认不要让两个任务共享同一可写目录。

## 4. 设备间继续

离开当前设备前：

```powershell
git add <明确的文件>
git commit -m "type: concise description"
git push -u origin <branch-name>
```

进入另一台设备后：

```powershell
git fetch origin
git switch <branch-name>
git pull --ff-only
```

未提交修改、`.env`、浏览器登录、本地数据库、正在运行的服务和 Worktree 目录不会通过 GitHub 自动同步。

## 5. Cloud 任务模板

```text
基于 origin/<base-branch> 完成【任务目标】。
只允许修改：【目录或文件】。
不得修改：【禁止范围】。
完成后运行：【测试命令】。
请总结修改、测试结果和剩余风险，并创建独立分支/PR；不要直接合并 main。
```

Cloud 启动前必须确认基线提交已经推送。Cloud 结果需要真实 UI、登录状态、内网或设备验证时，先检查 diff，再拉到本地 Worktree，最后用 Handoff 转入 Local。

## 6. 合并前检查

- [ ] 修改范围与任务/PR 描述一致。
- [ ] 没有密钥、本地数据库、依赖目录或构建产物。
- [ ] `scripts/check-repo.*` 已通过。
- [ ] 技术栈对应的 lint、test、build 已通过（如已配置）。
- [ ] 需要时已完成 Local 真实环境或 UI 验证。
- [ ] 未覆盖其他并行任务的修改。
- [ ] 剩余风险和后续事项已记录。

## 7. 冲突与清理

- 分支被另一个 Worktree 占用时，不要强行重复检出；使用 Handoff、新分支或先释放原 Worktree。
- 多个任务误改同一目录时，立即暂停其中一个，分别检查 `git status` 和 `git diff`，再迁移到独立 Worktree。
- 仅在确认分支不再需要后删除任务 Worktree 和远程分支。
- 对共享分支不要使用强制推送；个人任务分支需要改写历史时也只使用 `--force-with-lease`，并先确认无人共用。
