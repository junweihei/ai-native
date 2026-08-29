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


if __name__ == "__main__":
    unittest.main()
