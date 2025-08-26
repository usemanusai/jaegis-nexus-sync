param(
  [string]$Token = $env:GITHUB_TOKEN,
  [string]$RepoOwner = "usemanusai",
  [string]$RepoName = "jaegis-nexus-sync",
  [string]$WorkspacePath = ".",
  [switch]$EnableTLS,
  [string]$Domain = "",
  [string]$Email = ""
)
# Resolve workspace to project root when invoked from anywhere
try {
  $ScriptDir = Split-Path -Parent $PSCommandPath
  if ([string]::IsNullOrWhiteSpace($WorkspacePath) -or $WorkspacePath -eq '.') {
    $candidate = Resolve-Path (Join-Path $ScriptDir '..') -ErrorAction SilentlyContinue
    if ($candidate) {
      $candPath = $candidate.Path
      if (Test-Path (Join-Path $candPath 'docker-compose.yml')) { $WorkspacePath = $candPath }
    }
  }
} catch {}


# =====================
# Helper functions
# =====================
function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERR ] $m" -ForegroundColor Red }

function Ensure-Admin() {
  $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  if (-not $isAdmin) {
    Write-Info "Elevating to Administrator..."
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = (Get-Process -Id $PID).Path
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" $($MyInvocation.UnboundArguments -join ' ')"
    $psi.Verb = "runas"
    try { [Diagnostics.Process]::Start($psi) | Out-Null } catch { Write-Err "Elevation failed: $($_.Exception.Message)"; exit 1 }
    exit 0
  }
}

function Test-Cmd($name){ $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }

function Ensure-Path($p){ if ($env:PATH -notlike "*;$p;*") { $env:PATH = "$env:PATH;$p" } }

function Ensure-Winget(){ if (-not (Test-Cmd 'winget')) { Write-Err "winget not found. Please install 'App Installer' from Microsoft Store, then re-run."; exit 1 } }

function Winget-Install($id, $name){
  Write-Info "Installing $name ($id) via winget..."
  winget install --id $id --silent --accept-source-agreements --accept-package-agreements -e | Out-Null
}

function Ensure-Tooling(){
  Ensure-Winget
  if (-not (Test-Cmd 'node')) { Winget-Install 'OpenJS.NodeJS.LTS' 'Node.js LTS' }
  if (-not (Test-Cmd 'git')) { Winget-Install 'Git.Git' 'Git' }
  if (-not (Test-Cmd 'gh')) { Winget-Install 'GitHub.cli' 'GitHub CLI' }
  # Refresh PATH for current session (common install locations)
  Ensure-Path 'C:\\Program Files\\nodejs'
  Ensure-Path 'C:\\Program Files\\Git\\bin'
  Ensure-Path 'C:\\Program Files\\GitHub CLI'
}

function GH-Login($token){
  if (-not (Test-Cmd 'gh')) { return $false }
  Write-Info "Authenticating gh with provided token"
  try { $token | gh auth login --with-token | Out-Null; gh auth setup-git | Out-Null; return $true } catch { Write-Warn "gh auth failed: $($_.Exception.Message)"; return $false }
}

function Ensure-Repo($owner,$name,$token){
  $exists = $false
  if (Test-Cmd 'gh') { gh repo view "$owner/$name" 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { $exists = $true } }
  if (-not $exists) {
    Write-Info "Creating repo $owner/$name"
    if (Test-Cmd 'gh') {
      gh repo create "$owner/$name" --public -y | Out-Null
    } else {
      $headers = @{ Authorization = "Bearer $token"; 'User-Agent' = 'NexusSync-Bootstrap'; 'Accept'='application/vnd.github+json' }
      $bodyObj = @{ name = $name; private = $false; auto_init = $true }
      $bodyJson = $bodyObj | ConvertTo-Json -Depth 3
      try { Invoke-RestMethod -Method POST -Uri "https://api.github.com/user/repos" -Headers $headers -ContentType 'application/json' -Body $bodyJson | Out-Null } catch { Write-Err "Failed to create repo via API: $($_.Exception.Message)"; exit 1 }
    }
  }
}

