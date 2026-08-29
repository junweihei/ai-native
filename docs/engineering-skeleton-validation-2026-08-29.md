# AI Native Learning OS V1 minimal skeleton validation record

Date: 2026-08-29  
Scope: application shell, placeholder routes, design-token entry, data-access boundary, error boundaries, test foundation, setup/check reproducibility  
Result: **Passed with one non-blocking browser-download caveat**

## 1. Environment

| Item | Value |
| --- | --- |
| OS | Windows, PowerShell |
| Required application runtime used | Node.js v24.19.0 |
| npm CLI | 11.7.0, explicitly executed by Node 24 |
| Existing content-tool runtime | Python 3.12.6 |
| E2E browser used locally | Installed Microsoft Edge via `LEARNING_OS_E2E_CHANNEL=msedge` |
| Temporary validation commit | `d34ffb3` in an ignored, disposable validation repository only |

The host also has Node 22.11.0 installed globally. The Windows setup/check scripts locate npm's JavaScript CLI and execute it with the already-validated Node 24 binary, preventing the global npm launcher from silently selecting Node 22.

## 2. Exact commands exercised

For this host, the bundled Node 24 directory was prepended to `PATH` and the installed Edge channel was selected because the Playwright Chromium CDN download stalled. With a standard Node 24 installation and normal network access, the documented commands need no wrapper or browser override.

```powershell
$env:Path = '<Node-24-directory>;' + $env:Path
$env:LEARNING_OS_E2E_CHANNEL = 'msedge'
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-repo.ps1
```

The following lifecycle commands were also exercised through npm's CLI under Node 24:

```text
npm run dev
npm run build
npm start
```

The macOS/Linux scripts were syntax- and parity-reviewed against the Windows scripts. They were not executed on this Windows host.

## 3. Current-workspace results

| Check | Result |
| --- | --- |
| Content contract validator | Passed: 0 errors, 24 pre-existing legacy-frontmatter warnings |
| Existing Python tool tests | Passed: 9/9 |
| TypeScript typecheck | Passed |
| ESLint | Passed, zero warnings allowed |
| Prettier scope | Passed |
| Unit sample | Passed: 1/1 |
| Component sample | Passed: 1/1 |
| Local-service sample | Passed: 2/2 |
| Production build | Passed: client and server outputs generated under ignored `dist/` |
| E2E and accessibility | Passed: 3/3, including routing, 320 px navigation, and axe WCAG A/AA scan |
| Repository forbidden-file check | Passed |

Development smoke returned HTTP 200 for `/today` and `{ "ok": true }` for `/api/v1/health`. Production-start smoke returned HTTP 200 for `/review`; `/api/v1/data-source` returned the expected boundary state `unavailable/not-configured` and no learning content.

## 4. Fresh clone and Worktree reproduction

Because the proposed scaffold was uncommitted in the real repository, validation used a disposable repository under ignored `.codex-work/`. It contained only `git ls-files --cached --others --exclude-standard` results, was committed, then used to create a literal `git clone` and an independent `git worktree`. The real repository index, branch, and history were not changed.

| Environment | Setup | Development/start | Full repository check |
| --- | --- | --- | --- |
| Literal fresh clone at temporary commit `d34ffb3` | Passed; `npm ci` installed 355 packages from `package-lock.json` | E2E started both development services; `npm start` served `/review` and both API probes successfully | Passed, including build and 3/3 E2E/AX |
| Independent Worktree at temporary commit `d34ffb3` | Passed from the same lock file | E2E started both development services | Passed, including build and 3/3 E2E/AX |

The reproduction initially exposed and then verified fixes for two Windows-only issues: Git checkout line-ending normalization and graceful child-process shutdown on Ctrl+C.

## 5. Artifact and secret review

- `node_modules/`, `dist/`, coverage, Playwright reports/results, local databases, logs, `.env`, and scratch validation directories are ignored.
- The repository check rejects those categories if tracked.
- `.env.example` contains placeholders and local defaults only; no secret, credential, token, or private key was added.
- Application and test code contain no hard-coded authoritative content path, learning runtime status, or L0-L4 value.
- The test adapter carries only deterministic index-source metadata and no learning object or alternative authority.

## 6. Caveats and follow-up

1. The default setup path installs Playwright Chromium. Its CDN download reached 30% and then stopped progressing on this network, so local browser validation used the documented installed-browser fallback. CI/release acceptance should leave `LEARNING_OS_E2E_CHANNEL` blank and verify the pinned Playwright Chromium download.
2. npm emitted a host-global `disturl` deprecation warning. No repository npm configuration introduces that setting.
3. The 24 legacy-frontmatter warnings pre-date this scaffold and remain non-blocking; no learning Markdown was changed.
4. Automated axe checks are smoke coverage, not a substitute for manual keyboard, zoom, screen-reader, contrast, and full support-matrix acceptance.
