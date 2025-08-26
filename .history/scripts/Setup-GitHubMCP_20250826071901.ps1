param(
  [Parameter(Mandatory=$true)][string]$Token,
  [string]$RepoOwner="usemanusai",
  [string]$RepoName="jaegis-nexus-sync",
  [string]$Path=".",
  [switch]$Persist,
  [switch]$StartMCP,
  [switch]$Publish
)

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERR ] $m" -ForegroundColor Red }

# 1) Set environment variables for this session (and optionally persist)
$env:GITHUB_TOKEN = $Token
$env:GH_TOKEN = $Token
if ($Persist) {
  [System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', $Token, 'User')
  [System.Environment]::SetEnvironmentVariable('GH_TOKEN', $Token, 'User')
  Write-Info "Persisted GITHUB_TOKEN and GH_TOKEN to User environment"
}
Write-Info "Session env set for GITHUB_TOKEN and GH_TOKEN"

# 2) Verify token scopes and identity
try {
  $headers = @{ Authorization = "token $Token"; 'User-Agent' = 'NexusSync-Setup' }
  $resp = Invoke-WebRequest -UseBasicParsing -Uri 'https://api.github.com/user' -Headers $headers -Method GET -TimeoutSec 20
  $user = ($resp.Content | ConvertFrom-Json)
  $scopes = $resp.Headers['X-OAuth-Scopes']
  Write-Info "Authenticated as: $($user.login) ($($user.html_url))"
  Write-Info "Token scopes: $scopes"
} catch {
  Write-Err "Failed to validate token: $($_.Exception.Message)"; exit 1
}

# 3) Ensure required tools
function Test-Cmd($name){ $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }
if (-not (Test-Cmd 'npx')) { Write-Warn 'npx not found. Please install Node.js (LTS). Winget: winget install OpenJS.NodeJS.LTS'; }
if (-not (Test-Cmd 'git')) { Write-Warn 'git not found. Install Git: winget install Git.Git' }
if ($Publish -and -not (Test-Cmd 'gh')) { Write-Warn 'gh CLI not found. Install: winget install GitHub.cli' }

# 4) Optionally start MCP server as background job
$job = $null
if ($StartMCP) {
  if (-not (Test-Cmd 'npx')) { Write-Err 'npx is required to start MCP server'; exit 1 }
  Write-Info "Starting GitHub MCP server via npx..."
  $script = {
    $ErrorActionPreference='Stop'
    & npx jaegis-github-mcp-server@latest 2>&1 | Tee-Object -FilePath "$env:TEMP\\jaegis-github-mcp.log"
  }
  $job = Start-Job -ScriptBlock $script
  Start-Sleep -Seconds 2
  if ((Get-Job $job.Id).State -eq 'Running') { Write-Info "MCP server running as Job Id $($job.Id). Log: $env:TEMP\jaegis-github-mcp.log" } else { Write-Err "MCP server failed to start." }
}

# 5) Optionally publish the repo (git + gh). Creates repo if missing, uses token-based auth (no passwords).
if ($Publish) {
  Push-Location $Path
  try {
    if (-not (Test-Path '.git')) { git init | Out-Null }

    $remoteUrl = "https://github.com/$RepoOwner/$RepoName.git"

    # If gh is available, log in with token and ensure repo exists
    if (Test-Cmd 'gh') {
      Write-Info "Authenticating gh with provided token (no password prompts)"
      $Token | gh auth login --with-token | Out-Null
      gh auth setup-git | Out-Null
      gh repo view "$RepoOwner/$RepoName" 2>$null | Out-Null
      if ($LASTEXITCODE -ne 0) {
        Write-Info "Repository not found; creating $RepoOwner/$RepoName"
        gh repo create "$RepoOwner/$RepoName" --public -y | Out-Null
      }
    } else {
      Write-Warn "gh CLI not found. Skipping repo create. Ensure $RepoOwner/$RepoName exists."
    }

    $hasOrigin = git remote | Select-String -SimpleMatch 'origin'
    if (-not $hasOrigin) {
      git remote add origin $remoteUrl
      Write-Info "Added remote origin: $remoteUrl"
    }

    git add -A
    if (-not (git diff --cached --quiet 2>$null)) {
      git commit -m "chore: bootstrap JAEGIS NexusSync with installer, CI, docs" | Out-Null
    } else { Write-Info "No changes to commit" }
    git branch -M main

    if (Test-Cmd 'gh') {
      # Push using gh-configured git credential helper (uses token under the hood)
      git push -u origin main
      Write-Info "Pushed to main via gh auth"
    } else {
      # Fallback: use per-command HTTP Authorization header (Basic x-access-token:TOKEN)
      $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$Token"))
      git -c "http.https://github.com/.extraheader=Authorization: Basic $basic" push -u origin main
      Write-Info "Pushed to main using HTTP extraheader (token)"
    }

    # Tag and release
    if (-not (git tag --list 'v0.1.0')) { git tag v0.1.0 }
    if (Test-Cmd 'gh') {
      git push --tags
      gh release view v0.1.0 2>$null | Out-Null
      if ($LASTEXITCODE -ne 0) {
        gh release create v0.1.0 -t 'v0.1.0' -n 'Initial release: installers will be built by CI.'
        Write-Info "Release v0.1.0 created"
      } else { Write-Info "Release v0.1.0 already exists" }
    } else {
      # Fallback: push tags via extraheader; release creation skipped
      $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$Token"))
      git -c "http.https://github.com/.extraheader=Authorization: Basic $basic" push --tags
      Write-Warn "gh not available: release creation skipped. Tags pushed; CI will still run."
    }
  } catch {
    Write-Err "Publish failed: $($_.Exception.Message)"; exit 1
  } finally { Pop-Location }
}

Write-Info "Done."
if ($job) { Write-Info "To stop MCP server: Stop-Job $($job.Id); Receive-Job $($job.Id) | Out-Null; Remove-Job $($job.Id)" }

