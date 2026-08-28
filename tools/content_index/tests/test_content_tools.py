from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.content_index.common import (
    infer_category,
    parse_frontmatter,
    parse_template_registry,
    unresolved_placeholders,
)


class FrontmatterTests(unittest.TestCase):
    def test_parses_scalars_and_lists(self) -> None:
        metadata, body, present = parse_frontmatter(
            """---
id: sample
status: learning
nodes:
  - KN-one
  - KN-two
---
# Title
Body
"""
        )
        self.assertTrue(present)
        self.assertEqual(metadata["id"], "sample")
        self.assertEqual(metadata["nodes"], ["KN-one", "KN-two"])
        self.assertIn("# Title", body)

    def test_legacy_document_has_no_frontmatter(self) -> None:
        metadata, body, present = parse_frontmatter("# Legacy\n")
        self.assertFalse(present)
        self.assertEqual(metadata, {})
        self.assertEqual(body, "# Legacy\n")


class ClassificationTests(unittest.TestCase):
    def test_recognizes_project_directory(self) -> None:
        self.assertEqual(infer_category("04-use/真实任务.md"), "project")

    def test_recognizes_session_directory(self) -> None:
        self.assertEqual(infer_category("daily-task/D1.md"), "session")


class RegistryTests(unittest.TestCase):
    def test_reads_template_records(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            registry = Path(directory) / "registry.yaml"
            registry.write_text(
                """version: V0.1
templates:
  - template_id: tpl-one
    name: One
    path: one.md
  - template_id: tpl-two
    name: Two
    path: two.md
""",
                encoding="utf-8",
            )
            records = parse_template_registry(registry)
        self.assertEqual([record["template_id"] for record in records], ["tpl-one", "tpl-two"])
        self.assertEqual(records[0]["path"], "one.md")


class PlaceholderTests(unittest.TestCase):
    def test_finds_unique_placeholders(self) -> None:
        self.assertEqual(unresolved_placeholders("{{task_id}} {{task_id}} {{date}}"), ["{{date}}", "{{task_id}}"])


if __name__ == "__main__":
    unittest.main()

