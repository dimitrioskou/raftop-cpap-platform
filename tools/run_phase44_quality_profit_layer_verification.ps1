# RAFTOP CPAP CARE Pro
# Phase 44.1C - Quality Profit Layer Verification
# Verifies the Six Sigma / Quality & Profit Excellence page integration.
# Safe: reads files, runs optional build, checks production URLs. Does not modify DB/backend.

param(
    [switch]$RunBuild
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendDir = Join-Path $Root "enterprise-frontend"
$FrontendSrc = Join-Path $FrontendDir "src"
$PagesDir = Join-Path $FrontendSrc "pages"
$AppPath = Join-Path $FrontendSrc "App.js"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase44_quality_profit_layer_verification_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 44.1C Quality Profit Layer Verification" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report verifies the Six Sigma / Quality & Profit Excellence frontend layer."
Write-ReportLine "It validates page file presence, App.js route wiring, frontend auth guard signals, build readiness and production URL reachability."
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 44.1C Quality Profit Layer Verification..."
Write-Host ""

$QualityPagePath = Join-Path $PagesDir "RaftopoulosQualityProfitExcellencePage.js"

if (Test-Path $QualityPagePath) {
    Add-Result "Quality Profit page file" "PASS" "Found RaftopoulosQualityProfitExcellencePage.js."
    $QualityPageContent = Get-Content -Path $QualityPagePath -Raw -ErrorAction SilentlyContinue
} else {
    Add-Result "Quality Profit page file" "FAIL" "Missing RaftopoulosQualityProfitExcellencePage.js."
    $QualityPageContent = ""
}

if (Test-Path $AppPath) {
    Add-Result "Frontend App.js" "PASS" "Found App.js."
    $AppContent = Get-Content -Path $AppPath -Raw -ErrorAction SilentlyContinue
} else {
    Add-Result "Frontend App.js" "FAIL" "Missing App.js."
    $AppContent = ""
}

if (ContainsText $AppContent "RaftopoulosQualityProfitExcellencePage") {
    Add-Result "Quality Profit App.js import/reference" "PASS" "App.js references RaftopoulosQualityProfitExcellencePage."
} else {
    Add-Result "Quality Profit App.js import/reference" "FAIL" "App.js does not reference RaftopoulosQualityProfitExcellencePage."
}

if (ContainsText $AppContent "/sales/raftopoulos/quality-profit") {
    Add-Result "Quality Profit route path" "PASS" "App.js contains /sales/raftopoulos/quality-profit."
} else {
    Add-Result "Quality Profit route path" "FAIL" "App.js missing /sales/raftopoulos/quality-profit."
}

if (ContainsText $AppContent "Quality & Profit") {
    Add-Result "Quality Profit navigation link" "PASS" "Navigation contains Quality & Profit label."
} else {
    Add-Result "Quality Profit navigation link" "WARN" "Navigation label Quality & Profit not found."
}

if (ContainsText $AppContent "getFrontendAuthToken" -and ContainsText $AppContent "raftop_redirect_after_login" -and ContainsText $AppContent "<Navigate to=`"/login`"") {
    Add-Result "Global frontend auth guard" "PASS" "App.js contains global login guard signals."
} else {
    Add-Result "Global frontend auth guard" "FAIL" "Global frontend login guard signals not found."
}

$RequiredPageMarkers = @(
    "Quality & Profit Excellence Center",
    "Estimated Annual Impact",
    "DMAIC Operating Model",
    "Defect Reduction Table",
    "ATLAS Improvement Playbooks",
    "Commercial Close",
    "Profit Protection Layer",
    "Six Sigma"
)

foreach ($Marker in $RequiredPageMarkers) {
    if (ContainsText $QualityPageContent $Marker) {
        Add-Result ("Page marker: " + $Marker) "PASS" ("Found marker: " + $Marker)
    } else {
        Add-Result ("Page marker: " + $Marker) "FAIL" ("Missing marker: " + $Marker)
    }
}

if (ContainsText $QualityPageContent "/api/tenant/pilot-demo/dashboard") {
    Add-Result "Quality page pilot API dependency" "PASS" "Page reads existing protected pilot demo dashboard API."
} else {
    Add-Result "Quality page pilot API dependency" "FAIL" "Page does not reference protected pilot demo dashboard API."
}

if (ContainsText $QualityPageContent "Authorization") {
    Add-Result "Quality page token usage" "PASS" "Page sends Authorization header."
} else {
    Add-Result "Quality page token usage" "FAIL" "Page does not send Authorization header."
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
    Add-Result "Frontend production build" "WARN" "Build was not run. Use -RunBuild for build verification."
}

Test-Url "Production Quality Profit URL" "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/quality-profit"
Test-Url "Production Pilot Demo URL" "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/pilot-demo"
Test-Url "Production Backend Health" "https://raftop-cpap-backend.onrender.com/api/health"

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "QUALITY PROFIT INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "PASS means the Six Sigma / Quality & Profit commercial layer is wired and deployable."
Write-ReportLine "The browser-level incognito test must still be confirmed manually because SPA pages return HTTP 200 even when JavaScript redirects to login."
Write-ReportLine ""
Write-ReportLine "Manual test required:"
Write-ReportLine "1. Open incognito."
Write-ReportLine "2. Visit https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/quality-profit"
Write-ReportLine "3. Confirm it shows login first."
Write-ReportLine "4. Login and confirm Quality & Profit Excellence Center loads."
Write-ReportLine ""
Write-ReportLine "Recommended demo order update:"
Write-ReportLine "1. Executive Demo Home"
Write-ReportLine "2. Quality & Profit Excellence Center"
Write-ReportLine "3. Pilot Walkthrough Scenario"
Write-ReportLine "4. Pilot Demo Dashboard"
Write-ReportLine "5. ATLAS Action Queue"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE44_QUALITY_PROFIT_LAYER_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE44_QUALITY_PROFIT_LAYER_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE44_QUALITY_PROFIT_LAYER_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 44.1C Quality Profit Layer Verification"
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