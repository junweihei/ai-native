import unittest
from pathlib import Path

from tools.content_index.build_learning_index import build_index
from tools.content_index.common import load_config


class TodayProjectionTests(unittest.TestCase):
    def test_real_month_one_mapping_projects_d02_without_defaults(self):
        repo_root = Path(__file__).resolve().parents[3]
        config = load_config(repo_root / "config" / "learning-content.json")
        index = build_index(repo_root, config)
        context = index["current_context"]

        self.assertEqual(context["resolution"], "resolved")
        self.assertEqual(context["task_id"], "M01-D02")
        self.assertTrue(context["task"]["evidence_requirements"])
        self.assertEqual(context["task"]["dependencies"], [{"id": "M01-D01", "status": "completed"}])
        self.assertTrue(context["task"]["executable"])
        self.assertIsNone(context["trace"]["goal"]["acceptance_relation"])
        self.assertIn("goal_acceptance_relation_missing", {issue["code"] for issue in context["issues"]})


    def test_index_declares_repeatable_source_revision_and_freshness(self):
        repo_root = Path(__file__).resolve().parents[3]
        config = load_config(repo_root / "config" / "learning-content.json")
        first = build_index(repo_root, config)
        second = build_index(repo_root, config)

        self.assertEqual(first["source_revision"], second["source_revision"])
        self.assertRegex(first["source_revision"], r"^sha256:[0-9a-f]{64}$")
        self.assertEqual(first["freshness"]["status"], "fresh")


    def test_public_projection_excludes_controlled_answers_and_projects_protocol(self):
        repo_root = Path(__file__).resolve().parents[3]
        config = load_config(repo_root / "config" / "learning-content.json")
        index = build_index(repo_root, config)
        paths = {item["path"] for item in index["documents"]}
        serialized = str(index["documents"])

        self.assertNotIn("content/practice/20题首测_参考答案.md", paths)
        self.assertNotIn("content/practice/10题复测_参考答案.md", paths)
        self.assertNotIn("核心判定依据", serialized)
        task = index["current_context"]["task"]
        self.assertEqual(len(task["step_protocol"]), 8)
        self.assertEqual([item["id"] for item in task["resources"]], ["R1", "R2"])
        self.assertEqual(
            [item["id"] for item in task["knowledge_nodes"]],
            ["task-fit", "deterministic-vs-llm-vs-agent"],
        )
        self.assertTrue(index["archive_documents"])
        self.assertTrue(
            all(item["status"] == "archived" for item in index["archive_documents"])
        )
        self.assertTrue(
            all(item["path"].startswith("archive/") for item in index["archive_documents"])
        )

        knowledge = index["knowledge"]
        self.assertEqual(len(knowledge["layers"]), 6)
        self.assertTrue(all(item["problem"] != "____" for item in knowledge["layers"]))
        task_fit = next(item for item in knowledge["nodes"] if item["id"] == "task-fit")
        self.assertEqual(task_fit["summary"], "根据任务确定性、输入结构、路径是否固定和是否需要中间证据选择下一步，选择足够简单的实现机制。")
        self.assertEqual(task_fit["runtimeStatus"], "partial")
        self.assertIsNone(task_fit["assessedLevel"])
        self.assertEqual(task_fit["evidenceRecords"][0]["status"], "not_started")


if __name__ == "__main__":
    unittest.main()
