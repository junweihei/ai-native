from __future__ import annotations

import argparse
import hashlib
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
TASK_PROTOCOL = [
    "locate",
    "closed_book_first_pass",
    "specified_input",
    "active_processing",
    "artifact",
    "self_check",
    "single_issue_revision",
    "close",
]


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


def _current_context(mapping, documents: list[dict], controlled_materials: list[dict] | None = None) -> dict | None:
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
            "step_protocol": TASK_PROTOCOL,
            "not_applicable_steps": [],
            "resources": [
                {"id": str(resource), "allowed_scope": "仅用于当前任务指定输入"}
                for resource in (fields.get("resources") or [])
            ],
            "knowledge_nodes": [
                {"id": str(node), "role": "当前任务关联"}
                for node in (fields.get("nodes") or [])
            ],
            "self_check": [completion_rule] if completion_rule else [],
            "controlled_materials": controlled_materials or [],
            "dependencies": dependency_records,
            "gate": {
                "status": "blocked" if unresolved_dependencies else "satisfied",
                "label": "依赖任务门禁",
                "details": [item["id"] for item in unresolved_dependencies],
            },
            "current_step": f"{task_id.split('-')[-1]} 证据补链" if evidence_requirements else None,
            "next_action": last_session.get("next_action") if last_session else metadata.get("next_action"),
            "last_session": {
                "id": last_session.get("id"),
                "updated": last_session.get("updated"),
                "current_step": last_session.get("current_step"),
                "unresolved_issue": last_session.get("unresolved_issue") or (snapshot_row[3] if snapshot_row and len(snapshot_row) > 3 else None),
            }
            if last_session
            else None,
            "executable": bool(
                all(required_values.values()) and not unresolved_dependencies and week_row
            ),
        },
    }



def _roadmap(parsed_documents: list, mapping) -> dict:
    master = next((item for item in parsed_documents if "six-month" in item.relative_path), None)
    if not master or not mapping:
        return {"currentTaskId": None, "relationIssues": [{"code": "roadmap_source_missing", "message": "缺少六个月总纲或运行映射。"}], "months": []}

    months = []
    for raw_line in master.body.splitlines():
        if not raw_line.lstrip().startswith("|"):
            continue
        cells = [cell.strip() for cell in raw_line.strip().strip("|").split("|")]
        if len(cells) != 5 or not re.fullmatch(r"第[1-6]月", cells[0]):
            continue
        number = int(re.search(r"\d", cells[0]).group())
        months.append({
            "id": f"M{number:02d}",
            "title": cells[1],
            "capabilityRange": cells[2],
            "projectIncrement": cells[3],
            "acceptance": cells[4],
            "status": "learning" if number == 1 else "not_started",
            "partial": number != 1,
            "weeks": [],
        })

    tasks: dict[str, dict] = {}
    week_number = None
    week_titles: dict[int, str] = {}
    for raw_line in mapping.body.splitlines():
        heading = re.match(r"^###\s+第([1-4])周：?\s*(.+)$", raw_line)
        if heading:
            week_number = int(heading.group(1))
            week_titles[week_number] = heading.group(2).strip()
            continue
        if not raw_line.lstrip().startswith("|") or week_number is None:
            continue
        cells = [cell.strip().replace("**", "") for cell in raw_line.strip().strip("|").split("|")]
        if len(cells) < 7 or not re.fullmatch(r"M01-D\d{2}", cells[0]):
            continue
        task_id = cells[0]
        status = next((value for label, value in STATUS_LABELS.items() if label in cells[-1]), None)
        dependencies = [f"M01-D{int(value):02d}" for value in re.findall(r"D(\d{1,2})", cells[-1])]
        tasks[task_id] = {
            "id": task_id,
            "title": cells[2],
            "timeRange": cells[1],
            "status": status,
            "dependencies": dependencies,
            "gate": None,
            "acceptance": cells[5],
            "blockedReason": None,
            "unlockCondition": None,
            "current": task_id == mapping.metadata.get("current_task"),
            "relationIssues": [],
            "week": week_number,
        }

    relation_issues = []
    for task in tasks.values():
        missing = [item for item in task["dependencies"] if item not in tasks]
        if missing:
            task["relationIssues"].append("缺失父级：" + "、".join(missing))
            relation_issues.append({"code": "missing_parent", "message": f"{task['id']} 依赖不存在任务。"})
        unresolved = [item for item in task["dependencies"] if tasks.get(item, {}).get("status") not in {"completed", "verified"}]
        if task["status"] == "not_started" and unresolved:
            task["blockedReason"] = "等待依赖：" + "、".join(unresolved)
            task["unlockCondition"] = "完成或验证上述依赖任务"
        if task["status"] == "blocked":
            task["blockedReason"] = "权威计划标记为阻塞"
            task["unlockCondition"] = "在权威计划中记录解除条件"
        if not task["status"]:
            task["relationIssues"].append("状态未知")
            relation_issues.append({"code": "unknown_status", "message": f"{task['id']} 状态未知。"})

    visiting, visited = set(), set()
    def visit(task_id: str) -> None:
        if task_id in visiting:
            relation_issues.append({"code": "cycle", "message": f"检测到循环依赖：{task_id}"})
            tasks[task_id]["relationIssues"].append("循环依赖")
            return
        if task_id in visited or task_id not in tasks:
            return
        visiting.add(task_id)
        for dependency in tasks[task_id]["dependencies"]:
            visit(dependency)
        visiting.remove(task_id)
        visited.add(task_id)
    for task_id in tasks:
        visit(task_id)

    if months:
        month = months[0]
        for number in range(1, 5):
            title = week_titles.get(number, f"第{number}周（关系缺失）")
            gate_match = re.search(rf"第{number}周门禁：([^\n]+)", mapping.body)
            month["weeks"].append({
                "id": f"M01-W{number:02d}",
                "title": title,
                "gate": gate_match.group(1).strip() if gate_match else None,
                "tasks": [task for task in tasks.values() if task["week"] == number],
            })
    return {"currentTaskId": mapping.metadata.get("current_task"), "relationIssues": relation_issues, "months": months}


