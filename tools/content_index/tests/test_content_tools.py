from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.content_index.common import (
    discover_markdown,
    infer_category,
    local_markdown_links,
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
        self.assertEqual(infer_category("content/projects/真实任务.md"), "project")

    def test_recognizes_session_directory(self) -> None:
        self.assertEqual(infer_category("content/sessions/D1.md"), "session")



class DiscoveryTests(unittest.TestCase):
    def test_excludes_directory_readmes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            content = repo / "content"
            content.mkdir()
            (content / "README.md").write_text("# Guide\n", encoding="utf-8")
            note = content / "note.md"
            note.write_text("# Note\n", encoding="utf-8")
            config = {
                "content_roots": ["content"],
                "root_documents": [],
                "excluded_directories": [],
                "excluded_filenames": ["README.md"],
            }
            discovered = discover_markdown(repo, config)
        self.assertEqual(discovered, [note.resolve()])


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



class MarkdownLinkTests(unittest.TestCase):
    def test_returns_only_local_targets(self) -> None:
        text = "[local](../content/README.md#规则) [web](https://example.com) [anchor](#top)"
        self.assertEqual(local_markdown_links(text), ["../content/README.md"])

    def test_supports_angle_bracket_paths(self) -> None:
        self.assertEqual(local_markdown_links("[file](<folder/My File.md>)"), ["folder/My File.md"])


if __name__ == "__main__":
    unittest.main()

