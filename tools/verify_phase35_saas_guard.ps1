$ErrorActionPreference = "Continue"

$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"

$Failures = 0
$Warnings = 0

function Expect-Status {
    param(
        [string]$Label,
        [string]$Method = "GET",
        [string]$Url,
        [int]$ExpectedStatus
    )

    try {
        $response = Invoke-WebRequest $Url `
            -Method $Method `
            -Headers @{"x-tenant-id"=$TenantId} `
            -UseBasicParsing `
            -TimeoutSec 25

        $actual = [int]$response.StatusCode

        if ($actual -eq $ExpectedStatus) {
            Write-Host "[OK] $Label => $actual" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] $Label expected $ExpectedStatus got $actual" -ForegroundColor Red
            $script:Failures += 1
        }
    }
    catch {
        $actual = 0

        if ($_.Exception.Response) {
            $actual = [int]$_.Exception.Response.StatusCode
        }

        if ($actual -eq $ExpectedStatus) {
            Write-Host "[OK] $Label => $actual" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] $Label expected $ExpectedStatus got $actual | $($_.Exception.Message)" -ForegroundColor Red
            $script:Failures += 1

            if ($_.ErrorDetails.Message) {
                Write-Host "      $($_.ErrorDetails.Message)" -ForegroundColor DarkGray
            }
        }
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 SaaS Guard Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Force active and confirm protected access"
Write-Host "============================================================"

Expect-Status `
    -Label "Force subscription ACTIVE" `
    -Method "POST" `
    -Url "$Backend/api/tenant/subscription/force-active" `
    -ExpectedStatus 200

Expect-Status `
    -Label "Protected patients route allowed while ACTIVE" `
    -Method "GET" `
    -Url "$Backend/api/tenant/patients" `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Force suspended and confirm protected access is blocked"
Write-Host "============================================================"

Expect-Status `
    -Label "Force subscription SUSPENDED" `
    -Method "POST" `
    -Url "$Backend/api/tenant/subscription/force-suspended" `
    -ExpectedStatus 200

Expect-Status `
    -Label "Protected patients route blocked while SUSPENDED" `
    -Method "GET" `
    -Url "$Backend/api/tenant/patients" `
    -ExpectedStatus 402

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Restore active"
Write-Host "============================================================"

Expect-Status `
    -Label "Restore subscription ACTIVE" `
    -Method "POST" `
    -Url "$Backend/api/tenant/subscription/force-active" `
    -ExpectedStatus 200

Expect-Status `
    -Label "Protected patients route allowed after restore" `
    -Method "GET" `
    -Url "$Backend/api/tenant/patients" `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: SAAS_GUARD_READY" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: SAAS_GUARD_BLOCKED" -ForegroundColor Red
exit 1