def _registry_values(value: str) -> list[str]:
    if not value or value in {"-", "—", "无"}:
        return []
    return [
        item.strip()
        for item in re.split(r"[、,，；;]", value)
        if item.strip() and item.strip() not in {"-", "—", "无"}
    ]


def _knowledge_projection(parsed_documents: list, documents: list[dict]) -> dict:
    structure_source = next(
        (item for item in parsed_documents if item.relative_path.endswith("AI_Native_知识地图_V0.2.md")),
        None,
    )
    registry = next(
        (item for item in parsed_documents if item.relative_path.endswith("AI_Native_知识节点注册表_V1.0.md")),
        None,
    )
    if not registry:
        missing = ["知识节点注册表"]
        return {
            "layers": [],
            "flows": [],
            "safeguards": [],
            "nodes": [],
            "issues": [{
                "code": "knowledge_source_missing",
                "message": f"权威源缺失：{'、'.join(missing)}。",
            }],
        }

    layers = []
    in_layers = False
    for raw in registry.body.splitlines():
        if raw.startswith("## 六层功能架构定义"):
            in_layers = True
            continue
        if in_layers and raw.startswith("## "):
            break
        if in_layers and raw.lstrip().startswith("|"):
            cells = [cell.strip() for cell in raw.strip().strip("|").split("|")]
            if len(cells) == 2 and cells[0] != "层" and not set(cells[0]) <= {"-"}:
                layers.append({
                    "id": f"layer-{len(layers) + 1}",
                    "title": cells[0],
                    "problem": cells[1],
                })

    nodes = []
    for raw in registry.body.splitlines():
        if not raw.lstrip().startswith("|"):
            continue
        cells = [cell.strip() for cell in raw.strip().strip("|").split("|")]
        if (
            len(cells) != 13
            or cells[0] == "ID"
            or not cells[0]
            or set(cells[0]) <= {"-"}
        ):
            continue
        node_id = cells[0]
        task_ids = _registry_values(cells[9])
        predecessors = _registry_values(cells[10])
        related = _registry_values(cells[11])
        successors = _registry_values(cells[12])
        linked_documents = [
            item
            for item in documents
            if node_id in (item.get("nodes") if isinstance(item.get("nodes"), list) else [])
        ]
        artifact_records = [
            {
                "id": item["id"],
                "path": item["path"],
                "title": item["title"],
                "status": item["status"],
                "taskId": item.get("task_id"),
            }
            for item in linked_documents
            if item.get("type") == "artifact"
        ]
        evidence_records = [
            {
                "id": item["id"],
                "path": item["path"],
                "title": item["title"],
                "status": item["status"],
                "taskId": item.get("task_id"),
                "capabilityLevel": item.get("capability_level"),
            }
            for item in linked_documents
            if item.get("type") == "evidence"
        ]
        verified_evidence = [
            item
            for item in evidence_records
            if item["status"] == "verified" and item.get("capabilityLevel")
        ]
        assessed_level = (
            verified_evidence[0]["capabilityLevel"] if verified_evidence else None
        )
        if verified_evidence:
            runtime_status = "supported"
            assessment_status = "verified"
            gap = None
        elif artifact_records:
            runtime_status = "partial"
            assessment_status = "unassessed"
            gap = (
                "已关联证据尚未通过独立验证；"
                if evidence_records
                else "缺少独立证据；"
            ) + (
                f"按权威计划任务 {'、'.join(task_ids)} 完成补强。"
                if task_ids
                else "权威计划未提供补强动作。"
            )
        else:
            runtime_status = "not_started"
            assessment_status = "unassessed"
            gap = "缺少可追溯成果与独立证据。"

        milestones = sorted({
            str(item.get("milestone"))
            for item in linked_documents
            if item.get("milestone")
        } | {
            task_id.split("-")[0]
            for task_id in task_ids
            if re.fullmatch(r"M\d{2}-D\d{2}", task_id)
        })
        nodes.append({
            "id": node_id,
            "title": cells[1],
            "nodeKind": cells[2],
            "summary": cells[3],
            "problem": cells[4],
            "useWhen": cells[5],
            "avoidWhen": cells[6],
            "proofRule": cells[7],
            "targetLevel": cells[8],
            "assessedLevel": assessed_level,
            "assessmentStatus": assessment_status,
            "runtimeStatus": runtime_status,
            "formationTasks": task_ids,
            "artifacts": [item["path"] for item in artifact_records],
            "evidence": [item["path"] for item in evidence_records],
            "artifactRecords": artifact_records,
            "evidenceRecords": evidence_records,
            "predecessors": predecessors,
            "related": related,
            "successors": successors,
            "milestones": milestones,
            "relationIssues": [],
            "gap": gap,
            "sourcePath": registry.relative_path,
        })

    issues = []
    node_ids = {node["id"] for node in nodes}
    for node in nodes:
        for relation_name, relation_label in (
            ("predecessors", "前置"),
            ("related", "相关"),
            ("successors", "后续"),
        ):
            missing = [
                item for item in node[relation_name]
                if item not in node_ids
            ]
            if missing:
                node["relationIssues"].append(
                    f"{relation_label}节点不存在：{'、'.join(missing)}"
                )
        if not node["formationTasks"]:
            node["relationIssues"].append("未关联权威计划任务")
        if not node["artifacts"]:
            node["relationIssues"].append("未关联成果")
        if not any(item["status"] == "verified" for item in node["evidenceRecords"]):
            node["relationIssues"].append("未关联通过独立验证的证据")

    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(node_id: str, trail: list[str]) -> None:
        if node_id in visiting:
            cycle = " → ".join(trail + [node_id])
            node = next(item for item in nodes if item["id"] == node_id)
            issue = f"前置关系循环：{cycle}"
            if issue not in node["relationIssues"]:
                node["relationIssues"].append(issue)
            return
        if node_id in visited:
            return
        visiting.add(node_id)
        node = next(item for item in nodes if item["id"] == node_id)
        for predecessor in node["predecessors"]:
            if predecessor in node_ids:
                visit(predecessor, trail + [node_id])
        visiting.remove(node_id)
        visited.add(node_id)

    for node_id in sorted(node_ids):
        visit(node_id, [])

    for node in nodes:
        for issue in node["relationIssues"]:
            issues.append({
                "code": "cycle" if "循环" in issue else ("evidence_gap" if "独立验证" in issue else "broken_link"),
                "message": f"{node['id']}：{issue}",
            })

    return {
        "layers": layers,
        "flows": ["数据流", "控制流", "反馈流"],
        "safeguards": ["评测与可靠性", "权限、风险与治理"],
        "nodes": nodes,
        "issues": issues,
        "currentTaskId": next((getattr(item, "metadata", {}).get("current_task") for item in parsed_documents if getattr(item, "metadata", {}).get("current_task")), None),
        "sourcePath": registry.relative_path,
    }

