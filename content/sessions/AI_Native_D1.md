---
id: S-M01-D01
title: AI Native D1 学习会话
type: session
status: completed
task_status_at_end: completed
created: 2026-08-25
updated: 2026-08-28
goal: G6M
milestone: M01
week: M01-W01
task_id: M01-D01
produces:
  - content/knowledge/AI_Native_知识地图_V0.1.md
---

# AI Native D1：生成式 AI 与 Agent 基础

> AI Native 知识地图 · 节点 01

理解 AI Native 最底层的智能能力从哪里来，以及 LLM 如何从“生成文本”逐步扩展到“调用工具并完成任务”。

## 一、这一节点解决什么问题

这一节点主要回答 5 个问题：

- LLM 到底是什么？
- 自然语言怎么变成模型可以计算的内容？
- LLM 为什么能理解上下文并生成内容？
- Prompt、RAG、Context、Tools 分别解决什么问题？
- LLM 是怎样进一步演变成 Agent 的？

## 二、核心知识骨架

可以先记这一条主链：

```text
自然语言
   ↓
Tokenization
   ↓
Embedding
   ↓
Transformer
   ↓
训练形成 Parameters
   ↓
LLM / SLM
   ↓
Prompt + Context
   ↓
Completion
   ↓
RAG / Tools 扩展能力
   ↓
Agent
   ↓
Multi-Agent
```

但要注意，这里面其实存在两条不同的链。

## 三、第一条链：模型是怎么形成的

这是 Training（训练）链。

```text
Training Data
     ↓
Tokenization
     ↓
Token ID
     ↓
Embedding + Positional Information
     ↓
Transformer
     ↓
Attention Mechanism
     ↓
不断调整 Parameters
     ↓
训练得到 Model
     ↓
LLM / SLM
```

### 1. Training Data

模型训练使用的大规模文本、代码、图像等数据。

**解决的问题：** AI 从哪里学习语言、知识和模式？

### 2. Token

模型并不直接理解“文字”。文本首先会被拆成 Token：

```text
"人工智能正在改变软件工程"
→
["人工", "智能", "正在", "改变", "软件", "工程"]
```

实际分词方式会因 tokenizer 不同而不同。

**定义：** Token 是语言模型处理文本时的基本离散单位。

**作用：** 把自然语言转换为模型能够进一步处理的符号序列。

### 3. Embedding

Token 本身只是 ID，不能直接表达语义。Embedding 会把它转换成一个高维向量：

```text
Token
 ↓
Vector

狗        → [0.21, -0.34, 0.81 ...]
小狗      → [0.23, -0.31, 0.79 ...]
汽车      → [-0.72, 0.42, 0.16 ...]
```

相似概念在向量空间中通常更接近。

**定义：** Embedding 是把离散对象映射到连续向量空间中的数学表示。

后续可以继续扩展：Token Embedding、Sentence Embedding、Document Embedding、Image Embedding。

这里不要把 Embedding 只理解成 Transformer Encoder 的最终产物。

### 4. Positional Information

Transformer 本身并不天然理解词语的先后顺序，因此需要加入位置信息。

```text
狗咬人
人咬狗
```

Token 基本相同，但顺序不同，含义完全不同。

**作用：** Positional Information 负责让模型理解 Token 的顺序关系。

### 5. Attention

这是 Transformer 最关键的机制之一。它解决的问题是：当前 Token 应该重点关注上下文中的哪些 Token？

例如：“小狗听到主人回来后开始大声吠叫。”理解“吠叫”时：

```text
小狗      权重高
主人      有关联
回来      有关联
```

**可以简单记：** Attention = 动态计算上下文之间的相关性。

Multi-head Attention 则是同时从多个关系维度观察上下文。

### 6. Transformer

Transformer 是现代主流语言模型的核心神经网络架构。

```text
Embedding
    + Position
    + Attention
    + Feed Forward Network
    ↓
Transformer
```

其作用是在上下文中学习 Token 之间复杂的语言和语义关系。

不要把所有现代 LLM 都理解成“Encoder → Decoder”。常见架构包括 Encoder-only、Decoder-only 和 Encoder-Decoder。GPT 类主流生成式 LLM 通常属于 Decoder-only Transformer。

### 7. Parameters

训练真正做的事情，本质上是：

```text
训练数据
↓
模型不断预测
↓
计算误差
↓
调整 Parameters
↓
反复训练
```

