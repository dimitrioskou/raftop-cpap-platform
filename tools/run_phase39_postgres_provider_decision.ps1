# RAFTOP CPAP CARE Pro
# Phase 39.3 - Production PostgreSQL Provider Decision
# Safe ASCII-only script

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase39_postgres_provider_decision_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 39.3 Production PostgreSQL Provider Decision" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report defines the recommended production PostgreSQL provider decision for RAFTOP CPAP CARE Pro."
Write-ReportLine "It does not create a database and does not store any secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 39.3 PostgreSQL provider decision..."
Write-Host ""

Test-FileExists "tools\run_phase39_render_backend_preparation.ps1" "Phase 39.1 backend preparation script" "YES"
Test-FileExists "tools\run_phase39_render_backend_env_pack.ps1" "Phase 39.2 backend env pack script" "YES"
Test-FileExists "enterprise-backend\.env.production.example" "Backend production env template" "YES"
Test-FileExists "tools\run_phase37_production_smoke_test.ps1" "Production smoke test runner" "YES"

Write-ReportLine "PROVIDER DECISION"
Write-ReportLine ""
Write-ReportLine "Recommended provider for Phase 39:"
Write-ReportLine ""
Write-ReportLine "Render PostgreSQL"
Write-ReportLine ""
Write-ReportLine "Reason:"
Write-ReportLine ""
Write-ReportLine "- Backend deployment target is Render."
Write-ReportLine "- Operational simplicity is important at this stage."
Write-ReportLine "- One provider for backend and database reduces deployment friction."
Write-ReportLine "- DATABASE_URL can be stored directly in Render backend environment variables."
Write-ReportLine "- The first production goal is controlled pilot readiness, not complex multi-cloud architecture."
Write-ReportLine ""
Write-ReportLine "Alternative provider:"
Write-ReportLine ""
Write-ReportLine "Neon PostgreSQL"
Write-ReportLine ""
Write-ReportLine "Use Neon if:"
Write-ReportLine ""
Write-ReportLine "- You already have an active Neon project."
Write-ReportLine "- You want serverless Postgres."
Write-ReportLine "- You want branching or modern Postgres workflows."
Write-ReportLine "- You can manage the external DATABASE_URL carefully."
Write-ReportLine ""
Write-ReportLine "Third option:"
Write-ReportLine ""
Write-ReportLine "Supabase PostgreSQL"
Write-ReportLine ""
Write-ReportLine "Use Supabase if:"
Write-ReportLine ""
Write-ReportLine "- You already have an active Supabase project."
Write-ReportLine "- You want Supabase dashboard/tools."
Write-ReportLine "- You understand pooling, SSL and connection modes."
Write-ReportLine "- You will not expose the database connection string to frontend code."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "PRODUCTION DATABASE REQUIREMENTS"
Write-ReportLine ""
Write-ReportLine "The selected PostgreSQL provider must support:"
Write-ReportLine ""
Write-ReportLine "- production PostgreSQL database"
Write-ReportLine "- SSL connection"
Write-ReportLine "- external connection string"
Write-ReportLine "- backups"
Write-ReportLine "- restore process"
Write-ReportLine "- stable hosting"
Write-ReportLine "- separation from demo and development data"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "DATABASE NAME RECOMMENDATION"
Write-ReportLine ""
Write-ReportLine "Recommended database name:"
Write-ReportLine ""
Write-ReportLine "raftop_production"
Write-ReportLine ""
Write-ReportLine "Recommended user name:"
Write-ReportLine ""
Write-ReportLine "raftop_prod_user"
Write-ReportLine ""
Write-ReportLine "Recommended tenant id after bootstrap:"
Write-ReportLine ""
Write-ReportLine "raftopoulos-live"
Write-ReportLine ""
Write-ReportLine "Do not use:"
Write-ReportLine ""
Write-ReportLine "- demo-tenant"
Write-ReportLine "- raftop_demo"
Write-ReportLine "- local dev database"
Write-ReportLine "- expired database"
Write-ReportLine "- suspended database"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "DATABASE_URL RULES"
Write-ReportLine ""
Write-ReportLine "Required:"
Write-ReportLine ""
Write-ReportLine "- must point to production database"
Write-ReportLine "- must be stored only in Render environment variables"
Write-ReportLine "- must not be committed to GitHub"
Write-ReportLine "- must not be pasted into reports"
Write-ReportLine "- must not be sent to ChatGPT"
Write-ReportLine "- must use SSL where provider requires it"
Write-ReportLine ""
Write-ReportLine "Expected format:"
Write-ReportLine ""
Write-ReportLine "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "DECISION MATRIX"
Write-ReportLine ""
Write-ReportLine "Render PostgreSQL:"
Write-ReportLine "- Best for current Render backend deployment path"
Write-ReportLine "- Recommended for first controlled production pilot"
Write-ReportLine "- Selected for Phase 39 unless you choose otherwise"
Write-ReportLine ""
Write-ReportLine "Neon PostgreSQL:"
Write-ReportLine "- Strong alternative"
Write-ReportLine "- Good if you prefer serverless Postgres"
Write-ReportLine "- Good if you already use Neon"
Write-ReportLine ""
Write-ReportLine "Supabase PostgreSQL:"
Write-ReportLine "- Good if you already use Supabase"
Write-ReportLine "- More platform features"
Write-ReportLine "- More connection mode details to handle carefully"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "PHASE 39 DECISION"
Write-ReportLine ""
Write-ReportLine "Default selected provider:"
Write-ReportLine ""
Write-ReportLine "Render PostgreSQL"
Write-ReportLine ""
Write-ReportLine "Decision status:"
Write-ReportLine ""
Write-ReportLine "READY FOR MANUAL DATABASE CREATION"
Write-ReportLine ""
Write-ReportLine "Next phase:"
Write-ReportLine ""
Write-ReportLine "Phase 39.4 - Render PostgreSQL Creation Checklist"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE39_POSTGRES_PROVIDER_DECISION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE39_POSTGRES_PROVIDER_DECISION_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE39_POSTGRES_PROVIDER_DECISION_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 39.3 PostgreSQL Provider Decision"
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