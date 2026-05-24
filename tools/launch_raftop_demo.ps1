$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$BackendRoot = Join-Path $ProjectRoot "enterprise-backend"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"
$ToolsRoot = Join-Path $ProjectRoot "tools"

$BackendPort = 5001
$FrontendPort = 3001

$BackendUrl = "http://localhost:5001"
$FrontendUrl = "http://localhost:3001"

$EvidenceScript = Join-Path $ToolsRoot "generate_pre_demo_evidence_report.ps1"

function Write-Section {
    param([string]$Title)

    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Title
    Write-Host "============================================================"
}

function Test-PortOpen {
    param([int]$Port)

    try {
        $result = Test-NetConnection localhost -Port $Port -WarningAction SilentlyContinue
        return $result.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

function Wait-ForPort {
    param(
        [string]$Label,
        [int]$Port,
        [int]$TimeoutSeconds = 90
    )

    $started = Get-Date

    while (((Get-Date) - $started).TotalSeconds -lt $TimeoutSeconds) {
        if (Test-PortOpen -Port $Port) {
            Write-Host "[OK] $Label is available on port $Port" -ForegroundColor Green
            return $true
        }

        Start-Sleep -Seconds 2
    }

    Write-Host "[FAIL] $Label did not become available on port $Port" -ForegroundColor Red
    return $false
}

function Start-BackendIfNeeded {
    if (Test-PortOpen -Port $BackendPort) {
        Write-Host "[OK] Backend already running on port $BackendPort" -ForegroundColor Green
        return
    }

    Write-Host "[START] Starting backend..." -ForegroundColor Yellow

    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        "cd '$BackendRoot'; npm start"
    )
}

function Start-FrontendIfNeeded {
    if (Test-PortOpen -Port $FrontendPort) {
        Write-Host "[OK] Frontend already running on port $FrontendPort" -ForegroundColor Green
        return
    }

    Write-Host "[START] Starting frontend..." -ForegroundColor Yellow

    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        "cd '$FrontendRoot'; npm start"
    )
}

function Open-DemoUrl {
    param(
        [string]$Label,
        [string]$Url
    )

    Write-Host "[OPEN] $Label -> $Url" -ForegroundColor Cyan
    Start-Process $Url
    Start-Sleep -Milliseconds 700
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Demo Launcher" -ForegroundColor Cyan
Write-Host "Project:  $ProjectRoot" -ForegroundColor Gray
Write-Host "Backend:  $BackendUrl" -ForegroundColor Gray
Write-Host "Frontend: $FrontendUrl" -ForegroundColor Gray

Write-Section "1. Start Services"

Start-BackendIfNeeded
Start-FrontendIfNeeded

Write-Section "2. Wait for Services"

$backendReady = Wait-ForPort -Label "Backend" -Port $BackendPort -TimeoutSeconds 90
$frontendReady = Wait-ForPort -Label "Frontend" -Port $FrontendPort -TimeoutSeconds 120

if (!$backendReady -or !$frontendReady) {
    Write-Host ""
    Write-Host "FINAL STATUS: RAFTOP_DEMO_LAUNCH_BLOCKED" -ForegroundColor Red
    exit 1
}

Write-Section "3. Backend Health"

try {
    $health = Invoke-RestMethod "$BackendUrl/api/health" -Method GET -TimeoutSec 25

    if ($health.ok -eq $true) {
        Write-Host "[OK] Backend health ok=true" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Backend health did not return ok=true" -ForegroundColor Red
        Write-Host "FINAL STATUS: RAFTOP_DEMO_LAUNCH_BLOCKED" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "[FAIL] Backend health failed | $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "FINAL STATUS: RAFTOP_DEMO_LAUNCH_BLOCKED" -ForegroundColor Red
    exit 1
}

Write-Section "4. Generate Pre-Demo Evidence"

if (!(Test-Path $EvidenceScript)) {
    Write-Host "[FAIL] Missing evidence script: $EvidenceScript" -ForegroundColor Red
    Write-Host "FINAL STATUS: RAFTOP_DEMO_LAUNCH_BLOCKED" -ForegroundColor Red
    exit 1
}

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $EvidenceScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Evidence report failed" -ForegroundColor Red
    Write-Host "FINAL STATUS: RAFTOP_DEMO_LAUNCH_BLOCKED" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Evidence report ready" -ForegroundColor Green

Write-Section "5. Open Demo Pages"

Open-DemoUrl -Label "Main App" -Url "$FrontendUrl"
Open-DemoUrl -Label "Tenant Dashboard" -Url "$FrontendUrl/tenant/dashboard"
Open-DemoUrl -Label "Security Command Center" -Url "$FrontendUrl/tenant/security"
Open-DemoUrl -Label "User Activity Audit" -Url "$FrontendUrl/tenant/security/user-activity"
Open-DemoUrl -Label "Failed Login Audit" -Url "$FrontendUrl/tenant/security/failed-logins"
Open-DemoUrl -Label "Patient Portal" -Url "$FrontendUrl/patient/dashboard"
Open-DemoUrl -Label "Patient Therapy" -Url "$FrontendUrl/patient/therapy"
Open-DemoUrl -Label "Patient Nightly Analysis" -Url "$FrontendUrl/patient/nightly-analysis"
Open-DemoUrl -Label "Patient Night Compare" -Url "$FrontendUrl/patient/night-compare"

Write-Section "6. Final Result"

Write-Host "Backend:  READY" -ForegroundColor Green
Write-Host "Frontend: READY" -ForegroundColor Green
Write-Host "Evidence: READY" -ForegroundColor Green
Write-Host ""
Write-Host "FINAL STATUS: RAFTOP_DEMO_LAUNCH_READY" -ForegroundColor Green
exit 0