# AI Native 内容目录迁移 V1.0

## 目标

在建设 Learning OS 网站前稳定内容目录和路径契约，使网站、模板、索引、Word 导出和仓库检查共享同一套数据结构。

## 路径映射

| 旧路径 | V1.0 路径 |
|---|---|
| `01-map/` | `content/knowledge/` |
| `02-cases/` | `content/cases/` |
| `03-practice/` | `content/practice/` |
| `04-use/` | `content/projects/` |
| `05-evidence/` | `content/evidence/` |
| `daily-task/` | `content/sessions/` |
| 根目录六个月总纲 | `content/plans/six-month/` |
| 根目录第一个月文件 | `content/plans/month-01/` |
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

## 验收标准

- 内容校验为 0 错误。
- 模板注册表路径全部有效。
- 本地 Markdown 链接全部有效。
- 内容索引从 V1.0 路径重新生成。
- Windows 和 GitHub 仓库检查继续通过。
- 旧正式内容目录不再存在。

