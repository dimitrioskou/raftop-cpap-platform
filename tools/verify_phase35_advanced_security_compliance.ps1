$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"
$BackendRoot = Join-Path $ProjectRoot "enterprise-backend"
$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"
$PatientId = "demo-patient-001"
$DbUrl = "postgresql://postgres:postgres@localhost:5432/cpap_care"
$Psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

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

function Expect-Status {
    param(
        [string]$Label,
        [string]$Url,
        [hashtable]$Headers,
        [int]$ExpectedStatus
    )

    try {
        $response = Invoke-WebRequest $Url `
            -Headers $Headers `
            -UseBasicParsing `
            -TimeoutSec 25

        $actual = [int]$response.StatusCode

        if ($actual -eq $ExpectedStatus) {
            Ok "$Label => $actual"
        }
        else {
            Fail "$Label expected $ExpectedStatus got $actual"
        }
    }
    catch {
        $actual = 0

        if ($_.Exception.Response) {
            $actual = [int]$_.Exception.Response.StatusCode
        }

        if ($actual -eq $ExpectedStatus) {
            Ok "$Label => $actual"
        }
        else {
            Fail "$Label expected $ExpectedStatus got $actual | $($_.Exception.Message)"

            if ($_.ErrorDetails.Message) {
                Write-Host "      $($_.ErrorDetails.Message)" -ForegroundColor DarkGray
            }
        }
    }
}

function Query-Scalar {
    param([string]$Sql)

    $result = & $Psql $DbUrl -t -A -c $Sql
    return ([string]$result).Trim()
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 35A Advanced Security & Compliance Readiness" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray
Write-Host "Patient: $PatientId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Backend health"
Write-Host "============================================================"

Expect-Status `
    -Label "Backend health" `
    -Url "$Backend/api/health" `
    -Headers @{} `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Database security/compliance tables"
Write-Host "============================================================"

$userActivityTable = Query-Scalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='user_activity_audit_log';"

if ($userActivityTable -eq "1") {
    Ok "user_activity_audit_log table exists"
}
else {
    Fail "user_activity_audit_log table missing"
}

$failedLoginTable = Query-Scalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='failed_login_audit_log';"

if ($failedLoginTable -eq "1") {
    Ok "failed_login_audit_log table exists"
}
else {
    Fail "failed_login_audit_log table missing"
}

$aclAuditTable = Query-Scalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='acl_audit_log';"

if ($aclAuditTable -eq "1") {
    Ok "acl_audit_log table exists"
}
else {
    Warn "acl_audit_log table missing or not detected"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Generate fresh audit events"
Write-Host "============================================================"

Expect-Status `
    -Label "Tenant patients endpoint generates user activity audit" `
    -Url "$Backend/api/tenant/patients" `
    -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
    -ExpectedStatus 200

Expect-Status `
    -Label "Patient API allowed with tenant + patient" `
    -Url "$Backend/api/patient/therapy/summary?patientId=$PatientId" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedStatus 200

Expect-Status `
    -Label "Patient API blocked without patient id" `
    -Url "$Backend/api/patient/therapy/summary" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedStatus 401

try {
    Invoke-WebRequest "$Backend/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"wrong-user@test.local","password":"wrong-password","tenantId":"raftopoulos-live"}' `
        -UseBasicParsing `
        -TimeoutSec 25 | Out-Null

    Fail "Unknown login unexpectedly succeeded"
}
catch {
    $actual = 0

    if ($_.Exception.Response) {
        $actual = [int]$_.Exception.Response.StatusCode
    }

    if ($actual -eq 401) {
        Ok "Unknown login produces 401"
    }
    else {
        Fail "Unknown login expected 401 got $actual"
    }
}

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Database audit rows"
Write-Host "============================================================"

$userActivityRows = Query-Scalar "SELECT COUNT(*) FROM user_activity_audit_log WHERE tenant_id='$TenantId' AND path='/api/tenant/patients' AND status_code=200;"

if ([int]$userActivityRows -gt 0) {
    Ok "tenant user activity audit rows exist"
}
else {
    Fail "tenant user activity audit rows missing"
}

$patientBlockedRows = Query-Scalar "SELECT COUNT(*) FROM user_activity_audit_log WHERE tenant_id='$TenantId' AND path='/api/patient/therapy/summary' AND status_code=401 AND success=false;"

if ([int]$patientBlockedRows -gt 0) {
    Ok "blocked patient access audit rows exist"
}
else {
    Fail "blocked patient access audit rows missing"
}

$failedLoginRows = Query-Scalar "SELECT COUNT(*) FROM failed_login_audit_log WHERE tenant_id='$TenantId' AND email='wrong-user@test.local' AND reason='UNKNOWN_EMAIL_OR_INVALID_DEV_CREDENTIALS' AND status_code=401;"

if ([int]$failedLoginRows -gt 0) {
    Ok "failed login audit rows exist"
}
else {
    Fail "failed login audit rows missing"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "5. Security/compliance APIs"
Write-Host "============================================================"

try {
    $securityPayload = Invoke-RestMethod "$Backend/api/tenant/security/overview?tenantId=$TenantId" `
        -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
        -Method GET `
        -TimeoutSec 25

    if ($securityPayload.ok -eq $true) {
        Ok "security overview ok=true"
    }
    else {
        Fail "security overview ok is not true"
    }

    if ($securityPayload.phase -eq "35A.20-security-overview-failed-login-risk") {
        Ok "security overview phase marker correct"
    }
    else {
        Warn "unexpected security overview phase marker: $($securityPayload.phase)"
    }

    if ($null -ne $securityPayload.userActivity) {
        Ok "security overview includes userActivity"
    }
    else {
        Fail "security overview missing userActivity"
    }

    if ($null -ne $securityPayload.failedLogins) {
        Ok "security overview includes failedLogins"
    }
    else {
        Fail "security overview missing failedLogins"
    }

    if ($null -ne $securityPayload.complianceSignals) {
        Ok "security overview includes complianceSignals"
    }
    else {
        Fail "security overview missing complianceSignals"
    }

    if ($null -ne $securityPayload.risk.score) {
        Ok "security overview risk score exists"
    }
    else {
        Fail "security overview risk score missing"
    }
}
catch {
    Fail "security overview API failed | $($_.Exception.Message)"
}

try {
    $activityPayload = Invoke-RestMethod "$Backend/api/tenant/security/user-activity?tenantId=$TenantId" `
        -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
        -Method GET `
        -TimeoutSec 25

    if ($activityPayload.ok -eq $true) {
        Ok "user activity API ok=true"
    }
    else {
        Fail "user activity API ok is not true"
    }

    if ($activityPayload.phase -eq "35A.5-user-activity-audit-api") {
        Ok "user activity API phase marker correct"
    }
    else {
        Warn "unexpected user activity phase marker: $($activityPayload.phase)"
    }
}
catch {
    Fail "user activity API failed | $($_.Exception.Message)"
}

try {
    $failedLoginPayload = Invoke-RestMethod "$Backend/api/tenant/security/failed-logins?tenantId=$TenantId" `
        -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
        -Method GET `
        -TimeoutSec 25

    if ($failedLoginPayload.ok -eq $true) {
        Ok "failed login API ok=true"
    }
    else {
        Fail "failed login API ok is not true"
    }

    if ($failedLoginPayload.phase -eq "35A.14-failed-login-audit-api") {
        Ok "failed login API phase marker correct"
    }
    else {
        Warn "unexpected failed login phase marker: $($failedLoginPayload.phase)"
    }
}
catch {
    Fail "failed login API failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "6. Backend source files"
Write-Host "============================================================"

Check-FileContains `
    -Label "userActivityAuditService exists" `
    -Path "$BackendRoot\src\services\userActivityAuditService.js" `
    -Pattern "writeUserActivityAudit"

Check-FileContains `
    -Label "userActivityAuditMiddleware exists" `
    -Path "$BackendRoot\src\middleware\userActivityAuditMiddleware.js" `
    -Pattern "USER_ACTIVITY_AUDIT_ENABLED"

Check-FileContains `
    -Label "failedLoginAuditService exists" `
    -Path "$BackendRoot\src\services\failedLoginAuditService.js" `
    -Pattern "writeFailedLoginFromRequest"

Check-FileContains `
    -Label "auth.js captures failed logins" `
    -Path "$BackendRoot\src\routes\auth.js" `
    -Pattern "UNKNOWN_EMAIL_OR_INVALID_DEV_CREDENTIALS"

Check-FileContains `
    -Label "userActivityAudit tenant route exists" `
    -Path "$BackendRoot\src\routes\tenant\userActivityAudit.js" `
    -Pattern "35A.5-user-activity-audit-api"

Check-FileContains `
    -Label "failedLoginAudit tenant route exists" `
    -Path "$BackendRoot\src\routes\tenant\failedLoginAudit.js" `
    -Pattern "35A.14-failed-login-audit-api"

Check-FileContains `
    -Label "securityOverview includes failed login risk" `
    -Path "$BackendRoot\src\routes\tenant\securityOverview.js" `
    -Pattern "35A.20-security-overview-failed-login-risk"

Write-Host ""
Write-Host "============================================================"
Write-Host "7. Frontend security pages/routes"
Write-Host "============================================================"

Check-FileContains `
    -Label "TenantSecurityOverviewPage exists" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Tenant Security Overview"

Check-FileContains `
    -Label "Security Center shows User Activity" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "User Activity Events"

Check-FileContains `
    -Label "Security Center shows Failed Logins" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Failed Logins"

Check-FileContains `
    -Label "Security Center shows Compliance Signals" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Compliance Signals"

Check-FileContains `
    -Label "TenantUserActivityAuditPage exists" `
    -Path "$FrontendRoot\src\pages\TenantUserActivityAuditPage.js" `
    -Pattern "User Activity Audit"

Check-FileContains `
    -Label "TenantFailedLoginAuditPage exists" `
    -Path "$FrontendRoot\src\pages\TenantFailedLoginAuditPage.js" `
    -Pattern "Failed Login Audit"

Check-FileContains `
    -Label "TenantRoutes has User Activity route" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern 'path="/tenant/security/user-activity"'

Check-FileContains `
    -Label "TenantRoutes has Failed Logins route" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern 'path="/tenant/security/failed-logins"'

Check-FileContains `
    -Label "App.js has Failed Logins nav" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "/tenant/security/failed-logins"

Write-Host ""
Write-Host "============================================================"
Write-Host "8. Frontend build"
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
Write-Host "9. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: ADVANCED_SECURITY_COMPLIANCE_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: ADVANCED_SECURITY_COMPLIANCE_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: ADVANCED_SECURITY_COMPLIANCE_BLOCKED" -ForegroundColor Red
exit 1