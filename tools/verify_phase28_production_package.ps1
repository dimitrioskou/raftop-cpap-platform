$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"

$RequiredFiles = @(
    "enterprise-backend\src\server.js",
    "enterprise-backend\src\routes\tenant\patientSignals.js",
    "enterprise-backend\src\routes\tenant\unifiedTasks.js",
    "enterprise-backend\src\routes\tenant\closedLoopControlSummary.js",
    "enterprise-backend\src\routes\tenant\atlas.js",
    "enterprise-backend\src\routes\tenant\atlasActionCenterForceRoute.js",
    "enterprise-backend\src\routes\tenant\executiveMetrics.js",
    "enterprise-frontend\src\App.js",
    "enterprise-frontend\src\components\OperationalCommandCenter.js",
    "enterprise-frontend\src\components\ExecutiveKpiRibbon.js",
    "tools\raftop_final_commercial_demo_gate.ps1"
)

$Failures = 0

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 28 Production Package Audit" -ForegroundColor White
Write-Host "Project: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

foreach ($file in $RequiredFiles) {
    $path = Join-Path $ProjectRoot $file

    if (Test-Path $path) {
        Write-Host "[OK] $file" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Missing: $file" -ForegroundColor Red
        $Failures += 1
    }
}

Write-Host ""
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PRODUCTION_PACKAGE_READY" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PRODUCTION_PACKAGE_BLOCKED" -ForegroundColor Red
exit 1