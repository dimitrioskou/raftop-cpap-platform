# RAFTOP CPAP CARE Pro
# Phase 44.23 - Final Demo & Sales Readiness Gate
# Verifies technical demo readiness + commercial presentation readiness.
# Safe: does not modify backend/database. Reads files, checks latest reports, builds frontend, checks URLs and git state.

param(
    [switch]$RunBuild,
    [string]$FrontendUrl = "https://raftop-cpap-frontend.onrender.com",
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com"
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$FrontendDir = Join-Path $Root "enterprise-frontend"
$FrontendSrc = Join-Path $FrontendDir "src"
$AppPath = Join-Path $FrontendSrc "App.js"
$LoginPagePath = Join-Path $FrontendSrc "pages\LoginPage.js"
$QualityPagePath = Join-Path $FrontendSrc "pages\RaftopoulosQualityProfitExcellencePage.js"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase44_final_demo_sales_readiness_gate_" + $Timestamp + ".md")

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

function ContainsText {
    param(
        [string]$Content,
        [string]$Needle
    )

    return $Content -match [regex]::Escape($Needle)
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 44.23 Final Demo & Sales Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This gate verifies whether the RAFTOP production demo and commercial sales package are ready for Raftopoulos presentation."
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 44.23 Final Demo & Sales Readiness Gate..."
Write-Host ""

# Latest technical reports
Check-ReportStatus "Phase 42 final pre-sale demo checklist" "phase42_final_pre_sale_demo_checklist_*.md" @(
    "PHASE42_FINAL_PRE_SALE_DEMO_READY",
    "PHASE42_FINAL_PRE_SALE_DEMO_READY_WITH_WARNINGS"
)

Check-ReportStatus "Quality Profit layer verification" "phase44_quality_profit_layer_verification_*.md" @(
    "PHASE44_QUALITY_PROFIT_LAYER_VERIFIED",
    "PHASE44_QUALITY_PROFIT_LAYER_VERIFIED_WITH_WARNINGS"
)

Check-ReportStatus "Sales demo navigation verification" "phase42_raftopoulos_sales_demo_navigation_verification_*.md" @(
    "PHASE42_SALES_DEMO_NAVIGATION_VERIFIED",
    "PHASE42_SALES_DEMO_NAVIGATION_VERIFIED_WITH_WARNINGS"
)

Check-ReportStatus "Backend protected route authorization" "phase41_backend_protected_route_authorization_audit_*.md" @(
    "PHASE41_BACKEND_PROTECTED_ROUTE_AUTHORIZATION_AUDIT_READY"
)

Check-ReportStatus "Admin login E2E" "phase41_admin_login_e2e_verification_*.md" @(
    "PHASE41_ADMIN_LOGIN_E2E_VERIFIED",
    "PHASE41_ADMIN_LOGIN_E2E_VERIFIED_WITH_WARNINGS"
)

# File checks
if (Test-Path $AppPath) {
    Add-Result "App.js exists" "PASS" "Found enterprise-frontend/src/App.js."
    $AppContent = Get-Content -Path $AppPath -Raw -ErrorAction SilentlyContinue
} else {
    Add-Result "App.js exists" "FAIL" "Missing App.js."
    $AppContent = ""
}

if (Test-Path $LoginPagePath) {
    Add-Result "LoginPage exists" "PASS" "Found LoginPage.js."
    $LoginContent = Get-Content -Path $LoginPagePath -Raw -ErrorAction SilentlyContinue
} else {
    Add-Result "LoginPage exists" "FAIL" "Missing LoginPage.js."
    $LoginContent = ""
}

if (Test-Path $QualityPagePath) {
    Add-Result "Quality Profit page exists" "PASS" "Found RaftopoulosQualityProfitExcellencePage.js."
    $QualityContent = Get-Content -Path $QualityPagePath -Raw -ErrorAction SilentlyContinue
} else {
    Add-Result "Quality Profit page exists" "FAIL" "Missing RaftopoulosQualityProfitExcellencePage.js."
    $QualityContent = ""
}

# App route checks
$RequiredRoutes = @(
    "/login",
    "/sales/raftopoulos/executive-demo-home",
    "/sales/raftopoulos/quality-profit",
    "/sales/raftopoulos/pilot-walkthrough-scenario",
    "/sales/raftopoulos/pilot-demo"
)

foreach ($Route in $RequiredRoutes) {
    if (ContainsText $AppContent $Route) {
        Add-Result ("Route wired: " + $Route) "PASS" "Route appears in App.js."
    } else {
        Add-Result ("Route wired: " + $Route) "FAIL" "Route missing from App.js."
    }
}

if (ContainsText $AppContent "getFrontendAuthToken" -and ContainsText $AppContent "raftop_redirect_after_login" -and ContainsText $AppContent "Navigate to=") {
    Add-Result "Global frontend auth guard" "PASS" "Auth guard signals found in App.js."
} else {
    Add-Result "Global frontend auth guard" "FAIL" "Auth guard signals missing from App.js."
}

# Page marker checks
$QualityMarkers = @(
    "Quality & Profit Excellence Center",
    "Estimated Annual Impact",
    "DMAIC Operating Model",
    "Defect Reduction Table",
    "ATLAS Improvement Playbooks",
    "Commercial Close"
)

foreach ($Marker in $QualityMarkers) {
    if (ContainsText $QualityContent $Marker) {
        Add-Result ("Quality marker: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Quality marker: " + $Marker) "FAIL" "Marker missing."
    }
}

$LoginMarkers = @(
    "Robust production login page",
    "tenantId payload plus x-tenant-id",
    "tenant_id payload plus x-tenant-id",
    "x-tenant-id only",
    "raftop_auth_token",
    "commercial_demo_mode"
)

foreach ($Marker in $LoginMarkers) {
    if (ContainsText $LoginContent $Marker) {
        Add-Result ("Login marker: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Login marker: " + $Marker) "WARN" "Marker missing. Login may still work, but robust marker not detected."
    }
}

# Git state
Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree" "PASS" "Working tree is clean."
} else {
    Add-Result "Git working tree" "WARN" "There are uncommitted or untracked changes."
    Write-ReportLine "GIT_STATUS:"
    Write-ReportLine ($GitStatus | Out-String)
    Write-ReportLine ""
}

# Build
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
    Add-Result "Frontend production build" "WARN" "Build was not run. Use -RunBuild for full readiness gate."
}

