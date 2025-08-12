param(
  [string]$ProjectDir = "$PSScriptRoot\discord-dungeon-game",
  [int]$Port = 3000
)

Write-Host "=== Discord Dungeon Game - Windows Setup ==="

# 1) Ensure PowerShell can run npm scripts
try {
  $current = Get-ExecutionPolicy -Scope CurrentUser -ErrorAction Stop
} catch {
  $current = "Undefined"
}
if ($current -in @("Undefined","Restricted","AllSigned")) {
  Write-Host "Setting execution policy for CurrentUser to RemoteSigned (required for npm.ps1)"
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
}

# 2) Install Node.js LTS via winget if node is missing
$node = (Get-Command node -ErrorAction SilentlyContinue)
if (-not $node) {
  Write-Host "Installing Node.js LTS via winget..."
  winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
  $env:PATH = "$env:ProgramFiles\nodejs;$env:PATH"
} else {
  Write-Host "Node found at $($node.Source)"
}

# 3) Enable Corepack and activate pnpm@9
Write-Host "Enabling Corepack and activating pnpm@9..."
corepack enable
corepack prepare pnpm@9 --activate

# 4) Create project directory if needed and copy sources next to this script
if (-not (Test-Path $ProjectDir)) {
  Write-Host "Creating project directory: $ProjectDir"
  New-Item -ItemType Directory -Force -Path $ProjectDir | Out-Null
}

# If this script lives next to the extracted folder, we just ensure $ProjectDir exists.
Set-Location $ProjectDir

# 5) Install dependencies
Write-Host "Installing dependencies with pnpm..."
pnpm install

# 6) Start the dev server
Write-Host "Starting dev server on http://localhost:$Port ..."
$env:NODE_OPTIONS="--max-old-space-size=4096"
$env:PORT="$Port"
pnpm run dev