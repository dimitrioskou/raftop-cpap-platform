$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"

$BackendDir = Join-Path $ProjectRoot "enterprise-backend"
$FrontendDir = Join-Path $ProjectRoot "enterprise-frontend"

$Failures = 0
$Warnings = 0

function Write-Section($Title) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor DarkGray
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor DarkGray
}

function Check-File($Name, $Path) {
    if (Test-Path $Path) {
        Write-Host "[OK] $Name" -ForegroundColor Green
        return $true
    }

    Write-Host "[FAIL] Missing $Name => $Path" -ForegroundColor Red
    $script:Failures += 1
    return $false
}

function Check-Text($Name, $Path, $Needle) {
    if (-not (Test-Path $Path)) {
        Write-Host "[FAIL] $Name file missing => $Path" -ForegroundColor Red
        $script:Failures += 1
        return $false
    }

    $content = Get-Content $Path -Raw

    if ($content -like "*$Needle*") {
        Write-Host "[OK] $Name contains: $Needle" -ForegroundColor Green
        return $true
    }

    Write-Host "[FAIL] $Name missing: $Needle" -ForegroundColor Red
    $script:Failures += 1
    return $false
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 28B Production Deployment Lockdown" -ForegroundColor White
Write-Host "Project: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

Write-Section "1. Required package files"
Check-File "Backend package.json" (Join-Path $BackendDir "package.json")
Check-File "Frontend package.json" (Join-Path $FrontendDir "package.json")
Check-File "Backend server.js" (Join-Path $BackendDir "src\server.js")
Check-File "Frontend App.js" (Join-Path $FrontendDir "src\App.js")

Write-Section "2. Backend production route registration"
$ServerPath = Join-Path $BackendDir "src\server.js"

Check-Text "server.js" $ServerPath "routes/tenant/executiveMetrics"
Check-Text "server.js" $ServerPath "/api/tenant/executive-metrics"
Check-Text "server.js" $ServerPath "/api/tenant/atlas"
Check-Text "server.js" $ServerPath "/api/tenant/atlas/action-center"
Check-Text "server.js" $ServerPath "/api/tenant/closed-loop"
Check-Text "server.js" $ServerPath "/api/tenant/tasks-unified"
Check-Text "server.js" $ServerPath "/api/tenant/patient-signals"

Write-Section "3. Frontend production env integrity"
$EnvProductionPath = Join-Path $FrontendDir ".env.production"

Check-File ".env.production" $EnvProductionPath

if (Test-Path $EnvProductionPath) {
    $envContent = Get-Content $EnvProductionPath -Raw

    if ($envContent -like "*REACT_APP_API_URL=*") {
        Write-Host "[OK] REACT_APP_API_URL exists" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] REACT_APP_API_URL missing" -ForegroundColor Red
        $Failures += 1
    }

    if ($envContent -like "*localhost:5001*") {
        Write-Host "[WARNING] .env.production points to localhost. OK for local production build, NOT OK for Render production." -ForegroundColor Yellow
        $Warnings += 1
    }
    else {
        Write-Host "[OK] .env.production does not point to localhost" -ForegroundColor Green
    }
}

Write-Section "4. Frontend live binding files"
Check-Text "OperationalCommandCenter.js" (Join-Path $FrontendDir "src\components\OperationalCommandCenter.js") "/api/tenant/atlas"
Check-Text "OperationalCommandCenter.js" (Join-Path $FrontendDir "src\components\OperationalCommandCenter.js") "/api/tenant/closed-loop/control-summary"
Check-Text "OperationalCommandCenter.js" (Join-Path $FrontendDir "src\components\OperationalCommandCenter.js") "/api/tenant/atlas/action-center"
Check-Text "ExecutiveKpiRibbon.js" (Join-Path $FrontendDir "src\components\ExecutiveKpiRibbon.js") "/api/tenant/executive-metrics"

Write-Section "5. Critical verification scripts"
Check-File "Final commercial demo gate" (Join-Path $ProjectRoot "tools\raftop_final_commercial_demo_gate.ps1")
Check-File "Phase 27 executive metrics verification" (Join-Path $ProjectRoot "tools\verify_phase27_executive_metrics.ps1")
Check-File "Phase 28 production package audit" (Join-Path $ProjectRoot "tools\verify_phase28_production_package.ps1")

Write-Section "6. Result"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PRODUCTION_LOCKDOWN_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PRODUCTION_LOCKDOWN_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PRODUCTION_LOCKDOWN_BLOCKED" -ForegroundColor Red
exit 1