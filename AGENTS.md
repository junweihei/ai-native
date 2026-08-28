# AI-native repository instructions

## Project state

- This repository is in its bootstrap phase; the product scope and application stack are not selected yet.
- Do not introduce a framework, runtime, database, model provider, or production dependency unless the task explicitly requires it.
- GitHub is the single source of truth. Local, Worktree, and Cloud must operate on commits from this repository.
- The content directory contract is V1.0 and is documented in `content/README.md`.
- Keep authoritative learning Markdown under `content/`; do not recreate `01-map/`, `02-cases/`, `03-practice/`, `04-use/`, `05-evidence/`, or `daily-task/`.
- Treat Markdown as the source of truth, `exports/word/` as generated publication output, and `archive/` as non-active history.
- Website code must consume the generated index instead of hard-coding content paths or maintaining a second learning status.
- Update `config/learning-content.json`, template paths, tests, and documentation in the same change whenever the content contract changes.


## Setup and checks

- Windows setup: `powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`
- Windows check: `powershell -ExecutionPolicy Bypass -File .\scripts\check-repo.ps1`
- macOS/Linux/Cloud setup: `bash ./scripts/setup.sh`
- macOS/Linux/Cloud check: `bash ./scripts/check-repo.sh`
- When a real application stack is added, update these commands and this file in the same change.

## Change boundaries

- Never commit `.env`, credentials, tokens, private keys, local databases, dependency folders, build output, or editor state.
- Do not modify production data or external services without explicit authorization.
- Keep changes within the requested scope. Do not combine unrelated refactors with feature work.
- Preserve user changes already present in the worktree.
- Add or update tests when behavior changes. If tests do not yet exist, state that clearly in the handoff.

## Parallel work

- Use one task per branch and one branch per Worktree.
- Use branch prefixes: `feature/`, `fix/`, `refactor/`, `test/`, `docs/`, or `cloud/`.
- Avoid concurrent edits to high-conflict files such as dependency lockfiles, central routing files, schemas, and migration sequences.
- Cloud work must start from a pushed branch or commit and should be delivered as a separate branch or pull request.
- Use Handoff when validation requires the Local browser, desktop applications, logged-in state, internal network, local database, or physical devices.

## Completion contract

Before handing work off:

1. Review `git diff` and ensure no secrets or unrelated files are included.
2. Run the repository check and all stack-specific tests available for the changed area.
3. Summarize changed files, checks performed, results, and remaining risks.
4. Do not merge directly into `main`; leave the result reviewable through a pull request.

## Code review rules

- Flag committed secrets, credentials, private keys, local databases, or generated dependency/build directories as blocking issues.
- Flag changes that cannot be reproduced from tracked files in a fresh clone or Worktree.
- Flag behavioral changes without a corresponding test or an explicit explanation of why testing is not yet possible.
