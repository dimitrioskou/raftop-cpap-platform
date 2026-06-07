param(
  [ValidateSet("status", "lock", "unlock")]
  [string]$Action = "status",

  [string]$BackendBase = "https://raftop-cpap-backend.onrender.com",

  [string]$Reason = "",

  [string]$Actor = "platform_super_user"
)

$ErrorActionPreference = "Stop"

$Key = $env:RAFTOP_CONTROL_KEY

if ([string]::IsNullOrWhiteSpace($Key)) {
  Write-Host ""
  Write-Host "Missing RAFTOP_CONTROL_KEY environment variable."
  Write-Host "Set it only in this PowerShell session before running this script."
  Write-Host ""
  exit 1
}

$Headers = @{
  "x-raftop-control-key" = $Key
}

if ($Action -eq "status") {
  $Url = $BackendBase.TrimEnd("/") + "/api/pilot20/internal/tenant-control/status"

  $Response = Invoke-WebRequest `
    -Uri $Url `
    -Headers $Headers `
    -UseBasicParsing `
    -TimeoutSec 90

  Write-Host ""
  Write-Host $Response.Content
  Write-Host ""
  exit 0
}

$Locked = $false
if ($Action -eq "lock") { $Locked = $true }

if ([string]::IsNullOrWhiteSpace($Reason)) {
  if ($Locked) {
    $Reason = "pilot_locked_by_platform_super_user"
  } else {
    $Reason = "pilot_unlocked_by_platform_super_user"
  }
}

$Url = $BackendBase.TrimEnd("/") + "/api/pilot20/internal/tenant-control/set"

$Body = @{
  is_locked = $Locked
  reason = $Reason
  actor = $Actor
} | ConvertTo-Json -Compress

$Response = Invoke-WebRequest `
  -Uri $Url `
  -Method POST `
  -Headers $Headers `
  -Body $Body `
  -ContentType "application/json" `
  -UseBasicParsing `
  -TimeoutSec 90

Write-Host ""
Write-Host $Response.Content
Write-Host ""