def _controlled_material_projection(repo_root: Path, config: dict) -> tuple[set[str], list[dict]]:
    manifest_name = config.get("controlled_materials_manifest")
    if not isinstance(manifest_name, str):
        return set(), []
    manifest_path = (repo_root / manifest_name).resolve()
    try:
        manifest_path.relative_to(repo_root.resolve())
    except ValueError:
        return set(), []
    if not manifest_path.is_file():
        return set(), []
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    protected: set[str] = set()
    placeholders: list[dict] = []
    for material in manifest.get("materials", []):
        placeholders.append({
            "control_id": material.get("control_id"),
            "safe_category": material.get("safe_category"),
            "task_id": material.get("task_id"),
            "condition": material.get("condition"),
            "access_state": "locked",
        })
        for pattern in material.get("paths", []):
            if not isinstance(pattern, str):
                continue
            for match in repo_root.glob(pattern):
                if not match.is_file():
                    continue
                try:
                    protected.add(match.resolve().relative_to(repo_root.resolve()).as_posix())
                except ValueError:
                    continue
    return protected, placeholders


def _archive_projection(repo_root: Path) -> tuple[list[Path], list[dict]]:
    archive_root = repo_root / "archive"
    paths = sorted(archive_root.rglob("*.md")) if archive_root.is_dir() else []
    documents = []
    for path in paths:
        document = read_document(path, repo_root)
        documents.append(
            {
                "id": document.metadata.get("id") or legacy_id(document.relative_path),
                "path": document.relative_path,
                "title": markdown_title(document),
                "type": document.metadata.get("type") or "archive",
                "category": "archive",
                "status": "archived",
                "task_id": document.metadata.get("task_id"),
                "milestone": document.metadata.get("milestone"),
                "week": document.metadata.get("week"),
                "nodes": document.metadata.get("nodes", []),
                "evidence_for": document.metadata.get("evidence_for", []),
                "capability_level": document.metadata.get("capability_level"),
                "updated": document.metadata.get("updated") or iso_mtime(path),
            }
        )
    return paths, documents


