$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
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
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 User Activity Audit Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray
Write-Host "Patient: $PatientId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "0. Backend health"
Write-Host "============================================================"

Expect-Status `
    -Label "Backend health" `
    -Url "$Backend/api/health" `
    -Headers @{} `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Audit source files"
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
    -Label "server.js wires userActivityAuditMiddleware" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "userActivityAuditMiddleware"

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Generate audit events"
Write-Host "============================================================"

Expect-Status `
    -Label "Tenant patients endpoint audited" `
    -Url "$Backend/api/tenant/patients" `
    -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
    -ExpectedStatus 200

Expect-Status `
    -Label "Patient therapy endpoint audited" `
    -Url "$Backend/api/patient/therapy/summary?patientId=$PatientId" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedStatus 200

Expect-Status `
    -Label "Patient guard failure audited" `
    -Url "$Backend/api/patient/therapy/summary" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedStatus 401

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Database audit rows"
Write-Host "============================================================"

$tableExists = Query-Scalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='user_activity_audit_log';"

if ($tableExists -eq "1") {
    Ok "user_activity_audit_log table exists"
}
else {
    Fail "user_activity_audit_log table missing"
}

$tenantRows = Query-Scalar "SELECT COUNT(*) FROM user_activity_audit_log WHERE tenant_id='$TenantId' AND path='/api/tenant/patients' AND status_code=200;"

if ([int]$tenantRows -gt 0) {
    Ok "tenant patients audit row exists"
}
else {
    Fail "tenant patients audit row missing"
}

$patientRows = Query-Scalar "SELECT COUNT(*) FROM user_activity_audit_log WHERE tenant_id='$TenantId' AND path='/api/patient/therapy/summary' AND status_code=200;"

if ([int]$patientRows -gt 0) {
    Ok "patient therapy audit row exists"
}
else {
    Fail "patient therapy audit row missing"
}

$blockedRows = Query-Scalar "SELECT COUNT(*) FROM user_activity_audit_log WHERE tenant_id='$TenantId' AND path='/api/patient/therapy/summary' AND status_code=401 AND success=false;"

if ([int]$blockedRows -gt 0) {
    Ok "blocked patient request audit row exists"
}
else {
    Fail "blocked patient request audit row missing"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: USER_ACTIVITY_AUDIT_READY" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: USER_ACTIVITY_AUDIT_BLOCKED" -ForegroundColor Red
exit 1