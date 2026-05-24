$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"

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

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 34 Route ACL Verification" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================================"
Write-Host "1. Route ACL source files"
Write-Host "============================================================"

Check-FileContains `
    -Label "RuntimeAclRouteGuard exists" `
    -Path "$FrontendRoot\src\security\RuntimeAclRouteGuard.js" `
    -Pattern "RuntimeAclRouteGuard"

Check-FileContains `
    -Label "RuntimeAclRouteGuard uses canAccessRoute" `
    -Path "$FrontendRoot\src\security\RuntimeAclRouteGuard.js" `
    -Pattern "canAccessRoute"

Check-FileContains `
    -Label "TenantRoutes imports RuntimeAclRouteGuard" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern "RuntimeAclRouteGuard"

Check-FileContains `
    -Label "TenantRoutes protects ATLAS" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern 'path="/tenant/atlas"'

Check-FileContains `
    -Label "TenantRoutes protects Closed Loop" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern 'path="/tenant/closed-loop"'

Check-FileContains `
    -Label "runtimeAcl has route rules" `
    -Path "$FrontendRoot\src\security\runtimeAcl.js" `
    -Pattern "ROUTE_PERMISSION_RULES"

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Build check"
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
Write-Host "3. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: ROUTE_ACL_READY" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: ROUTE_ACL_BLOCKED" -ForegroundColor Red
exit 1