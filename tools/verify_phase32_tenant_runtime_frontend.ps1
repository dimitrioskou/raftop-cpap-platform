$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Frontend = "http://localhost:3001"
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

    $match = Select-String -Path $Path -Pattern $Pattern -Quiet

    if ($match) {
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
        [string]$Url,
        [hashtable]$Headers = @{}
    )

    try {
        $response = Invoke-WebRequest $Url -Headers $Headers -UseBasicParsing -TimeoutSec 20

        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] $Label => 200" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] $Label => $($response.StatusCode)" -ForegroundColor Red
            $script:Failures += 1
        }
    }
    catch {
        Write-Host "[FAIL] $Label unavailable | $($_.Exception.Message)" -ForegroundColor Red
        $script:Failures += 1
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 32 Tenant Runtime Frontend Verification" -ForegroundColor White
Write-Host ""

Write-Host "============================================================"
Write-Host "1. Frontend source files"
Write-Host "============================================================"

Check-FileContains `
    -Label "TenantRuntimeContext exists" `
    -Path "$ProjectRoot\enterprise-frontend\src\context\TenantRuntimeContext.js" `
    -Pattern "TenantRuntimeProvider"

Check-FileContains `
    -Label "TenantBrandBanner uses runtime context" `
    -Path "$ProjectRoot\enterprise-frontend\src\components\TenantBrandBanner.js" `
    -Pattern "TenantRuntimeContext|useTenantRuntime"

Check-FileContains `
    -Label "RuntimeFeatureGate exists" `
    -Path "$ProjectRoot\enterprise-frontend\src\components\RuntimeFeatureGate.js" `
    -Pattern "RuntimeFeatureGate"

Check-FileContains `
    -Label "App.js imports TenantRuntimeProvider" `
    -Path "$ProjectRoot\enterprise-frontend\src\App.js" `
    -Pattern "TenantRuntimeProvider"

Check-FileContains `
    -Label "App.js imports RuntimeFeatureGate" `
    -Path "$ProjectRoot\enterprise-frontend\src\App.js" `
    -Pattern "RuntimeFeatureGate"

Check-FileContains `
    -Label "App.js has gated ATLAS navigation" `
    -Path "$ProjectRoot\enterprise-frontend\src\App.js" `
    -Pattern 'feature="atlas"'

Check-FileContains `
    -Label "App.js has gated Closed Loop navigation" `
    -Path "$ProjectRoot\enterprise-frontend\src\App.js" `
    -Pattern 'feature="closedLoop"'

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend tenant context API"
Write-Host "============================================================"

try {
    $context = Invoke-RestMethod "$Backend/api/tenant/context" `
        -Headers @{"x-tenant-id"="athens-sleep-center"} `
        -Method GET `
        -TimeoutSec 20

    if ($context.ok -eq $true) {
        Write-Host "[OK] tenant context ok=true" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] tenant context ok != true" -ForegroundColor Red
        $Failures += 1
    }

    if ($context.context.modules -and $context.context.entitlements) {
        Write-Host "[OK] modules and entitlements resolved" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] modules or entitlements missing" -ForegroundColor Red
        $Failures += 1
    }
}
catch {
    Write-Host "[FAIL] tenant context API failed | $($_.Exception.Message)" -ForegroundColor Red
    $Failures += 1
}

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Frontend runtime shell"
Write-Host "============================================================"

Check-Endpoint `
    -Label "Frontend SPA root" `
    -Url "$Frontend/"

Check-FileContains `
    -Label "Executive Demo Home route registered" `
    -Path "$ProjectRoot\enterprise-frontend\src\App.js" `
    -Pattern 'path="/sales/raftopoulos/executive-demo-home"'

Check-FileContains `
    -Label "Tenant Provisioning route registered" `
    -Path "$ProjectRoot\enterprise-frontend\src\App.js" `
    -Pattern 'path="/super-admin/tenant-provisioning"'

Check-FileContains `
    -Label "ATLAS route registered" `
    -Path "$ProjectRoot\enterprise-frontend\src\App.js" `
    -Pattern 'path="/tenant/atlas"'

Check-FileContains `
    -Label "Closed Loop route registered" `
    -Path "$ProjectRoot\enterprise-frontend\src\App.js" `
    -Pattern 'path="/tenant/closed-loop"'

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: TENANT_RUNTIME_FRONTEND_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: TENANT_RUNTIME_FRONTEND_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: TENANT_RUNTIME_FRONTEND_BLOCKED" -ForegroundColor Red
exit 1