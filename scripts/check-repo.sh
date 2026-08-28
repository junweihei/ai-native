#!/usr/bin/env bash
set -euo pipefail

script_dir="${BASH_SOURCE[0]%/*}"
if [[ "$script_dir" == "${BASH_SOURCE[0]}" ]]; then
  script_dir='.'
fi
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

required_files=(
  README.md
  AGENTS.md
  .gitignore
  .codex/README.md
  docs/operations/multi-device-workflow.md
  config/learning-content.json
  00-templates/template-registry.yaml
  tools/content_index/validate_learning_content.py
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

forbidden_pattern='(^|/)(\.env($|\.)|node_modules/|\.venv/|venv/|secrets/)|\.(pem|key|p12|pfx|db|sqlite|sqlite3)$'
if ! tracked_files="$(git -c safe.directory="$repo_root" ls-files)"; then
  echo 'Unable to inspect tracked files.' >&2
  exit 1
fi

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  if [[ "$file" == '.env.example' || "$file" == */.env.example ]]; then
    continue
  fi
  if [[ "$file" =~ $forbidden_pattern ]]; then
    echo "Forbidden tracked file detected: $file" >&2
    exit 1
  fi
done <<< "$tracked_files"

if command -v python3 >/dev/null 2>&1; then
  python_cmd=(python3)
elif command -v python >/dev/null 2>&1; then
  python_cmd=(python)
else
  echo 'Python 3 is required to validate Learning OS content.' >&2
  exit 1
fi

"${python_cmd[@]}" tools/content_index/validate_learning_content.py
"${python_cmd[@]}" -m unittest discover -s tools/content_index/tests -v

echo 'Repository baseline and Learning OS content checks passed.'
