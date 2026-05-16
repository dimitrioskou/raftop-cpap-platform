$ErrorActionPreference = "Continue"

$Backend = "http://localhost:5001"
$Frontend = "http://localhost:3001"
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
            $response = Invoke-WebRequest $Url -UseBasicParsing -TimeoutSec 15
        }
        else {
            $response = Invoke-WebRequest $Url -Headers $HeadersOverride -UseBasicParsing -TimeoutSec 15
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
        $response = Invoke-WebRequest $Url -Headers $Headers -UseBasicParsing -TimeoutSec 15
        return $response.Content | ConvertFrom-Json
    }
    catch {
        return $null
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 27 Executive Metrics Verification" -ForegroundColor White
Write-Host "Tenant:   $TenantId" -ForegroundColor Gray
Write-Host "Backend:  $Backend" -ForegroundColor Gray
Write-Host "Frontend: $Frontend" -ForegroundColor Gray

Write-Section "1. Backend executive metrics endpoint"
Test-Get "Executive Metrics" "$Backend/api/tenant/executive-metrics" $Headers

Write-Section "2. Executive metrics payload sanity"
$metricsPayload = Read-Json "$Backend/api/tenant/executive-metrics"

if ($null -eq $metricsPayload) {
    Write-Host "[FAIL] Executive Metrics payload is null/unreadable" -ForegroundColor Red
    $Failures += 1
}
elseif ($metricsPayload.ok -ne $true) {
    Write-Host "[FAIL] Executive Metrics payload ok != true" -ForegroundColor Red
    $Failures += 1
}
else {
    Write-Host "[OK] Executive Metrics payload ok=true" -ForegroundColor Green

    if ($metricsPayload.fallback -eq $true) {
        Write-Host "[WARNING] Executive Metrics reports fallback=true" -ForegroundColor Yellow
        $Warnings += 1
    }
    else {
        Write-Host "[OK] Executive Metrics fallback=false" -ForegroundColor Green
    }

    $readiness = $metricsPayload.readinessStatus
    if (-not $readiness) { $readiness = $metricsPayload.readiness_status }

    if ($readiness) {
        Write-Host "[OK] readinessStatus present: $readiness" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] readinessStatus missing" -ForegroundColor Red
        $Failures += 1
    }

    $kpiCount = 0
    if ($metricsPayload.kpis) { $kpiCount = $metricsPayload.kpis.Count }
    elseif ($metricsPayload.items) { $kpiCount = $metricsPayload.items.Count }
    elseif ($metricsPayload.rows) { $kpiCount = $metricsPayload.rows.Count }

    if ($kpiCount -ge 4) {
        Write-Host "[OK] KPI count: $kpiCount" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] KPI count too low: $kpiCount" -ForegroundColor Red
        $Failures += 1
    }

    if ($metricsPayload.summary) {
        Write-Host "[OK] summary object present" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] summary object missing" -ForegroundColor Red
        $Failures += 1
    }

    if ($metricsPayload.metrics) {
        Write-Host "[OK] metrics object present" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] metrics object missing" -ForegroundColor Red
        $Failures += 1
    }
}

Write-Section "3. Frontend executive pages"
Test-Get "Frontend root" "$Frontend"
Test-Get "Executive Pilot Close" "$Frontend/sales/raftopoulos/executive-pilot-close"
Test-Get "Executive Leave-behind" "$Frontend/sales/raftopoulos/executive-leave-behind"
Test-Get "Decision Room" "$Frontend/sales/raftopoulos/decision-room"
Test-Get "Business Impact" "$Frontend/tenant/business-impact"

Write-Section "4. Cross-check core operational endpoints"
Test-Get "ATLAS" "$Backend/api/tenant/atlas" $Headers
Test-Get "Action Center" "$Backend/api/tenant/atlas/action-center" $Headers
Test-Get "Closed Loop Control Summary" "$Backend/api/tenant/closed-loop/control-summary" $Headers
Test-Get "Unified Tasks" "$Backend/api/tenant/tasks-unified" $Headers
Test-Get "Patient Signals" "$Backend/api/tenant/patient-signals" $Headers

Write-Section "5. Result"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: FAILED" -ForegroundColor Red
exit 1