大量训练中学习到的模式被编码进模型参数。模型不是“把互联网文章全部存进数据库”，而是通过训练，把大量统计规律和模式压缩进神经网络参数。

### 8. LLM / SLM

- **LLM：** Large Language Model，大语言模型。
- **SLM：** Small Language Model，小语言模型。

**长期定义：** 语言模型是通过大规模数据训练形成的参数化神经网络，它根据当前上下文，对后续 Token 的概率分布进行预测。

## 四、第二条链：模型是怎么被使用的

这是 Inference（推理）链，必须和 Training 分开。

```text
User Input
    ↓
Prompt
    ↓
Tokenization
    ↓
Context Window
    ↓
LLM
    ↓
Next Token Prediction
    ↓
Token
    ↓
继续预测
    ↓
Completion
```

### 1 Prompt：告诉模型当前要做什么

Prompt 是模型当前推理时获得的输入信息，常见包括：

- System Prompt
- User Prompt
- Conversation History
- Retrieved Knowledge
- Tool Results

其中，System Prompt / Instructions 主要定义角色、规则、行为、输出要求和安全约束。User Prompt 是用户当前提出的问题、指令、目标或任务。

### 2 Context：模型当前真正“看得到”的信息

Context 是模型本次推理时可以使用的全部信息。

```text
Context
├── System Instructions
├── User Prompt
├── Conversation History
├── RAG Results
├── Tool Results
├── Memory
└── 当前任务状态
```

这些内容共同进入 Context Window。

### 3 Context Window

模型一次能够处理的信息量是有限的：

```text
System Prompt + User Prompt + History + RAG + Tool Results + 其他信息
= 占用 Context Window
```

这会引出后续非常重要的 Context Engineering：如何选择最合适的信息，在最合适的时间放进模型上下文。

### 4 Completion：模型是怎样生成内容的

LLM 并不是一次生成整段回答，而是不断执行：

```text
当前 Context
↓
预测下一个 Token
↓
加入 Context
↓
再次预测
↓
……
```

最终形成 Completion。最基础的生成式 AI 模型可以抽象成：

```text
Prompt
  ↓
LLM
  ↓
Completion
```

## 五、LLM 存在哪些天然边界

只靠一个 LLM 会遇到几个核心问题：

```text
知识可能过时       → 不知道企业内部信息
上下文有限         → 不能一次知道所有东西
只能输出 Token     → 不能真正操作外部系统
生成具有概率性     → 可能出现 Hallucination
```

所以后续技术，本质上都是在补这些能力缺口。

## 六、RAG：解决外部知识问题

RAG（Retrieval-Augmented Generation）的基本过程是：

```text
用户问题
   ↓
Retrieval
   ↓
找到相关知识
   ↓
加入 Context
   ↓
LLM
   ↓
生成答案
```

RAG 不是另外训练一个模型，而是在模型推理前给它补充当前所需知识。它主要解决私有知识、最新知识、企业文档、专业知识和事实依据问题。

RAG 可以提升 Grounding 和事实可靠性，但不能保证完全消除 Hallucination。

## 七、Tools：解决“只能说，不能做”

加入 Tools 后，模型可以判断需要行动，调用外部系统并继续处理返回结果：

```text
用户 → LLM → 判断需要行动 → Tool → 外部系统 → 返回结果 → LLM
```

**Knowledge Tools** 负责获取信息，例如搜索、数据库查询、文件搜索、企业知识库和 API 查询。

**Action Tools** 负责执行动作，例如发邮件、创建任务、修改数据库、提交审批、操作 ERP 和执行代码。

可以记：RAG 让 AI 知道更多，Tools 让 AI 能做事情。

## 八、Agent：从生成内容到完成任务

Microsoft 入门阶段可以先记：

```text
Agent = Model + Instructions + Tools
```

- **Model：** 提供理解和推理能力。
- **Instructions：** 告诉 Agent 身份、目标和规则。
- **Tools：** 让 Agent 能够获取信息和执行操作。

## 九、Agent 和普通 LLM 调用的真正区别

普通生成式 AI：

```text
Prompt → Model → Completion
```

Agent：

```text
Goal
 ↓
Model 判断
 ↓
调用 Tool
 ↓
观察结果
 ↓
继续判断
 ↓
再次调用 Tool
 ↓
直到完成 Goal
```

这个循环以后会进一步学习为 Agent Loop：Observe → Reason → Act → Observe，也就是感知 → 决策 → 行动 → 再感知。

## 十、Workflow 与 Agent：提前留一个接口

