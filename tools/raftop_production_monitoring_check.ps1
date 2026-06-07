param(
  [string]$BackendBase = "https://raftop-cpap-backend.onrender.com",
  [string]$FrontendBase = "https://raftop-cpap-frontend.onrender.com",
  [string]$CredentialFile = "C:\Users\Administrator\Desktop\RAFTOP_PILOT20_CREDENTIALS_DO_NOT_COMMIT\RAFTOP_PILOT20_USERS_CREDENTIALS_DO_NOT_COMMIT.txt"
)

$ErrorActionPreference = "Continue"

$Pass = 0
$Warn = 0
$Fail = 0

function Result {
  param([string]$Name, [string]$Status, [string]$Details)

  if ($Status -eq "PASS") { $script:Pass++ }
  elseif ($Status -eq "WARN") { $script:Warn++ }
  else { $script:Fail++ }

  Write-Host ($Status + " - " + $Name + " - " + $Details)
}

function Read-FileSafe {
  param([string]$Path)

  if (Test-Path $Path) {
    try { return Get-Content -Path $Path -Raw -Encoding UTF8 } catch { return "" }
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
  param([string]$Email, [string]$Password)

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
      # Try next.
    }
  }

  return [PSCustomObject]@{
    ok = $false
    endpoint = ""
    token = ""
  }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Monitoring Check"
Write-Host ""

# Public backend/frontend checks.
foreach ($Url in @(
  $BackendBase.TrimEnd("/") + "/api/health",
  $FrontendBase.TrimEnd("/") + "/login",
  $FrontendBase.TrimEnd("/") + "/pilot20/manual-entry",
  $FrontendBase.TrimEnd("/") + "/pilot20/usage-upload",
  $FrontendBase.TrimEnd("/") + "/pilot20/rescue-monitor",
  $FrontendBase.TrimEnd("/") + "/pilot20/import-history",
  $FrontendBase.TrimEnd("/") + "/pilot20/unmatched-devices",
  $FrontendBase.TrimEnd("/") + "/pilot20/rolling-80h-report",
  $FrontendBase.TrimEnd("/") + "/pilot20/production-rollout-import"
)) {
  try {
    $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 90

    if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 300) {
      Result $Url "PASS" ("HTTP " + $Response.StatusCode)
    } else {
      Result $Url "FAIL" ("HTTP " + $Response.StatusCode)
    }
  } catch {
    Result $Url "FAIL" $_.Exception.Message
  }
}

# Authenticated Pilot20 endpoint checks.
if (!(Test-Path $CredentialFile)) {
  Result "Pilot20 credentials file" "WARN" "Not found; skipping authenticated checks."
} else {
  $CredContent = Read-FileSafe $CredentialFile
  $Users = @(Parse-Credentials $CredContent)
  $PilotAdmin = $Users | Where-Object { $_.role -eq "tenant_admin" } | Select-Object -First 1

  if ($null -eq $PilotAdmin) {
    $PilotAdmin = $Users | Select-Object -First 1
  }

  if ($null -eq $PilotAdmin) {
    Result "Pilot admin credentials parsed" "WARN" "No usable credential found."
  } else {
    $Login = Try-Login -Email $PilotAdmin.email -Password $PilotAdmin.password

    if (-not $Login.ok) {
      Result "Pilot admin login" "FAIL" "Could not obtain token."
    } else {
      Result "Pilot admin login" "PASS" ("Endpoint " + $Login.endpoint)

      $Headers = @{
        Authorization = "Bearer $($Login.token)"
      }

      foreach ($Endpoint in @(
        "/api/pilot20/health",
        "/api/pilot20/patients",
        "/api/pilot20/rescue-monitor",
        "/api/pilot20/import-history",
        "/api/pilot20/unmatched-devices",
        "/api/pilot20/rolling-80h-early-warning"
      )) {
        $Url = $BackendBase.TrimEnd("/") + $Endpoint

        try {
          $Response = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 90

          if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 300) {
            Result $Endpoint "PASS" ("HTTP " + $Response.StatusCode)
          } else {
            Result $Endpoint "FAIL" ("HTTP " + $Response.StatusCode)
          }
        } catch {
          Result $Endpoint "FAIL" $_.Exception.Message
        }
      }
    }
  }
}

Write-Host ""
Write-Host "PASS_COUNT: $Pass"
Write-Host "WARN_COUNT: $Warn"
Write-Host "FAIL_COUNT: $Fail"
Write-Host ""

if ($Fail -gt 0) {
  Write-Host "FINAL STATUS: MONITORING_CHECK_FAILED"
  exit 1
}

if ($Warn -gt 0) {
  Write-Host "FINAL STATUS: MONITORING_CHECK_READY_WITH_WARNINGS"
  exit 0
}

Write-Host "FINAL STATUS: MONITORING_CHECK_READY"
exit 0
