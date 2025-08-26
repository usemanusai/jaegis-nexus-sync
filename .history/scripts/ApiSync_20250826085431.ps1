param(
  [Parameter(Mandatory=$true)][string]$Token,
  [Parameter(Mandatory=$true)][string]$Owner,
  [Parameter(Mandatory=$true)][string]$Repo,
  [string]$Root = '.',
  [string]$Branch = 'main',
  [switch]$CreateRelease
)
$ErrorActionPreference = 'Stop'
$headers = @{ Authorization = "Bearer $Token"; 'User-Agent' = 'NexusSync-ApiSync'; Accept='application/vnd.github+json' }

function Get-FileList($root){
  Get-ChildItem -Path $root -Recurse -File -Force | Where-Object {
    $_.FullName -notmatch '\\.git(\\|$)' -and $_.FullName -notmatch '\\node_modules(\\|$)' -and $_.FullName -notmatch '\\.next(\\|$)'
  }
}

function Ensure-Branch($owner,$repo,$branch){
  $repoUrl = "https://api.github.com/repos/$owner/$repo"
  $refUrl = "$repoUrl/git/refs/heads/$branch"
  try { Invoke-RestMethod -Method GET -Uri $refUrl -Headers $headers | Out-Null; return }
  catch {
    # Get default branch SHAs
    $default = (Invoke-RestMethod -Method GET -Uri $repoUrl -Headers $headers).default_branch
    try {
      $sha = (Invoke-RestMethod -Method GET -Uri "$repoUrl/git/refs/heads/$default" -Headers $headers).object.sha
    } catch { $sha = (Invoke-RestMethod -Method GET -Uri "$repoUrl/git/refs" -Headers $headers)[0].object.sha }
    $body = @{ ref = "refs/heads/$branch"; sha = $sha } | ConvertTo-Json
    Invoke-RestMethod -Method POST -Uri "$repoUrl/git/refs" -Headers $headers -Body $body -ContentType 'application/json' | Out-Null
  }
}

function Put-Content($owner,$repo,$branch,$full,$root){
  $rel = Resolve-Path $full | ForEach-Object { $_.Path }
  $rootAbs = (Resolve-Path $root).Path
  $rel = $rel.Substring($rootAbs.Length)
  $rel = $rel.TrimStart([char]'\',[char]'/')
  $url = "https://api.github.com/repos/$owner/$repo/contents/$([uri]::EscapeDataString($rel))?ref=$branch"
  $bytes = [System.IO.File]::ReadAllBytes($full)
  $b64 = [Convert]::ToBase64String($bytes)
  $sha = $null
  try { $existing = Invoke-RestMethod -Method GET -Uri $url -Headers $headers; $sha = $existing.sha } catch {}
  $msg = if ($sha) { "chore: update $rel" } else { "chore: add $rel" }
  $body = @{ message = $msg; content = $b64; branch = $branch }
  if ($sha) { $body.sha = $sha }
  $json = $body | ConvertTo-Json -Depth 4
  Invoke-RestMethod -Method PUT -Uri $url -Headers $headers -Body $json -ContentType 'application/json' | Out-Null
}

# Ensure repo exists
try { Invoke-RestMethod -Method GET -Uri "https://api.github.com/repos/$Owner/$Repo" -Headers $headers | Out-Null }
catch { throw "Repo $Owner/$Repo not accessible with given token" }

Ensure-Branch $Owner $Repo $Branch

$rootPath = Resolve-Path $Root | ForEach-Object { $_.Path }
Get-FileList $rootPath | ForEach-Object { Put-Content $Owner $Repo $Branch $_.FullName $rootPath }

if ($CreateRelease) {
  $relBody = @{ tag_name = 'v0.1.0'; name = 'v0.1.0'; body = 'Initial release: installers will be built by CI.' } | ConvertTo-Json
  try { Invoke-RestMethod -Method POST -Uri "https://api.github.com/repos/$Owner/$Repo/releases" -Headers $headers -Body $relBody -ContentType 'application/json' | Out-Null } catch {}
}
Write-Output "ApiSync complete"

