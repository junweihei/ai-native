[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $repoRoot

Write-Host "Preparing AI Native Learning OS worktree: $repoRoot"

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    throw 'Node.js 24 LTS is required.'
}

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

if (-not (Test-Path -LiteralPath 'package-lock.json')) {
    throw 'package-lock.json is required for reproducible setup.'
}

& node $npmCli ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }

if ($env:LEARNING_OS_E2E_CHANNEL) {
    Write-Host "Using installed Playwright browser channel: $env:LEARNING_OS_E2E_CHANNEL"
} else {
    & node 'node_modules\playwright\cli.js' install chromium
    if ($LASTEXITCODE -ne 0) { throw 'Playwright Chromium installation failed.' }
}

Write-Host 'Setup complete. Run npm run dev or the repository check.'
