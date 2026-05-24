# RAFTOP CPAP CARE Pro
# Phase 38.2 - Production Preflight Verification
# Fixed version: no R alias conflict

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase38_production_preflight_verification_result_" + $Timestamp + ".md")
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-CheckResult {
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

function Test-RequiredFile {
    param(
        [string]$RelativePath,
        [string]$Name
    )

    $FullPath = Join-Path $Root $RelativePath

    if (Test-Path $FullPath) {
        Add-CheckResult $Name "PASS" ("Found: " + $RelativePath)
    } else {
        Add-CheckResult $Name "FAIL" ("Missing required file: " + $RelativePath)
    }
}

function Test-OptionalFile {
    param(
        [string]$RelativePath,
        [string]$Name
    )

    $FullPath = Join-Path $Root $RelativePath

    if (Test-Path $FullPath) {
        Add-CheckResult $Name "PASS" ("Found: " + $RelativePath)
    } else {
        Add-CheckResult $Name "WARN" ("Optional file missing: " + $RelativePath)
    }
}

function Test-RequiredDirectory {
    param(
        [string]$RelativePath,
        [string]$Name
    )

    $FullPath = Join-Path $Root $RelativePath

    if (Test-Path $FullPath) {
        Add-CheckResult $Name "PASS" ("Found: " + $RelativePath)
    } else {
        Add-CheckResult $Name "FAIL" ("Missing required directory: " + $RelativePath)
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.2 Production Preflight Verification Result" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This local preflight verifies that the project contains the required files before production deployment execution begins."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP production preflight verification..."
Write-Host ""

Test-RequiredDirectory "enterprise-backend" "Backend directory"
Test-RequiredDirectory "enterprise-frontend" "Frontend directory"
Test-RequiredDirectory "tools" "Tools directory"
Test-RequiredDirectory "reports" "Reports directory"

Test-RequiredFile "enterprise-backend\package.json" "Backend package.json"
Test-RequiredFile "enterprise-backend\src\server.js" "Backend server entry"
Test-OptionalFile "enterprise-backend\.env.production.example" "Backend production env example"

Test-RequiredFile "enterprise-frontend\package.json" "Frontend package.json"
Test-OptionalFile "enterprise-frontend\.env.production.example" "Frontend production env example"

Test-RequiredFile "tools\generate_phase36_production_readiness_summary.ps1" "Phase 36.5 production readiness summary generator"
Test-RequiredFile "tools\generate_phase37_production_deployment_master_checklist.ps1" "Phase 37.1 deployment master checklist generator"
Test-RequiredFile "tools\generate_phase37_render_backend_deployment_guide.ps1" "Phase 37.2 backend deployment guide generator"
Test-RequiredFile "tools\generate_phase37_production_postgresql_setup_guide.ps1" "Phase 37.3 production PostgreSQL guide generator"
Test-RequiredFile "tools\generate_phase37_frontend_deployment_guide.ps1" "Phase 37.4 frontend deployment guide generator"
Test-RequiredFile "tools\generate_phase37_production_environment_checklist.ps1" "Phase 37.5 production environment checklist generator"
Test-RequiredFile "tools\generate_phase37_production_smoke_test_script.ps1" "Phase 37.6 smoke test generator"
Test-RequiredFile "tools\run_phase37_production_smoke_test.ps1" "Phase 37.6 smoke test runner"
Test-RequiredFile "tools\generate_phase37_go_live_checklist.ps1" "Phase 37.7 go-live checklist generator"
Test-RequiredFile "tools\generate_phase38_production_deployment_execution_pack.ps1" "Phase 38.1 deployment execution pack generator"
Test-RequiredFile "tools\generate_phase38_production_preflight_verification_script.ps1" "Phase 38.2 preflight generator"

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE38_PRODUCTION_PREFLIGHT_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE38_PRODUCTION_PREFLIGHT_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE38_PRODUCTION_PREFLIGHT_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 38.2 Production Preflight Verification"
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