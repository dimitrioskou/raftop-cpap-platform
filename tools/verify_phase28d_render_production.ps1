$ErrorActionPreference = "Continue"

$RenderBackend = "https://raftop-enterprise-backend.onrender.com"
$LocalFrontend = "http://localhost:3001"
$TenantId = "raftopoulos-live"

$Headers = @{
    "x-tenant-id" = $TenantId
    "Content-Type" = "application/json"
}

$Failures = 0
$Warnings = 0

function Write-Section($Title) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor DarkGray
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor DarkGray
}

function Test-Get($Name, $Url, $HeadersOverride = $null) {
    try {
        if ($null -eq $HeadersOverride) {
            $response = Invoke-WebRequest $Url -UseBasicParsing -TimeoutSec 30
        }
        else {
            $response = Invoke-WebRequest $Url -Headers $HeadersOverride -UseBasicParsing -TimeoutSec 30
        }

        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] $Name => 200" -ForegroundColor Green
            return $true
        }

        Write-Host "[FAIL] $Name => $($response.StatusCode)" -ForegroundColor Red
        $script:Failures += 1
        return $false
    }
    catch {
        Write-Host "[FAIL] $Name unavailable: $Url | $($_.Exception.Message)" -ForegroundColor Red
        $script:Failures += 1
        return $false
    }
}

function Read-Json($Url) {
    try {
        $response = Invoke-WebRequest $Url -Headers $Headers -UseBasicParsing -TimeoutSec 30
        return $response.Content | ConvertFrom-Json
    }
    catch {
        return $null
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 28D Render Production Verification" -ForegroundColor White
Write-Host "Render Backend: $RenderBackend" -ForegroundColor Gray
Write-Host "Local Frontend:  $LocalFrontend" -ForegroundColor Gray
Write-Host "Tenant:          $TenantId" -ForegroundColor Gray

Write-Section "1. Render backend health"
Test-Get "Render health" "$RenderBackend/api/health"

Write-Section "2. Render operational routes"
Test-Get "Patient Signals" "$RenderBackend/api/tenant/patient-signals" $Headers
Test-Get "Unified Tasks" "$RenderBackend/api/tenant/tasks-unified" $Headers
Test-Get "Closed Loop Control Summary" "$RenderBackend/api/tenant/closed-loop/control-summary" $Headers
Test-Get "ATLAS" "$RenderBackend/api/tenant/atlas" $Headers
Test-Get "ATLAS Action Center" "$RenderBackend/api/tenant/atlas/action-center" $Headers
Test-Get "Executive Metrics" "$RenderBackend/api/tenant/executive-metrics" $Headers

Write-Section "3. Render payload sanity"
$atlas = Read-Json "$RenderBackend/api/tenant/atlas"
if ($null -ne $atlas -and $atlas.ok -eq $true) {
    Write-Host "[OK] ATLAS payload ok=true" -ForegroundColor Green

    if ($atlas.fallback -eq $true) {
        Write-Host "[WARNING] ATLAS fallback=true on Render" -ForegroundColor Yellow
        $Warnings += 1
    }
    else {
        Write-Host "[OK] ATLAS fallback=false" -ForegroundColor Green
    }
}
else {
    Write-Host "[FAIL] ATLAS payload invalid" -ForegroundColor Red
    $Failures += 1
}

$metrics = Read-Json "$RenderBackend/api/tenant/executive-metrics"
if ($null -ne $metrics -and $metrics.ok -eq $true) {
    Write-Host "[OK] Executive Metrics payload ok=true" -ForegroundColor Green

    if ($metrics.fallback -eq $true) {
        Write-Host "[WARNING] Executive Metrics fallback=true on Render" -ForegroundColor Yellow
        $Warnings += 1
    }
    else {
        Write-Host "[OK] Executive Metrics fallback=false" -ForegroundColor Green
    }

    $kpiCount = 0
    if ($metrics.kpis) { $kpiCount = $metrics.kpis.Count }
    elseif ($metrics.items) { $kpiCount = $metrics.items.Count }
    elseif ($metrics.rows) { $kpiCount = $metrics.rows.Count }

    if ($kpiCount -ge 4) {
        Write-Host "[OK] Render KPI count: $kpiCount" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Render KPI count too low: $kpiCount" -ForegroundColor Red
        $Failures += 1
    }
}
else {
    Write-Host "[FAIL] Executive Metrics payload invalid" -ForegroundColor Red
    $Failures += 1
}

Write-Section "4. Local frontend production build routes"
Test-Get "Frontend root" "$LocalFrontend"
Test-Get "Executive Pilot Close" "$LocalFrontend/sales/raftopoulos/executive-pilot-close"
Test-Get "Executive Leave-behind" "$LocalFrontend/sales/raftopoulos/executive-leave-behind"
Test-Get "ATLAS frontend page" "$LocalFrontend/tenant/atlas"
Test-Get "Action Center frontend page" "$LocalFrontend/tenant/atlas/action-center"
Test-Get "Closed Loop frontend page" "$LocalFrontend/tenant/closed-loop"

Write-Section "5. Result"
Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: RENDER_PRODUCTION_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: RENDER_PRODUCTION_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: RENDER_PRODUCTION_BLOCKED" -ForegroundColor Red
exit 1