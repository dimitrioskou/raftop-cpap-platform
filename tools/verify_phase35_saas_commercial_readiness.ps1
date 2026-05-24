$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"
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

function Expect-Status {
    param(
        [string]$Label,
        [string]$Url,
        [int]$ExpectedStatus
    )

    try {
        $response = Invoke-WebRequest $Url `
            -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
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

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 SaaS Commercial Readiness Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Subscription Status API"
Write-Host "============================================================"

try {
    $payload = Invoke-RestMethod "$Backend/api/tenant/subscription/status" `
        -Headers @{"x-tenant-id"=$TenantId} `
        -Method GET `
        -TimeoutSec 25

    if ($payload.ok -eq $true) {
        Ok "subscription status ok=true"
    }
    else {
        Fail "subscription status ok is not true"
    }

    if ($payload.phase -eq "35B.2-saas-subscription-status-hardening") {
        Ok "subscription phase marker is correct"
    }
    else {
        Warn "unexpected subscription phase marker: $($payload.phase)"
    }

    if ($payload.subscription.plan -eq "ENTERPRISE") {
        Ok "plan is ENTERPRISE"
    }
    else {
        Fail "plan expected ENTERPRISE got $($payload.subscription.plan)"
    }

    if ($payload.subscription.status -eq "ACTIVE") {
        Ok "status is ACTIVE"
    }
    else {
        Fail "status expected ACTIVE got $($payload.subscription.status)"
    }

    if ($payload.access.allowed -eq $true -or $payload.subscription.access.allowed -eq $true) {
        Ok "access is allowed"
    }
    else {
        Fail "access is not allowed"
    }

    if ($payload.modules.atlas -eq $true) { Ok "ATLAS enabled" } else { Fail "ATLAS disabled" }
    if ($payload.modules.actionCenter -eq $true) { Ok "Action Center enabled" } else { Fail "Action Center disabled" }
    if ($payload.modules.closedLoop -eq $true) { Ok "Closed Loop enabled" } else { Fail "Closed Loop disabled" }
    if ($payload.modules.executiveMetrics -eq $true) { Ok "Executive Metrics enabled" } else { Fail "Executive Metrics disabled" }
    if ($payload.modules.securityCenter -eq $true) { Ok "Security Center enabled" } else { Fail "Security Center disabled" }

    if ([int]$payload.limits.patientLimit -ge 50000) {
        Ok "patient limit enterprise-grade"
    }
    else {
        Fail "patient limit too low: $($payload.limits.patientLimit)"
    }

    if ([int]$payload.limits.seatLimit -ge 100) {
        Ok "seat limit enterprise-grade"
    }
    else {
        Fail "seat limit too low: $($payload.limits.seatLimit)"
    }
}
catch {
    Fail "subscription status API failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Protected SaaS APIs"
Write-Host "============================================================"

Expect-Status `
    -Label "Patients API allowed" `
    -Url "$Backend/api/tenant/patients" `
    -ExpectedStatus 200

Expect-Status `
    -Label "ATLAS API allowed" `
    -Url "$Backend/api/tenant/atlas" `
    -ExpectedStatus 200

Expect-Status `
    -Label "Security Overview API allowed" `
    -Url "$Backend/api/tenant/security/overview" `
    -ExpectedStatus 200

Expect-Status `
    -Label "ACL Audit API allowed" `
    -Url "$Backend/api/tenant/security/acl-audit" `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Backend SaaS middleware files"
Write-Host "============================================================"

Check-FileContains `
    -Label "tenantSubscriptionGuard hardened" `
    -Path "$ProjectRoot\enterprise-backend\src\middleware\tenantSubscriptionGuard.js" `
    -Pattern "35B.4-saas-subscription-guard-hardening"

Check-FileContains `
    -Label "tenantModuleEntitlementGuard exists" `
    -Path "$ProjectRoot\enterprise-backend\src\middleware\tenantModuleEntitlementGuard.js" `
    -Pattern "MODULE_UPGRADE_REQUIRED"

Check-FileContains `
    -Label "server.js wires module entitlement guard" `
    -Path "$ProjectRoot\enterprise-backend\src\server.js" `
    -Pattern "tenantModuleEntitlementGuard"

Check-FileContains `
    -Label "tenantSubscriptionService hardened" `
    -Path "$ProjectRoot\enterprise-backend\src\services\tenantSubscriptionService.js" `
    -Pattern "35B.2-saas-subscription-status-hardening"

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Frontend SaaS dashboard files/routes"
Write-Host "============================================================"

Check-FileContains `
    -Label "TenantSubscriptionStatusPage exists" `
    -Path "$FrontendRoot\src\pages\TenantSubscriptionStatusPage.js" `
    -Pattern "Tenant Subscription Status"

Check-FileContains `
    -Label "TenantRoutes has subscription route" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern 'path="/tenant/subscription"'

Check-FileContains `
    -Label "App.js has Subscription nav link" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "/tenant/subscription"

Write-Host ""
Write-Host "============================================================"
Write-Host "5. Frontend build"
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
Write-Host "6. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: SAAS_COMMERCIAL_READINESS_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: SAAS_COMMERCIAL_READINESS_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: SAAS_COMMERCIAL_READINESS_BLOCKED" -ForegroundColor Red
exit 1