# AI Native D1：生成式 AI 与 Agent 基础

## 十、RAG：解决外部知识问题

```text
用户问题
理解 AI Native 最底层的智能能力从哪里来，以及 LLM 如何从“生成文本”逐步扩展到“调用工具并完成任务”。
生成答案
```
## 一、这一节点解决什么问题
## 十一、Tools：解决“只能说，不能做”
这一节点主要回答 5 个问题：
```text
用户
LLM 到底是什么？
LLM
```
LLM 为什么能理解上下文并生成内容？
## 十二、Agent：从生成内容到完成任务
```text
            Agent
    Model  Instructions  Tools
```
## 二、核心知识骨架
## 十三、Agent 和普通 LLM 调用的真正区别
可以先记这一条主链：
```text
Prompt
```text
Completion
```
   ↓
## 十四、Workflow 与 Agent：提前留一个接口
   ↓
```text
Workflow
   ↓
目标驱动执行。
```
   ↓
## 十五、Multi-Agent
```text
         Manager Agent
    Agent     Agent     Agent
```
   ↓
## 十六、这一节点的概念关系图
```text
                   Generative AI
                          │
                             ┌────────┴────────┐
                             ↓                 ↓
                          Workflow          Agent Loop
                                          │
                                          ▼
                                      Multi-Agent
```
```
## 十七、概念 → 问题映射
但要注意，这里面其实存在两条不同的链：
## 十八、需要长期保留的 6 条主线

学习完 R1 后，我认为真正应该进入长期知识体系的不是几十个名词，而是下面 6 条。

## 十九、与后续 AI Native 知识地图的连接

```text
节点 01
            └── Security
            └── Cost / Performance
```
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

解决的问题：

AI 从哪里学习语言、知识和模式？

### 2. Token

模型并不直接理解“文字”。

文本首先会被拆成 Token：

"人工智能正在改变软件工程"

→

["人工", "智能", "正在", "改变", "软件", "工程"]

实际分词方式会因 tokenizer 不同而不同。

定义：

Token 是语言模型处理文本时的基本离散单位。

作用：

把自然语言转换为模型能够进一步处理的符号序列。

### 3. Embedding

Token 本身只是 ID，不能直接表达语义。

Embedding 会把它转换成一个高维向量：

Token
 ↓
Vector

例如：

狗        → [0.21, -0.34, 0.81 ...]
小狗      → [0.23, -0.31, 0.79 ...]
汽车      → [-0.72, 0.42, 0.16 ...]

相似概念在向量空间中通常更接近。

定义：

Embedding 是把离散对象映射到连续向量空间中的数学表示。

后续可以继续扩展：

Token Embedding
Sentence Embedding
Document Embedding
Image Embedding

这里不要把 Embedding 只理解成 Transformer Encoder 的最终产物。

### 4. Positional Information

Transformer 本身并天然理解词语的先后顺序。

因此需要加入位置信息。

例如：

狗咬人
人咬狗

Token 基本相同，但顺序不同，含义完全不同。

所以：

Positional Information 负责让模型理解 Token 的顺序关系。

### 5. Attention

这是 Transformer 最关键的机制之一。

它解决的问题是：

当前 Token 应该重点关注上下文中的哪些 Token？

例如：

小狗听到主人回来后开始大声吠叫。

理解“吠叫”时：

小狗      权重高
主人      有关联
回来      有关联

可以简单记：

Attention = 动态计算上下文之间的相关性。

Multi-head Attention 则是：

同时从多个关系维度观察上下文。

### 6. Transformer

Transformer 是现代主流语言模型的核心神经网络架构。

可以先用一个简化公式理解：

Embedding
+
Position
+
Attention
+
Feed Forward Network
↓
Transformer

其作用：

在上下文中学习 Token 之间复杂的语言和语义关系。

注意：

不要把所有现代 LLM 都理解成“Encoder → Decoder”。

常见架构包括：

Encoder-only
Decoder-only
Encoder-Decoder

GPT 类主流生成式 LLM 通常属于：

Decoder-only Transformer。

### 7. Parameters

Parameters 是一个非常重要的概念。

训练真正做的事情，本质上是：

