# RAFTOP CPAP CARE Pro
# Phase 42.7 - Frontend Fallback Inventory
# Reads frontend source only. Does not modify files.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendSrc = Join-Path $Root "enterprise-frontend\src"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase42_frontend_fallback_inventory_" + $Timestamp + ".md")

$PassCount = 0
$WarnCount = 0
$FailCount = 0

function Add-Result {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Details
    )

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    Add-Content -Path $ReportPath -Value ("CHECK: " + $Name) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("STATUS: " + $Status) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("DETAILS: " + $Details) -Encoding UTF8
    Add-Content -Path $ReportPath -Value "" -Encoding UTF8

    Write-Host ($Status + " - " + $Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 42.7 Frontend Fallback Inventory" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 42.7 frontend fallback inventory..."
Write-Host ""

if (Test-Path $FrontendSrc) {
    Add-Result "Frontend src directory" "PASS" "Found enterprise-frontend/src."
} else {
    Add-Result "Frontend src directory" "FAIL" "Missing enterprise-frontend/src."
}

$Files = Get-ChildItem -Path $FrontendSrc -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx -ErrorAction SilentlyContinue

$FallbackFiles = @()

foreach ($File in $Files) {
    $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue

    if ($Content -match "Auto-generated fallback module" -or $Content -match "build-stabilization fallback") {
        $FallbackFiles += $File
    }
}

if ($FallbackFiles.Count -eq 0) {
    Add-Result "Fallback file count" "PASS" "No auto-generated fallback frontend files found."
} else {
    Add-Result "Fallback file count" "WARN" ("Auto-generated fallback files found: " + $FallbackFiles.Count)
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "FALLBACK FILES" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

$CriticalKeywords = @(
    "Login",
    "PilotDemo",
    "Dashboard",
    "Atlas",
    "Patient",
    "Tenant",
    "SuperAdmin",
    "Billing",
    "Payment",
    "Subscription",
    "Raftopoulos"
)

$CriticalCount = 0

foreach ($File in $FallbackFiles) {
    $Relative = $File.FullName.Replace($Root + "\", "")
    $Name = $File.Name
    $Priority = "LOW"

    foreach ($Keyword in $CriticalKeywords) {
        if ($Name -match $Keyword -or $Relative -match $Keyword) {
            $Priority = "HIGH"
            break
        }
    }

    if ($Priority -eq "HIGH") {
        $CriticalCount++
    }

    Add-Content -Path $ReportPath -Value ("FALLBACK_FILE: " + $Relative) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("CLEANUP_PRIORITY: " + $Priority) -Encoding UTF8
    Add-Content -Path $ReportPath -Value "" -Encoding UTF8
}

if ($CriticalCount -eq 0) {
    Add-Result "High-priority fallback count" "PASS" "No high-priority fallback files detected."
} else {
    Add-Result "High-priority fallback count" "WARN" ("High-priority fallback files detected: " + $CriticalCount)
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "INTERPRETATION" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Fallback files are acceptable for build stabilization, but product-critical pages must be replaced with real implementations before final commercial handover." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Next phase:" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Phase 42.8 - Raftopoulos Sales Demo Navigation Polish" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($FailCount -gt 0) {
    $FinalStatus = "PHASE42_FRONTEND_FALLBACK_INVENTORY_FAILED"
    $ExitCode = 1
} elseif ($WarnCount -gt 0) {
    $FinalStatus = "PHASE42_FRONTEND_FALLBACK_INVENTORY_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE42_FRONTEND_FALLBACK_INVENTORY_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 42.7 Frontend Fallback Inventory"
Write-Host "============================================================"
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host ("PASS_COUNT: " + $PassCount)
Write-Host ("WARN_COUNT: " + $WarnCount)
Write-Host ("FAIL_COUNT: " + $FailCount)
Write-Host ""
Write-Host ("FINAL STATUS: " + $FinalStatus)
Write-Host ""

exit $ExitCode