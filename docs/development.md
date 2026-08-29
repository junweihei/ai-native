# AI Native Learning OS V1 development guide

Status: V1.0 engineering-skeleton baseline  
Scope: application infrastructure only; no business-page implementation and no safe-write implementation

## Prerequisites

- Node.js 24 LTS and npm supplied with it.
- Python 3 for the repository's existing learning-content validation and index tests.
- Git for reproducibility and tracked-file checks.

Copy `.env.example` to `.env` only when local overrides are needed. `.env` is ignored and must never be committed. The service rejects non-loopback hosts in V1.

## Exact commands

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
npm run dev
powershell -ExecutionPolicy Bypass -File .\scripts\check-repo.ps1
```

macOS, Linux, or Cloud:

```bash
bash ./scripts/setup.sh
npm run dev
bash ./scripts/check-repo.sh
```

Focused commands:

```text
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
npm run test:component
npm run test:server
npm run test:e2e
npm run build
npm start
```

`npm run dev` starts the browser shell on `127.0.0.1:5173` and the local service boundary on `127.0.0.1:4173`. `npm start` serves a completed build. Neither command reads or writes learning Markdown in this skeleton.

## Engineering boundary

The browser depends on `LearningIndexAdapter`, not on repository paths. The default adapter returns `not-configured`; a future reviewed change may replace it with the generated-index reader defined by the data contract. The test adapter under `web/tests/fixtures/` contains only deterministic source metadata and proves replaceability without mirroring learning content.

The current API surface is deliberately small:

- `GET /api/v1/health`: process readiness only.
- `GET /api/v1/data-source`: contract version and index availability only.

There are no mutation endpoints. Draft recovery, diff preview, confirmation, conflict detection, atomic write-back, and failure recovery remain outside this skeleton.

## Test layers

- Unit: contract and replaceable adapter behavior.
- Component: accessible rendering and the single disabled placeholder action.
- Local service: health and adapter injection using Fastify request injection.
- End to end: primary routing and the 320 px navigation baseline in Chromium.
- Accessibility: automated axe WCAG A/AA smoke scan in the end-to-end suite.
- Static: TypeScript, ESLint, Prettier, tracked-secret/build-output checks, and existing Python content checks.

Automated accessibility checks do not replace keyboard, zoom, screen-reader, contrast, or content-design review. The full browser and assistive-technology matrix remains a later acceptance activity.

## Reproducibility rule

Setup uses `npm ci`, so `package-lock.json` is mandatory. A clean clone or Worktree must run setup before checks. Browser binaries live in Playwright's user cache and are not repository artifacts.

By default setup installs Playwright Chromium. If that download is unavailable and a supported local browser is already installed, set `LEARNING_OS_E2E_CHANNEL` explicitly (for example `msedge` or `chrome`); the same tests then run against that channel. CI and release acceptance should leave it blank to use the pinned Playwright browser.

Before handoff, record runtime versions and exact results for setup, development smoke, tests, build, production-start smoke, repository check, and a clean-snapshot reproduction. A literal fresh clone cannot contain uncommitted work; before a commit exists, use a temporary clean snapshot containing only proposed tracked files and state that limitation explicitly.
