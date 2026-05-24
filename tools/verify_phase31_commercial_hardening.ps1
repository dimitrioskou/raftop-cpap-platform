$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 31 Commercial Hardening Verification" -ForegroundColor Cyan
Write-Host ""

$Failures = 0
$Warnings = 0

$LocalBackend = "http://localhost:5001"
$LocalFrontend = "http://localhost:3001"
$RenderBackend = "https://raftop-enterprise-backend.onrender.com"

$TenantHeaders = @{
    "x-tenant-id" = "raftopoulos-live"
}

function Check-Endpoint {
    param(
        [string]$Label,
        [string]$Url,
        [hashtable]$Headers = @{}
    )

    try {
        $response = Invoke-WebRequest $Url -Headers $Headers -UseBasicParsing -TimeoutSec 20

        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] $Label" -ForegroundColor Green
            return $true
        }

        Write-Host "[FAIL] $Label returned $($response.StatusCode)" -ForegroundColor Red
        $script:Failures++
        return $false
    }
    catch {
        Write-Host "[FAIL] $Label unavailable | $($_.Exception.Message)" -ForegroundColor Red
        $script:Failures++
        return $false
    }
}

Write-Host "============================================================"
Write-Host "1. Local Backend Core"
Write-Host "============================================================"

Check-Endpoint `
    -Label "Local backend health" `
    -Url "$LocalBackend/api/health"

Check-Endpoint `
    -Label "Executive metrics" `
    -Url "$LocalBackend/api/tenant/executive-metrics" `
    -Headers $TenantHeaders

Check-Endpoint `
    -Label "ATLAS root" `
    -Url "$LocalBackend/api/tenant/atlas" `
    -Headers $TenantHeaders

Check-Endpoint `
    -Label "ATLAS summary" `
    -Url "$LocalBackend/api/tenant/atlas/summary" `
    -Headers $TenantHeaders

Check-Endpoint `
    -Label "ATLAS queue" `
    -Url "$LocalBackend/api/tenant/atlas/queue" `
    -Headers $TenantHeaders

Check-Endpoint `
    -Label "Action Center" `
    -Url "$LocalBackend/api/tenant/atlas/action-center" `
    -Headers $TenantHeaders

Check-Endpoint `
    -Label "Closed Loop control-summary" `
    -Url "$LocalBackend/api/tenant/closed-loop/control-summary" `
    -Headers $TenantHeaders

Check-Endpoint `
    -Label "Unified Tasks" `
    -Url "$LocalBackend/api/tenant/tasks-unified" `
    -Headers $TenantHeaders

Check-Endpoint `
    -Label "Patient Signals" `
    -Url "$LocalBackend/api/tenant/patient-signals" `
    -Headers $TenantHeaders

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Local Frontend Executive Flow"
Write-Host "============================================================"

$FrontendPages = @(
    "/sales/raftopoulos/executive-demo-home",
    "/sales/raftopoulos/executive-demo-script",
    "/sales/raftopoulos/pilot-walkthrough",
    "/sales/raftopoulos/executive-pilot-close",
    "/sales/raftopoulos/pilot-approval-decision",
    "/sales/raftopoulos/rollout-roadmap",
    "/tenant/atlas",
    "/tenant/atlas/action-center",
    "/tenant/closed-loop",
    "/tenant/business-impact"
)

foreach ($page in $FrontendPages) {

    Check-Endpoint `
        -Label $page `
        -Url "$LocalFrontend$page"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Render Production Backend"
Write-Host "============================================================"

Check-Endpoint `
    -Label "Render backend health" `
    -Url "$RenderBackend/api/health"

Check-Endpoint `
    -Label "Render executive metrics" `
    -Url "$RenderBackend/api/tenant/executive-metrics" `
    -Headers $TenantHeaders

Check-Endpoint `
    -Label "Render ATLAS root" `
    -Url "$RenderBackend/api/tenant/atlas" `
    -Headers $TenantHeaders

Check-Endpoint `
    -Label "Render Closed Loop control-summary" `
    -Url "$RenderBackend/api/tenant/closed-loop/control-summary" `
    -Headers $TenantHeaders

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Multi-Tenant Hardening Checks"
Write-Host "============================================================"

try {
    $atlas = Invoke-RestMethod `
        "$LocalBackend/api/tenant/atlas" `
        -Headers $TenantHeaders `
        -Method GET

    if ($atlas.ok -eq $true) {
        Write-Host "[OK] Tenant-aware ATLAS payload active" -ForegroundColor Green
    }
    else {
        Write-Host "[WARN] Tenant-aware ATLAS payload unclear" -ForegroundColor Yellow
        $Warnings++
    }
}
catch {
    Write-Host "[FAIL] Tenant-aware ATLAS payload check failed" -ForegroundColor Red
    $Failures++
}

try {
    $metrics = Invoke-RestMethod `
        "$LocalBackend/api/tenant/executive-metrics" `
        -Headers $TenantHeaders `
        -Method GET

    if ($metrics.ok -eq $true) {
        Write-Host "[OK] Executive KPI payload active" -ForegroundColor Green
    }
    else {
        Write-Host "[WARN] Executive KPI payload unclear" -ForegroundColor Yellow
        $Warnings++
    }
}
catch {
    Write-Host "[FAIL] Executive KPI payload check failed" -ForegroundColor Red
    $Failures++
}

Write-Host ""
Write-Host "============================================================"
Write-Host "5. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings"
Write-Host "Failures: $Failures"
Write-Host ""

if ($Failures -eq 0) {

    Write-Host "FINAL STATUS: COMMERCIAL_HARDENING_READY" -ForegroundColor Green
}
else {

    Write-Host "FINAL STATUS: COMMERCIAL_HARDENING_BLOCKED" -ForegroundColor Red
}

Write-Host ""