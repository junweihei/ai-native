---
id: ART-M01-D01-knowledge-map-v0-1
title: AI Native 知识地图 V0.1
version: V0.1
type: artifact
artifact_type: knowledge_map
status: completed
document_status: active
task_state: completed
verification_state: unverified
capability_level: L2
created: 2026-08-19
updated: 2026-08-28
goal: G6M
stage: S1
milestone: M01
task_id: M01-D01
evidence_for:
  - M01-C01
nodes:
  - ai-native-foundation
---

# AI Native 知识地图 V0.1：起点认知图

日期：2026-08-24
学习阶段：D1，完成生成式 AI、LLM、Prompt、Agent 入门学习后

## 一、我现在怎样理解 AI Native

我目前认为：

> AI Native 是从设计软件开始，就把 AI 的理解、生成和辅助行动能力作为系统的一部分，让用户可以表达目标，而不只是按照固定菜单一步步操作。

它不只是“在原有系统里增加一个聊天框”，而是可能改变用户与软件交互、信息处理和任务执行的方式。

不过，我现在只形成了初步认识，还不能完整解释企业系统应该怎样落地。

**一句话定义：** AI Native = 以 AI 为基础能力，把软件从功能驱动重构为目标驱动。这里的“目标驱动”不是取消传统功能、规则和流程，而是让用户除了“操作功能”，还可以直接“表达目标”，由系统理解并协助完成任务。

**技术表达：** Goal → Context → Model → Workflow/Agent → Tools → Systems → Result → Feedback/Evals

## 二、AI Native 试图解决什么问题

传统软件主要要求人适应系统：

```text
人理解业务问题
→ 人查找资料
→ 人判断下一步
→ 人进入多个系统操作
→ 人检查结果
```

我目前理解的 AI Native 是：

```text
人表达目标
→ AI 理解任务
→ AI 使用当前上下文和必要资料
→ AI 生成内容或辅助执行动作
→ 人检查结果
```

它可能解决的问题包括：

- 用户必须学习复杂的软件操作方式；
- 信息分散在文档和多个业务系统中；
- 很多任务需要理解自然语言，难以完全写成固定规则；
- 跨系统任务需要人反复查找、复制、判断和操作；
- 同类知识工作质量不稳定、耗时较长。

## 三、我目前认识的核心概念

### 1. 生成式 AI

生成式 AI 能根据输入和训练中学到的模式生成文字、图像、代码等新内容。它生成的是符合上下文的结果，不代表结果一定正确。

### 2. LLM

LLM 是经过大量文本训练的大语言模型。

我目前把它理解为：

> LLM 提供自然语言理解和生成能力，是 AI 应用的重要能力来源，但 LLM 本身不等于完整的Agent 或业务系统。

### 3. Prompt

Prompt 是给模型的提示。是为了让模型完成当前任务而提供的提示内容。 它可以包含问题、任务说明、背景信息、示例和输出要求等。

### 4. Instructions
是对模型的明确要求，用来说明：
- 要完成什么任务；
- 应遵守什么规则； 
- 输出采用什么格式；
- 哪些事情不能做。
### 5. Context

Context 是模型处理当前任务时能够看到的信息，包括：

- 用户当前的问题；
- 系统指令；
- 对话历史；
- 提供的文档内容；
- 工具返回的数据。

### 6. RAG

RAG 是先从外部资料中检索相关内容，再把内容放进 Context，让模型依据这些资料回答。RAG 可以增加回答依据、降低无依据生成的风险，但不能保证回答一定正确。

### 7. Tools

Tools 是 AI 应用查询外部信息或执行现实操作的能力，例如：

- 查询数据库；
- 搜索文件；
- 调用业务接口；
- 创建工单；
- 发送通知。

### 8. Agent

我目前认为：

> Agent 是让模型围绕一个目标，根据当前情况判断下一步、调用工具、查看结果，并继续行动的 AI 系统。

理解、推理和生成能力主要来自 Agent 使用的模型；Agent 还需要运行流程、工具权限、停止条件和人工控制。
```
普通 LLM：输入 → 输出

Workflow：路线基本提前确定

Agent：模型可以根据情况决定下一步
```

## 四、我目前能画出的基本关系

```text
用户目标或问题
      ↓
Prompt / Instructions
      ↓
组织当前 Context
      ↓
Model 理解、判断和生成
      ↓
根据任务选择直接回答 / Workflow / Agent
      ↓
必要时检索知识、调用 Tools / Systems
      ↓
获得结果
      ↓
用户检查 / Feedback / Evals
```

我现在能确认的一条关系是：

> Agent 不是独立于 LLM 的另一个“大脑”，而是围绕目标使用模型进行理解和生成，并在必要时组织工具完成任务。

```
Context
   ↓
Model 判断
   ↓
Action / Tool
   ↓
获得结果
   ↓
更新 Context
   ↓
再次判断
```

## 五、我目前认识的技术组成

```text

### 1. 核心组成

AI Native
├── Goal & Input
│   ├── 用户目标
│   ├── 当前问题
│   └── Prompt
│
├── Context
│   ├── Instructions
│   ├── Conversation History
│   ├── 当前任务资料
│   ├── 检索得到的信息
│   └── Tool 返回结果
│
├── Model
│   └── LLM / 多模态模型
│
├── Knowledge
│   ├── 文档
│   ├── 知识库
│   ├── 数据
│   └── 其他知识来源
│
├── Tools
│   ├── Search
│   ├── Retrieval
│   ├── Database Query
│   ├── API
│   └── Business Systems
│
├── Execution
│   ├── Single Model Call
│   ├── Workflow
│   └── Agent
│
└── Control & Improvement
    ├── Human Approval
    ├── Security & Permission
    ├── Observability
    ├── Evals
    └── Feedback
    
    
    
### 2. 关键机制

有些概念会同时连接多个组成部分，不适合强行归到某一个节点。

RAG：
Knowledge
   ↓
Retrieval
   ↓
Context
   ↓
Model
   ↓
Generation



其中 Workflow、Agent、Memory、MCP、多 Agent 和完整评价体系，我还没有系统学会，暂时只保留位置。

## 六、我目前怎样判断结果好不好

我只能先使用几个简单标准：

- 任务是否完成；
- 结果是否与问题相关；
- 回答是否有资料依据；
- 是否执行了未经允许的操作；
- 用户是否还需要大量修改；
- 时间和成本是否能够接受。

## 七、我当前最不确定的问题

1. 什么情况下只调用一次 LLM 就够了，什么情况下才真正需要 Agent？
2. Workflow 和 Agent 的边界是什么，谁负责决定下一步？
3. 如何用可以观察和记录的证据，证明一个 AI Native 应用比传统方案更好？
4. AI Native 应该怎样建立既能表达核心组成，又能表达运行机制的整体结构？
5. 未来软件工程如何转换为ai native
6. 传统企业数字化转型在ai native中应该是什么样的
7. 一个 AI 应用效果不好时，应该从 Prompt、Context、Knowledge、Tools、Workflow、Agent、Model 等哪些地方寻找问题并优化？

## 八、V0.1 的结论

我目前只能画出基本组成和粗略关系。

我还不能完整说明：

- 怎样选择规则、Workflow、模型或 Agent；
- 企业级 Agent 需要哪些架构组件；
- 知识、数据、工具和权限怎样流动；
- 怎样建立完整的评测、监控和人工接管机制。

这些未知内容将留给后续学习，不在 V0.1 中假装已经掌握。
