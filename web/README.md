# AI Native Learning OS Web

本目录用于未来 Learning OS 网站，不与学习内容目录混放。

## 当前状态

- `prototypes/AI_Native_Learning_OS_V3.html` 是冻结的产品原型，只作为信息架构和视觉参考。
- 当前不继续在单文件 HTML 中堆功能。
- 尚未选择前端框架、构建工具或部署方式。

## 数据来源

```text
Markdown 权威内容
+ 00-templates/template-registry.yaml
        ↓
tools/content_index/build_learning_index.py
        ↓
web/public/data/learning-index.json
        ↓
未来网站
```

`learning-index.json` 是自动生成物，不允许反向成为学习内容源。

## V4 的最低要求

1. 默认入口是“今日任务”，不是任意知识节点。
2. 读取 `task_id`、`status`、`artifact_id`、`evidence_for` 和 `template_id`。
3. 状态来自 Markdown；`localStorage` 只保存临时草稿和界面偏好。
4. 知识地图负责导航，不决定任务顺序。
5. 模板注册表负责创建交付件，网页不硬编码输出目录。
6. 内容、样式、逻辑和测试分离，不再使用单文件大页面。

在产品范围和技术栈确认前，不新增框架或生产依赖。

