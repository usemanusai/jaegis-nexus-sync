param(
  [Parameter(Mandatory=$true)][string]$Token,
  [Parameter(Mandatory=$true)][string]$Owner,
  [Parameter(Mandatory=$true)][string]$Repo,
  [string]$Branch = 'main',
  [string]$Path = '.'
)
$ErrorActionPreference = 'Stop'

Push-Location $Path
try {
  # Ensure remote uses token (username can be your login)
  $remoteUrl = "https://$Owner:$Token@github.com/$Owner/$Repo.git"
  git remote set-url origin $remoteUrl 2>$null

  git fetch origin
  try {
    git pull --no-rebase --allow-unrelated-histories origin $Branch
  } catch {
    Write-Host "Pull failed (continuing to resolve conflicts)"
  }

  # Resolve all conflicts preferring ours
  $conflicted = git diff --name-only --diff-filter=U
  if ($conflicted) {
    $files = $conflicted -split "`n" | Where-Object { $_ -and $_.Trim().Length -gt 0 }
    foreach ($f in $files) {
      git checkout --ours -- "$f"
      git add -- "$f"
    }
    git add -A
    try { git commit -m "chore: merge origin/$Branch preferring ours" } catch { }
  }

  # Push branch
  git push -u origin $Branch

  # Ensure v0.1.0 release exists
  $headers = @{ Authorization = ("token " + $Token); 'User-Agent'='NexusSync-Release'; Accept='application/vnd.github+json' }
  try {
    Invoke-RestMethod -Method GET -Uri "https://api.github.com/repos/$Owner/$Repo/releases/tags/v0.1.0" -Headers $headers | Out-Null
  } catch {
    $body = @{ tag_name='v0.1.0'; name='v0.1.0'; body='Initial release: installers will be built by CI.' } | ConvertTo-Json
    Invoke-RestMethod -Method POST -Uri "https://api.github.com/repos/$Owner/$Repo/releases" -Headers $headers -Body $body -ContentType 'application/json' | Out-Null
  }

  Write-Host "Done: merged (ours), pushed, ensured release v0.1.0"
} finally {
  Pop-Location
}