def build_index(repo_root: Path, config: dict) -> dict:
    documents = []
    parsed_documents = []
    source_paths = list(discover_markdown(repo_root, config))
    archive_paths, archive_documents = _archive_projection(repo_root)
    protected_paths, controlled_materials = _controlled_material_projection(repo_root, config)
    for path in source_paths:
        document = read_document(path, repo_root)
        if document.relative_path in protected_paths:
            continue
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
                "capability_level": metadata.get("capability_level"),
                "current_step": metadata.get("current_step"),
                "unresolved_issue": metadata.get("unresolved_issue"),
                "next_action": metadata.get("next_action"),
                "capability_change_evidence_ids": metadata.get("capability_change_evidence_ids", []),
                "review_scope": metadata.get("review_scope"),
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
    current_task_id = mapping.metadata.get("current_task") if mapping else None
    current_controlled = [
        {key: value for key, value in item.items() if key != "task_id"}
        for item in controlled_materials
        if item.get("task_id") == current_task_id
    ]
    current_context = _current_context(mapping, documents, current_controlled) if mapping else None

    source_digest = hashlib.sha256()
    source_digest.update(json.dumps(config, ensure_ascii=False, sort_keys=True).encode("utf-8"))
    for path in sorted(source_paths + archive_paths):
        relative_path = path.resolve().relative_to(repo_root.resolve()).as_posix()
        source_digest.update(relative_path.encode("utf-8"))
        source_digest.update(b"\0")
        source_digest.update(path.read_bytes())
        source_digest.update(b"\0")
    if registry_path.is_file():
        source_digest.update(registry_path.read_bytes())

    generated_at = datetime.now(timezone.utc).isoformat()
    return {
        "schema_version": config.get("schema_version", "V0.1"),
        "generated_at": generated_at,
        "source_revision": f"sha256:{source_digest.hexdigest()}",
        "freshness": {"status": "fresh", "reason": None, "checked_at": generated_at},
        "source_of_truth": "markdown",
        "stats": {
            "documents": len(documents),
            "templates": len(templates),
            "metadata_complete": sum(item["metadata_complete"] for item in documents),
            "validation_errors": error_count,
            "validation_warnings": warning_count,
        },
        "documents": documents,
        "archive_documents": archive_documents,
        "current_context": current_context,
        "roadmap": _roadmap(parsed_documents, mapping),
        "knowledge": _knowledge_projection(parsed_documents, documents),
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
