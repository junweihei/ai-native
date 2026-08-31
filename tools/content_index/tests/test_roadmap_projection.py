from types import SimpleNamespace
import unittest

from tools.content_index.build_learning_index import _knowledge_projection, _roadmap


class RoadmapProjectionTests(unittest.TestCase):
    def test_preserves_plan_order_and_reports_cycles_missing_parents_and_statuses(self):
        master = SimpleNamespace(
            relative_path="content/plans/six-month/master.md",
            body="| 月份 | 核心主题 | 主要能力等级 | 主项目增量 | 月末关键证据 |\n| 第1月 | 基础 | L1—L2 | V0 | 证据 |\n| 第2月 | 后续 | L2 | V1 | 证据 |",
        )
        mapping = SimpleNamespace(
            relative_path="content/plans/month-01/map.md",
            metadata={"current_task": "M01-D01"},
            body="""### 第1周：图
| ID | 时间 | 目标 | 动作 | 成果 | 通过证据 | 依赖/状态 |
| M01-D01 | 60 分钟 | 第一项 | 动作 | 成果 | 标准 | D2；**已完成** |
| M01-D02 | 60 分钟 | 第二项 | 动作 | 成果 | 标准 | D1、D99；**已验证** |
第1周门禁：口头关卡
""",
        )
        roadmap = _roadmap([master, mapping], mapping)
        week = roadmap["months"][0]["weeks"][0]
        self.assertEqual([task["id"] for task in week["tasks"]], ["M01-D01", "M01-D02"])
        self.assertEqual(week["tasks"][0]["status"], "completed")
        self.assertEqual(week["tasks"][1]["status"], "verified")
        self.assertTrue(any(issue["code"] == "cycle" for issue in roadmap["relationIssues"]))
        self.assertTrue(any(issue["code"] == "missing_parent" for issue in roadmap["relationIssues"]))
        self.assertTrue(roadmap["months"][1]["partial"])



    def test_projects_authority_backed_node_details_cycles_and_evidence_gaps(self):
        structure = SimpleNamespace(
            relative_path="content/knowledge/AI_Native_知识地图_V0.2.md",
            metadata={},
            body="""## 六层结构
| 层 | 解决的问题 | 关键要素 | 与上下层的关系 |
| 业务 | 目标 | 要素 | 关系 |
""",
        )
        registry = SimpleNamespace(
            relative_path="content/knowledge/AI_Native_知识节点注册表_V1.0.md",
            metadata={},
            body="""| ID | 标题 | 类型 | 它是什么 | 解决什么问题 | 何时使用 | 何时不用或更简单替代 | 怎样证明有效 | 目标能力 | 计划任务 | 前置节点 | 相关节点 | 后续节点 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| node-a | 节点甲 | concept | 定义甲 | 问题甲 | 条件甲 | 替代甲 | 证据甲 | L2 | M01-D01 | node-b | missing-node |  |
| node-b | 节点乙 | pattern | 定义乙 | 问题乙 | 条件乙 | 替代乙 | 证据乙 | L2 | M01-D02 | node-a |  |  |
""",
        )
        mapping = SimpleNamespace(
            relative_path="content/plans/month-01/map.md",
            metadata={"current_task": "M01-D01"},
            body="",
        )
        documents = [
            {
                "id": "ART-1",
                "path": "content/knowledge/a.md",
                "title": "成果甲",
                "type": "artifact",
                "status": "completed",
                "task_id": "M01-D01",
                "milestone": "M01",
                "nodes": ["node-a"],
            },
            {
                "id": "EV-1",
                "path": "content/evidence/a.md",
                "title": "证据甲",
                "type": "evidence",
                "status": "not_started",
                "task_id": "M01-D01",
                "milestone": "M01",
                "capability_level": None,
                "nodes": ["node-a"],
            },
        ]

        projection = _knowledge_projection([structure, registry, mapping], documents)
        node = projection["nodes"][0]

        self.assertEqual(node["summary"], "定义甲")
        self.assertEqual(node["problem"], "问题甲")
        self.assertEqual(node["useWhen"], "条件甲")
        self.assertEqual(node["avoidWhen"], "替代甲")
        self.assertEqual(node["proofRule"], "证据甲")
        self.assertEqual(node["runtimeStatus"], "partial")
        self.assertIsNone(node["assessedLevel"])
        self.assertEqual(node["evidenceRecords"][0]["status"], "not_started")
        self.assertEqual(projection["currentTaskId"], "M01-D01")
        self.assertTrue(any("不存在" in issue for issue in node["relationIssues"]))
        self.assertTrue(any(item["code"] == "cycle" for item in projection["issues"]))
        self.assertTrue(any("独立验证" in issue for issue in node["relationIssues"]))

if __name__ == "__main__":
    unittest.main()