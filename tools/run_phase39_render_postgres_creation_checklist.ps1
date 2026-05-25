# RAFTOP CPAP CARE Pro
# Phase 39.4 - Render PostgreSQL Creation Checklist
# Safe ASCII-only script
# Does not create database and does not store secrets.

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase39_render_postgres_creation_checklist_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Details
    )

    if ($Status -eq "PASS") {
        $script:PassCount++
    } elseif ($Status -eq "WARN") {
        $script:WarnCount++
    } else {
        $script:FailCount++
    }

    Write-ReportLine ("CHECK: " + $Name)
    Write-ReportLine ("STATUS: " + $Status)
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($Status + " - " + $Name)
}

function Test-FileExists {
    param(
        [string]$RelativePath,
        [string]$Name,
        [string]$Required
    )

    $FullPath = Join-Path $Root $RelativePath

    if (Test-Path $FullPath) {
        Add-Result $Name "PASS" ("Found: " + $RelativePath)
    } else {
        if ($Required -eq "YES") {
            Add-Result $Name "FAIL" ("Missing required file: " + $RelativePath)
        } else {
            Add-Result $Name "WARN" ("Optional file missing: " + $RelativePath)
        }
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 39.4 Render PostgreSQL Creation Checklist" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This checklist defines the manual Render PostgreSQL creation steps for RAFTOP CPAP CARE Pro."
Write-ReportLine "It does not create a database and does not store secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 39.4 Render PostgreSQL creation checklist..."
Write-Host ""

Test-FileExists "tools\run_phase39_render_backend_preparation.ps1" "Phase 39.1 backend preparation script" "YES"
Test-FileExists "tools\run_phase39_render_backend_env_pack.ps1" "Phase 39.2 backend env pack script" "YES"
Test-FileExists "tools\run_phase39_postgres_provider_decision.ps1" "Phase 39.3 provider decision script" "YES"
Test-FileExists "enterprise-backend\.env.production.example" "Backend production env template" "YES"
Test-FileExists "tools\run_phase37_production_smoke_test.ps1" "Production smoke test runner" "YES"

Write-ReportLine "RECOMMENDED PROVIDER"
Write-ReportLine ""
Write-ReportLine "Render PostgreSQL"
Write-ReportLine ""
Write-ReportLine "Reason:"
Write-ReportLine "- Backend deployment target is Render."
Write-ReportLine "- Keeping backend and database in the same platform reduces setup friction."
Write-ReportLine "- DATABASE_URL can be entered directly in Render backend environment variables."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "MANUAL RENDER POSTGRESQL CREATION STEPS"
Write-ReportLine ""
Write-ReportLine "1. Open Render Dashboard."
Write-ReportLine "2. Select New."
Write-ReportLine "3. Select PostgreSQL."
Write-ReportLine "4. Choose a clear production database name."
Write-ReportLine "5. Select the same region as the backend service if possible."
Write-ReportLine "6. Choose a production-appropriate plan."
Write-ReportLine "7. Create the PostgreSQL database."
Write-ReportLine "8. Open the database Info or Connect section."
Write-ReportLine "9. Copy the connection URL needed by the backend."
Write-ReportLine "10. Store it only in Render backend Environment Variables as DATABASE_URL."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "RECOMMENDED NAMES"
Write-ReportLine ""
Write-ReportLine "Database name:"
Write-ReportLine "raftop_production"
Write-ReportLine ""
Write-ReportLine "Database user:"
Write-ReportLine "raftop_prod_user"
Write-ReportLine ""
Write-ReportLine "Backend env var:"
Write-ReportLine "DATABASE_URL"
Write-ReportLine ""
Write-ReportLine "Tenant after bootstrap:"
Write-ReportLine "raftopoulos-live"
Write-ReportLine ""
Write-ReportLine "Do not use demo names for production."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "DATABASE_URL RULES"
Write-ReportLine ""
Write-ReportLine "Expected format:"
Write-ReportLine ""
Write-ReportLine "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
Write-ReportLine ""
Write-ReportLine "If SSL mode is required by the connection/client, use:"
Write-ReportLine ""
Write-ReportLine "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
Write-ReportLine ""
Write-ReportLine "Rules:"
Write-ReportLine "- DATABASE_URL must not be committed to GitHub."
Write-ReportLine "- DATABASE_URL must not be placed in frontend code."
Write-ReportLine "- DATABASE_URL must not be stored in reports."
Write-ReportLine "- DATABASE_URL must not be pasted into ChatGPT."
Write-ReportLine "- DATABASE_URL must not point to localhost."
Write-ReportLine "- DATABASE_URL must not point to demo database."
Write-ReportLine "- DATABASE_URL must not point to expired or suspended database."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "BACKUP AND RESTORE DECISION"
Write-ReportLine ""
Write-ReportLine "Before real patient data:"
Write-ReportLine "- Confirm backup capability."
Write-ReportLine "- Confirm retention expectation."
Write-ReportLine "- Document who owns database backup monitoring."
Write-ReportLine "- Run a restore test before full production."
Write-ReportLine ""
Write-ReportLine "No restore test means no real backup confidence."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "PRODUCTION DATABASE ACCEPTANCE CHECKLIST"
Write-ReportLine ""
Write-ReportLine "- Render PostgreSQL database created: PENDING"
Write-ReportLine "- Production database name selected: PENDING"
Write-ReportLine "- Region selected: PENDING"
Write-ReportLine "- Plan selected: PENDING"
Write-ReportLine "- DATABASE_URL copied privately: PENDING"
Write-ReportLine "- DATABASE_URL entered in backend Render env vars: PENDING"
Write-ReportLine "- DATABASE_URL not saved in repo: PENDING"
Write-ReportLine "- SSL behavior confirmed: PENDING"
Write-ReportLine "- Backup expectation confirmed: PENDING"
Write-ReportLine "- Restore test planned: PENDING"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "NEXT PHASE"
Write-ReportLine ""
Write-ReportLine "Phase 39.5 - Backend Render Web Service Creation Checklist"
Write-ReportLine ""
Write-ReportLine "This will define the exact backend web service settings:"
Write-ReportLine "- repository"
Write-ReportLine "- branch"
Write-ReportLine "- root directory"
Write-ReportLine "- build command"
Write-ReportLine "- start command"
Write-ReportLine "- environment variables"
Write-ReportLine "- health endpoint"
Write-ReportLine "- first deploy checks"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE39_RENDER_POSTGRES_CREATION_CHECKLIST_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE39_RENDER_POSTGRES_CREATION_CHECKLIST_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE39_RENDER_POSTGRES_CREATION_CHECKLIST_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 39.4 Render PostgreSQL Creation Checklist"
Write-Host "============================================================"
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