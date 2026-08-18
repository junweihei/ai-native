#!/usr/bin/env bash
set -euo pipefail

script_dir="${BASH_SOURCE[0]%/*}"
if [[ "$script_dir" == "${BASH_SOURCE[0]}" ]]; then
  script_dir='.'
fi
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

echo "Preparing worktree: $repo_root"

if [[ -f pnpm-lock.yaml ]]; then
  pnpm install --frozen-lockfile
elif [[ -f yarn.lock ]]; then
  yarn install --immutable
elif [[ -f package-lock.json ]]; then
  npm ci
elif [[ -f package.json ]]; then
  npm install
fi

if [[ -f pyproject.toml ]]; then
  if command -v poetry >/dev/null 2>&1; then
    poetry install
  elif command -v uv >/dev/null 2>&1; then
    uv sync
  else
    echo 'pyproject.toml detected; configure Poetry/uv or add the exact install command.'
  fi
elif [[ -f requirements.txt ]]; then
  python -m pip install -r requirements.txt
fi

if [[ -x ./gradlew ]]; then
  ./gradlew dependencies
elif [[ -f pom.xml ]]; then
  mvn dependency:go-offline
fi

echo 'Setup complete.'
