from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.content_index.common import (  # noqa: E402
    DEFAULT_CONFIG,
    REPO_ROOT,
    discover_markdown,
    headings,
    infer_category,
    infer_type,
    iso_mtime,
    legacy_id,
    load_config,
    markdown_title,
    parse_template_registry,
    read_document,
    summary,
)
from tools.content_index.validate_learning_content import collect_issues  # noqa: E402


def build_index(repo_root: Path, config: dict) -> dict:
    documents = []
    for path in discover_markdown(repo_root, config):
        document = read_document(path, repo_root)
        metadata = document.metadata
        item_type = metadata.get("type") or infer_type(document.relative_path)
        item_id = metadata.get("id") or legacy_id(document.relative_path)
        documents.append(
            {
                "id": item_id,
                "path": document.relative_path,
                "title": markdown_title(document),
                "type": item_type,
                "category": infer_category(document.relative_path),
                "status": metadata.get("status", "unknown"),
                "task_id": metadata.get("task_id"),
                "artifact_id": metadata.get("artifact_id"),
                "template_id": metadata.get("template_id"),
                "milestone": metadata.get("milestone"),
                "week": metadata.get("week"),
                "nodes": metadata.get("nodes", []),
                "evidence_for": metadata.get("evidence_for", []),
                "created": metadata.get("created"),
                "updated": metadata.get("updated") or iso_mtime(path),
                "metadata_complete": all(metadata.get(field) for field in ("id", "type", "status")),
                "headings": headings(document.body),
                "summary": summary(document.body),
            }
        )

    registry_path = repo_root / config["template_registry"]
    templates = parse_template_registry(registry_path) if registry_path.is_file() else []
    issues = collect_issues(repo_root, config)
    error_count = sum(issue.level == "error" for issue in issues)
    warning_count = sum(issue.level == "warning" for issue in issues)

    return {
        "schema_version": config.get("schema_version", "V0.1"),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_of_truth": "markdown",
        "stats": {
            "documents": len(documents),
            "templates": len(templates),
            "metadata_complete": sum(item["metadata_complete"] for item in documents),
            "validation_errors": error_count,
            "validation_warnings": warning_count,
        },
        "documents": documents,
        "templates": templates,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the Learning OS website content index")
    parser.add_argument("--repo", type=Path, default=REPO_ROOT)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--allow-errors", action="store_true")
    args = parser.parse_args()

    repo_root = args.repo.resolve()
    config = load_config(args.config)
    index = build_index(repo_root, config)
    if index["stats"]["validation_errors"] and not args.allow_errors:
        print("Index not written because content validation has errors.", file=sys.stderr)
        return 1

    output = args.output or (repo_root / config["generated_index"])
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Learning index written: {output}")
    print(json.dumps(index["stats"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

