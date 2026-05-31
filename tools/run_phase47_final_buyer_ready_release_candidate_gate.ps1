# RAFTOP CPAP CARE Pro
# Phase 47 - Final Buyer-Ready Release Candidate Gate
# Purpose: Confirm that the platform is ready to be presented as a buyer-ready release candidate.
# Safe: read-only checks + optional frontend build. Does not modify database or application files.

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
$PagesDir = Join-Path $FrontendSrc "pages"
$AppPath = Join-Path $FrontendSrc "App.js"
$ToolsDir = Join-Path $Root "tools"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase47_final_buyer_ready_release_candidate_gate_" + $Timestamp + ".md")

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

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try {
            return Get-Content -Path $Path -Raw -ErrorAction Stop
        } catch {
            return ""
        }
    }

    return ""
}

function ContainsText {
    param(
        [string]$Content,
        [string]$Needle
    )

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $false
    }

    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
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

    if ($null -eq $Latest) {
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 47 Final Buyer-Ready Release Candidate Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""
Write-ReportLine "Purpose: confirm final buyer-ready release candidate status."
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 47 Final Buyer-Ready Release Candidate Gate..."
Write-Host ""

# 1. Required previous gates
Check-ReportStatus "Phase 46 full product completion audit" "phase46_full_product_completion_audit_v2_*.md" @(
    "PHASE46_FULL_PRODUCT_COMPLETION_AUDIT_READY"
)

Check-ReportStatus "Phase 44 final demo sales readiness gate" "phase44_final_demo_sales_readiness_gate_*.md" @(
    "PHASE44_FINAL_DEMO_SALES_READY",
    "PHASE44_FINAL_DEMO_SALES_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 42 final pre-sale demo checklist" "phase42_final_pre_sale_demo_checklist_*.md" @(
    "PHASE42_FINAL_PRE_SALE_DEMO_READY",
    "PHASE42_FINAL_PRE_SALE_DEMO_READY_WITH_WARNINGS"
)

# 2. Core file checks
if (Test-Path $AppPath) {
    Add-Result "Frontend App.js exists" "PASS" "Found enterprise-frontend/src/App.js."
    $AppContent = Read-FileSafe $AppPath
} else {
    Add-Result "Frontend App.js exists" "FAIL" "Missing enterprise-frontend/src/App.js."
    $AppContent = ""
}

$RequiredPages = @(
    "LoginPage.js",
    "RaftopoulosQualityProfitExcellencePage.js",
    "RaftopoulosExecutiveDemoHomePage.js",
    "RaftopoulosExecutiveDemoScriptPage.js",
    "RaftopoulosPilotWalkthroughScenarioPage.js",
    "BuyerSettingsPage.js",
    "BuyerCompliancePage.js",
    "BuyerReportsPage.js",
    "BuyerDoctorClinicPage.js"
)

foreach ($Page in $RequiredPages) {
    $Path = Join-Path $PagesDir $Page

    if (Test-Path $Path) {
        Add-Result ("Required frontend page: " + $Page) "PASS" "Page file exists."
    } else {
        Add-Result ("Required frontend page: " + $Page) "FAIL" "Page file missing."
    }
}

# 3. Route wiring checks
$RequiredRoutes = @(
    "/login",
    "/sales/raftopoulos/executive-demo-home",
    "/sales/raftopoulos/quality-profit",
    "/sales/raftopoulos/pilot-walkthrough-scenario",
    "/sales/raftopoulos/pilot-demo",
    "/settings",
    "/compliance",
    "/reports",
    "/doctor",
    "/clinic"
)

foreach ($Route in $RequiredRoutes) {
    if (ContainsText $AppContent $Route) {
        Add-Result ("Route wired: " + $Route) "PASS" "Route appears in App.js."
    } else {
        Add-Result ("Route wired: " + $Route) "FAIL" "Route missing from App.js."
    }
}

# 4. Buyer page content markers
$BuyerPageMarkers = @{
    "BuyerSettingsPage.js" = @("Settings & Tenant Control Center", "Enterprise Settings", "Tenant Configuration")
    "BuyerCompliancePage.js" = @("CPAP Compliance & Risk Control", "No-Data Detection", "Compliance Risk")
    "BuyerReportsPage.js" = @("Reports & Management Visibility", "Monthly Executive Report", "ATLAS Action Summary")
    "BuyerDoctorClinicPage.js" = @("Doctor & Clinic CPAP Reporting Module", "Doctor Patient Summaries", "Recurring Revenue Path")
}

foreach ($Page in $BuyerPageMarkers.Keys) {
    $Path = Join-Path $PagesDir $Page
    $Content = Read-FileSafe $Path

    foreach ($Marker in $BuyerPageMarkers[$Page]) {
        if (ContainsText $Content $Marker) {
            Add-Result ("Buyer marker in " + $Page + ": " + $Marker) "PASS" "Marker found."
        } else {
            Add-Result ("Buyer marker in " + $Page + ": " + $Marker) "FAIL" "Marker missing."
        }
    }
}

# 5. Existing sales/demo marker checks
$QualityPagePath = Join-Path $PagesDir "RaftopoulosQualityProfitExcellencePage.js"
$QualityContent = Read-FileSafe $QualityPagePath

$QualityMarkers = @(
    "Quality & Profit Excellence Center",
    "Estimated Annual Impact",
    "DMAIC Operating Model",
    "Defect Reduction Table",
    "ATLAS Improvement Playbooks"
)

foreach ($Marker in $QualityMarkers) {
    if (ContainsText $QualityContent $Marker) {
        Add-Result ("Quality Profit marker: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Quality Profit marker: " + $Marker) "FAIL" "Marker missing."
    }
}

# 6. Verification scripts
$RequiredTools = @(
    "run_phase46_full_product_completion_audit_v2.ps1",
    "run_phase46_buyer_navigation_gap_closure.ps1",
    "run_phase47_final_buyer_ready_release_candidate_gate.ps1"
)

foreach ($Tool in $RequiredTools) {
    $ToolPath = Join-Path $ToolsDir $Tool

    if (Test-Path $ToolPath) {
        Add-Result ("Verification tool exists: " + $Tool) "PASS" "Tool file exists."
    } else {
        Add-Result ("Verification tool exists: " + $Tool) "FAIL" "Tool file missing."
    }
}

# 7. Git status
Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree" "PASS" "Working tree is clean."
} else {
    Add-Result "Git working tree" "WARN" "There are uncommitted/untracked changes."
    Write-ReportLine "GIT_STATUS:"
    Write-ReportLine ($GitStatus | Out-String)
    Write-ReportLine ""
}

# 8. Optional frontend build
if ($RunBuild) {
    if (Test-Path $FrontendDir) {
        Push-Location $FrontendDir
        $BuildOutput = npm run build 2>&1
        $BuildExitCode = $LASTEXITCODE
        Pop-Location

        Write-ReportLine "FRONTEND_BUILD_OUTPUT:"
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
    Add-Result "Frontend production build" "WARN" "Build was not run. Use -RunBuild for full release candidate gate."
}

# 9. Production URL checks
Test-Url "Production frontend root" ($FrontendUrl.TrimEnd("/") + "/")
Test-Url "Production login URL" ($FrontendUrl.TrimEnd("/") + "/login")
Test-Url "Production executive demo home URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/executive-demo-home")
Test-Url "Production quality profit URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/quality-profit")
Test-Url "Production pilot walkthrough URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/pilot-walkthrough-scenario")
Test-Url "Production pilot demo URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/pilot-demo")
Test-Url "Production buyer settings URL" ($FrontendUrl.TrimEnd("/") + "/settings")
Test-Url "Production buyer compliance URL" ($FrontendUrl.TrimEnd("/") + "/compliance")
Test-Url "Production buyer reports URL" ($FrontendUrl.TrimEnd("/") + "/reports")
Test-Url "Production buyer doctor URL" ($FrontendUrl.TrimEnd("/") + "/doctor")
Test-Url "Production buyer clinic URL" ($FrontendUrl.TrimEnd("/") + "/clinic")
Test-Url "Production backend health" ($BackendUrl.TrimEnd("/") + "/api/health")

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "FINAL INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "PASS means release candidate evidence exists."
Write-ReportLine "WARN means release can proceed only if warning is understood and not buyer-facing."
Write-ReportLine "FAIL means do not call the product buyer-ready until fixed."
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE47_BUYER_READY_RELEASE_CANDIDATE_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE47_BUYER_READY_RELEASE_CANDIDATE_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE47_BUYER_READY_RELEASE_CANDIDATE_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 47 Final Buyer-Ready Release Candidate Gate"
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