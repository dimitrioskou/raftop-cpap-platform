$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"
$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"

$Failures = 0
$Warnings = 0

function Check-FileContains {
    param(
        [string]$Label,
        [string]$Path,
        [string]$Pattern
    )

    if (!(Test-Path $Path)) {
        Write-Host "[FAIL] Missing file: $Label" -ForegroundColor Red
        $script:Failures += 1
        return
    }

    $ok = Select-String -Path $Path -Pattern $Pattern -Quiet

    if ($ok) {
        Write-Host "[OK] $Label" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] $Label missing pattern: $Pattern" -ForegroundColor Red
        $script:Failures += 1
    }
}

function Check-Endpoint {
    param(
        [string]$Label,
        [string]$Url
    )

    try {
        $response = Invoke-WebRequest $Url `
            -Headers @{"x-tenant-id"=$TenantId} `
            -UseBasicParsing `
            -TimeoutSec 25

        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] $Label => 200" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] $Label expected 200 got $($response.StatusCode)" -ForegroundColor Red
            $script:Failures += 1
        }
    }
    catch {
        Write-Host "[FAIL] $Label unavailable | $($_.Exception.Message)" -ForegroundColor Red
        $script:Failures += 1
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 34 Security Center Verification" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================================"
Write-Host "1. Backend security endpoints"
Write-Host "============================================================"

Check-Endpoint `
    -Label "Security Overview API" `
    -Url "$Backend/api/tenant/security/overview"

Check-Endpoint `
    -Label "ACL Audit API" `
    -Url "$Backend/api/tenant/security/acl-audit"

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Frontend security files/routes"
Write-Host "============================================================"

Check-FileContains `
    -Label "TenantSecurityOverviewPage exists" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Tenant Security Overview"

Check-FileContains `
    -Label "TenantAclAuditPage exists" `
    -Path "$FrontendRoot\src\pages\TenantAclAuditPage.js" `
    -Pattern "ACL Audit Dashboard"

Check-FileContains `
    -Label "TenantRoutes has Security Center route" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern 'path="/tenant/security"'

Check-FileContains `
    -Label "TenantRoutes has ACL Audit route" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern 'path="/tenant/security/acl-audit"'

Check-FileContains `
    -Label "App.js has Security Center nav link" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "/tenant/security"

Check-FileContains `
    -Label "App.js has ACL Audit nav link" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "/tenant/security/acl-audit"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Build check"
Write-Host "============================================================"

Push-Location $FrontendRoot

try {
    npm run build

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] npm run build passed" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] npm run build failed" -ForegroundColor Red
        $Failures += 1
    }
}
catch {
    Write-Host "[FAIL] npm run build crashed | $($_.Exception.Message)" -ForegroundColor Red
    $Failures += 1
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: SECURITY_CENTER_READY" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: SECURITY_CENTER_BLOCKED" -ForegroundColor Red
exit 1