$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"

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
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Patient Layer Verification" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================================"
Write-Host "1. Patient source files"
Write-Host "============================================================"

Check-FileContains `
    -Label "PatientLayout exists" `
    -Path "$FrontendRoot\src\patient\PatientLayout.js" `
    -Pattern "My Therapy Portal"

Check-FileContains `
    -Label "PatientDashboardPage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientDashboardPage.js" `
    -Pattern "Adherence Score"

Check-FileContains `
    -Label "PatientTherapyPage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientTherapyPage.js" `
    -Pattern "Nightly Therapy Summary"

Check-FileContains `
    -Label "PatientRoutes exists" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern "PatientRoutes"

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Patient routes wiring"
Write-Host "============================================================"

Check-FileContains `
    -Label "PatientRoutes has dashboard route" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/dashboard"'

Check-FileContains `
    -Label "PatientRoutes has therapy route" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/therapy"'

Check-FileContains `
    -Label "App.js imports PatientRoutes" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "PatientRoutes"

Check-FileContains `
    -Label "App.js renders PatientRoutes" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "PatientRoutes()"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Frontend build"
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
Write-Host "4. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PATIENT_LAYER_READY" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PATIENT_LAYER_BLOCKED" -ForegroundColor Red
exit 1