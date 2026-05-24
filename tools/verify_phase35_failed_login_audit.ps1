$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$BackendRoot = Join-Path $ProjectRoot "enterprise-backend"
$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"
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
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = "",
        [int]$ExpectedStatus
    )

    try {
        if ($Body) {
            $response = Invoke-WebRequest $Url `
                -Method $Method `
                -ContentType "application/json" `
                -Headers $Headers `
                -Body $Body `
                -UseBasicParsing `
                -TimeoutSec 25
        }
        else {
            $response = Invoke-WebRequest $Url `
                -Method $Method `
                -Headers $Headers `
                -UseBasicParsing `
                -TimeoutSec 25
        }

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
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Failed Login Audit Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Backend health"
Write-Host "============================================================"

Expect-Status `
    -Label "Backend health" `
    -Url "$Backend/api/health" `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Source files"
Write-Host "============================================================"

Check-FileContains `
    -Label "failedLoginAuditService exists" `
    -Path "$BackendRoot\src\services\failedLoginAuditService.js" `
    -Pattern "writeFailedLoginFromRequest"

Check-FileContains `
    -Label "auth.js imports failed login audit service" `
    -Path "$BackendRoot\src\routes\auth.js" `
    -Pattern "writeFailedLoginFromRequest"

Check-FileContains `
    -Label "auth.js audits missing credentials" `
    -Path "$BackendRoot\src\routes\auth.js" `
    -Pattern "MISSING_CREDENTIALS"

Check-FileContains `
    -Label "auth.js audits invalid password" `
    -Path "$BackendRoot\src\routes\auth.js" `
    -Pattern "INVALID_PASSWORD"

Check-FileContains `
    -Label "auth.js audits unknown email" `
    -Path "$BackendRoot\src\routes\auth.js" `
    -Pattern "UNKNOWN_EMAIL_OR_INVALID_DEV_CREDENTIALS"

Check-FileContains `
    -Label "failedLoginAudit route exists" `
    -Path "$BackendRoot\src\routes\tenant\failedLoginAudit.js" `
    -Pattern "35A.14-failed-login-audit-api"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Generate failed login events"
Write-Host "============================================================"

$MissingBody = '{"email":"","password":"","tenantId":"raftopoulos-live"}'
$UnknownBody = '{"email":"wrong-user@test.local","password":"wrong-password","tenantId":"raftopoulos-live"}'

Expect-Status `
    -Label "Missing credentials produces 400" `
    -Url "$Backend/api/auth/login" `
    -Method "POST" `
    -Body $MissingBody `
    -ExpectedStatus 400

Expect-Status `
    -Label "Unknown email produces 401" `
    -Url "$Backend/api/auth/login" `
    -Method "POST" `
    -Body $UnknownBody `
    -ExpectedStatus 401

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Database audit rows"
Write-Host "============================================================"

$tableExists = Query-Scalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='failed_login_audit_log';"

if ($tableExists -eq "1") {
    Ok "failed_login_audit_log table exists"
}
else {
    Fail "failed_login_audit_log table missing"
}

$missingRows = Query-Scalar "SELECT COUNT(*) FROM failed_login_audit_log WHERE tenant_id='$TenantId' AND reason='MISSING_CREDENTIALS' AND status_code=400;"

if ([int]$missingRows -gt 0) {
    Ok "missing credentials audit row exists"
}
else {
    Fail "missing credentials audit row missing"
}

$unknownRows = Query-Scalar "SELECT COUNT(*) FROM failed_login_audit_log WHERE tenant_id='$TenantId' AND email='wrong-user@test.local' AND reason='UNKNOWN_EMAIL_OR_INVALID_DEV_CREDENTIALS' AND status_code=401;"

if ([int]$unknownRows -gt 0) {
    Ok "unknown email audit row exists"
}
else {
    Fail "unknown email audit row missing"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "5. Failed login audit API"
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
        Ok "failed login API phase marker correct"
    }
    else {
        Warn "unexpected failed login API phase marker: $($payload.phase)"
    }

    if ($payload.summary.totalFailed -gt 0) {
        Ok "failed login summary has events"
    }
    else {
        Fail "failed login summary has no events"
    }

    if ($null -ne $payload.risk.score) {
        Ok "failed login risk score exists"
    }
    else {
        Fail "failed login risk score missing"
    }
}
catch {
    Fail "failed login API failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "6. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: FAILED_LOGIN_AUDIT_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: FAILED_LOGIN_AUDIT_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: FAILED_LOGIN_AUDIT_BLOCKED" -ForegroundColor Red
exit 1