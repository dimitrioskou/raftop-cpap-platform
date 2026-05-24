$ErrorActionPreference = "Continue"

$Backend = "http://localhost:5001"

$Failures = 0
$Warnings = 0

function Check-Context {
    param(
        [string]$TenantId,
        [string]$ExpectedMode = "any"
    )

    Write-Host ""
    Write-Host "Checking tenant context: $TenantId" -ForegroundColor Cyan

    try {
        $payload = Invoke-RestMethod "$Backend/api/tenant/context" `
            -Headers @{"x-tenant-id"=$TenantId} `
            -Method GET `
            -TimeoutSec 20

        if ($payload.ok -eq $true) {
            Write-Host "[OK] context ok=true" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] context ok is not true" -ForegroundColor Red
            $script:Failures += 1
        }

        if ($payload.context.tenantId) {
            Write-Host "[OK] tenantId resolved: $($payload.context.tenantId)" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] tenantId missing" -ForegroundColor Red
            $script:Failures += 1
        }

        if ($payload.context.branding.platformName) {
            Write-Host "[OK] branding platformName: $($payload.context.branding.platformName)" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] branding platformName missing" -ForegroundColor Red
            $script:Failures += 1
        }

        if ($payload.context.modules.atlas -ne $null) {
            Write-Host "[OK] modules resolved" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] modules missing" -ForegroundColor Red
            $script:Failures += 1
        }

        if ($payload.context.limits.patients -ne $null) {
            Write-Host "[OK] limits resolved: patients=$($payload.context.limits.patients)" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] limits missing" -ForegroundColor Red
            $script:Failures += 1
        }

        if ($payload.context.entitlements.canUseAtlas -ne $null) {
            Write-Host "[OK] entitlements resolved" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] entitlements missing" -ForegroundColor Red
            $script:Failures += 1
        }

        if ($ExpectedMode -eq "postgres" -and $payload.fallback -eq $true) {
            Write-Host "[FAIL] expected postgres context but got fallback" -ForegroundColor Red
            $script:Failures += 1
        }

        if ($ExpectedMode -eq "fallback" -and $payload.fallback -ne $true) {
            Write-Host "[WARNING] expected fallback but got postgres/live context" -ForegroundColor Yellow
            $script:Warnings += 1
        }

        return $payload
    }
    catch {
        Write-Host "[FAIL] context request failed | $($_.Exception.Message)" -ForegroundColor Red
        $script:Failures += 1
        return $null
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 32 Tenant Context Verification" -ForegroundColor White
Write-Host "Backend: $Backend" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Core tenant context"
Write-Host "============================================================"

Check-Context -TenantId "raftopoulos-live" -ExpectedMode "any"

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Provisioned tenant context"
Write-Host "============================================================"

Check-Context -TenantId "athens-sleep-center" -ExpectedMode "postgres"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Unknown tenant fallback safety"
Write-Host "============================================================"

Check-Context -TenantId "unknown-demo-tenant-context-test" -ExpectedMode "fallback"

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: TENANT_CONTEXT_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: TENANT_CONTEXT_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: TENANT_CONTEXT_BLOCKED" -ForegroundColor Red
exit 1