#!/usr/bin/env bash
set -euo pipefail

script_dir="${BASH_SOURCE[0]%/*}"
if [[ "$script_dir" == "${BASH_SOURCE[0]}" ]]; then
  script_dir='.'
fi
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

required_files=(
  README.md AGENTS.md .gitignore .env.example package.json package-lock.json tsconfig.json
  vite.config.ts playwright.config.ts .codex/README.md docs/operations/multi-device-workflow.md
  docs/development.md config/learning-content.json 00-templates/template-registry.yaml
  tools/content_index/validate_learning_content.py web/index.html web/shared/data-contract.ts
  web/src/main.tsx web/server/index.ts
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

forbidden_pattern='(^|/)(\.env($|\.)|node_modules/|dist/|build/|coverage/|playwright-report/|test-results/|\.venv/|venv/|secrets/)|\.(pem|key|p12|pfx|db|sqlite|sqlite3)$'
tracked_files="$(git -c safe.directory="$repo_root" ls-files)"
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  [[ "$file" == '.env.example' || "$file" == */.env.example ]] && continue
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
npm run check

echo 'Repository, content, application, accessibility, and build checks passed.'
