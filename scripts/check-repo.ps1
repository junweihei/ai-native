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
    'docs/multi-device-workflow.md'
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

Write-Host 'Repository baseline check passed.'
