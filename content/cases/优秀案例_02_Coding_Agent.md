---
document_status: active
task_state: not_started
verification_state: unverified
capability_level: L0
---

# 优秀案例 02：Coding Agent

> **当天主提交件｜S1-D07**
> 完成端到端链路，并区分 Agent 决策、人类确认和安全验证。
> 本文件记录成果与证据，不维护权威任务状态；任务状态只在 S1 执行计划更新。

## 今日必须回答

1. 从 Issue/Prompt 到 Pull Request 的闭环怎样运行，Agent 在哪些节点决定下一步？
2. 哪些节点必须由人类确认，哪些节点属于测试或安全校验？
3. 去掉测试、人工评审或安全扫描分别会产生什么后果？

日期：____  用时：____

来源：[GitHub Docs - About third-party coding agents](https://docs.github.com/en/copilot/concepts/agents/about-third-party-coding-agents)；[Risks and mitigations for Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations)

## 从任务到交付的流程

Issue/Prompt → ____ → ____ → ____ → ____ → Pull Request → 人工评审

## 拆解

- 用户与真实问题：____
- 它好在哪里：____
- Agent 自主决定什么：____
- 人类必须确认什么：____
- 安全检查与权限边界：____
- 最重要的决策：____
- 去掉测试会怎样：____
- 去掉人工评审会怎样：____
- 去掉安全扫描会怎样：____
- 可迁移规律：____
- 仍然未知：____

## 提交前验收

- [ ] 画出从任务到 PR 的完整流程，并标出失败后的迭代路径。
- [ ] Agent 决策、人类确认、安全验证三类节点清楚可区分。
- [ ] 分别说明删除测试、评审、扫描的直接和最终后果。
- [ ] 结论能追溯到指定 GitHub 官方资料。

> 上述 checkbox 只用于成果自检，不是任务状态。

## 提交结论

- 成果自检：PASS / REVIEW_PENDING
- 最主要差距：____
- 下一步：____