function Git-Push-All($workspace,$owner,$name,$token){
  Push-Location $workspace
  try {
    if (-not (Test-Path '.git')) { git init | Out-Null }
    # Set user if empty
    if (-not (git config user.name)) { git config user.name "$owner" | Out-Null }
    if (-not (git config user.email)) { git config user.email "$owner@users.noreply.github.com" | Out-Null }

    $remoteUrl = "https://github.com/$owner/$name.git"
    $hasOrigin = git remote | Select-String -SimpleMatch 'origin'
    if (-not $hasOrigin) { git remote add origin $remoteUrl | Out-Null }

    git add -A
    $needCommit = $true
    try { git diff --cached --quiet 2>$null; if ($LASTEXITCODE -eq 0) { $needCommit = $false } } catch {}
    if ($needCommit) { git commit -m "chore: bootstrap JAEGIS NexusSync with installer, CI, docs" | Out-Null }
    git branch -M main | Out-Null

    if (Test-Cmd 'gh') {
      git push -u origin main
    } else {
      $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
      git -c "http.https://github.com/.extraheader=Authorization: Basic $basic" push -u origin main
    }

    if (-not (git tag --list 'v0.1.0')) { git tag v0.1.0 }
    if (Test-Cmd 'gh') {
      git push --tags
      gh release view v0.1.0 2>$null | Out-Null
      if ($LASTEXITCODE -ne 0) { gh release create v0.1.0 -t 'v0.1.0' -n 'Initial release: installers will be built by CI.' | Out-Null }
    } else {
      $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
      git -c "http.https://github.com/.extraheader=Authorization: Basic $basic" push --tags
      Write-Warn "gh not available: release creation skipped."
    }
  } finally { Pop-Location }
}

function Start-MCP(){
  if (-not (Test-Cmd 'npx')) { Write-Err 'npx not found after install.'; return }
  Write-Info "Starting GitHub MCP server as background job..."
  $script = { $ErrorActionPreference='Stop'; & npx jaegis-github-mcp-server@latest 2>&1 | Tee-Object -FilePath "$env:TEMP\jaegis-github-mcp.log" }
  $job = Start-Job -ScriptBlock $script
  Start-Sleep -Seconds 2
  if ((Get-Job $job.Id).State -eq 'Running') { Write-Info "MCP server Job Id: $($job.Id). Log: $env:TEMP\jaegis-github-mcp.log" } else { Write-Err "MCP server failed to start." }
}

# =====================
# Main
# =====================
if (-not $Token -or $Token.Trim().Length -lt 20) { Write-Err "Valid -Token (PAT) is required"; exit 1 }

Ensure-Admin
Ensure-Tooling

# Sanitize Domain for TLS (strip scheme and trailing slash)
if ($EnableTLS -and $Domain) {
  $Domain = $Domain -replace '^https?://',''
  $Domain = $Domain.TrimEnd('/')
}

# Export tokens into current session and persist for this user
$env:GITHUB_TOKEN = $Token; $env:GH_TOKEN = $Token
[System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', $Token, 'User')
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', $Token, 'User')

# Login and setup git
$ghOK = GH-Login $Token

# Create repo if needed
Ensure-Repo $RepoOwner $RepoName $Token

# If TLS requested, write headless config and invoke installer accordingly
$installer = Join-Path $WorkspacePath 'tools/genesis-installer/genesis-installer.exe'
if (-not (Test-Path $installer)) { $installer = 'genesis-installer' } # if built or in PATH

# Start MCP first so subsequent MCP ops are authenticated
Start-MCP

# Push code (before running installer CI to get workflows)
Git-Push-All $WorkspacePath $RepoOwner $RepoName $Token

# Optional: run installer in headless/interactive based on flags
if ($EnableTLS) {
  $cfgPath = Join-Path $WorkspacePath 'tools/genesis-installer/config.sample.yaml'
  if (Test-Path $cfgPath) {
    # Patch config for TLS (robust regex replacements)
    $y = Get-Content $cfgPath -Raw
    $y = $y -replace 'tls:\s*false','tls: true'
    if ($Domain) {
      $dom = $Domain -replace "'","''"
      $y = [Regex]::Replace($y, '(^\s*domain:\s*)""(\s*$)', { param($m) $m.Groups[1].Value + "'" + $dom + "'" + $m.Groups[2].Value }, 'Multiline')
    }
    if ($Email) {
      $em = $Email -replace "'","''"
      $y = [Regex]::Replace($y, '(^\s*email:\s*)""(\s*$)', { param($m) $m.Groups[1].Value + "'" + $em + "'" + $m.Groups[2].Value }, 'Multiline')
    }
    $customCfg = Join-Path $WorkspacePath 'tools/genesis-installer/config.prod.yaml'
    $y | Set-Content -Path $customCfg -Encoding UTF8
    Write-Info "TLS config written: $customCfg"
    try { & $installer --config $customCfg } catch { Write-Warn "Installer not built or not in PATH; skipping runtime install." }
  }
} else {
  try { & $installer --quick } catch { Write-Warn "Installer not built or not in PATH; skipping runtime install." }
}

Write-Info "Bootstrap completed. CI will build installer binaries on tag v0.1.0."

