param(
  [ValidateSet("status", "lock", "unlock")]
  [string]$Action = "status",

  [string]$BackendBase = "https://raftop-cpap-backend.onrender.com",

  [string]$Reason = "",

  [string]$Actor = "platform_super_user",

  [string]$CredentialFile = "C:\Users\Administrator\Desktop\RAFTOP_PILOT20_CREDENTIALS_DO_NOT_COMMIT\RAFTOP_PILOT20_USERS_CREDENTIALS_DO_NOT_COMMIT.txt"
)

$ErrorActionPreference = "Stop"

function Read-FileSafe {
  param([string]$Path)

  if (Test-Path $Path) {
    return Get-Content -Path $Path -Raw -Encoding UTF8
  }

  return ""
}

function Parse-Credentials {
  param([string]$Content)

  $Users = @()
  $Blocks = $Content -split "----------------------------------------"

  foreach ($Block in $Blocks) {
    if ($Block -notmatch "Email:" -or $Block -notmatch "Temporary password:") {
      continue
    }

    $Role = ""
    $Email = ""
    $Password = ""

    foreach ($Line in ($Block -split "`r?`n")) {
      $Trimmed = $Line.Trim()

      if ($Trimmed.StartsWith("Role:")) {
        $Role = $Trimmed.Substring(5).Trim()
      } elseif ($Trimmed.StartsWith("Email:")) {
        $Email = $Trimmed.Substring(6).Trim()
      } elseif ($Trimmed.StartsWith("Temporary password:")) {
        $Password = $Trimmed.Substring("Temporary password:".Length).Trim()
      }
    }

    if (![string]::IsNullOrWhiteSpace($Email) -and ![string]::IsNullOrWhiteSpace($Password)) {
      $Users += [PSCustomObject]@{
        role = $Role
        email = $Email
        password = $Password
      }
    }
  }

  return $Users
}

function Extract-Token {
  param($Json)

  foreach ($Key in @("token", "accessToken", "access_token", "jwt")) {
    if ($Json.PSObject.Properties.Name -contains $Key) {
      $Value = [string]$Json.$Key
      if (![string]::IsNullOrWhiteSpace($Value)) { return $Value }
    }
  }

  if ($Json.user) {
    foreach ($Key in @("token", "accessToken", "access_token", "jwt")) {
      if ($Json.user.PSObject.Properties.Name -contains $Key) {
        $Value = [string]$Json.user.$Key
        if (![string]::IsNullOrWhiteSpace($Value)) { return $Value }
      }
    }
  }

  if ($Json.data) {
    foreach ($Key in @("token", "accessToken", "access_token", "jwt")) {
      if ($Json.data.PSObject.Properties.Name -contains $Key) {
        $Value = [string]$Json.data.$Key
        if (![string]::IsNullOrWhiteSpace($Value)) { return $Value }
      }
    }
  }

  return ""
}

function Try-Login {
  param(
    [string]$Email,
    [string]$Password,
    [string]$BackendBase
  )

  $Endpoints = @(
    "/api/auth/login",
    "/api/login",
    "/auth/login",
    "/login"
  )

  foreach ($Endpoint in $Endpoints) {
    $Url = $BackendBase.TrimEnd("/") + $Endpoint

    try {
      $Response = Invoke-WebRequest `
        -Uri $Url `
        -Method POST `
        -Body (@{ email = $Email; password = $Password } | ConvertTo-Json -Compress) `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 90

      $Json = $Response.Content | ConvertFrom-Json
      $Token = Extract-Token $Json

      if (![string]::IsNullOrWhiteSpace($Token)) {
        return [PSCustomObject]@{
          ok = $true
          endpoint = $Endpoint
          token = $Token
        }
      }
    } catch {
      # Try next endpoint.
    }
  }

  return [PSCustomObject]@{
    ok = $false
    endpoint = ""
    token = ""
  }
}

$ControlKey = $env:RAFTOP_CONTROL_KEY

if ([string]::IsNullOrWhiteSpace($ControlKey)) {
  Write-Host ""
  Write-Host "Missing RAFTOP_CONTROL_KEY environment variable."
  Write-Host "Set it only in this PowerShell session before running this script."
  Write-Host ""
  exit 1
}

if (!(Test-Path $CredentialFile)) {
  Write-Host ""
  Write-Host "Pilot20 credential file not found:"
  Write-Host $CredentialFile
  Write-Host ""
  exit 1
}

$CredentialContent = Read-FileSafe $CredentialFile
$Users = @(Parse-Credentials $CredentialContent)

$PilotAdmin = $Users | Where-Object { $_.role -eq "tenant_admin" } | Select-Object -First 1

if ($null -eq $PilotAdmin) {
  $PilotAdmin = $Users | Select-Object -First 1
}

if ($null -eq $PilotAdmin) {
  Write-Host ""
  Write-Host "No usable Pilot20 credentials found."
  Write-Host ""
  exit 1
}

$Login = Try-Login -Email $PilotAdmin.email -Password $PilotAdmin.password -BackendBase $BackendBase

if (-not $Login.ok) {
  Write-Host ""
  Write-Host "Could not login to get Pilot20 bearer token."
  Write-Host "Control key exists, but backend also requires Authorization bearer token."
  Write-Host ""
  exit 1
}

$Headers = @{
  "x-raftop-control-key" = $ControlKey
  "Authorization" = "Bearer $($Login.token)"
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