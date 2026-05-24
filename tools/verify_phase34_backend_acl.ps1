$ErrorActionPreference = "Continue"

$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"

$Failures = 0
$Warnings = 0

function Expect-Status {
    param(
        [string]$Label,
        [string]$Url,
        [string]$Role,
        [int]$ExpectedStatus
    )

    try {
        $response = Invoke-WebRequest $Url `
            -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"=$Role} `
            -UseBasicParsing `
            -TimeoutSec 25

        $actual = [int]$response.StatusCode

        if ($actual -eq $ExpectedStatus) {
            Write-Host "[OK] $Label | role=$Role => $actual" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] $Label | role=$Role expected $ExpectedStatus got $actual" -ForegroundColor Red
            $script:Failures += 1
        }
    }
    catch {
        $actual = 0

        if ($_.Exception.Response) {
            $actual = [int]$_.Exception.Response.StatusCode
        }

        if ($actual -eq $ExpectedStatus) {
            Write-Host "[OK] $Label | role=$Role => $actual" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] $Label | role=$Role expected $ExpectedStatus got $actual | $($_.Exception.Message)" -ForegroundColor Red
            $script:Failures += 1

            if ($_.ErrorDetails.Message) {
                Write-Host "      $($_.ErrorDetails.Message)" -ForegroundColor DarkGray
            }
        }
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 34 Backend ACL Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. ATLAS API ACL"
Write-Host "============================================================"

Expect-Status `
    -Label "Viewer cannot access ATLAS" `
    -Url "$Backend/api/tenant/atlas" `
    -Role "viewer" `
    -ExpectedStatus 403

Expect-Status `
    -Label "Operator can access ATLAS" `
    -Url "$Backend/api/tenant/atlas" `
    -Role "operator" `
    -ExpectedStatus 200

Expect-Status `
    -Label "Doctor can access ATLAS" `
    -Url "$Backend/api/tenant/atlas" `
    -Role "doctor" `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "2. ATLAS Action Center ACL"
Write-Host "============================================================"

Expect-Status `
    -Label "Viewer cannot access Action Center" `
    -Url "$Backend/api/tenant/atlas/action-center" `
    -Role "viewer" `
    -ExpectedStatus 403

Expect-Status `
    -Label "Operator can access Action Center" `
    -Url "$Backend/api/tenant/atlas/action-center" `
    -Role "operator" `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Closed Loop API ACL"
Write-Host "============================================================"

Expect-Status `
    -Label "Operator cannot access Closed Loop" `
    -Url "$Backend/api/tenant/closed-loop/control-summary" `
    -Role "operator" `
    -ExpectedStatus 403

Expect-Status `
    -Label "Doctor can access Closed Loop" `
    -Url "$Backend/api/tenant/closed-loop/control-summary" `
    -Role "doctor" `
    -ExpectedStatus 200

Expect-Status `
    -Label "Tenant admin can access Closed Loop" `
    -Url "$Backend/api/tenant/closed-loop/control-summary" `
    -Role "tenant_admin" `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Core safe APIs"
Write-Host "============================================================"

Expect-Status `
    -Label "Viewer can access patients" `
    -Url "$Backend/api/tenant/patients" `
    -Role "viewer" `
    -ExpectedStatus 200

Expect-Status `
    -Label "Viewer can access devices" `
    -Url "$Backend/api/tenant/devices" `
    -Role "viewer" `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "5. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: BACKEND_ACL_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: BACKEND_ACL_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: BACKEND_ACL_BLOCKED" -ForegroundColor Red
exit 1