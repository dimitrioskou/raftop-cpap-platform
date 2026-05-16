$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$BackendDir = Join-Path $ProjectRoot "enterprise-backend"
$FrontendDir = Join-Path $ProjectRoot "enterprise-frontend"
$PreDemoCheck = Join-Path $ProjectRoot "tools\raftop_pre_demo_check.ps1"

$BackendUrl = "http://localhost:5001/api/health"
$FrontendUrl = "http://localhost:3001"
$DemoUrl = "http://localhost:3001/sales/raftopoulos/executive-pilot-close"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

function Test-HttpOk {
    param([string]$Url)

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
    }
    catch {
        return $false
    }
}

function Stop-PortProcess {
    param([int]$Port)

    $lines = netstat -ano | Select-String ":$Port"

    foreach ($line in $lines) {
        $text = $line.ToString()

        if ($text -match "LISTENING\s+(\d+)$") {
            $pidToKill = $matches[1]

            try {
                Write-Host "Stopping process on port $Port with PID $pidToKill" -ForegroundColor Yellow
                taskkill /PID $pidToKill /F | Out-Null
            }
            catch {
                Write-Host "Could not stop PID $pidToKill on port $Port" -ForegroundColor Yellow
            }
        }
    }
}

Write-Step "RAFTOP CPAP CARE Pro - One-click demo launcher"

Write-Host "Project root: $ProjectRoot"
Write-Host "Backend dir:  $BackendDir"
Write-Host "Frontend dir: $FrontendDir"
Write-Host "Demo URL:     $DemoUrl"

Write-Step "1. Check folders"

if (!(Test-Path $BackendDir)) {
    Write-Host "Backend folder not found: $BackendDir" -ForegroundColor Red
    exit 1
}

if (!(Test-Path $FrontendDir)) {
    Write-Host "Frontend folder not found: $FrontendDir" -ForegroundColor Red
    exit 1
}

if (!(Test-Path $PreDemoCheck)) {
    Write-Host "Pre-demo check not found: $PreDemoCheck" -ForegroundColor Red
    exit 1
}

Write-Host "Folders OK" -ForegroundColor Green

Write-Step "2. Stop old frontend process on port 3001"

Stop-PortProcess -Port 3001

Write-Step "3. Ensure backend is running"

if (Test-HttpOk -Url $BackendUrl) {
    Write-Host "Backend already running: $BackendUrl" -ForegroundColor Green
}
else {
    Write-Host "Backend is not responding. Starting backend in new PowerShell window..." -ForegroundColor Yellow

    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd `"$BackendDir`"; npm start"
    )

    Write-Host "Waiting for backend to become ready..." -ForegroundColor Yellow

    $backendReady = $false

    for ($i = 1; $i -le 30; $i++) {
        Start-Sleep -Seconds 2

        if (Test-HttpOk -Url $BackendUrl) {
            $backendReady = $true
            break
        }

        Write-Host "Backend wait attempt $i/30..."
    }

    if (-not $backendReady) {
        Write-Host "Backend did not become ready. Check backend terminal." -ForegroundColor Red
        exit 1
    }

    Write-Host "Backend ready." -ForegroundColor Green
}

Write-Step "4. Build frontend"

Set-Location $FrontendDir

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed." -ForegroundColor Red
    exit 1
}

Write-Host "Frontend build OK." -ForegroundColor Green

Write-Step "5. Start frontend static server with SPA fallback"

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$FrontendDir`"; npx serve -s build -l 3001"
)

Write-Host "Waiting for frontend to become ready..." -ForegroundColor Yellow

$frontendReady = $false

for ($i = 1; $i -le 20; $i++) {
    Start-Sleep -Seconds 2

    if (Test-HttpOk -Url $FrontendUrl) {
        $frontendReady = $true
        break
    }

    Write-Host "Frontend wait attempt $i/20..."
}

if (-not $frontendReady) {
    Write-Host "Frontend did not become ready. Check frontend terminal." -ForegroundColor Red
    exit 1
}

Write-Host "Frontend ready." -ForegroundColor Green

Write-Step "6. Run pre-demo check"

Set-Location $ProjectRoot

& $PreDemoCheck

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Pre-demo check failed. Do not present until fixed." -ForegroundColor Red
    exit 1
}

Write-Step "7. Open executive demo page"

Start-Process $DemoUrl

Write-Host ""
Write-Host "READY FOR CLIENT DEMO" -ForegroundColor Green
Write-Host "Opened: $DemoUrl" -ForegroundColor Green
Write-Host ""