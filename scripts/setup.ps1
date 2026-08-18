[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $repoRoot

Write-Host "Preparing worktree: $repoRoot"

if (Test-Path -LiteralPath 'pnpm-lock.yaml') {
    pnpm install --frozen-lockfile
} elseif (Test-Path -LiteralPath 'yarn.lock') {
    yarn install --immutable
} elseif (Test-Path -LiteralPath 'package-lock.json') {
    npm ci
} elseif (Test-Path -LiteralPath 'package.json') {
    npm install
}

if (Test-Path -LiteralPath 'pyproject.toml') {
    if (Get-Command poetry -ErrorAction SilentlyContinue) {
        poetry install
    } elseif (Get-Command uv -ErrorAction SilentlyContinue) {
        uv sync
    } else {
        Write-Host 'pyproject.toml detected; configure Poetry/uv or add the exact install command.'
    }
} elseif (Test-Path -LiteralPath 'requirements.txt') {
    python -m pip install -r requirements.txt
}

if (Test-Path -LiteralPath 'gradlew.bat') {
    & .\gradlew.bat dependencies
} elseif (Test-Path -LiteralPath 'pom.xml') {
    mvn dependency:go-offline
}

Write-Host 'Setup complete.'
