[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $repoRoot

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw 'Node.js 24 LTS is required.' }
$nodeVersion = (& node --version).TrimStart('v')
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -ne 24) {
    throw "Node.js 24 LTS is required; found v$nodeVersion."
}

$npmCommand = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCommand) { throw 'npm is required.' }
$npmCli = Join-Path (Split-Path -Parent $npmCommand.Source) 'node_modules\npm\bin\npm-cli.js'
if (-not (Test-Path -LiteralPath $npmCli)) {
    throw "Unable to locate npm CLI beside $($npmCommand.Source)."
}

$requiredFiles = @(
    'README.md', 'AGENTS.md', '.gitignore', '.env.example', 'package.json', 'package-lock.json',
    'tsconfig.json', 'vite.config.ts', 'playwright.config.ts', '.codex/README.md',
    'docs/operations/multi-device-workflow.md', 'docs/development.md',
    'config/learning-content.json', '00-templates/template-registry.yaml',
    'tools/content_index/validate_learning_content.py', 'web/index.html',
    'web/shared/data-contract.ts', 'web/src/main.tsx', 'web/server/index.ts'
)

$missing = $requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missing) { throw "Missing required files: $($missing -join ', ')" }

$tracked = @(git -c "safe.directory=$($repoRoot -replace '\\', '/')" ls-files)
$forbidden = $tracked | Where-Object {
    (($_ -match '(^|/)\.env($|\.)') -and ($_ -notmatch '(^|/)\.env\.example$')) -or
    $_ -match '(^|/)(node_modules/|dist/|build/|coverage/|playwright-report/|test-results/|\.venv/|venv/|secrets/)' -or
    $_ -match '\.(pem|key|p12|pfx|db|sqlite|sqlite3)$'
}
if ($forbidden) { throw "Forbidden tracked files detected: $($forbidden -join ', ')" }

$pythonCommand = Get-Command py -ErrorAction SilentlyContinue
$pythonPrefix = @()
if ($pythonCommand) { $pythonPrefix = @('-3') } else { $pythonCommand = Get-Command python -ErrorAction SilentlyContinue }
if (-not $pythonCommand) { throw 'Python 3 is required to validate Learning OS content.' }

& $pythonCommand.Source @pythonPrefix 'tools/content_index/validate_learning_content.py'
if ($LASTEXITCODE -ne 0) { throw 'Learning OS content validation failed.' }
& $pythonCommand.Source @pythonPrefix '-m' 'unittest' 'discover' '-s' 'tools/content_index/tests' '-v'
if ($LASTEXITCODE -ne 0) { throw 'Learning OS content tool tests failed.' }
& $pythonCommand.Source @pythonPrefix 'tools/content_index/build_learning_index.py'
if ($LASTEXITCODE -ne 0) { throw 'Learning OS index generation failed.' }

& node $npmCli run check
if ($LASTEXITCODE -ne 0) { throw 'Application checks failed.' }

Write-Host 'Repository, content, application, accessibility, and build checks passed.'
