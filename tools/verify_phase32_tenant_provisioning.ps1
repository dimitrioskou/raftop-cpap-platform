$ErrorActionPreference = "Continue"

$Backend = "http://localhost:5001"
$SuperAdminKey = "z3xmG0oPSe3gSmS0EVlscVabRf9dgeLFd63edl3SfkOMcZ2aB87LmbNPeB/C4LCm"

$Headers = @{
    "x-super-admin-key" = $SuperAdminKey
    "Content-Type" = "application/json"
}

$Failures = 0
$Warnings = 0

$TenantSuffix = Get-Date -Format "yyyyMMddHHmmss"
$TenantCompanyName = "Demo Sleep Clinic $TenantSuffix"

function Write-Section($Title) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor DarkGray
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 32 Tenant Provisioning Verification" -ForegroundColor White
Write-Host "Backend: $Backend" -ForegroundColor Gray

Write-Section "1. Super admin route availability"

try {
    $response = Invoke-WebRequest "$Backend/api/super-admin/tenant-provisioning" `
        -Headers $Headers `
        -UseBasicParsing `
        -TimeoutSec 20

    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Tenant provisioning GET => 200" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Tenant provisioning GET => $($response.StatusCode)" -ForegroundColor Red
        $Failures += 1
    }
}
catch {
    Write-Host "[FAIL] Tenant provisioning GET failed | $($_.Exception.Message)" -ForegroundColor Red
    $Failures += 1
}

Write-Section "2. Create tenant"

$Body = @{
    companyName = $TenantCompanyName
    platformName = "Sleep Clinic Pro"
    adminEmail = "admin@clinic.gr"
    plan = "professional"
    patientLimit = 500
    userLimit = 15
    deviceLimit = 1000
    logoText = "SCP"
    primaryColor = "#7c3aed"
    secondaryColor = "#0891b2"
    accentColor = "#111827"
} | ConvertTo-Json -Depth 8

$CreatedTenantId = $null

try {
    $createResponse = Invoke-WebRequest "$Backend/api/super-admin/tenant-provisioning/create" `
        -Method POST `
        -Headers $Headers `
        -Body $Body `
        -UseBasicParsing `
        -TimeoutSec 20

    if ($createResponse.StatusCode -eq 200) {
        Write-Host "[OK] Tenant create => 200" -ForegroundColor Green

        $payload = $createResponse.Content | ConvertFrom-Json
        $CreatedTenantId = $payload.tenant.tenantId

        if ($payload.ok -eq $true -and $CreatedTenantId) {
            Write-Host "[OK] Created tenantId: $CreatedTenantId" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] Tenant create payload missing tenantId" -ForegroundColor Red
            $Failures += 1
        }

        if ($payload.tenant.branding.logoText -eq "SCP") {
            Write-Host "[OK] Branding payload attached" -ForegroundColor Green
        }
        else {
            Write-Host "[WARNING] Branding payload unclear" -ForegroundColor Yellow
            $Warnings += 1
        }
    }
    else {
        Write-Host "[FAIL] Tenant create => $($createResponse.StatusCode)" -ForegroundColor Red
        $Failures += 1
    }
}
catch {
    Write-Host "[FAIL] Tenant create failed | $($_.Exception.Message)" -ForegroundColor Red
    $Failures += 1
}

Write-Section "3. Duplicate protection"

try {
    $duplicateResponse = Invoke-WebRequest "$Backend/api/super-admin/tenant-provisioning/create" `
        -Method POST `
        -Headers $Headers `
        -Body $Body `
        -UseBasicParsing `
        -TimeoutSec 20

    Write-Host "[FAIL] Duplicate tenant was accepted unexpectedly => $($duplicateResponse.StatusCode)" -ForegroundColor Red
    $Failures += 1
}
catch {
    if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 409) {
        Write-Host "[OK] Duplicate tenant rejected with 409" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Duplicate test returned unexpected error | $($_.Exception.Message)" -ForegroundColor Yellow
        $Warnings += 1
    }
}

Write-Section "4. Super admin guard"

try {
    $badResponse = Invoke-WebRequest "$Backend/api/super-admin/tenant-provisioning" `
        -Headers @{"x-super-admin-key"="wrong-key"} `
        -UseBasicParsing `
        -TimeoutSec 20

    Write-Host "[FAIL] Invalid super admin key was accepted => $($badResponse.StatusCode)" -ForegroundColor Red
    $Failures += 1
}
catch {
    if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[OK] Invalid super admin key rejected with 401" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Invalid key test returned unexpected error | $($_.Exception.Message)" -ForegroundColor Yellow
        $Warnings += 1
    }
}

Write-Section "5. Final Result"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: TENANT_PROVISIONING_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: TENANT_PROVISIONING_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: TENANT_PROVISIONING_BLOCKED" -ForegroundColor Red
exit 1