# Production URL checks
Test-Url "Production frontend root" ($FrontendUrl.TrimEnd("/") + "/")
Test-Url "Production login URL" ($FrontendUrl.TrimEnd("/") + "/login")
Test-Url "Production executive demo home" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/executive-demo-home")
Test-Url "Production quality profit URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/quality-profit")
Test-Url "Production pilot walkthrough URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/pilot-walkthrough-scenario")
Test-Url "Production pilot demo URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/pilot-demo")
Test-Url "Production backend health" ($BackendUrl.TrimEnd("/") + "/api/health")

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "FINAL SALES READINESS INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "PASS means ready for controlled Raftopoulos demo."
Write-ReportLine "WARN means proceed only if warning is understood and not client-facing."
Write-ReportLine "FAIL means do not present commercially until fixed."
Write-ReportLine ""
Write-ReportLine "Required manual checks before meeting:"
Write-ReportLine "1. New incognito opens quality-profit and redirects to login."
Write-ReportLine "2. Login succeeds."
Write-ReportLine "3. Quality & Profit Excellence Center loads."
Write-ReportLine "4. Pilot Demo Dashboard loads."
Write-ReportLine "5. Backup screenshots exist."
Write-ReportLine ""
Write-ReportLine "Recommended demo order:"
Write-ReportLine "1. Executive Demo Home"
Write-ReportLine "2. Quality & Profit Excellence Center"
Write-ReportLine "3. Pilot Walkthrough Scenario"
Write-ReportLine "4. Pilot Demo Dashboard"
Write-ReportLine "5. ATLAS Action Queue"
Write-ReportLine "6. No-data patient story"
Write-ReportLine "7. Leak/compliance story"
Write-ReportLine "8. Pilot scope close"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE44_FINAL_DEMO_SALES_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE44_FINAL_DEMO_SALES_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE44_FINAL_DEMO_SALES_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 44.23 Final Demo & Sales Readiness Gate"
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