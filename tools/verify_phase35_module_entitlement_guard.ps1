$ErrorActionPreference = "Continue"

$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"
$DbUrl = "postgresql://postgres:postgres@localhost:5432/cpap_care"
$Psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

$Failures = 0
$Warnings = 0

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

function Run-Sql {
    param([string]$Sql)

    & $Psql $DbUrl -c $Sql | Out-Null
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Module Entitlement Guard Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Restore all modules enabled"
Write-Host "============================================================"

Run-Sql "UPDATE tenant_subscriptions SET atlas_enabled = TRUE, action_center_enabled = TRUE, closed_loop_enabled = TRUE, executive_metrics_enabled = TRUE, security_center_enabled = TRUE, updated_at = NOW() WHERE tenant_id = '$TenantId';"

Expect-Status `
    -Label "ATLAS allowed when module enabled" `
    -Url "$Backend/api/tenant/atlas" `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Disable ATLAS and expect module upgrade block"
Write-Host "============================================================"

Run-Sql "UPDATE tenant_subscriptions SET atlas_enabled = FALSE, updated_at = NOW() WHERE tenant_id = '$TenantId';"

Expect-Status `
    -Label "ATLAS blocked when module disabled" `
    -Url "$Backend/api/tenant/atlas" `
    -ExpectedStatus 402

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Restore ATLAS"
Write-Host "============================================================"

Run-Sql "UPDATE tenant_subscriptions SET atlas_enabled = TRUE, action_center_enabled = TRUE, closed_loop_enabled = TRUE, executive_metrics_enabled = TRUE, security_center_enabled = TRUE, updated_at = NOW() WHERE tenant_id = '$TenantId';"

Expect-Status `
    -Label "ATLAS allowed after restore" `
    -Url "$Backend/api/tenant/atlas" `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: MODULE_ENTITLEMENT_GUARD_READY" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: MODULE_ENTITLEMENT_GUARD_BLOCKED" -ForegroundColor Red
exit 1