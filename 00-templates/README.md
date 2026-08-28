---
id: ai-native-template-library-readme
title: AI Native Learning OS 模板库使用说明
version: V0.1
status: active
type: guide
created: 2026-08-28
updated: 2026-08-28
governed_by:
  - ../AI_Native_Learning_OS_学习执行规则_V0.1.md
  - ../AI_Native_Learning_OS_统一模板规范_V0.1.md
registry: template-registry.yaml
---

# AI Native Learning OS 模板库

这里保存每天可以直接复制使用的空模板。

```text
统一执行规则 = 必须怎样运行
统一模板规范 = 模板为什么这样设计
00-templates/ = 每天实际复制什么
template-registry.yaml = 网页和工具怎样找到模板
```

## 一、目录结构

```text
00-templates/
├── README.md
├── template-registry.yaml
├── 01-task/
│   ├── 每日任务卡模板.md
│   └── 补强任务卡模板.md
├── 02-learning/
│   ├── 每日学习会话模板.md
│   ├── 知识节点学习模板.md
│   ├── 案例拆解模板.md
│   ├── 专项练习模板.md
│   └── 真实任务应用模板.md
├── 03-evidence/
│   ├── 成果证据声明模板.md
│   ├── 闭卷验证模板.md
│   └── Eval记录模板.md
└── 04-review/
    ├── 日收尾模板.md
    ├── 周复盘模板.md
    └── 月度验收模板.md
```

模板目录只保存空模板，正式学习结果仍进入：

```text
daily-task/  每日学习会话
01-map/      知识地图和架构成果
02-cases/    案例拆解
03-practice/ 练习、测试和错因
04-use/      真实任务与项目成果
05-evidence/ 闭卷、迁移和复盘证据
```

## 二、每天怎样选择模板

| 今天的主要活动 | 主要模板 | 默认交付目录 |
|---|---|---|
| 执行已有计划任务 | 已有运行映射；需要时用每日任务卡 | 由运行映射指定 |
| 记录一次学习过程 | 每日学习会话 | `daily-task/` |
| 学习一个长期知识节点 | 知识节点学习 | `01-map/nodes/`，目录不存在时先放 `01-map/` |
| 拆解一个案例 | 案例拆解 | `02-cases/` |
| 针对一个弱点练习 | 专项练习 | `03-practice/` |
| 应用到真实问题 | 真实任务应用 | `04-use/` |
| 提交正式成果 | 成果证据声明 | 写入成果文件末尾，通常不单建文件 |
| 闭卷、测试、迁移 | 闭卷验证或 Eval 记录 | `05-evidence/` 或项目对应目录 |
| 当天收尾 | 日收尾 | 默认追加到会话记录，不单建文件 |
| 周/月调整计划 | 周复盘或月度验收 | `05-evidence/` |

## 三、每天的创建与提交流程

```text
1. 在运行映射确认当前任务
2. 查看 template-registry.yaml 的推荐模板
3. 复制模板到目标成果目录
4. 替换所有 {{占位符}}
5. 保留 template_id 和 template_version
6. 独立完成主要内容
7. 将 status 改为 review_pending
8. 自检或接受一次具体反馈
9. 达标后改为 completed；独立证据通过后改为 verified
```

“提交交付件”不是上传到另一个系统，而是：

> 文件已经保存在指定目录，frontmatter 中的 `task_id`、`status`、`artifact_id` 和 `evidence_for` 已填写，且成果达到任务标准。

## 四、一个学习日最少需要几个文件

默认只需要：

1. 一个主要交付件。
2. 一份简短会话记录；如果主要交付件已经包含学习过程和日收尾，可以合并，不重复创建。

测试、闭卷或真实反馈发生时，再增加证据记录。不能因为模板齐全就要求每天填写所有模板。

## 五、D2、D3、D4 怎样使用

这三个任务已经有专用成果文件，不重新从模板创建：

| 任务 | 直接填写 | 可选支持记录 | 提交条件 |
|---|---|---|---|
| D2 | `../01-map/任务适用性判断_D2.md` | `每日学习会话模板.md` | 8 个判断完成并满足 2/2/2 分布 |
| D3 | `../01-map/四种机制边界草稿_D3.md` | `每日学习会话模板.md` | 四类边界、控制权和 8 个例子完成 |
| D4 | `../01-map/系统结构与三条流草稿_D4.md` | `每日学习会话模板.md` | 组件归类有理由，三条流有起止 |

模板库主要服务后续新任务；已有专用成果表优先使用，避免重复交付。

## 六、网页怎样映射

文件夹服务于人类查找；网页不能只依赖文件夹判断语义。网页应读取：

- `template_id`：来自哪个模板。
- `type`：任务、会话、成果、证据或复盘。
- `task_id`：属于哪个学习任务。
- `status`：当前是否已提交、待验收或完成。
- `artifact_id`：主要交付件身份。
- `evidence_for`：证明哪项能力。
- `output_dir`：模板默认生成位置。

当前不需要后端。后续可由本地脚本扫描 Markdown frontmatter，生成只读索引 JSON，再由网页展示。Markdown 仍是权威内容源，JSON 只是自动生成的网页索引。

## 七、占位符规则

- `{{task_id}}`：例如 `M01-D02`。
- `{{artifact_id}}`：例如 `ART-M01-D02-task-fit`。
- `{{date}}`：`YYYY-MM-DD`。
- `{{title}}`：交付件的人类可读标题。
- `{{milestone}}`：例如 `M01`。
- `{{week}}`：例如 `M01-W01`。
- `{{capability_id}}`：例如 `M01-C02`。
- `{{node_id}}`：例如 `KN-task-fit`。
- `{{output_path}}`：工程内相对路径。

创建文件后不能遗留关键占位符；模板文件本身保留占位符。

