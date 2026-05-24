$ErrorActionPreference = "Continue"

$LocalBackend = "http://localhost:5001"
$LocalFrontend = "http://localhost:3001"
$RenderBackend = "https://raftop-enterprise-backend.onrender.com"

$TenantId = "raftopoulos-live"

$Headers = @{
    "x-tenant-id" = $TenantId
}

$Failures = 0
$Warnings = 0

function Check-Endpoint {
    param(
        [string]$Label,
        [string]$Url,
        [hashtable]$Headers = @{}
    )

    try {
        $response = Invoke-WebRequest $Url -Headers $Headers -UseBasicParsing -TimeoutSec 30

        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] $Label" -ForegroundColor Green
            return $true
        }

        Write-Host "[FAIL] $Label returned $($response.StatusCode)" -ForegroundColor Red
        $script:Failures += 1
        return $false
    }
    catch {
        Write-Host "[FAIL] $Label unavailable | $($_.Exception.Message)" -ForegroundColor Red
        $script:Failures += 1
        return $false
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 31 Tenant Branding Verification" -ForegroundColor Cyan
Write-Host "Tenant: $TenantId" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================================"
Write-Host "1. Local Branding API"
Write-Host "============================================================"

Check-Endpoint `
    -Label "Local tenant branding" `
    -Url "$LocalBackend/api/tenant/branding" `
    -Headers $Headers

try {
    $branding = Invoke-RestMethod "$LocalBackend/api/tenant/branding" -Headers $Headers -Method GET -TimeoutSec 30

    if ($branding.ok -eq $true) {
        Write-Host "[OK] Branding payload ok=true" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Branding payload ok != true" -ForegroundColor Red
        $Failures += 1
    }

    if ($branding.branding.platformName) {
        Write-Host "[OK] platformName: $($branding.branding.platformName)" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] platformName missing" -ForegroundColor Red
        $Failures += 1
    }

    if ($branding.branding.whiteLabelReady -eq $true) {
        Write-Host "[OK] whiteLabelReady=true" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] whiteLabelReady is not true" -ForegroundColor Yellow
        $Warnings += 1
    }
}
catch {
    Write-Host "[FAIL] Branding payload sanity failed | $($_.Exception.Message)" -ForegroundColor Red
    $Failures += 1
}

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Frontend Branding Surface"
Write-Host "============================================================"

Check-Endpoint `
    -Label "Executive Demo Home" `
    -Url "$LocalFrontend/sales/raftopoulos/executive-demo-home"

Check-Endpoint `
    -Label "Executive Pilot Close" `
    -Url "$LocalFrontend/sales/raftopoulos/executive-pilot-close"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Render Branding API"
Write-Host "============================================================"

Check-Endpoint `
    -Label "Render tenant branding" `
    -Url "$RenderBackend/api/tenant/branding" `
    -Headers $Headers

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: TENANT_BRANDING_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: TENANT_BRANDING_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: TENANT_BRANDING_BLOCKED" -ForegroundColor Red
exit 1