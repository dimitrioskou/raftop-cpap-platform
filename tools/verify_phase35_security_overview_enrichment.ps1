$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"
$BackendRoot = Join-Path $ProjectRoot "enterprise-backend"
$Backend = "http://localhost:5001"
$TenantId = "raftopoulos-live"

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

function Warn {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    $script:Warnings += 1
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
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Security Overview Enrichment Verification" -ForegroundColor Cyan
Write-Host "Backend: $Backend" -ForegroundColor Gray
Write-Host "Tenant:  $TenantId" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Backend Security Overview API"
Write-Host "============================================================"

try {
    $payload = Invoke-RestMethod "$Backend/api/tenant/security/overview?tenantId=$TenantId" `
        -Headers @{"x-tenant-id"=$TenantId; "x-runtime-role"="operator"} `
        -Method GET `
        -TimeoutSec 25

    if ($payload.ok -eq $true) {
        Ok "security overview ok=true"
    }
    else {
        Fail "security overview ok is not true"
    }

    if ($payload.phase -eq "35A.9-security-overview-enrichment") {
        Ok "phase marker is correct"
    }
    else {
        Warn "unexpected phase marker: $($payload.phase)"
    }

    if ($payload.summary.totalEvents -ge 0) {
        Ok "ACL summary exists"
    }
    else {
        Fail "ACL summary missing"
    }

    if ($payload.summary.userActivityTotalEvents -ge 0) {
        Ok "user activity summary exists"
    }
    else {
        Fail "user activity summary missing"
    }

    if ($null -ne $payload.userActivity) {
        Ok "userActivity object exists"
    }
    else {
        Fail "userActivity object missing"
    }

    if ($null -ne $payload.complianceSignals) {
        Ok "complianceSignals object exists"
    }
    else {
        Fail "complianceSignals object missing"
    }

    if ($null -ne $payload.risk.score) {
        Ok "risk score exists"
    }
    else {
        Fail "risk score missing"
    }

    if ($null -ne $payload.userActivity.recentFailedEvents) {
        Ok "recent failed activity exists"
    }
    else {
        Fail "recent failed activity missing"
    }
}
catch {
    Fail "security overview API failed | $($_.Exception.Message)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend route file"
Write-Host "============================================================"

Check-FileContains `
    -Label "securityOverview route has enrichment phase" `
    -Path "$BackendRoot\src\routes\tenant\securityOverview.js" `
    -Pattern "35A.9-security-overview-enrichment"

Check-FileContains `
    -Label "securityOverview includes user activity audit table" `
    -Path "$BackendRoot\src\routes\tenant\securityOverview.js" `
    -Pattern "user_activity_audit_log"

Check-FileContains `
    -Label "securityOverview includes compliance signals" `
    -Path "$BackendRoot\src\routes\tenant\securityOverview.js" `
    -Pattern "complianceSignals"

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Frontend Security Center"
Write-Host "============================================================"

Check-FileContains `
    -Label "TenantSecurityOverviewPage exists" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Tenant Security Overview"

Check-FileContains `
    -Label "Security Center shows user activity metrics" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "User Activity Events"

Check-FileContains `
    -Label "Security Center shows compliance signals" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Compliance Signals"

Check-FileContains `
    -Label "Security Center links to User Activity" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "/tenant/security/user-activity"

Check-FileContains `
    -Label "Security Center shows recent failed activity" `
    -Path "$FrontendRoot\src\pages\TenantSecurityOverviewPage.js" `
    -Pattern "Recent Failed User Activity"

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Frontend build"
Write-Host "============================================================"

Push-Location $FrontendRoot

try {
    npm run build

    if ($LASTEXITCODE -eq 0) {
        Ok "npm run build passed"
    }
    else {
        Fail "npm run build failed"
    }
}
catch {
    Fail "npm run build crashed | $($_.Exception.Message)"
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================================"
Write-Host "5. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: SECURITY_OVERVIEW_ENRICHMENT_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: SECURITY_OVERVIEW_ENRICHMENT_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: SECURITY_OVERVIEW_ENRICHMENT_BLOCKED" -ForegroundColor Red
exit 1