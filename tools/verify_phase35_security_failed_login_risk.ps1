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
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Security Failed Login Risk Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Backend Security Overview API"
Write-Host "============================================================"

try {
    $payload = Invoke-RestMethod "$Backend/api/tenant/security/overview?tenantId=$TenantId" `
        -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
        -Method GET `
        -TimeoutSec 25

    if ($payload.ok -eq $true) {
        Ok "security overview ok=true"
    }
    else {
        Fail "security overview ok is not true"
    }

    if ($payload.phase -eq "35A.20-security-overview-failed-login-risk") {
        Ok "phase marker is correct"
    }
    else {
        Warn "unexpected phase marker: $($payload.phase)"
    }

    if ($null -ne $payload.failedLogins) {
        Ok "failedLogins object exists"
    }
    else {
        Fail "failedLogins object missing"
    }

    if ($payload.summary.failedLoginTotal -ge 0) {
        Ok "summary.failedLoginTotal exists"
    }
    else {
        Fail "summary.failedLoginTotal missing"
    }

    if ($payload.summary.failedLoginUniqueEmails -ge 0) {
        Ok "summary.failedLoginUniqueEmails exists"
    }
    else {
        Fail "summary.failedLoginUniqueEmails missing"
    }

    if ($payload.summary.failedLoginUniqueIps -ge 0) {
        Ok "summary.failedLoginUniqueIps exists"
    }
    else {
        Fail "summary.failedLoginUniqueIps missing"
    }

    if ($null -ne $payload.summary.failedLoginRiskScore) {
        Ok "summary.failedLoginRiskScore exists"
    }
    else {
        Fail "summary.failedLoginRiskScore missing"
    }

    if ($null -ne $payload.failedLogins.risk.score) {
        Ok "failed login risk score exists"
    }
    else {
        Fail "failed login risk score missing"
    }

    if ($null -ne $payload.failedLogins.recentFailedLogins) {
        Ok "recent failed logins array exists"
    }
    else {
        Fail "recent failed logins array missing"
    }

    if ($null -ne $payload.complianceSignals.failedLogins) {
        Ok "complianceSignals.failedLogins exists"
    }
    else {
        Fail "complianceSignals.failedLogins missing"
    }

    if ($null -ne $payload.complianceSignals.hasRecentFailedLogins) {
        Ok "complianceSignals.hasRecentFailedLogins exists"
    }
    else {
        Fail "complianceSignals.hasRecentFailedLogins missing"
    }
}
catch {
    Fail "security overview API failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend route file"
Write-Host "============================================================"

Check-FileContains `
    -Label "securityOverview has failed login risk phase" `
    -Path "$BackendRoot\src\routes\tenant\securityOverview.js" `
    -Pattern "35A.20-security-overview-failed-login-risk"

Check-FileContains `
    -Label "securityOverview queries failed login audit table" `
    -Path "$BackendRoot\src\routes\tenant\securityOverview.js" `
    -Pattern "failed_login_audit_log"

Check-FileContains `
    -Label "securityOverview exposes failedLogins object" `
    -Path "$BackendRoot\src\routes\tenant\securityOverview.js" `
    -Pattern "failedLogins"

Check-FileContains `
    -Label "securityOverview exposes failed login compliance signal" `
    -Path "$BackendRoot\src\routes\tenant\securityOverview.js" `
    -Pattern "hasRecentFailedLogins"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Frontend Security Center"
Write-Host "============================================================"

Check-FileContains `
    -Label "TenantSecurityOverviewPage exists" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Tenant Security Overview"

Check-FileContains `
    -Label "Security Center shows Failed Logins metric" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Failed Logins"

Check-FileContains `
    -Label "Security Center shows Failed Login Risk" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Failed Login Risk"

Check-FileContains `
    -Label "Security Center shows Auth Risk Level" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Auth Risk Level"

Check-FileContains `
    -Label "Security Center shows Top Failed Email" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Top Failed Email"

Check-FileContains `
    -Label "Security Center shows Recent Failed Login Attempts" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Recent Failed Login Attempts"

Check-FileContains `
    -Label "Security Center links to Failed Logins page" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
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
    Write-Host "FINAL STATUS: SECURITY_FAILED_LOGIN_RISK_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: SECURITY_FAILED_LOGIN_RISK_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: SECURITY_FAILED_LOGIN_RISK_BLOCKED" -ForegroundColor Red
exit 1