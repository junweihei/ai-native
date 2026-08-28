from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.content_index.common import (  # noqa: E402
    DEFAULT_CONFIG,
    REPO_ROOT,
    discover_markdown,
    load_config,
    local_markdown_links,
    parse_template_registry,
    read_document,
    unresolved_placeholders,
)


@dataclass(frozen=True)
class Issue:
    level: str
    code: str
    path: str
    message: str


def collect_issues(repo_root: Path, config: dict[str, Any]) -> list[Issue]:
    issues: list[Issue] = []
    required_paths = set(config.get("required_frontmatter_paths", []))
    required_fields = config.get("required_frontmatter_fields", [])
    allowed_statuses = set(config.get("allowed_statuses", []))
    ids: list[tuple[str, str]] = []

    content_paths = discover_markdown(repo_root, config)
    for path in content_paths:
        document = read_document(path, repo_root)
        metadata = document.metadata

        if document.relative_path in required_paths and not document.has_frontmatter:
            issues.append(
                Issue("error", "missing-frontmatter", document.relative_path, "关键文件缺少 frontmatter")
            )
        elif not document.has_frontmatter:
            issues.append(
                Issue("warning", "legacy-frontmatter", document.relative_path, "历史文件尚未补充 frontmatter")
            )

        if document.has_frontmatter:
            if document.relative_path in required_paths:
                for field in required_fields:
                    if not metadata.get(field):
                        issues.append(
                            Issue(
                                "error",
                                "missing-field",
                                document.relative_path,
                                f"关键文件缺少字段: {field}",
                            )
                        )
            document_id = metadata.get("id")
            if isinstance(document_id, str) and document_id:
                ids.append((document_id, document.relative_path))
            status = metadata.get("status")
            if status and status not in allowed_statuses:
                issues.append(
                    Issue(
                        "error",
                        "invalid-status",
                        document.relative_path,
                        f"未知状态: {status}",
                    )
                )

        placeholders = unresolved_placeholders(path.read_text(encoding="utf-8"))
        if placeholders:
            issues.append(
                Issue(
                    "error",
                    "unresolved-placeholder",
                    document.relative_path,
                    "正式内容残留模板占位符: " + ", ".join(placeholders[:5]),
                )
            )


    link_sources = set(content_paths)
    for relative in config.get("link_check_paths", []):
        candidate = repo_root / relative
        if not candidate.is_file():
            issues.append(Issue("error", "missing-link-source", relative, "链接检查文件不存在"))
        else:
            link_sources.add(candidate.resolve())

    repo_root_resolved = repo_root.resolve()
    for source in sorted(link_sources):
        source_relative = source.relative_to(repo_root_resolved).as_posix()
        for target in local_markdown_links(source.read_text(encoding="utf-8")):
            if target.startswith("/"):
                destination = repo_root_resolved / target.lstrip("/")
            else:
                destination = source.parent / target
            destination = destination.resolve()
            try:
                destination.relative_to(repo_root_resolved)
            except ValueError:
                issues.append(
                    Issue("error", "link-outside-repository", source_relative, f"链接超出仓库: {target}")
                )
                continue
            if not destination.exists():
                issues.append(
                    Issue("error", "broken-local-link", source_relative, f"本地链接不存在: {target}")
                )

    counts = Counter(document_id for document_id, _ in ids)
    for document_id, count in counts.items():
        if count > 1:
            paths = [path for found_id, path in ids if found_id == document_id]
            issues.append(
                Issue(
                    "error",
                    "duplicate-id",
                    ", ".join(paths),
                    f"ID {document_id!r} 出现 {count} 次",
                )
            )

    registry_relative = config.get("template_registry")
    if registry_relative:
        registry_path = repo_root / registry_relative
        if not registry_path.is_file():
            issues.append(Issue("error", "missing-registry", registry_relative, "模板注册表不存在"))
        else:
            records = parse_template_registry(registry_path)
            template_ids = [record.get("template_id", "") for record in records]
            for template_id, count in Counter(template_ids).items():
                if not template_id:
                    issues.append(Issue("error", "missing-template-id", registry_relative, "模板缺少 ID"))
                elif count > 1:
                    issues.append(
                        Issue("error", "duplicate-template-id", registry_relative, f"模板 ID 重复: {template_id}")
                    )
            registry_root = registry_path.parent
            for record in records:
                template_path = record.get("path")
                if not template_path:
                    issues.append(
                        Issue(
                            "error",
                            "missing-template-path",
                            registry_relative,
                            f"模板 {record.get('template_id', '<unknown>')} 缺少 path",
                        )
                    )
                    continue
                absolute_template = registry_root / template_path
                if not absolute_template.is_file():
                    issues.append(
                        Issue("error", "broken-template-path", template_path, "注册表指向的模板不存在")
                    )
                    continue
                template_document = read_document(absolute_template, repo_root)
                if template_document.metadata.get("template_id") != record.get("template_id"):
                    issues.append(
                        Issue(
                            "error",
                            "template-id-mismatch",
                            template_path,
                            "模板文件与注册表的 template_id 不一致",
                        )
                    )

    return sorted(issues, key=lambda issue: (issue.level != "error", issue.path, issue.code))


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate AI Native Learning OS Markdown content")
    parser.add_argument("--repo", type=Path, default=REPO_ROOT)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--json", action="store_true", dest="as_json")
    parser.add_argument("--warnings-as-errors", action="store_true")
    args = parser.parse_args()

    config = load_config(args.config)
    issues = collect_issues(args.repo.resolve(), config)
    errors = [issue for issue in issues if issue.level == "error"]
    warnings = [issue for issue in issues if issue.level == "warning"]

    if args.as_json:
        print(json.dumps([asdict(issue) for issue in issues], ensure_ascii=False, indent=2))
    else:
        for issue in issues:
            print(f"[{issue.level.upper()}] {issue.code}: {issue.path} — {issue.message}")
        print(f"Learning content validation: {len(errors)} error(s), {len(warnings)} warning(s)")

    if errors or (warnings and args.warnings_as_errors):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

