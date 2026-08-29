from __future__ import annotations

import argparse
import json
import re
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
    parse_frontmatter,
    parse_template_registry,
    read_document,
    summary,
)
from tools.content_index.validate_learning_content import collect_issues  # noqa: E402


STATUS_LABELS = {
    "未开始": "not_started",
    "学习中": "learning",
    "待复盘": "review_pending",
    "已完成": "completed",
    "已验证": "verified",
    "阻塞": "blocked",
}


def _table_row(body: str, identifier: str, id_column: int = 0) -> list[str] | None:
    for raw_line in body.splitlines():
        if not raw_line.lstrip().startswith("|"):
            continue
        cells = [cell.strip().replace("**", "") for cell in raw_line.strip().strip("|").split("|")]
        if len(cells) > id_column and cells[id_column] == identifier:
            return cells
    return None


def _task_status(body: str, task_id: str) -> str | None:
    row = _table_row(body, task_id)
    if not row:
        return None
    for label, status in STATUS_LABELS.items():
        if label in row[-1]:
            return status
    return None


def _current_task_fields(body: str) -> dict:
    marker = "## 十二、供 Learning OS 界面读取的最小字段"
    section_start = body.find(marker)
    if section_start < 0:
        return {}
    match = re.search(r"```yaml\s*\n(.*?)\n```", body[section_start:], re.DOTALL)
    if not match:
        return {}
    metadata, _, present = parse_frontmatter(f"---\n{match.group(1)}\n---\n")
    return metadata if present else {}


def _evidence_steps(body: str, task_id: str) -> list[str]:
    short_id = re.sub(r"^D0+", "D", task_id.split("-")[-1])
    match = re.search(
        rf"^###\s+{re.escape(short_id)}\s+证据补链\s*$\n(.*?)(?=^###\s|^##\s|^---\s*$)",
        body,
        re.MULTILINE | re.DOTALL,
    )
    if not match:
        return []
    return [
        item.strip()
        for item in re.findall(r"^\d+\.\s+(.+)$", match.group(1), re.MULTILINE)
        if item.strip()
    ]


