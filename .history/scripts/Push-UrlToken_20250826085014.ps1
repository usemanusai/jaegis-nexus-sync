param(
  [Parameter(Mandatory=$true)][string]$Token,
  [Parameter(Mandatory=$true)][string]$Owner,
  [Parameter(Mandatory=$true)][string]$Repo,
  [string]$Branch = 'main'
)
$ErrorActionPreference = 'Stop'

# Build remote URL embedding the token as password (username fixed to x-access-token)
$remote = "https://x-access-token:$Token@github.com/$Owner/$Repo.git"

# Ensure branch name
& git branch -M $Branch | Out-Null

# Push branch and tags
& git push $remote "HEAD:refs/heads/$Branch"
& git push $remote --tags

