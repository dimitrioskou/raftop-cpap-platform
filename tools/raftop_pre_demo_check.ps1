$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$BackendRoot = Join-Path $ProjectRoot "enterprise-backend"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"

$Backend = "http://localhost:5001"
$Frontend = "http://localhost:3001"

$TenantId = "raftopoulos-live"
$PatientId = "demo-patient-001"

$Failures = 0
$Warnings = 0

function Section {
    param([string]$Title)

    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Title
    Write-Host "============================================================"
}

function Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Warn {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    $script:Warnings += 1
}

function Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:Failures += 1
}

function Check-Path {
    param(
        [string]$Label,
        [string]$Path
    )

    if (Test-Path $Path) {
        Ok $Label
    }
    else {
        Fail "$Label missing: $Path"
    }
}

function Check-FileContains {
    param(
        [string]$Label,
        [string]$Path,
        [string]$Pattern
    )

    if (!(Test-Path $Path)) {
        Fail "Missing file for $Label`: $Path"
        return
    }

    $found = Select-String -Path $Path -Pattern $Pattern -Quiet

    if ($found) {
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
        [hashtable]$Headers = @{},
        [string]$Method = "GET",
        [string]$Body = "",
        [int]$ExpectedStatus = 200
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

function Expect-JsonPhase {
    param(
        [string]$Label,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$ExpectedPhase = ""
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

        if ($ExpectedPhase) {
            if ($payload.phase -eq $ExpectedPhase) {
                Ok "$Label phase marker correct"
            }
            else {
                Warn "$Label unexpected phase marker: $($payload.phase)"
            }
        }
    }
    catch {
        Fail "$Label failed | $($_.Exception.Message)"
    }
}

function Run-ChildScript {
    param(
        [string]$Label,
        [string]$ScriptPath
    )

    if (!(Test-Path $ScriptPath)) {
        Fail "$Label missing script: $ScriptPath"
        return
    }

    try {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ScriptPath

        if ($LASTEXITCODE -eq 0) {
            Ok "$Label passed"
        }
        else {
            Fail "$Label failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        Fail "$Label crashed | $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Pre-Demo Check" -ForegroundColor Cyan
Write-Host "Project:  $ProjectRoot" -ForegroundColor Gray
Write-Host "Backend:  $Backend" -ForegroundColor Gray
Write-Host "Frontend: $Frontend" -ForegroundColor Gray
Write-Host "Tenant:   $TenantId" -ForegroundColor Gray
Write-Host "Patient:  $PatientId" -ForegroundColor Gray

Section "0. Project Structure"

Check-Path "Project root exists" $ProjectRoot
Check-Path "Backend root exists" $BackendRoot
Check-Path "Frontend root exists" $FrontendRoot
Check-Path "Backend package.json exists" (Join-Path $BackendRoot "package.json")
Check-Path "Frontend package.json exists" (Join-Path $FrontendRoot "package.json")
Check-Path "Tools folder exists" (Join-Path $ProjectRoot "tools")

Section "1. Backend Health"

Expect-Status `
    -Label "Backend health" `
    -Url "$Backend/api/health" `
    -Headers @{} `
    -ExpectedStatus 200

Section "2. Core Tenant APIs"

Expect-JsonPhase `
    -Label "Tenant subscription status" `
    -Url "$Backend/api/tenant/subscription/status?tenantId=$TenantId" `
    -Headers @{"x-tenant-id"=$TenantId}

Expect-Status `
    -Label "Tenant patients API" `
    -Url "$Backend/api/tenant/patients" `
    -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
    -ExpectedStatus 200

Expect-Status `
    -Label "Tenant ATLAS API" `
    -Url "$Backend/api/tenant/atlas" `
    -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
    -ExpectedStatus 200

Expect-Status `
    -Label "Tenant ATLAS Action Center API" `
    -Url "$Backend/api/tenant/atlas/action-center" `
    -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
    -ExpectedStatus 200

Expect-Status `
    -Label "Tenant Closed Loop API" `
    -Url "$Backend/api/tenant/closed-loop/control-summary" `
    -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="tenant_admin"} `
    -ExpectedStatus 200

Section "3. Patient Portal APIs"

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

Section "4. Security & Compliance APIs"

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

Section "5. Failed Login Audit Smoke Test"

$FailedLoginBody = '{"email":"wrong-user@test.local","password":"wrong-password","tenantId":"raftopoulos-live"}'

Expect-Status `
    -Label "Unknown login is rejected" `
    -Url "$Backend/api/auth/login" `
    -Method "POST" `
    -Body $FailedLoginBody `
    -ExpectedStatus 401

Section "6. Backend Source Wiring"

Check-FileContains `
    -Label "server.js wires patient therapy route" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/patient/therapy"

Check-FileContains `
    -Label "server.js wires patient nightly analysis route" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/patient/nightly-analysis"

Check-FileContains `
    -Label "server.js wires patient night compare route" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/patient/night-compare"

Check-FileContains `
    -Label "server.js wires user activity route" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/tenant/security/user-activity"

Check-FileContains `
    -Label "server.js wires failed login route" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "/api/tenant/security/failed-logins"

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
    -Label "auth.js captures failed login events" `
    -Path "$BackendRoot\src\routes\auth.js" `
    -Pattern "UNKNOWN_EMAIL_OR_INVALID_DEV_CREDENTIALS"

Section "7. Frontend Patient Portal Wiring"

Check-FileContains `
    -Label "PatientRoutes has dashboard route" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/dashboard"'

Check-FileContains `
    -Label "PatientRoutes has therapy route" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/therapy"'

Check-FileContains `
    -Label "PatientRoutes has nightly analysis route" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/nightly-analysis"'

Check-FileContains `
    -Label "PatientRoutes has night compare route" `
    -Path "$FrontendRoot\src\routes\PatientRoutes.js" `
    -Pattern 'path="/patient/night-compare"'

Check-FileContains `
    -Label "App.js has Patient Portal link" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "/patient/dashboard"

Section "8. Frontend Security Center Wiring"

Check-FileContains `
    -Label "TenantSecurityOverviewPage exists" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Tenant Security Overview"

Check-FileContains `
    -Label "TenantSecurityOverviewPage shows User Activity" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "User Activity Events"

Check-FileContains `
    -Label "TenantSecurityOverviewPage shows Failed Logins" `
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
    -Label "App.js has Failed Logins navigation" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "/tenant/security/failed-logins"

Section "9. Frontend Build"

Push-Location $FrontendRoot

try {
    npm run build

    if ($LASTEXITCODE -eq 0) {
        Ok "Frontend build passed"
    }
    else {
        Fail "Frontend build failed"
    }
}
catch {
    Fail "Frontend build crashed | $($_.Exception.Message)"
}
finally {
    Pop-Location
}

Section "10. Phase 35 Master Readiness"

$Phase35Script = Join-Path $ProjectRoot "tools\verify_phase35_master_readiness.ps1"

Run-ChildScript `
    -Label "Phase 35 Master Readiness" `
    -ScriptPath $Phase35Script

Section "11. Final Result"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: RAFTOP_PRE_DEMO_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: RAFTOP_PRE_DEMO_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: RAFTOP_PRE_DEMO_BLOCKED" -ForegroundColor Red
exit 1