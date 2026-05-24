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
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Patient Nightly Analysis Verification" -ForegroundColor Cyan
Write-Host "Backend:  $Backend" -ForegroundColor Gray
Write-Host "Tenant:   $TenantId" -ForegroundColor Gray
Write-Host "Patient:  $PatientId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Backend nightly analysis API"
Write-Host "============================================================"

try {
    $payload = Invoke-RestMethod "$Backend/api/patient/nightly-analysis?patientId=$PatientId" `
        -Headers @{"x-tenant-id"=$TenantId} `
        -Method GET `
        -TimeoutSec 25

    if ($payload.ok -eq $true) {
        Ok "nightly analysis ok=true"
    }
    else {
        Fail "nightly analysis ok is not true"
    }

    if ($payload.phase -eq "35C.10-patient-nightly-analysis-engine") {
        Ok "phase marker is correct"
    }
    else {
        Warn "unexpected phase marker: $($payload.phase)"
    }

    if ($payload.score.nightScore -gt 0) {
        Ok "night score exists"
    }
    else {
        Fail "night score missing"
    }

    if ($payload.interpretation.usageQuality) {
        Ok "usage interpretation exists"
    }
    else {
        Fail "usage interpretation missing"
    }

    if (($payload.insights | Measure-Object).Count -gt 0) {
        Ok "nightly insights exist"
    }
    else {
        Fail "nightly insights missing"
    }

    if (($payload.recommendations | Measure-Object).Count -gt 0) {
        Ok "patient recommendations exist"
    }
    else {
        Fail "patient recommendations missing"
    }

    if ($null -ne $payload.providerEscalation.required) {
        Ok "provider escalation flag exists"
    }
    else {
        Fail "provider escalation flag missing"
    }
}
catch {
    Fail "nightly analysis API failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend route wiring"
Write-Host "============================================================"

Check-FileContains `
    -Label "patient nightly analysis route exists" `
    -Path "$BackendRoot\src\routes\patient\nightlyAnalysis.js" `
    -Pattern "35C.10-patient-nightly-analysis-engine"

Check-FileContains `
    -Label "server.js wires nightly analysis route" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/patient/nightly-analysis"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Frontend nightly analysis files/routes"
Write-Host "============================================================"

Check-FileContains `
    -Label "PatientNightlyAnalysisPage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientNightlyAnalysisPage.js" `
    -Pattern "SLEEPHQ-STYLE NIGHTLY ANALYSIS"

Check-FileContains `
    -Label "PatientNightlyAnalysisPage uses backend API" `
    -Path "$FrontendRoot\src\pages\patient\PatientNightlyAnalysisPage.js" `
    -Pattern "/api/patient/nightly-analysis"

Check-FileContains `
    -Label "PatientRoutes has nightly analysis route" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/nightly-analysis"'

Check-FileContains `
    -Label "PatientLayout has Nightly Analysis navigation" `
    -Path "$FrontendRoot\src\patient\PatientLayout.js" `
    -Pattern "Nightly Analysis"

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
    Write-Host "FINAL STATUS: PATIENT_NIGHTLY_ANALYSIS_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PATIENT_NIGHTLY_ANALYSIS_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PATIENT_NIGHTLY_ANALYSIS_BLOCKED" -ForegroundColor Red
exit 1