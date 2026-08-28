# Learning OS 内容工具

本目录使用 Python 标准库完成两件事，不引入应用框架或生产依赖：

1. 校验 Markdown 的 ID、状态、关键元数据、模板引用和残留占位符。
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

## 测试

```powershell
python -m unittest discover -s tools/content_index/tests -v
```

