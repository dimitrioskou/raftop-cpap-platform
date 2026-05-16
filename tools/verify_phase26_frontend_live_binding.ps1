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

function Assert-TextPresent($Name, $Url, $Text) {
    try {
        $response = Invoke-WebRequest $Url -UseBasicParsing -TimeoutSec 15

        if ($response.Content -like "*$Text*") {
            Write-Host "[OK] $Name contains '$Text'" -ForegroundColor Green
            return $true
        }

        Write-Host "[WARNING] $Name does not contain '$Text' in static HTML. This can be normal for React build." -ForegroundColor Yellow
        $script:Warnings += 1
        return $false
    }
    catch {
        Write-Host "[FAIL] $Name static text check failed: $($_.Exception.Message)" -ForegroundColor Red
        $script:Failures += 1
        return $false
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 26 Frontend Live Binding Verification" -ForegroundColor White
Write-Host "Tenant:   $TenantId" -ForegroundColor Gray
Write-Host "Backend:  $Backend" -ForegroundColor Gray
Write-Host "Frontend: $Frontend" -ForegroundColor Gray
Write-Host ""

Write-Section "1. Backend operational endpoints"
Test-Get "Backend health" "$Backend/api/health"
Test-Get "ATLAS live endpoint" "$Backend/api/tenant/atlas" $Headers
Test-Get "Closed Loop live endpoint" "$Backend/api/tenant/closed-loop/control-summary" $Headers
Test-Get "Action Center live endpoint" "$Backend/api/tenant/atlas/action-center" $Headers

Write-Section "2. Backend payload sanity"
$atlas = Read-Json "$Backend/api/tenant/atlas"
if ($null -ne $atlas -and $atlas.ok -eq $true) {
    $queueCount = 0
    if ($atlas.queue) { $queueCount = $atlas.queue.Count }
    elseif ($atlas.items) { $queueCount = $atlas.items.Count }
    elseif ($atlas.rows) { $queueCount = $atlas.rows.Count }

    if ($queueCount -gt 0) {
        Write-Host "[OK] ATLAS has live queue item(s): $queueCount" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] ATLAS returned 200 but queue is empty" -ForegroundColor Red
        $Failures += 1
    }

    if ($atlas.fallback -eq $true) {
        Write-Host "[WARNING] ATLAS reports fallback=true" -ForegroundColor Yellow
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

$closedLoop = Read-Json "$Backend/api/tenant/closed-loop/control-summary"
if ($null -ne $closedLoop -and $closedLoop.ok -eq $true) {
    $readiness = $closedLoop.readinessStatus
    if (-not $readiness) { $readiness = $closedLoop.readiness_status }

    if ($readiness) {
        Write-Host "[OK] Closed Loop readiness: $readiness" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Closed Loop readiness missing" -ForegroundColor Red
        $Failures += 1
    }

    if ($closedLoop.fallback -eq $true) {
        Write-Host "[WARNING] Closed Loop reports fallback=true" -ForegroundColor Yellow
        $Warnings += 1
    }
    else {
        Write-Host "[OK] Closed Loop fallback=false" -ForegroundColor Green
    }
}
else {
    Write-Host "[FAIL] Closed Loop payload invalid" -ForegroundColor Red
    $Failures += 1
}

$actionCenter = Read-Json "$Backend/api/tenant/atlas/action-center"
if ($null -ne $actionCenter -and $actionCenter.ok -eq $true) {
    $itemCount = 0
    if ($actionCenter.items) { $itemCount = $actionCenter.items.Count }
    elseif ($actionCenter.queue) { $itemCount = $actionCenter.queue.Count }
    elseif ($actionCenter.rows) { $itemCount = $actionCenter.rows.Count }
    elseif ($actionCenter.data -and $actionCenter.data.items) { $itemCount = $actionCenter.data.items.Count }

    if ($itemCount -gt 0) {
        Write-Host "[OK] Action Center has live item(s): $itemCount" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Action Center returned 200 but no items" -ForegroundColor Red
        $Failures += 1
    }

    if ($actionCenter.fallback -eq $true) {
        Write-Host "[WARNING] Action Center reports fallback=true" -ForegroundColor Yellow
        $Warnings += 1
    }
    else {
        Write-Host "[OK] Action Center fallback=false" -ForegroundColor Green
    }
}
else {
    Write-Host "[FAIL] Action Center payload invalid" -ForegroundColor Red
    $Failures += 1
}

Write-Section "3. Frontend pages"
Test-Get "Frontend root" "$Frontend"
Test-Get "Executive Pilot Close page" "$Frontend/sales/raftopoulos/executive-pilot-close"
Test-Get "Executive Leave-behind page" "$Frontend/sales/raftopoulos/executive-leave-behind"
Test-Get "ATLAS page" "$Frontend/tenant/atlas"
Test-Get "Closed Loop page" "$Frontend/tenant/closed-loop"
Test-Get "Action Center page" "$Frontend/tenant/atlas/action-center"

Write-Section "4. Static build marker checks"
Assert-TextPresent "Executive Pilot Close static HTML" "$Frontend/sales/raftopoulos/executive-pilot-close" "root"

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