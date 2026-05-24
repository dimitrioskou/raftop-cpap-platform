$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"
$BackendRoot = Join-Path $ProjectRoot "enterprise-backend"
$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"
$PatientId = "demo-patient-001"

$Failures = 0
$Warnings = 0

function Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:Failures += 1
}

function Warn {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    $script:Warnings += 1
}

function Check-FileContains {
    param(
        [string]$Label,
        [string]$Path,
        [string]$Pattern
    )

    if (!(Test-Path $Path)) {
        Fail "Missing file: $Label"
        return
    }

    $ok = Select-String -Path $Path -Pattern $Pattern -Quiet

    if ($ok) {
        Ok $Label
    }
    else {
        Fail "$Label missing pattern: $Pattern"
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Patient Night Compare Verification" -ForegroundColor Cyan
Write-Host "Backend:  $Backend" -ForegroundColor Gray
Write-Host "Tenant:   $TenantId" -ForegroundColor Gray
Write-Host "Patient:  $PatientId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Backend night compare API"
Write-Host "============================================================"

try {
    $payload = Invoke-RestMethod "$Backend/api/patient/night-compare?patientId=$PatientId" `
        -Headers @{"x-tenant-id"=$TenantId} `
        -Method GET `
        -TimeoutSec 25

    if ($payload.ok -eq $true) {
        Ok "night compare ok=true"
    }
    else {
        Fail "night compare ok is not true"
    }

    if ($payload.phase -eq "35C.14-patient-night-compare-api") {
        Ok "phase marker is correct"
    }
    else {
        Warn "unexpected phase marker: $($payload.phase)"
    }

    if ($payload.lastNight.usageHours -gt 0) {
        Ok "last night usage exists"
    }
    else {
        Fail "last night usage missing"
    }

    if ($payload.previousNight.usageHours -gt 0) {
        Ok "previous night usage exists"
    }
    else {
        Fail "previous night usage missing"
    }

    if ($payload.sevenDayAverage.usageHours -gt 0) {
        Ok "7-day average exists"
    }
    else {
        Fail "7-day average missing"
    }

    if ($payload.comparison.vsPrevious.usage) {
        Ok "vs previous comparison exists"
    }
    else {
        Fail "vs previous comparison missing"
    }

    if ($payload.comparison.vsSevenDayAverage.usage) {
        Ok "vs 7-day average comparison exists"
    }
    else {
        Fail "vs 7-day average comparison missing"
    }

    if ($payload.summary.status) {
        Ok "summary status exists"
    }
    else {
        Fail "summary status missing"
    }

    if ($null -ne $payload.signals.providerAttentionRequired) {
        Ok "provider attention flag exists"
    }
    else {
        Fail "provider attention flag missing"
    }
}
catch {
    Fail "night compare API failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend route wiring"
Write-Host "============================================================"

Check-FileContains `
    -Label "patient night compare route exists" `
    -Path "$BackendRoot\src\routes\patient\nightCompare.js" `
    -Pattern "35C.14-patient-night-compare-api"

Check-FileContains `
    -Label "server.js wires night compare route" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/patient/night-compare"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Frontend night compare files/routes"
Write-Host "============================================================"

Check-FileContains `
    -Label "PatientNightComparePage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientNightComparePage.js" `
    -Pattern "NIGHT COMPARISON"

Check-FileContains `
    -Label "PatientNightComparePage uses backend API" `
    -Path "$FrontendRoot\src\pages\patient\PatientNightComparePage.js" `
    -Pattern "/api/patient/night-compare"

Check-FileContains `
    -Label "PatientRoutes has night compare route" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/night-compare"'

Check-FileContains `
    -Label "PatientLayout has Night Compare navigation" `
    -Path "$FrontendRoot\src\patient\PatientLayout.js" `
    -Pattern "Night Compare"

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Frontend build"
Write-Host "============================================================"

Push-Location $FrontendRoot

try {
    npm run build

    if ($LASTEXITCODE -eq 0) {
        Ok "npm run build passed"
    }
    else {
        Fail "npm run build failed"
    }
}
catch {
    Fail "npm run build crashed | $($_.Exception.Message)"
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================================"
Write-Host "5. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PATIENT_NIGHT_COMPARE_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PATIENT_NIGHT_COMPARE_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PATIENT_NIGHT_COMPARE_BLOCKED" -ForegroundColor Red
exit 1