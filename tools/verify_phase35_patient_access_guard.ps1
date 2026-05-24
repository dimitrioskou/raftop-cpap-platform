$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$BackendRoot = Join-Path $ProjectRoot "enterprise-backend"
$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"
$PatientId = "demo-patient-001"

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

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Patient Access Guard Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray
Write-Host "Patient: $PatientId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Patient access guard behavior"
Write-Host "============================================================"

Expect-Status `
    -Label "Patient API blocked without tenant id" `
    -Url "$Backend/api/patient/therapy/summary?patientId=$PatientId" `
    -Headers @{} `
    -ExpectedStatus 401

Expect-Status `
    -Label "Patient API blocked without patient id" `
    -Url "$Backend/api/patient/therapy/summary" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedStatus 401

Expect-Status `
    -Label "Patient therapy allowed with tenant + patient" `
    -Url "$Backend/api/patient/therapy/summary?patientId=$PatientId" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedStatus 200

Expect-Status `
    -Label "Nightly analysis allowed with tenant + patient" `
    -Url "$Backend/api/patient/nightly-analysis?patientId=$PatientId" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedStatus 200

Expect-Status `
    -Label "Night compare allowed with tenant + patient" `
    -Url "$Backend/api/patient/night-compare?patientId=$PatientId" `
    -Headers @{"x-tenant-id"=$TenantId} `
    -ExpectedStatus 200

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend guard wiring"
Write-Host "============================================================"

Check-FileContains `
    -Label "patientAccessGuard exists" `
    -Path "$BackendRoot\src\middleware\patientAccessGuard.js" `
    -Pattern "35C.19-patient-access-guard"

Check-FileContains `
    -Label "server.js wires patientAccessGuard" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "patientAccessGuard"

Check-FileContains `
    -Label "server.js applies guard to patient routes" `
    -Path "$BackendRoot\src\server.js" `
    -Pattern "patientAccessGuard"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PATIENT_ACCESS_GUARD_READY" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PATIENT_ACCESS_GUARD_BLOCKED" -ForegroundColor Red
exit 1