Workflow 的执行路径主要由开发者预先定义；Agent 的具体执行过程具有一定动态性。

```text
Workflow：A → B → C → D

Agent：
         Tool A
       ↗
Goal → Model → Tool C
       ↘
         Tool B
```

可以记：Workflow 是预定义过程，Agent 是目标驱动执行。企业 AI Native 最终往往是 Workflow + Agent。

## 十一、Multi-Agent

当任务非常复杂时，可以让多个 Agent 分工：

```text
            Manager Agent
                 │
        ┌────────┼────────┐
        ↓        ↓        ↓
    Research   Coding   Review
     Agent     Agent     Agent
```

不同 Agent 有不同 Instructions、Tools 和专业能力，协同完成更复杂任务。

## 十二、这一节点的概念关系图

```text
                         Generative AI
                              │
                              ▼
                       Language Model
                              │
             ┌────────────────┴────────────────┐
             │                                 │
          Training                          Inference
             │                                 │
       Training Data                         Prompt
             ↓                                 ↓
       Tokenization                         Context
             ↓                                 │
        Embedding                    ┌─────────┼─────────┐
             ↓                       ↓         ↓         ↓
         Position                  History    RAG      Tools
             ↓                       │         │         │
        Transformer                  └─────────┼─────────┘
             ↓                                 ↓
         Attention                         Context Window
             ↓                                 ↓
        Parameters                            LLM
             ↓                                 ↓
            LLM                      Next Token Prediction
                                               ↓
                                           Completion
                                               │
                                               ▼
                                             Agent
                                    Model + Instructions + Tools
                                               │
                                      ┌────────┴────────┐
                                      ↓                 ↓
                                  Workflow          Agent Loop
                                                        │
                                                        ▼
                                                  Multi-Agent
```

## 十三、概念 → 问题映射

| 概念 | 它解决什么问题 |
| --- | --- |
| Tokenization | 怎么把自然语言变成机器可处理形式 |
| Embedding | 怎么用数学表示语言和语义 |
| Position | 怎么理解词语顺序 |
| Attention | 怎么识别上下文之间的相关关系 |
| Transformer | 怎么学习和处理复杂语言关系 |
| Parameters | 模型训练后“学到的东西”保存在哪里 |
| LLM | 怎么获得理解、生成、推理能力 |
| Prompt | 怎么告诉模型当前要做什么 |
| Context | 模型当前应该知道什么 |
| Context Window | 模型一次最多能看到多少信息 |
| RAG | 怎么获得外部、私有、最新知识 |
| Tools | 怎么让 AI 从回答走向行动 |
| Agent | 怎么围绕目标自主完成多步骤任务 |
| Workflow | 怎么控制和编排确定性流程 |
| Multi-Agent | 怎么通过专业分工处理复杂任务 |

## 十四、需要长期保留的 6 条主线

学习完 R1 后，真正应该进入长期知识体系的不是几十个名词，而是下面 6 条：

1. **LLM 的本质：** LLM 是通过大规模数据训练形成的参数化神经网络，根据上下文不断预测后续 Token。
2. **Training 与 Inference 必须分开：** Training 解决模型怎么获得能力，Inference 解决模型怎么使用能力。
3. **生成式 AI 的基础运行模型：** `Prompt + Context → Model → Completion`
4. **LLM 存在能力边界：** 模型知识、上下文、行动能力和可靠性都有限，因此需要 RAG、Memory、Tools 等机制进行增强。
5. **Agent 是一次重要范式升级：** `Model + Instructions + Tools → Agent`，AI 从“生成信息”升级为“围绕目标完成任务”。
6. **后续 AI Native 的演进主线：** `Model → Context → Tools → Agent → Workflow / Multi-Agent → AI Native Application`

## 十五、与后续 AI Native 知识地图的连接

```text
节点 01：生成式 AI 与 Agent 基础
        │
        ├── 节点 02：Prompt Engineering
        ├── 节点 03：Context Engineering
        │       ├── RAG
        │       ├── Memory
        │       └── Context Management
        ├── 节点 04：Tool Use
        │       ├── Function Calling
        │       ├── MCP
        │       └── Skills
        ├── 节点 05：Agent Engineering
        │       ├── Agent Loop
        │       ├── Planning
        │       ├── Workflow
        │       └── Multi-Agent
        └── 节点 06：AI Engineering
                ├── Evals
                ├── Guardrails
                ├── Observability
                ├── Security
                └── Cost / Performance
```
