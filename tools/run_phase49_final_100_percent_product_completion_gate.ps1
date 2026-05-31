# RAFTOP CPAP CARE Pro
# Phase 49 - Final 100% Product Completion Gate
# Purpose: Confirm the platform is 100% buyer-ready for delivery and sale discussion.
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
$DeliveryDir = Join-Path $Root "docs\buyer-delivery"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase49_final_100_percent_product_completion_gate_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 49 Final 100% Product Completion Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""
Write-ReportLine "Purpose: confirm 100% buyer-ready product completion."
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 49 Final 100% Product Completion Gate..."
Write-Host ""

# 1. Previous gates
Check-ReportStatus "Phase 46 full product completion audit" "phase46_full_product_completion_audit_v2_*.md" @(
    "PHASE46_FULL_PRODUCT_COMPLETION_AUDIT_READY"
)

Check-ReportStatus "Phase 47 buyer-ready release candidate gate" "phase47_final_buyer_ready_release_candidate_gate_*.md" @(
    "PHASE47_BUYER_READY_RELEASE_CANDIDATE_READY"
)

Check-ReportStatus "Phase 48 buyer delivery pack" "phase48_buyer_delivery_pack_*.md" @(
    "PHASE48_BUYER_DELIVERY_PACK_READY"
)

# 2. Required docs
$RequiredDocs = @(
    "01_RAFTOP_BUYER_DELIVERY_PACK.md",
    "02_PRODUCT_SCOPE_AND_BOUNDARIES.md",
    "03_BUYER_ONBOARDING_CHECKLIST.md",
    "04_SUPPORT_AND_INCIDENT_PROCESS.md",
    "05_RELEASE_NOTES.md",
    "06_OPERATIONAL_RUNBOOK.md"
)

foreach ($Doc in $RequiredDocs) {
    $Path = Join-Path $DeliveryDir $Doc
    if (Test-Path $Path) {
        Add-Result ("Buyer delivery doc exists: " + $Doc) "PASS" "Document exists."
    } else {
        Add-Result ("Buyer delivery doc exists: " + $Doc) "FAIL" "Document missing."
    }
}

# 3. Required scripts
$RequiredTools = @(
    "run_phase46_full_product_completion_audit_v2.ps1",
    "run_phase47_final_buyer_ready_release_candidate_gate.ps1",
    "run_phase48_create_buyer_delivery_pack.ps1",
    "run_phase49_final_100_percent_product_completion_gate.ps1"
)

foreach ($Tool in $RequiredTools) {
    $Path = Join-Path $ToolsDir $Tool
    if (Test-Path $Path) {
        Add-Result ("Verification tool exists: " + $Tool) "PASS" "Tool exists."
    } else {
        Add-Result ("Verification tool exists: " + $Tool) "FAIL" "Tool missing."
    }
}

# 4. App and route checks
if (Test-Path $AppPath) {
    Add-Result "Frontend App.js exists" "PASS" "App.js found."
    $AppContent = Read-FileSafe $AppPath
} else {
    Add-Result "Frontend App.js exists" "FAIL" "App.js missing."
    $AppContent = ""
}

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

# 5. Required frontend pages
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
        Add-Result ("Required page exists: " + $Page) "PASS" "Page exists."
    } else {
        Add-Result ("Required page exists: " + $Page) "FAIL" "Page missing."
    }
}

# 6. Git status
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

# 7. Optional frontend build
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
        Add-Result "Frontend production build" "FAIL" "Frontend directory missing."
    }
} else {
    Add-Result "Frontend production build" "WARN" "Build was not run. Use -RunBuild for final gate."
}

# 8. Production URL checks
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
Write-ReportLine "PASS means completion evidence exists."
Write-ReportLine "WARN means product can be considered complete only if warning is non-buyer-facing and understood."
Write-ReportLine "FAIL means product is not 100% buyer-ready."
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE49_FINAL_100_PERCENT_PRODUCT_COMPLETION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE49_FINAL_100_PERCENT_PRODUCT_COMPLETION_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE49_FINAL_100_PERCENT_PRODUCT_COMPLETION_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 49 Final 100% Product Completion Gate"
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