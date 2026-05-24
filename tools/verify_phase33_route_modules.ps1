$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"

$Failures = 0
$Warnings = 0

function Check-File {
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

    if ($Pattern) {
        $ok = Select-String -Path $Path -Pattern $Pattern -Quiet

        if ($ok) {
            Write-Host "[OK] $Label" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] $Label missing pattern: $Pattern" -ForegroundColor Red
            $script:Failures += 1
        }
    }
    else {
        Write-Host "[OK] $Label exists" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 33 Route Modules Verification" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================================"
Write-Host "1. Route module files"
Write-Host "============================================================"

Check-File `
    -Label "RouteGuards.js" `
    -Path "$FrontendRoot\src\routes\RouteGuards.js" `
    -Pattern "TechnicalRouteGuard"

Check-File `
    -Label "SalesRoutes.js" `
    -Path "$FrontendRoot\src\routes\SalesRoutes.js" `
    -Pattern "SalesRoutes"

Check-File `
    -Label "TenantRoutes.js" `
    -Path "$FrontendRoot\src\routes\TenantRoutes.js" `
    -Pattern "TenantRoutes"

Check-File `
    -Label "SuperAdminRoutes.js" `
    -Path "$FrontendRoot\src\routes\SuperAdminRoutes.js" `
    -Pattern "SuperAdminRoutes"

Check-File `
    -Label "SystemRoutes.js" `
    -Path "$FrontendRoot\src\routes\SystemRoutes.js" `
    -Pattern "SystemRoutes"

Check-File `
    -Label "DemoRoutes.js" `
    -Path "$FrontendRoot\src\routes\DemoRoutes.js" `
    -Pattern "DemoRoutes"

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
    Write-Host "FINAL STATUS: ROUTE_MODULES_READY" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: ROUTE_MODULES_BLOCKED" -ForegroundColor Red
exit 1