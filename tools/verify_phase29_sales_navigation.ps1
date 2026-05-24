$ErrorActionPreference = "Continue"

$Frontend = "http://localhost:3001"
$Failures = 0

$Pages = @(
    "/demo/raftopoulos/start",
    "/demo/raftopoulos/pilot",
    "/demo/raftopoulos/decision-room",
    "/sales/raftopoulos",
    "/sales/raftopoulos/pilot",
    "/sales/raftopoulos/decision-room",
    "/sales/raftopoulos/objections",
    "/sales/raftopoulos/pilot-success",
    "/sales/raftopoulos/pilot-playbook",
    "/sales/raftopoulos/rollout-roadmap",
    "/sales/raftopoulos/presentation-flow",
    "/sales/raftopoulos/final-demo-script",
    "/sales/raftopoulos/pilot-approval-decision",
    "/sales/raftopoulos/executive-pilot-close",
    "/sales/raftopoulos/executive-leave-behind",
    "/sales/raftopoulos/executive-demo-script",
    "/sales/raftopoulos/pilot-walkthrough",
    "/sales/raftopoulos/executive-demo-home",
    "/tenant/statistics",
    "/tenant/statistics/report",
    "/tenant/business-impact"
)

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 29 Sales Navigation Verification" -ForegroundColor White
Write-Host "Frontend: $Frontend" -ForegroundColor Gray
Write-Host ""

foreach ($page in $Pages) {
    $url = "$Frontend$page"

    try {
        $response = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 15

        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] $page => 200" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] $page => $($response.StatusCode)" -ForegroundColor Red
            $Failures += 1
        }
    }
    catch {
        Write-Host "[FAIL] $page unavailable | $($_.Exception.Message)" -ForegroundColor Red
        $Failures += 1
    }
}

Write-Host ""
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: SALES_NAVIGATION_READY" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: SALES_NAVIGATION_BLOCKED" -ForegroundColor Red
exit 1