# AI Native 内容目录迁移 V1.0

## 目标

在建设 Learning OS 网站前稳定内容目录和路径契约，使网站、模板、索引、Word 导出和仓库检查共享同一套数据结构。

## 路径映射

> 2026-11-07 S1 职责校正：当前 S1 的正式提交路径为 `content/practice/S1/`（D01–D20 每日唯一练习）和 `content/evidence/S1/`（P1/P2/P3/Final 与受控答案）；`content/sessions/` 是可选学习过程笔记，`content/knowledge/` 是稳定知识资产。`content/cases/`、`content/projects/` 不再是活动 S1 目录，其旧文件已进入 `archive/legacy-s1-artifacts/`。

| 旧路径 | V1.0 路径 |
|---|---|
| `01-map/` | `content/knowledge/` |
| `02-cases/` | `content/cases/` |
| `03-practice/` | `content/practice/` |
| `04-use/` | `content/projects/` |
| `05-evidence/` | `content/evidence/` |
| `daily-task/` | `content/sessions/` |
| 根目录六个月总纲 | `archive/legacy-plans/`（原 `content/plans/six-month/`，已归档） |
| 根目录第一个月文件 | `archive/legacy-plans/s1-month-01-v2/`（其 active 职责已由 `content/plans/S1/` 接替） |
| 根目录 Learning OS 共识和规则 | `content/system/` |
| 当前 Word 发布版 | `exports/word/` |
| 被替代规划 Word | `archive/legacy-plans/` |
| 历史原始 Word | `archive/source-documents/` |
| `docs/multi-device-workflow.md` | `docs/operations/multi-device-workflow.md` |

## 迁移约束

1. 文件正文含义和学习状态不因目录迁移而改变。
2. 所有机器路径使用仓库根目录相对路径。
3. 同目录 Markdown 链接使用相对文件名。
4. 历史网页和历史原始资料不进入正式内容索引。
5. `web/public/data/learning-index.json` 是生成物，不是权威内容源。
6. S1 每日只允许一个主提交文档；首次独立作答、资源对照、修订、总结和检查在同一练习文件完成。
7. `content/sessions/` 可以保存学习资料带来的额外理解、感悟和疑问，但不得维护任务状态、替代主练习或直接充当长期知识资产。

## 验收标准

- 内容校验为 0 错误。
- 模板注册表路径全部有效。
- 本地 Markdown 链接全部有效。
- 内容索引从 V1.0 路径重新生成。
- Windows 和 GitHub 仓库检查继续通过。
- 旧正式内容目录不再存在。