训练数据
↓
模型不断预测
↓
计算误差
↓
调整 Parameters
↓
反复训练

最终：

大量训练中学习到的模式被编码进模型参数。

所以模型不是：

“把互联网文章全部存进数据库”。

而更接近：

通过训练，把大量统计规律和模式压缩进神经网络参数。

### 8. LLM / SLM

最后形成模型。

LLM：

Large Language Model，大语言模型。

SLM：

Small Language Model，小语言模型。

可以使用这个长期定义：

语言模型是通过大规模数据训练形成的参数化神经网络，它根据当前上下文，对后续 Token 的概率分布进行预测。

## 四、第二条链：模型是怎么被使用的

这是 Inference（推理）链。

必须和 Training 分开。

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
## 五、Prompt：告诉模型当前要做什么

Prompt 是：

模型当前推理时获得的输入信息。

常见包括：

System Prompt
User Prompt
Conversation History
Retrieved Knowledge
Tool Results

其中：

System Prompt / Instructions

主要定义：

角色
规则
行为
输出要求
安全约束
User Prompt

用户当前提出的：

问题
指令
目标
任务
## 六、Context：模型当前真正“看得到”的信息

这是以后学习 AI Native 特别重要的概念。

可以理解成：

Context 是模型本次推理时可以使用的全部信息。

例如：

Context
├── System Instructions
├── User Prompt
├── Conversation History
├── RAG Results
├── Tool Results
├── Memory
└── 当前任务状态

这些内容共同进入：

Context Window。

## 七、Context Window

模型一次能够处理的信息量是有限的。

所以：

System Prompt
+
User Prompt
+
History
+
RAG
+
Tool Results
+
其他信息
=
占用 Context Window

这会直接引出后面 AI Native 非常重要的：

Context Engineering。

以后可以把它理解成：

如何选择最合适的信息，在最合适的时间放进模型上下文。

## 八、Completion：模型是怎样生成内容的

LLM 并不是一次生成整段回答。

而是不断执行：

当前 Context
↓
预测下一个 Token
↓
加入 Context
↓
再次预测
↓
……

最终形成：

Completion。

所以最基础的生成式 AI 模型可以抽象成：

Prompt
  ↓
LLM
  ↓
Completion
## 九、LLM 存在哪些天然边界

只靠一个 LLM 会遇到几个核心问题：

知识可能过时
      ↓
不知道企业内部信息

上下文有限
      ↓
不能一次知道所有东西

只能输出 Token
      ↓
不能真正操作外部系统

生成具有概率性
      ↓
可能出现 Hallucination

所以后续技术，本质上都是在补这些能力缺口。

十、RAG：解决外部知识问题

RAG：

Retrieval-Augmented Generation。

基本过程：

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

所以：

RAG 不是另外训练一个模型，而是在模型推理前给它补充当前所需知识。

主要解决：

私有知识
最新知识
企业文档
专业知识
事实依据

需要特别记住：

RAG 可以提升 Grounding 和事实可靠性，但不能保证完全消除 Hallucination。

十一、Tools：解决“只能说，不能做”

传统 LLM：

用户
↓
LLM
↓
答案

加入 Tools：

用户
↓
LLM
↓
判断需要行动
↓
Tool
↓
外部系统
↓
返回结果
↓
LLM

Tools 可以分成两类。

Knowledge Tools

负责获取信息：

搜索
数据库查询
文件搜索
企业知识库
API 查询
Action Tools

负责执行动作：

发邮件
创建任务
修改数据库
提交审批
操作 ERP
执行代码

因此可以记：

RAG 让 AI 知道更多，Tools 让 AI 能做事情。

十二、Agent：从生成内容到完成任务

这是这一节点最重要的升级。

Microsoft 入门阶段可以先记：

Agent = Model + Instructions + Tools

即：

               Agent
                 │
       ┌─────────┼─────────┐
       ↓         ↓         ↓
     Model  Instructions  Tools

其中：

Model：

提供理解和推理能力。

Instructions：

告诉 Agent 身份、目标和规则。

Tools：

让 Agent 能够获取信息和执行操作。

十三、Agent 和普通 LLM 调用的真正区别

