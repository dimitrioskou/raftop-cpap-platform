$ErrorActionPreference = "Continue"

$Backend = "http://localhost:5001"
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

function Test-Get($Name, $Url) {
    try {
        $response = Invoke-WebRequest $Url -Headers $Headers -UseBasicParsing -TimeoutSec 15

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

function Test-Post($Name, $Url, $BodyJson) {
    try {
        $response = Invoke-WebRequest `
            -Uri $Url `
            -Method POST `
            -Headers $Headers `
            -Body $BodyJson `
            -UseBasicParsing `
            -TimeoutSec 15

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
Write-Host "RAFTOP CPAP CARE Pro - Phase 25 Operational Intelligence Verification" -ForegroundColor White
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host ""

Write-Section "1. Backend Health"
Test-Get "Backend health" "$Backend/api/health"

Write-Section "2. Real Operational Endpoints"
Test-Get "Patient Signals" "$Backend/api/tenant/patient-signals"
Test-Get "Unified Tasks" "$Backend/api/tenant/tasks-unified"
Test-Get "Closed Loop Control Summary" "$Backend/api/tenant/closed-loop/control-summary"
Test-Get "ATLAS Main" "$Backend/api/tenant/atlas"
Test-Get "ATLAS Summary" "$Backend/api/tenant/atlas/summary"
Test-Get "ATLAS Queue" "$Backend/api/tenant/atlas/queue"
Test-Get "ATLAS Daily Board" "$Backend/api/tenant/atlas/daily-board"
Test-Get "ATLAS Action Center" "$Backend/api/tenant/atlas/action-center"
Test-Get "ATLAS Action Center Summary" "$Backend/api/tenant/atlas/action-center/summary"

Write-Section "3. Create Task Now Workflow"
$actionCenterPayload = Read-Json "$Backend/api/tenant/atlas/action-center"
$ActionId = $null

if ($actionCenterPayload.items -and $actionCenterPayload.items.Count -gt 0) {
    $ActionId = $actionCenterPayload.items[0].id
}
elseif ($actionCenterPayload.queue -and $actionCenterPayload.queue.Count -gt 0) {
    $ActionId = $actionCenterPayload.queue[0].id
}
elseif ($actionCenterPayload.rows -and $actionCenterPayload.rows.Count -gt 0) {
    $ActionId = $actionCenterPayload.rows[0].id
}
elseif ($actionCenterPayload.data -and $actionCenterPayload.data.items -and $actionCenterPayload.data.items.Count -gt 0) {
    $ActionId = $actionCenterPayload.data.items[0].id
}

if ($ActionId) {
    Write-Host "[INFO] Using Action Center item id: $ActionId" -ForegroundColor Gray

    Test-Post `
        "Create Task Now from Action Center" `
        "$Backend/api/tenant/atlas/action-center/$ActionId/create-task" `
        "{}"
}
else {
    Write-Host "[FAIL] No Action Center item id found for Create Task Now test" -ForegroundColor Red
    $Failures += 1
}

Write-Section "4. Payload Sanity Checks"

$patientSignals = Read-Json "$Backend/api/tenant/patient-signals"
if ($null -ne $patientSignals -and $patientSignals.ok -eq $true) {
    $count = 0
    if ($patientSignals.signals) { $count = $patientSignals.signals.Count }
    elseif ($patientSignals.items) { $count = $patientSignals.items.Count }
    elseif ($patientSignals.rows) { $count = $patientSignals.rows.Count }

    if ($count -gt 0) {
        Write-Host "[OK] Patient Signals payload has $count item(s)" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Patient Signals returned 200 but no items" -ForegroundColor Yellow
        $Warnings += 1
    }
}
else {
    Write-Host "[FAIL] Patient Signals payload is invalid" -ForegroundColor Red
    $Failures += 1
}

$tasks = Read-Json "$Backend/api/tenant/tasks-unified"
if ($null -ne $tasks -and $tasks.ok -eq $true) {
    $count = 0
    if ($tasks.tasks) { $count = $tasks.tasks.Count }
    elseif ($tasks.items) { $count = $tasks.items.Count }
    elseif ($tasks.rows) { $count = $tasks.rows.Count }
    elseif ($tasks.data -and $tasks.data.tasks) { $count = $tasks.data.tasks.Count }

    if ($count -gt 0) {
        Write-Host "[OK] Unified Tasks payload has $count item(s)" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Unified Tasks returned 200 but no items" -ForegroundColor Yellow
        $Warnings += 1
    }
}
else {
    Write-Host "[FAIL] Unified Tasks payload is invalid" -ForegroundColor Red
    $Failures += 1
}

$closedLoop = Read-Json "$Backend/api/tenant/closed-loop/control-summary"
if ($null -ne $closedLoop -and $closedLoop.ok -eq $true) {
    if ($closedLoop.readinessStatus -or $closedLoop.readiness_status) {
        Write-Host "[OK] Closed Loop readiness status present" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Closed Loop returned 200 but readiness status missing" -ForegroundColor Yellow
        $Warnings += 1
    }

    if ($closedLoop.nextBestActions -or $closedLoop.next_best_actions -or $closedLoop.items) {
        Write-Host "[OK] Closed Loop next best actions present" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Closed Loop next best actions missing" -ForegroundColor Yellow
        $Warnings += 1
    }
}
else {
    Write-Host "[FAIL] Closed Loop payload is invalid" -ForegroundColor Red
    $Failures += 1
}

$atlas = Read-Json "$Backend/api/tenant/atlas"
if ($null -ne $atlas -and $atlas.ok -eq $true) {
    $queueCount = 0
    if ($atlas.queue) { $queueCount = $atlas.queue.Count }
    elseif ($atlas.items) { $queueCount = $atlas.items.Count }
    elseif ($atlas.rows) { $queueCount = $atlas.rows.Count }

    if ($queueCount -gt 0) {
        Write-Host "[OK] ATLAS queue has $queueCount item(s)" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] ATLAS returned 200 but queue is empty" -ForegroundColor Yellow
        $Warnings += 1
    }
}
else {
    Write-Host "[FAIL] ATLAS payload is invalid" -ForegroundColor Red
    $Failures += 1
}

$actionCenter = Read-Json "$Backend/api/tenant/atlas/action-center"
if ($null -ne $actionCenter -and $actionCenter.ok -eq $true) {
    $count = 0
    if ($actionCenter.items) { $count = $actionCenter.items.Count }
    elseif ($actionCenter.queue) { $count = $actionCenter.queue.Count }
    elseif ($actionCenter.rows) { $count = $actionCenter.rows.Count }
    elseif ($actionCenter.data -and $actionCenter.data.items) { $count = $actionCenter.data.items.Count }

    if ($count -gt 0) {
        Write-Host "[OK] Action Center has $count item(s)" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Action Center returned 200 but no items" -ForegroundColor Yellow
        $Warnings += 1
    }
}
else {
    Write-Host "[FAIL] Action Center payload is invalid" -ForegroundColor Red
    $Failures += 1
}

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