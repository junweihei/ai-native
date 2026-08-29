# AI Native Learning OS repository instructions

## Project state and approved stack

- V1 uses the approved local-first stack: Node.js 24 LTS, TypeScript, React, Vite, React Router, and a loopback-only Fastify service.
- Do not introduce a database, account system, cloud service, model provider, or production dependency unless a reviewed task explicitly requires it.
- GitHub is the single source of truth. Local, Worktree, and Cloud must operate on commits from this repository.
- The content directory contract is V1.0 and is documented in `content/README.md`.
- Keep authoritative learning Markdown under `content/`; do not recreate `01-map/`, `02-cases/`, `03-practice/`, `04-use/`, `05-evidence/`, or `daily-task/`.
- Treat Markdown as the source of truth, `exports/word/` as generated publication output, and `archive/` as non-active history.
- Website code must consume a generated index through the data-access boundary. Never hard-code content paths or maintain a second learning status.
- Runtime state and L0-L4 capability level are separate concepts and must remain separate in types, UI, fixtures, and tests.
- Update `config/learning-content.json`, template paths, tests, and documentation in the same change whenever the content contract changes.

## Application boundaries

- `web/src/` contains the browser application shell and presentation code.
- `web/server/` contains the loopback-only local service boundary.
- `web/shared/` contains transport-neutral contracts shared by browser and local service.
- `web/tests/fixtures/` may contain replaceable test adapters, but never an alternative authoritative learning dataset.
- Production browser code must not read repository files directly. Production server code must not write learning Markdown until the reviewed safe-write contract is implemented.
- Keep every business page a placeholder until its implementation is separately approved.

## Setup and checks

- Required runtime: Node.js 24 LTS. Python 3 remains required for the existing content tools.
- Windows setup: `powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`
- Windows check: `powershell -ExecutionPolicy Bypass -File .\scripts\check-repo.ps1`
- macOS/Linux/Cloud setup: `bash ./scripts/setup.sh`
- macOS/Linux/Cloud check: `bash ./scripts/check-repo.sh`
- Development: `npm run dev`
- Static and automated verification: `npm run check`
- Production build/start smoke path: `npm run build`, then `npm start`
- When the stack changes, update these commands, setup/check scripts, dependency files, `.env.example`, and development documentation in the same change.

## Change boundaries

- Never commit `.env`, credentials, tokens, private keys, local databases, dependency folders, build output, browser reports, coverage, or editor state.
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
- Flag browser code that reads source Markdown directly, hard-coded content paths, or a second learning status as blocking issues.
- Flag behavioral changes without a corresponding test or an explicit explanation of why testing is not yet possible.