普通生成式 AI：

Prompt
↓
Model
↓
Completion

Agent：

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

这个循环以后会进一步学习为：

Agent Loop。

可以先记：

Observe
   ↓
Reason
   ↓
Act
   ↓
Observe
   ↓
……

也就是：

感知 → 决策 → 行动 → 再感知。

十四、Workflow 与 Agent：提前留一个接口

这一课虽然不用深入，但建议知识地图现在就预留位置。

Workflow
A → B → C → D

执行路径主要由开发者预先定义。

Agent
         Tool A
       ↗
Goal → Model → Tool C
       ↘
         Tool B

具体执行过程具有一定动态性。

可以记：

Workflow 是预定义过程，Agent 是目标驱动执行。

企业 AI Native 最终往往是：

Workflow + Agent。

十五、Multi-Agent

当任务非常复杂时，可以让多个 Agent 分工：

            Manager Agent
                 │
        ┌────────┼────────┐
        ↓        ↓        ↓
    Research   Coding   Review
     Agent     Agent     Agent

不同 Agent：

有不同 Instructions
有不同 Tools
有不同专业能力

协同完成更复杂任务。

但这里先形成概念即可，不需要现在深入。

十六、这一节点的概念关系图

这是我建议你以后保留的正式图：

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

 十七、概念 → 问题映射

这部分对后续构建知识地图特别重要。

| 概念           | 它解决什么问题                   |
| -------------- | -------------------------------- |
| Tokenization   | 怎么把自然语言变成机器可处理形式 |
| Embedding      | 怎么用数学表示语言和语义         |
| Position       | 怎么理解词语顺序                 |
| Attention      | 怎么识别上下文之间的相关关系     |
| Transformer    | 怎么学习和处理复杂语言关系       |
| Parameters     | 模型训练后“学到的东西”保存在哪里 |
| LLM            | 怎么获得理解、生成、推理能力     |
| Prompt         | 怎么告诉模型当前要做什么         |
| Context        | 模型当前应该知道什么             |
| Context Window | 模型一次最多能看到多少信息       |
| RAG            | 怎么获得外部、私有、最新知识     |
| Tools          | 怎么让 AI 从回答走向行动         |
| Agent          | 怎么围绕目标自主完成多步骤任务   |
| Workflow       | 怎么控制和编排确定性流程         |
| Multi-Agent    | 怎么通过专业分工处理复杂任务     |


学习完 R1 后，我认为真正应该进入长期知识体系的不是几十个名词，而是下面 6 条。

1. LLM 的本质

LLM 是通过大规模数据训练形成的参数化神经网络，根据上下文不断预测后续 Token。

2. Training 与 Inference 必须分开

Training 解决“模型怎么获得能力”，Inference 解决“模型怎么使用能力”。

3. 生成式 AI 的基础运行模型

Prompt + Context → Model → Completion

4. LLM 存在能力边界

模型知识、上下文、行动能力和可靠性都有限，因此需要 RAG、Memory、Tools 等机制进行增强。

5. Agent 是一次重要范式升级

Model + Instructions + Tools → Agent

AI 从：“生成信息”升级为：“围绕目标完成任务”。

6. 后续 AI Native 的演进主线

Model
  ↓
Context
  ↓
Tools
  ↓
Agent
  ↓
Workflow / Multi-Agent
  ↓
AI Native Application


十九、与后续 AI Native 知识地图的连接

你这个节点学完后，不是结束，而是自然向后展开：

节点 01
生成式 AI 与 Agent 基础
        │
        ├── 节点 02：Prompt Engineering
        │
        ├── 节点 03：Context Engineering
        │       ├── RAG
        │       ├── Memory
        │       └── Context Management
        │
        ├── 节点 04：Tool Use
        │       ├── Function Calling
        │       ├── MCP
        │       └── Skills
        │
        ├── 节点 05：Agent Engineering
        │       ├── Agent Loop
        │       ├── Planning
        │       ├── Workflow
        │       └── Multi-Agent
        │
        └── 节点 06：AI Engineering
                ├── Evals
                ├── Guardrails
                ├── Observability
                ├── Security
                └── Cost / Performance                                                 