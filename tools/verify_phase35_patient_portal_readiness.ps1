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

function Check-Endpoint {
    param(
        [string]$Label,
        [string]$Url,
        [string]$ExpectedPhase
    )

    try {
        $payload = Invoke-RestMethod $Url `
            -Headers @{"x-tenant-id"=$TenantId} `
            -Method GET `
            -TimeoutSec 25

        if ($payload.ok -eq $true) {
            Ok "$Label ok=true"
        }
        else {
            Fail "$Label ok is not true"
        }

        if ($ExpectedPhase -and $payload.phase -eq $ExpectedPhase) {
            Ok "$Label phase marker correct"
        }
        elseif ($ExpectedPhase) {
            Warn "$Label phase marker unexpected: $($payload.phase)"
        }
    }
    catch {
        Fail "$Label failed | $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Patient Portal Readiness Verification" -ForegroundColor Cyan
Write-Host "Backend:  $Backend" -ForegroundColor Gray
Write-Host "Tenant:   $TenantId" -ForegroundColor Gray
Write-Host "Patient:  $PatientId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Backend patient APIs"
Write-Host "============================================================"

Check-Endpoint `
    -Label "Patient Therapy Summary API" `
    -Url "$Backend/api/patient/therapy/summary?patientId=$PatientId" `
    -ExpectedPhase "35C.6-patient-therapy-api"

Check-Endpoint `
    -Label "Patient Nightly Analysis API" `
    -Url "$Backend/api/patient/nightly-analysis?patientId=$PatientId" `
    -ExpectedPhase "35C.10-patient-nightly-analysis-engine"

Check-Endpoint `
    -Label "Patient Night Compare API" `
    -Url "$Backend/api/patient/night-compare?patientId=$PatientId" `
    -ExpectedPhase "35C.14-patient-night-compare-api"

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend route files"
Write-Host "============================================================"

Check-FileContains `
    -Label "Therapy route exists" `
    -Path "$BackendRoot\src\routes\patient\therapy.js" `
    -Pattern "patient-therapy-demo-engine"

Check-FileContains `
    -Label "Nightly Analysis route exists" `
    -Path "$BackendRoot\src\routes\patient\nightlyAnalysis.js" `
    -Pattern "patient-nightly-analysis-engine"

Check-FileContains `
    -Label "Night Compare route exists" `
    -Path "$BackendRoot\src\routes\patient\nightCompare.js" `
    -Pattern "patient-night-compare-engine"

Check-FileContains `
    -Label "server.js wires patient therapy" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/patient/therapy"

Check-FileContains `
    -Label "server.js wires nightly analysis" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/patient/nightly-analysis"

Check-FileContains `
    -Label "server.js wires night compare" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/patient/night-compare"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Frontend patient pages"
Write-Host "============================================================"

Check-FileContains `
    -Label "PatientLayout exists" `
    -Path "$FrontendRoot\src\patient\PatientLayout.js" `
    -Pattern "My Therapy Portal"

Check-FileContains `
    -Label "PatientDashboardPage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientDashboardPage.js" `
    -Pattern "TODAY"

Check-FileContains `
    -Label "PatientTherapyPage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientTherapyPage.js" `
    -Pattern "NIGHTLY THERAPY SUMMARY"

Check-FileContains `
    -Label "PatientNightlyAnalysisPage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientNightlyAnalysisPage.js" `
    -Pattern "SLEEPHQ-STYLE NIGHTLY ANALYSIS"

Check-FileContains `
    -Label "PatientNightComparePage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientNightComparePage.js" `
    -Pattern "NIGHT COMPARISON"

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Frontend patient routes/navigation"
Write-Host "============================================================"

Check-FileContains `
    -Label "PatientRoutes has dashboard" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/dashboard"'

Check-FileContains `
    -Label "PatientRoutes has therapy" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/therapy"'

Check-FileContains `
    -Label "PatientRoutes has nightly analysis" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/nightly-analysis"'

Check-FileContains `
    -Label "PatientRoutes has night compare" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/night-compare"'

Check-FileContains `
    -Label "PatientLayout has Dashboard nav" `
    -Path "$FrontendRoot\src\patient\PatientLayout.js" `
    -Pattern "Dashboard"

Check-FileContains `
    -Label "PatientLayout has Therapy nav" `
    -Path "$FrontendRoot\src\patient\PatientLayout.js" `
    -Pattern "Therapy"

Check-FileContains `
    -Label "PatientLayout has Nightly Analysis nav" `
    -Path "$FrontendRoot\src\patient\PatientLayout.js" `
    -Pattern "Nightly Analysis"

Check-FileContains `
    -Label "PatientLayout has Night Compare nav" `
    -Path "$FrontendRoot\src\patient\PatientLayout.js" `
    -Pattern "Night Compare"

Check-FileContains `
    -Label "App.js renders PatientRoutes" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "PatientRoutes()"

Write-Host ""
Write-Host "============================================================"
Write-Host "5. Frontend build"
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
Write-Host "6. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PATIENT_PORTAL_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PATIENT_PORTAL_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PATIENT_PORTAL_BLOCKED" -ForegroundColor Red
exit 1