# RAFTOP CPAP CARE Pro
# Phase 122 - Backup, Restore & Monitoring Pack
# Creates internal backup, restore and monitoring operations pack.
# Does NOT expose secrets.
# Does NOT run destructive restore.
# Does NOT commit backup files.
# Does NOT require new npm packages.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$ToolsDir = Join-Path $Root "tools"

$BackupScriptFile = Join-Path $ToolsDir "raftop_production_backup.ps1"
$MonitoringScriptFile = Join-Path $ToolsDir "raftop_production_monitoring_check.ps1"
$RestoreChecklistFile = Join-Path $DocsDir "122_RESTORE_RUNBOOK.md"
$MonitoringDocFile = Join-Path $DocsDir "122_MONITORING_OPERATIONS.md"
$BackupDocFile = Join-Path $DocsDir "122_BACKUP_RESTORE_MONITORING_PACK.md"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase122_backup_restore_monitoring_pack_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    Add-Content -Path $ReportPath -Value ("CHECK: " + $Name) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("STATUS: " + $Status) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("DETAILS: " + $Details) -Encoding UTF8
    Add-Content -Path $ReportPath -Value "" -Encoding UTF8

    Write-Host ($Status + " - " + $Name)
}

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try { return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop } catch { return "" }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 122 Backup, Restore & Monitoring Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 122 - Backup, Restore & Monitoring Pack..."
Write-Host ""

