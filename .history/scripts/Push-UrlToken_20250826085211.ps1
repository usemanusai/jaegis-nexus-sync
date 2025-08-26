param(
  [Parameter(Mandatory=$true)][string]$Token,
  [Parameter(Mandatory=$true)][string]$Owner,
  [Parameter(Mandatory=$true)][string]$Repo,
  [Parameter(Mandatory=$false)][string]$Username,
  [string]$Branch = 'main'
)
$ErrorActionPreference = 'Stop'

# Determine username: if not provided, use Owner as default
if (-not $Username -or [string]::IsNullOrWhiteSpace($Username)) { $Username = $Owner }

# Build remote URL embedding the token as password (PAT expects username = account login)
$remote = "https://$Username:`$Token@github.com/$Owner/$Repo.git"

# Ensure branch name
& git branch -M $Branch | Out-Null

# Push branch and tags
& git push $remote "HEAD:refs/heads/$Branch"
& git push $remote --tags

