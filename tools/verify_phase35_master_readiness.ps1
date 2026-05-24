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

function Expect-JsonPhase {
    param(
        [string]$Label,
        [string]$Url,
        [hashtable]$Headers,
        [string]$ExpectedPhase
    )

    try {
        $payload = Invoke-RestMethod $Url `
            -Headers $Headers `
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
            Warn "$Label unexpected phase marker: $($payload.phase)"
        }
    }
    catch {
        Fail "$Label failed | $($_.Exception.Message)"
    }
}

function Query-Scalar {
    param([string]$Sql)

    $result = & $Psql $DbUrl -t -A -c $Sql
    return ([string]$result).Trim()
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Master Readiness Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray
Write-Host "Patient: $PatientId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Backend Health"
Write-Host "============================================================"

Expect-Status `
    -Label "Backend health" `
    -Url "$Backend/api/health" `
    -Headers @{} `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Database Tables"
Write-Host "============================================================"

$tables = @(
    "tenant_subscriptions",
    "user_activity_audit_log",
    "failed_login_audit_log",
    "acl_audit_log"
)

foreach ($table in $tables) {
    $exists = Query-Scalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$table';"

    if ($exists -eq "1") {
        Ok "$table exists"
    }
    else {
        Fail "$table missing"
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Patient Portal APIs"
Write-Host "============================================================"

Expect-JsonPhase `
    -Label "Patient Therapy Summary API" `
    -Url "$Backend/api/patient/therapy/summary?patientId=$PatientId" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedPhase "35C.6-patient-therapy-api"

Expect-JsonPhase `
    -Label "Patient Nightly Analysis API" `
    -Url "$Backend/api/patient/nightly-analysis?patientId=$PatientId" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedPhase "35C.10-patient-nightly-analysis-engine"

Expect-JsonPhase `
    -Label "Patient Night Compare API" `
    -Url "$Backend/api/patient/night-compare?patientId=$PatientId" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedPhase "35C.14-patient-night-compare-api"

Expect-Status `
    -Label "Patient Access Guard blocks missing patientId" `
    -Url "$Backend/api/patient/therapy/summary" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedStatus 401

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Security & Compliance APIs"
Write-Host "============================================================"

Expect-JsonPhase `
    -Label "Security Overview API" `
    -Url "$Backend/api/tenant/security/overview?tenantId=$TenantId" `
    -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
    -ExpectedPhase "35A.20-security-overview-failed-login-risk"

Expect-JsonPhase `
    -Label "User Activity Audit API" `
    -Url "$Backend/api/tenant/security/user-activity?tenantId=$TenantId" `
    -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
    -ExpectedPhase "35A.5-user-activity-audit-api"

Expect-JsonPhase `
    -Label "Failed Login Audit API" `
    -Url "$Backend/api/tenant/security/failed-logins?tenantId=$TenantId" `
    -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
    -ExpectedPhase "35A.14-failed-login-audit-api"

Write-Host ""
Write-Host "============================================================"
Write-Host "5. Generate Fresh Audit Events"
Write-Host "============================================================"

Expect-Status `
    -Label "Tenant patients endpoint" `
    -Url "$Backend/api/tenant/patients" `
    -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
    -ExpectedStatus 200

Expect-Status `
    -Label "Patient blocked request" `
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

    Fail "Unknown failed login unexpectedly succeeded"
}
catch {
    $actual = 0

    if ($_.Exception.Response) {
        $actual = [int]$_.Exception.Response.StatusCode
    }

    if ($actual -eq 401) {
        Ok "Unknown failed login produces 401"
    }
    else {
        Fail "Unknown failed login expected 401 got $actual"
    }
}

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "============================================================"
Write-Host "6. Audit Row Verification"
Write-Host "============================================================"

$userActivityRows = Query-Scalar "SELECT COUNT(*) FROM user_activity_audit_log WHERE tenant_id='$TenantId' AND path='/api/tenant/patients' AND status_code=200;"

if ([int]$userActivityRows -gt 0) {
    Ok "User activity audit rows exist"
}
else {
    Fail "User activity audit rows missing"
}

$blockedPatientRows = Query-Scalar "SELECT COUNT(*) FROM user_activity_audit_log WHERE tenant_id='$TenantId' AND path='/api/patient/therapy/summary' AND status_code=401 AND success=false;"

if ([int]$blockedPatientRows -gt 0) {
    Ok "Blocked patient access audit rows exist"
}
else {
    Fail "Blocked patient access audit rows missing"
}

$failedLoginRows = Query-Scalar "SELECT COUNT(*) FROM failed_login_audit_log WHERE tenant_id='$TenantId' AND email='wrong-user@test.local' AND reason='UNKNOWN_EMAIL_OR_INVALID_DEV_CREDENTIALS' AND status_code=401;"

if ([int]$failedLoginRows -gt 0) {
    Ok "Failed login audit rows exist"
}
else {
    Fail "Failed login audit rows missing"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "7. Backend Source Files"
Write-Host "============================================================"

Check-FileContains `
    -Label "patientAccessGuard exists" `
    -Path "$BackendRoot\src\middleware\patientAccessGuard.js" `
    -Pattern "35C.19-patient-access-guard"

Check-FileContains `
    -Label "userActivityAuditMiddleware exists" `
    -Path "$BackendRoot\src\middleware\userActivityAuditMiddleware.js" `
    -Pattern "USER_ACTIVITY_AUDIT_ENABLED"

Check-FileContains `
    -Label "failedLoginAuditService exists" `
    -Path "$BackendRoot\src\services\failedLoginAuditService.js" `
    -Pattern "writeFailedLoginFromRequest"

Check-FileContains `
    -Label "securityOverview has failed login risk" `
    -Path "$BackendRoot\src\routes\tenant\securityOverview.js" `
    -Pattern "35A.20-security-overview-failed-login-risk"

Check-FileContains `
    -Label "auth.js captures failed login" `
    -Path "$BackendRoot\src\routes\auth.js" `
    -Pattern "UNKNOWN_EMAIL_OR_INVALID_DEV_CREDENTIALS"

Write-Host ""
Write-Host "============================================================"
Write-Host "8. Frontend Patient Pages"
Write-Host "============================================================"

Check-FileContains `
    -Label "PatientDashboardPage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientDashboardPage.js" `
    -Pattern "/api/patient/therapy/summary"

Check-FileContains `
    -Label "PatientTherapyPage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientTherapyPage.js" `
    -Pattern "/api/patient/therapy/summary"

Check-FileContains `
    -Label "PatientNightlyAnalysisPage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientNightlyAnalysisPage.js" `
    -Pattern "/api/patient/nightly-analysis"

Check-FileContains `
    -Label "PatientNightComparePage exists" `
    -Path "$FrontendRoot\src\pages\patient\PatientNightComparePage.js" `
    -Pattern "/api/patient/night-compare"

Check-FileContains `
    -Label "PatientRoutes has dashboard" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/dashboard"'

Check-FileContains `
    -Label "PatientRoutes has night compare" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/night-compare"'

Write-Host ""
Write-Host "============================================================"
Write-Host "9. Frontend Security Pages"
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
    -Label "TenantUserActivityAuditPage exists" `
    -Path "$FrontendRoot\src\pages\TenantUserActivityAuditPage.js" `
    -Pattern "User Activity Audit"

Check-FileContains `
    -Label "TenantFailedLoginAuditPage exists" `
    -Path "$FrontendRoot\src\pages\TenantFailedLoginAuditPage.js" `
    -Pattern "Failed Login Audit"

Check-FileContains `
    -Label "TenantRoutes has user activity route" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern 'path="/tenant/security/user-activity"'

Check-FileContains `
    -Label "TenantRoutes has failed logins route" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern 'path="/tenant/security/failed-logins"'

Check-FileContains `
    -Label "App.js has Patient Portal link" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "/patient/dashboard"

Check-FileContains `
    -Label "App.js has Failed Logins link" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "/tenant/security/failed-logins"

Write-Host ""
Write-Host "============================================================"
Write-Host "10. Frontend Build"
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
Write-Host "11. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PHASE35_MASTER_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PHASE35_MASTER_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PHASE35_MASTER_BLOCKED" -ForegroundColor Red
exit 1