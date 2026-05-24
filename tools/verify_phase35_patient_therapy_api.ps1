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
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Patient Therapy API Verification" -ForegroundColor Cyan
Write-Host "Backend:  $Backend" -ForegroundColor Gray
Write-Host "Tenant:   $TenantId" -ForegroundColor Gray
Write-Host "Patient:  $PatientId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Backend patient therapy API"
Write-Host "============================================================"

try {
    $payload = Invoke-RestMethod "$Backend/api/patient/therapy/summary?patientId=$PatientId" `
        -Headers @{"x-tenant-id"=$TenantId} `
        -Method GET `
        -TimeoutSec 25

    if ($payload.ok -eq $true) {
        Ok "patient therapy summary ok=true"
    }
    else {
        Fail "patient therapy summary ok is not true"
    }

    if ($payload.phase -eq "35C.6-patient-therapy-api") {
        Ok "phase marker is correct"
    }
    else {
        Warn "unexpected phase marker: $($payload.phase)"
    }

    if ($payload.tenantId -eq $TenantId -or $payload.tenant_id -eq $TenantId) {
        Ok "tenant id resolved correctly"
    }
    else {
        Fail "tenant id mismatch"
    }

    if ($payload.patientId -eq $PatientId -or $payload.patient_id -eq $PatientId) {
        Ok "patient id resolved correctly"
    }
    else {
        Fail "patient id mismatch"
    }

    if ($payload.summary.adherenceScore -gt 0) {
        Ok "summary adherence score exists"
    }
    else {
        Fail "summary adherence score missing"
    }

    if ($payload.lastNight.usage) {
        Ok "lastNight usage exists"
    }
    else {
        Fail "lastNight usage missing"
    }

    if (($payload.insights | Measure-Object).Count -gt 0) {
        Ok "insights exist"
    }
    else {
        Fail "insights missing"
    }

    if (($payload.actions | Measure-Object).Count -gt 0) {
        Ok "actions exist"
    }
    else {
        Fail "actions missing"
    }

    if (($payload.nights | Measure-Object).Count -ge 7) {
        Ok "7-night trend exists"
    }
    else {
        Fail "7-night trend missing or incomplete"
    }
}
catch {
    Fail "patient therapy API failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend route files"
Write-Host "============================================================"

Check-FileContains `
    -Label "patient therapy route exists" `
    -Path "$BackendRoot\src\routes\patient\therapy.js" `
    -Pattern "35C.6-patient-therapy-api"

Check-FileContains `
    -Label "server.js wires patient therapy route" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/patient/therapy"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Frontend patient files"
Write-Host "============================================================"

Check-FileContains `
    -Label "PatientLayout exists" `
    -Path "$FrontendRoot\src\patient\PatientLayout.js" `
    -Pattern "My Therapy Portal"

Check-FileContains `
    -Label "PatientDashboardPage uses patient therapy API" `
    -Path "$FrontendRoot\src\pages\patient\PatientDashboardPage.js" `
    -Pattern "/api/patient/therapy/summary"

Check-FileContains `
    -Label "PatientDashboardPage uses backend fetch" `
    -Path "$FrontendRoot\src\pages\patient\PatientDashboardPage.js" `
    -Pattern "fetchPatientTherapySummary"

Check-FileContains `
    -Label "PatientTherapyPage uses patient therapy API" `
    -Path "$FrontendRoot\src\pages\patient\PatientTherapyPage.js" `
    -Pattern "/api/patient/therapy/summary"

Check-FileContains `
    -Label "PatientTherapyPage uses backend fetch" `
    -Path "$FrontendRoot\src\pages\patient\PatientTherapyPage.js" `
    -Pattern "fetchPatientTherapySummary"

Check-FileContains `
    -Label "PatientRoutes has dashboard route" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/dashboard"'

Check-FileContains `
    -Label "PatientRoutes has therapy route" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/therapy"'

Check-FileContains `
    -Label "App.js renders PatientRoutes" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "PatientRoutes()"

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
    Write-Host "FINAL STATUS: PATIENT_THERAPY_API_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PATIENT_THERAPY_API_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PATIENT_THERAPY_API_BLOCKED" -ForegroundColor Red
exit 1