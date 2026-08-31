# Learning OS 内容工具

本目录使用 Python 标准库完成两件事，不引入应用框架或生产依赖：

1. 校验 Markdown 的 ID、状态、关键元数据、本地链接、模板引用和残留占位符。
2. 将 Markdown 与模板注册表生成网站可读取的 JSON 索引。

## 校验

```powershell
python .\tools\content_index\validate_learning_content.py
```

历史文件缺少 frontmatter 目前只产生 warning；`config/learning-content.json` 列出的关键文件缺少元数据会产生 error。

## 生成网站索引

```powershell
python .\tools\content_index\build_learning_index.py
```

默认输出为 `web/public/data/learning-index.json`。它是自动生成物，不是权威内容源。
索引中的 `current_context` 仅投影运行映射已明确给出的当前任务、目标关系、成果、证据与续接信息；缺失字段保持缺失，不生成默认值。
`knowledge` 从 `content/knowledge/AI_Native_知识节点注册表_V1.0.md` 投影六层定义、节点四问、计划任务及成果/证据关系；未通过独立验证的证据不能生成能力等级。`archive_documents` 与活动文档同批生成，归档记录不参与当前任务或进度。

## 测试

```powershell
python -m unittest discover -s tools/content_index/tests -v
```