def _current_context(mapping, documents: list[dict]) -> dict | None:
    metadata = mapping.metadata
    task_id = metadata.get("current_task")
    if not isinstance(task_id, str) or not task_id.strip():
        return None

    fields = _current_task_fields(mapping.body)
    task_row = _table_row(mapping.body, task_id)
    snapshot_row = _table_row(mapping.body, task_id.split("-")[-1])
    if not task_row or fields.get("id") != task_id:
        return {
            "resolution": "partial",
            "task_id": task_id,
            "candidates": [],
            "issues": [
                {
                    "code": "task_projection_missing",
                    "message": "当前任务存在，但任务最小字段或运行映射行无法解析。",
                    "impact": "无法开始任务。",
                }
            ],
            "source_path": mapping.relative_path,
        }

    issues: list[dict] = []
    week_id = fields.get("week")
    week_row = _table_row(mapping.body, week_id, 1) if isinstance(week_id, str) else None
    capabilities = fields.get("capabilities") if isinstance(fields.get("capabilities"), list) else []
    capability_targets = []
    for capability_id in capabilities:
        row = _table_row(mapping.body, str(capability_id))
        capability_targets.append(
            {
                "id": capability_id,
                "title": row[1] if row and len(row) > 1 else None,
                "target_level": row[2] if row and len(row) > 2 else None,
            }
        )

    goal_id = metadata.get("goal")
    goal_document = next((item for item in documents if item["id"] == goal_id), None)
    sessions = [
        item for item in documents if item.get("task_id") == task_id and item.get("type") == "session"
    ]
    last_session = max(sessions, key=lambda item: item.get("updated") or "", default=None)
    dependencies = fields.get("depends_on") if isinstance(fields.get("depends_on"), list) else []
    dependency_records = [
        {"id": dependency_id, "status": _task_status(mapping.body, str(dependency_id))}
        for dependency_id in dependencies
    ]
    unresolved_dependencies = [
        item for item in dependency_records if item["status"] not in {"completed", "verified"}
    ]

    title_match = re.search(rf"现在：\s*{re.escape(task_id)}\s+([^\n]+)", mapping.body)
    task_title = title_match.group(1).strip() if title_match else None
    objective = task_row[2].split("；", 1)[1].strip() if len(task_row) > 2 and "；" in task_row[2] else None
    primary_artifacts = fields.get("primary_artifacts") if isinstance(fields.get("primary_artifacts"), list) else []
    supporting_artifacts = fields.get("supporting_artifacts") if isinstance(fields.get("supporting_artifacts"), list) else []
    completion_rule = fields.get("completion_rule")
    evidence_requirements = _evidence_steps(mapping.body, task_id)
    required_values = {
        "task title": task_title,
        "month": fields.get("month"),
        "week": week_id,
        "duration": task_row[1] if len(task_row) > 1 else None,
        "objective": objective,
        "primary artifact": primary_artifacts,
        "completion rule": completion_rule,
        "evidence requirements": evidence_requirements,
    }
    for field_name, value in required_values.items():
        if not value:
            issues.append(
                {
                    "code": "required_field_missing",
                    "message": f"关系缺失：{field_name}",
                    "impact": "该字段不使用默认值，可能限制任务执行或验收。",
                }
            )
    if not goal_document:
        issues.append(
            {
                "code": "goal_relation_missing",
                "message": "关系缺失：六个月目标无法解析。",
                "impact": "任务仍可查看，但目标追溯不完整。",
            }
        )
    elif not goal_document.get("acceptance_relation"):
        issues.append(
            {
                "code": "goal_acceptance_relation_missing",
                "message": "关系缺失：六个月目标的验收关系未结构化。",
                "impact": "目标仍可追溯，但无法展示其验收关系。",
            }
        )
    if not week_row:
        issues.append(
            {
                "code": "week_relation_missing",
                "message": "关系缺失：周计划无法解析。",
                "impact": "任务仍可查看，但周门禁不可确认。",
            }
        )

    return {
        "resolution": "resolved",
        "task_id": task_id,
        "candidates": [],
        "source_path": mapping.relative_path,
        "source_updated": metadata.get("updated"),
        "issues": issues,
        "trace": {
            "goal": {
                "id": goal_id,
                "title": goal_document.get("title") if goal_document else None,
                "status": goal_document.get("status") if goal_document else None,
                "acceptance_relation": None,
            },
            "month": {
                "id": fields.get("month") or metadata.get("milestone"),
                "title": metadata.get("title"),
                "status": metadata.get("status"),
                "acceptance_relation": "本月能力目标与月末证据门禁",
            },
            "week": {
                "id": week_id,
                "title": week_row[0] if week_row else None,
                "status": "active" if week_row else None,
                "acceptance_relation": week_row[5] if week_row and len(week_row) > 5 else None,
            },
            "day": {"id": task_id, "title": task_title, "status": metadata.get("current_status")},
        },
        "task": {
            "id": task_id,
            "title": task_title,
            "status": metadata.get("current_status"),
            "duration_text": task_row[1] if len(task_row) > 1 else None,
            "objective": objective,
            "capability_targets": capability_targets,
            "primary_artifacts": primary_artifacts,
            "supporting_artifacts": supporting_artifacts,
            "completion_rules": [completion_rule] if completion_rule else [],
            "evidence_requirements": evidence_requirements,
            "dependencies": dependency_records,
            "gate": {
                "status": "blocked" if unresolved_dependencies else "satisfied",
                "label": "依赖任务门禁",
                "details": [item["id"] for item in unresolved_dependencies],
            },
            "current_step": f"{re.sub(r'^D0+', 'D', task_id.split('-')[-1])} 证据补链" if evidence_requirements else None,
            "next_action": metadata.get("next_action"),
            "last_session": {
                "id": last_session.get("id"),
                "updated": last_session.get("updated"),
                "current_step": None,
                "unresolved_issue": snapshot_row[3] if snapshot_row and len(snapshot_row) > 3 else None,
            }
            if last_session
            else None,
            "executable": bool(
                all(required_values.values()) and not unresolved_dependencies and week_row
            ),
        },
    }


def build_index(repo_root: Path, config: dict) -> dict:
    documents = []
    parsed_documents = []
    for path in discover_markdown(repo_root, config):
        document = read_document(path, repo_root)
        parsed_documents.append(document)
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
    mapping = next((item for item in parsed_documents if item.metadata.get("current_task")), None)

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
        "current_context": _current_context(mapping, documents) if mapping else None,
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
