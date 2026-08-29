#!/usr/bin/env bash
set -euo pipefail

script_dir="${BASH_SOURCE[0]%/*}"
if [[ "$script_dir" == "${BASH_SOURCE[0]}" ]]; then
  script_dir='.'
fi
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

echo "Preparing AI Native Learning OS worktree: $repo_root"

if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js 24 LTS is required.' >&2
  exit 1
fi

node_version="$(node --version)"
node_major="${node_version#v}"
node_major="${node_major%%.*}"
if [[ "$node_major" != '24' ]]; then
  echo "Node.js 24 LTS is required; found $node_version." >&2
  exit 1
fi

if [[ ! -f package-lock.json ]]; then
  echo 'package-lock.json is required for reproducible setup.' >&2
  exit 1
fi

npm ci
if [[ -n "${LEARNING_OS_E2E_CHANNEL:-}" ]]; then
  echo "Using installed Playwright browser channel: $LEARNING_OS_E2E_CHANNEL"
else
  npx playwright install chromium
fi

if command -v python3 >/dev/null 2>&1; then
  python_cmd=(python3)
elif command -v python >/dev/null 2>&1; then
  python_cmd=(python)
else
  echo 'Python 3 is required to build the Learning OS index.' >&2
  exit 1
fi
"${python_cmd[@]}" tools/content_index/build_learning_index.py
echo 'Setup complete. Run npm run dev or the repository check.'
