$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"
$Backend = "http://localhost:5001"

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
Write-Host "RAFTOP CPAP CARE Pro - Phase 34 ACL Runtime UI Verification" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================================"
Write-Host "1. ACL UI source files"
Write-Host "============================================================"

Check-FileContains `
    -Label "RuntimeRoleSwitcher exists" `
    -Path "$FrontendRoot\src\security\RuntimeRoleSwitcher.js" `
    -Pattern "RuntimeRoleSwitcher"

Check-FileContains `
    -Label "RuntimeAclStatusPanel exists" `
    -Path "$FrontendRoot\src\security\RuntimeAclStatusPanel.js" `
    -Pattern "ACL Status Panel"

Check-FileContains `
    -Label "RuntimeAclNavGate exists" `
    -Path "$FrontendRoot\src\security\RuntimeAclNavGate.js" `
    -Pattern "RuntimeAclNavGate"

Check-FileContains `
    -Label "App.js imports RuntimeAclStatusPanel" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "RuntimeAclStatusPanel"

Check-FileContains `
    -Label "App.js imports RuntimeRoleSwitcher" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "RuntimeRoleSwitcher"

Check-FileContains `
    -Label "App.js renders ACL technical mode block" `
    -Path "$FrontendRoot\src\App.js" `
    -Pattern "isTechnicalDemoUnlocked"

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend tenant context runtime"
Write-Host "============================================================"

try {
    $context = Invoke-RestMethod "$Backend/api/tenant/context" `
        -Headers @{"x-tenant-id"="raftopoulos-live"} `
        -Method GET `
        -TimeoutSec 20

    if ($context.ok -eq $true) {
        Write-Host "[OK] tenant context ok=true" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] tenant context ok != true" -ForegroundColor Red
        $Failures += 1
    }

    if ($context.fallback -eq $false -and $context.source -eq "tenant-context-postgres") {
        Write-Host "[OK] PostgreSQL tenant runtime active" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] tenant context not PostgreSQL runtime" -ForegroundColor Yellow
        $Warnings += 1
    }
}
catch {
    Write-Host "[FAIL] tenant context API failed | $($_.Exception.Message)" -ForegroundColor Red
    $Failures += 1
}

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

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: ACL_RUNTIME_UI_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: ACL_RUNTIME_UI_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: ACL_RUNTIME_UI_BLOCKED" -ForegroundColor Red
exit 1