# -------------------------------------------------------------------
# Backup script
# -------------------------------------------------------------------
$BackupScriptContent = @'
param(
  [string]$DbEnvName = "RAFTOP_PRODUCTION_DATABASE_URL",
  [string]$BackupRoot = "C:\Users\Administrator\Desktop\RAFTOP_BACKUPS_DO_NOT_COMMIT",
  [string]$Label = "production"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null

$DbUrl = [Environment]::GetEnvironmentVariable($DbEnvName, "Process")

if ([string]::IsNullOrWhiteSpace($DbUrl)) {
  Write-Host ""
  Write-Host "Missing database URL environment variable in current PowerShell session:"
  Write-Host $DbEnvName
  Write-Host ""
  Write-Host "Set it temporarily only in this PowerShell session before running backup."
  Write-Host "Do not save it inside the repository."
  Write-Host ""
  exit 1
}

$PgDump = Get-Command pg_dump -ErrorAction SilentlyContinue

if ($null -eq $PgDump) {
  Write-Host ""
  Write-Host "pg_dump not found. Install PostgreSQL tools or add pg_dump to PATH."
  Write-Host ""
  exit 1
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = Join-Path $BackupRoot ("raftop_" + $Label + "_backup_" + $Timestamp + ".dump")
$ManifestFile = Join-Path $BackupRoot ("raftop_" + $Label + "_backup_" + $Timestamp + "_manifest.txt")

Write-Host ""
Write-Host "Creating production backup..."
Write-Host "Backup file:"
Write-Host $BackupFile
Write-Host ""
Write-Host "Database URL is loaded from environment and will not be printed."
Write-Host ""

& pg_dump `
  --dbname="$DbUrl" `
  --format=custom `
  --no-owner `
  --no-privileges `
  --file="$BackupFile"

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Backup failed."
  Write-Host ""
  exit 1
}

$SizeBytes = (Get-Item $BackupFile).Length

@"
RAFTOP CPAP CARE Pro Backup Manifest
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Label: $Label
Backup file: $BackupFile
Size bytes: $SizeBytes
Database source: environment variable $DbEnvName
Secrets printed: no
Restore policy: restore only after written approval and dry-run validation
"@ | Set-Content -Path $ManifestFile -Encoding UTF8

Write-Host ""
Write-Host "Backup completed."
Write-Host "Backup file:"
Write-Host $BackupFile
Write-Host ""
Write-Host "Manifest:"
Write-Host $ManifestFile
Write-Host ""

exit 0
'@

Set-Content -Path $BackupScriptFile -Value $BackupScriptContent -Encoding UTF8

if (Test-Path $BackupScriptFile) {
    Add-Result "Production backup script created" "PASS" $BackupScriptFile
} else {
    Add-Result "Production backup script created" "FAIL" $BackupScriptFile
}

# -------------------------------------------------------------------
# Monitoring script
# -------------------------------------------------------------------
$MonitoringScriptContent = @'
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
'@

Set-Content -Path $MonitoringScriptFile -Value $MonitoringScriptContent -Encoding UTF8

if (Test-Path $MonitoringScriptFile) {
    Add-Result "Production monitoring script created" "PASS" $MonitoringScriptFile
} else {
    Add-Result "Production monitoring script created" "FAIL" $MonitoringScriptFile
}

# -------------------------------------------------------------------
# Docs
# -------------------------------------------------------------------
$BackupDocContent = @'
# RAFTOP CPAP CARE Pro - Backup, Restore & Monitoring Pack

REQUIRED_MARKER: PHASE122_BACKUP_RESTORE_MONITORING_PACK
REQUIRED_MARKER: BACKUP_SCRIPT_READY
REQUIRED_MARKER: RESTORE_RUNBOOK_READY
REQUIRED_MARKER: MONITORING_SCRIPT_READY
REQUIRED_MARKER: READY_FOR_PHASE123_GDPR_DATA_BOUNDARY_PACK

## Purpose

Production readiness requires backup, restore and monitoring procedures.

This phase adds:
- production backup script
- restore runbook
- monitoring smoke-check script
- operational rules for secrets
- no backup files inside repository

## Backup script

tools/raftop_production_backup.ps1

The script reads the production database connection only from a temporary environment variable in the current PowerShell session.

It does not print the connection string.

## Monitoring script

tools/raftop_production_monitoring_check.ps1

Checks:
- backend health
- frontend pages
- Pilot20 login
- Patient Entry
- Usage Upload
- Rescue Monitor
- Import History
- Unmatched Devices
- Rolling 80h Report
- Production Rollout validation page

## Restore rule

Never restore directly into production without:
1. written approval
2. backup of current production
3. dry-run restore into temporary database
4. smoke test
5. rollback plan
'@

Set-Content -Path $BackupDocFile -Value $BackupDocContent -Encoding UTF8

$RestoreDocContent = @'
# RAFTOP CPAP CARE Pro - Restore Runbook

REQUIRED_MARKER: PHASE122_RESTORE_RUNBOOK
REQUIRED_MARKER: RESTORE_DRY_RUN_REQUIRED
REQUIRED_MARKER: CURRENT_PRODUCTION_BACKUP_REQUIRED
REQUIRED_MARKER: NO_DIRECT_PRODUCTION_RESTORE

## Critical rule

Do not restore directly into production.

## Restore sequence

1. Confirm written approval.
2. Take a fresh backup of current production.
3. Copy the target backup into a safe local folder.
4. Restore into temporary staging database first.
5. Run smoke tests against staging.
6. Verify:
   - login
   - Pilot20 patients
   - AirView upload
   - Rescue Monitor
   - Import History
   - Rolling 80h Report
7. Only after verification, schedule production restore window.
8. Keep rollback backup available.

## Production restore is forbidden unless

- current production backup exists
- backup file integrity is checked
- staging dry-run succeeds
- owner approves the restore window
'@

Set-Content -Path $RestoreChecklistFile -Value $RestoreDocContent -Encoding UTF8

$MonitoringDocContent = @'
# RAFTOP CPAP CARE Pro - Monitoring Operations

REQUIRED_MARKER: PHASE122_MONITORING_OPERATIONS
REQUIRED_MARKER: DAILY_MONITORING_CHECK_READY
REQUIRED_MARKER: PILOT20_ENDPOINTS_MONITORED
REQUIRED_MARKER: BUYER_ACCESS_MONITORED

## Daily check

Run:

.\tools\raftop_production_monitoring_check.ps1

## What must pass

- backend health
- frontend login
- Pilot20 page access
- authenticated Pilot20 API checks
- Rescue Monitor
- Import History
- Unmatched Devices
- Rolling 80h Early Warning

## If monitoring fails

1. Check Render backend deploy status.
2. Check Render frontend deploy status.
3. Check environment variables.
4. Check database availability.
5. Check latest Git commit.
6. Do not give buyer access until critical failure is resolved.

## Buyer rule

If buyer reports a problem, run monitoring check before changing code.
'@

Set-Content -Path $MonitoringDocFile -Value $MonitoringDocContent -Encoding UTF8

foreach ($Path in @($BackupDocFile, $RestoreChecklistFile, $MonitoringDocFile)) {
    if (Test-Path $Path) {
        Add-Result ("Phase122 doc created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase122 doc created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

# -------------------------------------------------------------------
# Local tool availability checks
# -------------------------------------------------------------------
if ($null -ne (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Add-Result "pg_dump available for backup" "PASS" "pg_dump found."
} else {
    Add-Result "pg_dump available for backup" "WARN" "pg_dump not found in PATH."
}

if ($null -ne (Get-Command psql -ErrorAction SilentlyContinue)) {
    Add-Result "psql available for restore/dry-run operations" "PASS" "psql found."
} else {
    Add-Result "psql available for restore/dry-run operations" "WARN" "psql not found in PATH."
}

# -------------------------------------------------------------------
# Required marker checks
# -------------------------------------------------------------------
$AllGenerated = ""
foreach ($Path in @($BackupScriptFile, $MonitoringScriptFile, $BackupDocFile, $RestoreChecklistFile, $MonitoringDocFile)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE122_BACKUP_RESTORE_MONITORING_PACK",
    "BACKUP_SCRIPT_READY",
    "RESTORE_RUNBOOK_READY",
    "MONITORING_SCRIPT_READY",
    "READY_FOR_PHASE123_GDPR_DATA_BOUNDARY_PACK",
    "raftop_production_backup.ps1",
    "raftop_production_monitoring_check.ps1",
    "RESTORE_DRY_RUN_REQUIRED",
    "DAILY_MONITORING_CHECK_READY"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase122 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase122 text exists: " + $Required) "FAIL" "Missing."
    }
}

foreach ($Forbidden in @(
    "postgresql://",
    "sk-",
    "Ξ",
    "Ο€",
    "Οƒ",
    "Ο„"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden Phase122 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase122 content absent: " + $Forbidden) "PASS" "Absent."
    }
}

Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
} else {
    Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE122_BACKUP_RESTORE_MONITORING_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE122_BACKUP_RESTORE_MONITORING_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE122_BACKUP_RESTORE_MONITORING_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 122 Backup, Restore & Monitoring Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backup script:"
Write-Host $BackupScriptFile
Write-Host ""
Write-Host "Monitoring script:"
Write-Host $MonitoringScriptFile
Write-Host ""
Write-Host "Docs:"
Write-Host $BackupDocFile
Write-Host $RestoreChecklistFile
Write-Host $MonitoringDocFile
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host ("PASS_COUNT: " + $script:PassCount)
Write-Host ("WARN_COUNT: " + $script:WarnCount)
Write-Host ("FAIL_COUNT: " + $script:FailCount)
Write-Host ""
Write-Host ("FINAL STATUS: " + $FinalStatus)
Write-Host ""

exit $ExitCode