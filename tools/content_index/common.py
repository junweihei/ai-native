from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = REPO_ROOT / "config" / "learning-content.json"
FRONTMATTER_BOUNDARY = "---"
PLACEHOLDER_RE = re.compile(r"\{\{[^{}]+\}\}")


@dataclass(frozen=True)
class MarkdownDocument:
    path: Path
    relative_path: str
    metadata: dict[str, Any]
    body: str
    has_frontmatter: bool


def load_config(path: Path | None = None) -> dict[str, Any]:
    config_path = path or DEFAULT_CONFIG
    return json.loads(config_path.read_text(encoding="utf-8"))


def _parse_scalar(value: str) -> Any:
    value = value.strip()
    if not value:
        return ""
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    if value == "[]":
        return []
    if value == "{}":
        return {}
    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False
    if value.lower() in {"null", "none", "~"}:
        return None
    return value


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str, bool]:
    """Parse the top-level YAML subset used by this repository.

    The parser intentionally reads only top-level scalar fields and top-level
    lists. Nested configuration remains the responsibility of its native file.
    This avoids adding a runtime dependency only to build the website index.
    """

    lines = text.splitlines()
    if not lines or lines[0].strip() != FRONTMATTER_BOUNDARY:
        return {}, text, False

    try:
        end = next(
            index
            for index, line in enumerate(lines[1:], start=1)
            if line.strip() == FRONTMATTER_BOUNDARY
        )
    except StopIteration:
        return {}, text, False

    metadata: dict[str, Any] = {}
    active_list: str | None = None
    for raw_line in lines[1:end]:
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        if raw_line.startswith("  - ") and active_list:
            current = metadata.setdefault(active_list, [])
            if isinstance(current, list):
                current.append(_parse_scalar(raw_line[4:]))
            continue
        if raw_line[:1].isspace():
            continue
        match = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", raw_line)
        if not match:
            active_list = None
            continue
        key, value = match.groups()
        if value == "":
            metadata[key] = []
            active_list = key
        else:
            metadata[key] = _parse_scalar(value)
            active_list = None

    body = "\n".join(lines[end + 1 :])
    return metadata, body, True


def relative_posix(path: Path, repo_root: Path = REPO_ROOT) -> str:
    return path.resolve().relative_to(repo_root.resolve()).as_posix()


def discover_markdown(
    repo_root: Path = REPO_ROOT, config: dict[str, Any] | None = None
) -> list[Path]:
    config = config or load_config()
    discovered: set[Path] = set()

    for relative in config.get("root_documents", []):
        path = repo_root / relative
        if path.is_file():
            discovered.add(path.resolve())

    excluded = set(config.get("excluded_directories", []))
    for relative in config.get("content_roots", []):
        root = repo_root / relative
        if not root.is_dir():
            continue
        for path in root.rglob("*.md"):
            relative_parts = path.relative_to(repo_root).parts
            if any(part in excluded for part in relative_parts):
                continue
            discovered.add(path.resolve())

    return sorted(discovered, key=lambda item: relative_posix(item, repo_root))


def read_document(path: Path, repo_root: Path = REPO_ROOT) -> MarkdownDocument:
    text = path.read_text(encoding="utf-8")
    metadata, body, has_frontmatter = parse_frontmatter(text)
    return MarkdownDocument(
        path=path,
        relative_path=relative_posix(path, repo_root),
        metadata=metadata,
        body=body,
        has_frontmatter=has_frontmatter,
    )


def infer_category(relative_path: str) -> str:
    path = relative_path.replace("\\", "/")
    if path.startswith("daily-task/"):
        return "session"
    if path.startswith("01-map/"):
        return "knowledge"
    if path.startswith("02-cases/"):
        return "case"
    if path.startswith("03-practice/"):
        return "practice"
    if path.startswith("04-use/"):
        return "project"
    if path.startswith("05-evidence/"):
        return "evidence"
    if "运行映射" in path or "总纲" in path or "开始这里" in path:
        return "plan"
    if "规则" in path or "规范" in path or "手册" in path or "资源" in path:
        return "guide"
    return "system"


def infer_type(relative_path: str) -> str:
    category = infer_category(relative_path)
    return {
        "session": "session",
        "plan": "plan",
        "guide": "guide",
        "evidence": "evidence",
    }.get(category, "artifact")


def markdown_title(document: MarkdownDocument) -> str:
    title = document.metadata.get("title")
    if isinstance(title, str) and title.strip():
        return title.strip()
    match = re.search(r"^#\s+(.+)$", document.body, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return document.path.stem


def headings(body: str) -> list[str]:
    return [match.group(1).strip() for match in re.finditer(r"^#{1,3}\s+(.+)$", body, re.MULTILINE)]


def summary(body: str, limit: int = 180) -> str:
    cleaned = re.sub(r"```[\s\S]*?```", " ", body)
    cleaned = re.sub(r"[#>*`\[\]|_-]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:limit]


def legacy_id(relative_path: str) -> str:
    digest = hashlib.sha1(relative_path.encode("utf-8")).hexdigest()[:12]
    return f"legacy-{digest}"


def iso_mtime(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()


def parse_template_registry(path: Path) -> list[dict[str, str]]:
    """Read the flat template records from template-registry.yaml.

    This is deliberately limited to the registry's list of scalar template
    records and does not attempt to be a general YAML parser.
    """

    records: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    in_templates = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip() == "templates:":
            in_templates = True
            continue
        if not in_templates:
            continue
        start = re.match(r"^\s{2}- template_id:\s*(.+)$", line)
        if start:
            if current:
                records.append(current)
            current = {"template_id": str(_parse_scalar(start.group(1)))}
            continue
        field = re.match(r"^\s{4}([A-Za-z0-9_-]+):\s*(.+)$", line)
        if field and current is not None:
            current[field.group(1)] = str(_parse_scalar(field.group(2)))
    if current:
        records.append(current)
    return records


def unresolved_placeholders(text: str) -> list[str]:
    return sorted(set(PLACEHOLDER_RE.findall(text)))


def unique_preserving_order(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result

