# RAFTOP CPAP CARE Pro
# Phase 42.9 - Final Pre-Sale Demo Checklist
# Verifies latest reports, frontend build state, Git cleanliness and production demo URLs.

param(
    [switch]$RunBuild
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$FrontendDir = Join-Path $Root "enterprise-frontend"

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase42_final_pre_sale_demo_checklist_" + $Timestamp + ".md")

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

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) {
        return $Files[0]
    }

    return $null
}

function Check-ReportStatus {
    param(
        [string]$Name,
        [string]$Pattern,
        [string[]]$AcceptedStatuses
    )

    $Latest = Get-LatestReport $Pattern

    if ($Latest -eq $null) {
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Get-Content -Path $Latest.FullName -Raw -ErrorAction SilentlyContinue

    foreach ($Status in $AcceptedStatuses) {
        if ($Content -match [regex]::Escape("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "FAIL" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

function Test-Url {
    param(
        [string]$Name,
        [string]$Url
    )

    try {
        $Response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop

        if ($Response.StatusCode -eq 200) {
            Add-Result $Name "PASS" ("HTTP 200: " + $Url)
        } else {
            Add-Result $Name "WARN" ("Unexpected HTTP status " + $Response.StatusCode + ": " + $Url)
        }
    } catch {
        Add-Result $Name "WARN" ("URL check failed: " + $_.Exception.Message)
    }
}

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 42.9 Final Pre-Sale Demo Checklist" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 42.9 final pre-sale demo checklist..."
Write-Host ""

Check-ReportStatus "Backend protected route authorization audit" "phase41_backend_protected_route_authorization_audit_*.md" @(
    "PHASE41_BACKEND_PROTECTED_ROUTE_AUTHORIZATION_AUDIT_READY"
)

Check-ReportStatus "Admin login E2E verification" "phase41_admin_login_e2e_verification_*.md" @(
    "PHASE41_ADMIN_LOGIN_E2E_VERIFIED",
    "PHASE41_ADMIN_LOGIN_E2E_VERIFIED_WITH_WARNINGS"
)

Check-ReportStatus "Pilot demo data verification" "phase42_pilot_demo_data_verification_*.md" @(
    "PHASE42_PILOT_DEMO_DATA_VERIFIED"
)

Check-ReportStatus "Pilot demo API route verification" "phase42_pilot_demo_api_route_verification_*.md" @(
    "PHASE42_PILOT_DEMO_API_ROUTES_VERIFIED",
    "PHASE42_PILOT_DEMO_API_ROUTES_VERIFIED_WITH_WARNINGS"
)

Check-ReportStatus "Frontend fallback inventory" "phase42_frontend_fallback_inventory_*.md" @(
    "PHASE42_FRONTEND_FALLBACK_INVENTORY_READY",
    "PHASE42_FRONTEND_FALLBACK_INVENTORY_READY_WITH_WARNINGS"
)

Check-ReportStatus "Sales demo navigation verification" "phase42_raftopoulos_sales_demo_navigation_verification_*.md" @(
    "PHASE42_SALES_DEMO_NAVIGATION_VERIFIED",
    "PHASE42_SALES_DEMO_NAVIGATION_VERIFIED_WITH_WARNINGS"
)

Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree" "PASS" "Working tree is clean."
} else {
    Add-Result "Git working tree" "WARN" "There are uncommitted changes. Commit/push before client presentation."
    Write-ReportLine "GIT_STATUS:"
    Write-ReportLine ($GitStatus | Out-String)
    Write-ReportLine ""
}

if ($RunBuild) {
    if (Test-Path $FrontendDir) {
        Push-Location $FrontendDir
        $BuildOutput = npm run build 2>&1
        $BuildExitCode = $LASTEXITCODE
        Pop-Location

        Write-ReportLine "BUILD_OUTPUT:"
        Write-ReportLine ($BuildOutput | Out-String)
        Write-ReportLine ""

        if ($BuildExitCode -eq 0) {
            Add-Result "Frontend production build" "PASS" "npm run build completed successfully."
        } else {
            Add-Result "Frontend production build" "FAIL" ("npm run build failed. Exit code: " + $BuildExitCode)
        }
    } else {
        Add-Result "Frontend production build" "FAIL" "enterprise-frontend directory missing."
    }
} else {
    Add-Result "Frontend production build" "WARN" "Build was not run. Use -RunBuild for local build verification."
}

Test-Url "Production frontend root" "https://raftop-cpap-frontend.onrender.com"
Test-Url "Executive demo home URL" "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/executive-demo-home"
Test-Url "Executive demo script URL" "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/executive-demo-script"
Test-Url "Pilot walkthrough URL" "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/pilot-walkthrough-scenario"
Test-Url "Pilot demo dashboard URL" "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/pilot-demo"
Test-Url "Production backend health" "https://raftop-cpap-backend.onrender.com/api/health"

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "FINAL PRE-SALE INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "PASS means the technical demo foundation is ready."
Write-ReportLine "WARN means presentation may proceed only if the warning is understood and accepted."
Write-ReportLine "FAIL means do not present commercially before fixing."
Write-ReportLine ""
Write-ReportLine "Recommended live demo order:"
Write-ReportLine "1. Executive Demo Home"
Write-ReportLine "2. Executive Demo Script"
Write-ReportLine "3. Pilot Walkthrough Scenario"
Write-ReportLine "4. Pilot Demo Dashboard"
Write-ReportLine "5. ATLAS Action Queue and patient-specific story"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE42_FINAL_PRE_SALE_DEMO_CHECKLIST_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE42_FINAL_PRE_SALE_DEMO_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE42_FINAL_PRE_SALE_DEMO_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 42.9 Final Pre-Sale Demo Checklist"
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