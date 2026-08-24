# AI Native 知识地图 V0.1：起点认知图

日期：____  用时：____

本版原则：前半部分闭卷完成，允许空白和错误；学习 R1 后只校正 R1 明确讲到的内容。不要用后来的知识覆盖起点草图。

## 闭卷：我现在认为 AI Native 是什么
一句话定义:AI Native = 以 AI 为基础能力，把软件从功能驱动重构为目标驱动。
标准定义：AI Native 是一种从设计之初就将 AI 的理解、推理、生成和行动能力作为系统基础能力，并围绕上下文、Agent、工具调用和反馈机制重新设计软件架构、业务流程与交互方式的软件工程范式。
技术表达：Goal → Context → Model → Agent/Workflow → Tools → Systems → Feedback/Evals
1. 它解决什么问题：
传统企业软件其实有一个根本问题：系统越来越多，但真正完成一件事情，人仍然要自己理解业务、找信息、操作系统、跨系统协调。
| 传统问题                 | AI Native 解决方式       |
| ----------------------- | ------------------------ |
| 人必须学习系统怎么操作    | 人直接表达目标            |
| 信息散落在几十个系统      | AI自动检索和组合上下文    |
| 跨系统流程靠人协调        | Agent调用多个系统完成任务 |
| 很多知识工作无法编码成规则 | LLM负责理解、推理和判断   |

2. 有哪些核心概念：
AI Native
├── Intelligence
│   └── LLM
│
├── Context
│   ├── Prompt
│   ├── RAG
│   ├── Memory
│   └── Context Engineering
│
├── Capability
│   ├── Tools
│   ├── MCP
│   └── Skills
│
├── Execution
│   ├── Workflow
│   ├── Agent
│   └── Multi-Agent / A2A
│
└── Governance
    ├── Guardrails
    ├── Security
    ├── Tracing
    └── Evals
3. 分成哪些主要模块：
    1. 业务交互层
    2. Agent / Workflow 执行层
    3. Context 上下文层
    4. Model 模型层
    5. Tool / MCP 能力连接层
    6. 基础设施层
    + 横向治理：安全、权限、评估、监控

- 我认为它们之间的关系（可以画图）：
LLM负责“想”，Context负责“知道什么”，Memory负责“记住什么”，RAG负责“找什么”，Skills负责“会什么”，Tools负责“做什么”，MCP负责“怎么连接”，Workflow负责“怎么组织执行”，Agent负责“自主完成任务”Evals负责“判断做得好不好”。
                    用户 / 业务目标
                          │
                          ▼
                 ┌─────────────────┐
                 │      Agent      │
                 │  理解 / 推理 /规划 │
                 └────────┬────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
        Context        Memory         Skills
       上下文工程       长期记忆        专业能力
            │                           │
            └─────────────┬─────────────┘
                          ▼
                     Workflow
                    任务执行编排
                          │
                          ▼
                       Tools
                    系统操作能力
                          │
                     ┌────┴────┐
                     │   MCP   │
                     └────┬────┘
                          │
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
      ERP                MES                OA
     CRM                数据库             文件
     GitHub              搜索              API

                          ↑
                          │
                         LLM
                    基础智能能力

整个过程
     │
     ▼
Tracing / Guardrails / Evals / Security
监控          安全控制       质量评估
____

4. 常用方法和工具是什么：
方法： Prompt Engineering、Context Engineering、RAG、Agent、Workflow、Tool Use、MCP、Memory、Evals。
工具： OpenAI / Claude / Gemini / DeepSeek 等模型，LangGraph、OpenAI Agents SDK 等 Agent 框架，MCP Server、向量数据库、知识库、Tracing/Evals 工具等。
5. 怎样判断做得好不好：
评价标准 = 任务完成率 + 准确性 + 稳定性 + 效率 + 成本 + 安全性。
## 学习 R1 后只校正四个概念

| 概念     |  我学习前的理解                         | R1 后的校正 | 仍不确定什么 |
| 生成式AI |  基于已知内容与提示词生成新的客户想要的内容| 本质上是统计学、数据科学和机器学习领域经过多年研究积累、逐步探索并完善的数学技术应用           | ____ |
| LLM      | 大语言模型进行逻辑推理                  |封装了词汇表中单词和短语之间的语言与语义关系。模型可以利用这些关系对自然语言输入进行推理，并生成有意义且相关的响应。| ____ |
| Prompt   | 用户输入的提示词                        |提供给大语言模型（LLM）以获取响应的输入，分为系统提示词与用户提示词| ____ |
| Agent    | 代理人干具体的任务                      |Agent 是基于生成式 AI 构建的软件应用程序，它们能够对自然语言进行推理和生成，通过使用工具来自动化执行任务，并能根据上下文条件做出响应以采取适当的行动。 | ____ |

- 我现在能确认的一条关系：分两条主线研究，训练与应用，后续大多在应用端。
第一条链模型是怎么形成的：Training Data ->Tokenization->Token ID->Embedding+Positional Information -> Transformer -> Attention Mechanism -> 不断调整 Parameters -> 训练得到 Model -> LLM / SLM
第二条链：模型是怎么被使用的：User Input->Prompt->Tokenization->Context Window->LLM->Next Token Prediction->Token->继续预测->Completion
- 我原图中需要明确标成“尚未学到”的部分：Context、Workflow、Tool Use、MCP、Memory、Evals、Transformer等

## 当前最不确定的 3 个位置

问号必须具体到后续可以查证，不写笼统的“我不懂”。

1. ai native 应该定义几层比较科学
2. 未来软件工程如何转换为ai native
3. 传统企业数字化转型在ai native中应该是什么样的

## D1 通过检查

- [ ] 保留了一张真实的闭卷起点图，没有因为不完整而重写。
- [ ] 只用 R1 校正了生成式 AI、LLM、Prompt、Agent。
- [ ] 写下了三个具体可查的问号。
