$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"
$BackendRoot = Join-Path $ProjectRoot "enterprise-backend"
$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"

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
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Failed Login Dashboard Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Backend Failed Login API"
Write-Host "============================================================"

try {
    $payload = Invoke-RestMethod "$Backend/api/tenant/security/failed-logins?tenantId=$TenantId" `
        -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
        -Method GET `
        -TimeoutSec 25

    if ($payload.ok -eq $true) {
        Ok "failed login API ok=true"
    }
    else {
        Fail "failed login API ok is not true"
    }

    if ($payload.phase -eq "35A.14-failed-login-audit-api") {
        Ok "phase marker is correct"
    }
    else {
        Warn "unexpected phase marker: $($payload.phase)"
    }

    if ($payload.summary.totalFailed -ge 0) {
        Ok "summary exists"
    }
    else {
        Fail "summary missing"
    }

    if ($null -ne $payload.risk.score) {
        Ok "risk score exists"
    }
    else {
        Fail "risk score missing"
    }

    if ($null -ne $payload.byEmail) {
        Ok "byEmail array exists"
    }
    else {
        Fail "byEmail array missing"
    }

    if ($null -ne $payload.byIp) {
        Ok "byIp array exists"
    }
    else {
        Fail "byIp array missing"
    }

    if ($null -ne $payload.byReason) {
        Ok "byReason array exists"
    }
    else {
        Fail "byReason array missing"
    }

    if ($null -ne $payload.recentFailedLogins) {
        Ok "recentFailedLogins array exists"
    }
    else {
        Fail "recentFailedLogins array missing"
    }
}
catch {
    Fail "failed login API failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend route files"
Write-Host "============================================================"

Check-FileContains `
    -Label "failedLoginAudit route exists" `
    -Path "$BackendRoot\src\routes\tenant\failedLoginAudit.js" `
    -Pattern "35A.14-failed-login-audit-api"

Check-FileContains `
    -Label "server.js wires failed login route" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/tenant/security/failed-logins"

Check-FileContains `
    -Label "auth.js writes failed login audit" `
    -Path "$BackendRoot\src\routes\auth.js" `
    -Pattern "writeFailedLoginFromRequest"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Frontend dashboard files/routes"
Write-Host "============================================================"

Check-FileContains `
    -Label "TenantFailedLoginAuditPage exists" `
    -Path "$FrontendRoot\src\pages\TenantFailedLoginAuditPage.js" `
    -Pattern "Failed Login Audit"

Check-FileContains `
    -Label "TenantFailedLoginAuditPage uses backend API" `
    -Path "$FrontendRoot\src\pages\TenantFailedLoginAuditPage.js" `
    -Pattern "/api/tenant/security/failed-logins"

Check-FileContains `
    -Label "TenantRoutes has failed login route" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern 'path="/tenant/security/failed-logins"'

Check-FileContains `
    -Label "App.js has Failed Logins nav link" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "/tenant/security/failed-logins"

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
    Write-Host "FINAL STATUS: FAILED_LOGIN_DASHBOARD_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: FAILED_LOGIN_DASHBOARD_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: FAILED_LOGIN_DASHBOARD_BLOCKED" -ForegroundColor Red
exit 1