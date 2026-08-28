[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $repoRoot

$requiredFiles = @(
    'README.md',
    'AGENTS.md',
    '.gitignore',
    '.codex/README.md',
    'docs/multi-device-workflow.md',
    'config/learning-content.json',
    '00-templates/template-registry.yaml',
    'tools/content_index/validate_learning_content.py'
)

$missing = $requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missing) {
    throw "Missing required files: $($missing -join ', ')"
}

$tracked = @(git -c "safe.directory=$($repoRoot -replace '\\', '/')" ls-files)
$forbidden = $tracked | Where-Object {
    (($_ -match '(^|/)\.env($|\.)') -and ($_ -notmatch '(^|/)\.env\.example$')) -or
    $_ -match '(^|/)(node_modules/|\.venv/|venv/|secrets/)' -or
    $_ -match '\.(pem|key|p12|pfx|db|sqlite|sqlite3)$'
}
if ($forbidden) {
    throw "Forbidden tracked files detected: $($forbidden -join ', ')"
}

$pythonCommand = Get-Command py -ErrorAction SilentlyContinue
$pythonPrefix = @()
if ($pythonCommand) {
    $pythonPrefix = @('-3')
} else {
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
}

if (-not $pythonCommand) {
    throw 'Python 3 is required to validate Learning OS content.'
}

& $pythonCommand.Source @pythonPrefix 'tools/content_index/validate_learning_content.py'
if ($LASTEXITCODE -ne 0) {
    throw 'Learning OS content validation failed.'
}

& $pythonCommand.Source @pythonPrefix '-m' 'unittest' 'discover' '-s' 'tools/content_index/tests' '-v'
if ($LASTEXITCODE -ne 0) {
    throw 'Learning OS content tool tests failed.'
}

Write-Host 'Repository baseline and Learning OS content checks passed.'
