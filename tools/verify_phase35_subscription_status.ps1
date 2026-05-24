$ErrorActionPreference = "Continue"

$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"

$Failures = 0
$Warnings = 0

function Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:Failures += 1
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

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Subscription Status Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Subscription status API"
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
        Ok "phase marker is correct"
    }
    else {
        Warn "phase marker unexpected: $($payload.phase)"
    }

    if ($payload.subscription.tenantId -eq $TenantId -or $payload.subscription.tenant_id -eq $TenantId) {
        Ok "tenant id resolved correctly"
    }
    else {
        Fail "tenant id mismatch"
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
        Ok "subscription access allowed"
    }
    else {
        Fail "subscription access is not allowed"
    }
}
catch {
    Fail "subscription status request failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "2. SaaS limits"
Write-Host "============================================================"

try {
    if ([int]$payload.limits.patientLimit -ge 50000) {
        Ok "patient limit is enterprise-grade"
    }
    else {
        Fail "patient limit too low: $($payload.limits.patientLimit)"
    }

    if ([int]$payload.limits.seatLimit -ge 100) {
        Ok "seat limit is enterprise-grade"
    }
    else {
        Fail "seat limit too low: $($payload.limits.seatLimit)"
    }

    if ($payload.limits.patientLimitReached -eq $false) {
        Ok "patient limit not reached"
    }
    else {
        Warn "patient limit reached"
    }

    if ($payload.limits.seatLimitReached -eq $false) {
        Ok "seat limit not reached"
    }
    else {
        Warn "seat limit reached"
    }
}
catch {
    Fail "limits validation failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Module entitlements"
Write-Host "============================================================"

try {
    if ($payload.modules.atlas -eq $true) {
        Ok "ATLAS module enabled"
    }
    else {
        Fail "ATLAS module disabled"
    }

    if ($payload.modules.actionCenter -eq $true) {
        Ok "Action Center module enabled"
    }
    else {
        Fail "Action Center module disabled"
    }

    if ($payload.modules.closedLoop -eq $true) {
        Ok "Closed Loop module enabled"
    }
    else {
        Fail "Closed Loop module disabled"
    }

    if ($payload.modules.executiveMetrics -eq $true) {
        Ok "Executive Metrics module enabled"
    }
    else {
        Fail "Executive Metrics module disabled"
    }

    if ($payload.modules.securityCenter -eq $true) {
        Ok "Security Center module enabled"
    }
    else {
        Fail "Security Center module disabled"
    }
}
catch {
    Fail "module entitlement validation failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: SUBSCRIPTION_STATUS_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: SUBSCRIPTION_STATUS_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: SUBSCRIPTION_STATUS_BLOCKED" -ForegroundColor Red
exit 1