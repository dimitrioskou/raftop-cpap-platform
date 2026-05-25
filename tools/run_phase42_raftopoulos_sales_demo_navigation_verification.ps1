# RAFTOP CPAP CARE Pro
# Phase 42.8A - Raftopoulos Sales Demo Navigation Verification
# Verifies frontend demo pages, App.js route wiring and production build readiness.

param(
    [switch]$RunBuild
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendDir = Join-Path $Root "enterprise-frontend"
$FrontendSrc = Join-Path $FrontendDir "src"
$AppPath = Join-Path $FrontendSrc "App.js"
$PagesDir = Join-Path $FrontendSrc "pages"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase42_raftopoulos_sales_demo_navigation_verification_" + $Timestamp + ".md")

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

function Test-CommandExists {
    param([string]$Command)

    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function ContainsText {
    param(
        [string]$Content,
        [string]$Needle
    )

    return $Content -match [regex]::Escape($Needle)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 42.8A Raftopoulos Sales Demo Navigation Verification" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report verifies that the Raftopoulos sales demo frontend navigation is wired correctly."
Write-ReportLine "It checks page files, App.js imports/routes, fallback debt and optional local production build."
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 42.8A sales demo navigation verification..."
Write-Host ""

if (Test-Path $FrontendDir) {
    Add-Result "Frontend directory" "PASS" "Found enterprise-frontend."
} else {
    Add-Result "Frontend directory" "FAIL" "Missing enterprise-frontend directory."
}

if (Test-Path $AppPath) {
    Add-Result "Frontend App.js" "PASS" "Found enterprise-frontend/src/App.js."
    $AppContent = Get-Content -Path $AppPath -Raw -ErrorAction SilentlyContinue
} else {
    Add-Result "Frontend App.js" "FAIL" "Missing enterprise-frontend/src/App.js."
    $AppContent = ""
}

$RequiredPages = @(
    @{
        File = "PilotDemoDashboardPage.js"
        ImportName = "PilotDemoDashboardPage"
        RoutePath = "/sales/raftopoulos/pilot-demo"
        Label = "Pilot Demo Dashboard"
    },
    @{
        File = "RaftopoulosExecutiveDemoHomePage.js"
        ImportName = "RaftopoulosExecutiveDemoHomePage"
        RoutePath = "/sales/raftopoulos"
        Label = "Executive Demo Home"
    },
    @{
        File = "RaftopoulosExecutiveDemoScriptPage.js"
        ImportName = "RaftopoulosExecutiveDemoScriptPage"
        RoutePath = "/sales/raftopoulos/executive-demo-script"
        Label = "Executive Demo Script"
    },
    @{
        File = "RaftopoulosPilotWalkthroughScenarioPage.js"
        ImportName = "RaftopoulosPilotWalkthroughScenarioPage"
        RoutePath = "/sales/raftopoulos/pilot-walkthrough-scenario"
        Label = "Pilot Walkthrough Scenario"
    }
)

foreach ($Page in $RequiredPages) {
    $PagePath = Join-Path $PagesDir $Page.File

    if (Test-Path $PagePath) {
        Add-Result ($Page.Label + " page file") "PASS" ("Found: " + $Page.File)
    } else {
        Add-Result ($Page.Label + " page file") "FAIL" ("Missing: " + $Page.File)
    }

    if (ContainsText $AppContent $Page.ImportName) {
        Add-Result ($Page.Label + " App.js import/reference") "PASS" ("App.js references " + $Page.ImportName)
    } else {
        Add-Result ($Page.Label + " App.js import/reference") "FAIL" ("App.js does not reference " + $Page.ImportName)
    }

    if (ContainsText $AppContent $Page.RoutePath) {
        Add-Result ($Page.Label + " route path") "PASS" ("App.js contains route path " + $Page.RoutePath)
    } else {
        if ($Page.RoutePath -eq "/sales/raftopoulos" -and (ContainsText $AppContent "/sales/raftopoulos/executive-demo-home")) {
            Add-Result ($Page.Label + " route path") "WARN" "Home page appears to use /sales/raftopoulos/executive-demo-home instead of /sales/raftopoulos."
        } else {
            Add-Result ($Page.Label + " route path") "FAIL" ("App.js missing route path " + $Page.RoutePath)
        }
    }
}

$FallbackFiles = @()

if (Test-Path $FrontendSrc) {
    $Files = Get-ChildItem -Path $FrontendSrc -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx -ErrorAction SilentlyContinue

    foreach ($File in $Files) {
        $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue

        if ($Content -match "Auto-generated fallback module" -or $Content -match "build-stabilization fallback") {
            $FallbackFiles += $File.FullName.Replace($Root + "\", "")
        }
    }
}

if ($FallbackFiles.Count -eq 0) {
    Add-Result "Frontend fallback debt" "PASS" "No auto-generated fallback modules detected."
} else {
    Add-Result "Frontend fallback debt" "WARN" ("Fallback modules detected: " + $FallbackFiles.Count)
    Write-ReportLine "FALLBACK_FILES:"
    foreach ($Fallback in $FallbackFiles) {
        Write-ReportLine ("- " + $Fallback)
    }
    Write-ReportLine ""
}

if (Test-CommandExists "node") {
    Add-Result "Node available" "PASS" "node command is available."
} else {
    Add-Result "Node available" "WARN" "node command not available."
}

if (Test-CommandExists "npm") {
    Add-Result "npm available" "PASS" "npm command is available."
} else {
    Add-Result "npm available" "WARN" "npm command not available."
}

if ($RunBuild) {
    if (Test-Path $FrontendDir) {
        Write-Host ""
        Write-Host "Running frontend production build..."
        Write-Host ""

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
        Add-Result "Frontend production build" "FAIL" "Cannot run build because frontend directory is missing."
    }
} else {
    Add-Result "Frontend production build" "WARN" "Build was not run. Use -RunBuild for build verification."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "NAVIGATION TARGETS"
Write-ReportLine ""
Write-ReportLine "Primary:"
Write-ReportLine "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/pilot-demo"
Write-ReportLine ""
Write-ReportLine "Secondary:"
Write-ReportLine "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos"
Write-ReportLine "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/executive-demo-script"
Write-ReportLine "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/pilot-walkthrough-scenario"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE42_SALES_DEMO_NAVIGATION_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE42_SALES_DEMO_NAVIGATION_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE42_SALES_DEMO_NAVIGATION_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 42.8A Sales Demo Navigation Verification"
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