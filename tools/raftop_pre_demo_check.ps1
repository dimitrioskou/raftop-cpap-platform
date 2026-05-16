$ErrorActionPreference = "Continue"

$BackendBase = "http://localhost:5001"
$FrontendBase = "http://localhost:3001"
$TenantId = "raftopoulos-live"

$Warnings = @()
$Failures = @()

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

function Add-Warning {
    param([string]$Message)
    $script:Warnings += $Message
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Add-Failure {
    param([string]$Message)
    $script:Failures += $Message
    Write-Host "[FAILED] $Message" -ForegroundColor Red
}

function Test-Url {
    param(
        [string]$Name,
        [string]$Url,
        [hashtable]$Headers = @{},
        [switch]$WarningOnly
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 12

        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            Write-Host "[OK] $Name => $($response.StatusCode)" -ForegroundColor Green
            return $true
        }

        if ($WarningOnly) {
            Add-Warning "$Name returned HTTP $($response.StatusCode): $Url"
            return $false
        }

        Add-Failure "$Name returned HTTP $($response.StatusCode): $Url"
        return $false
    }
    catch {
        if ($WarningOnly) {
            Add-Warning "$Name unavailable: $Url | $($_.Exception.Message)"
            return $false
        }

        Add-Failure "$Name unavailable: $Url | $($_.Exception.Message)"
        return $false
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Pre Demo Check" -ForegroundColor White
Write-Host "Tenant: $TenantId" -ForegroundColor White
Write-Host "Backend: $BackendBase" -ForegroundColor White
Write-Host "Frontend: $FrontendBase" -ForegroundColor White
Write-Host ""

$Headers = @{
    "Accept" = "application/json"
    "x-tenant-id" = $TenantId
}

Write-Section "1. Backend health"

Test-Url -Name "Backend health" -Url "$BackendBase/api/health" -Headers $Headers

Test-Url `
    -Name "Tenant subscription status" `
    -Url "$BackendBase/api/tenant/subscription/status?tenantId=$TenantId" `
    -Headers $Headers `
    -WarningOnly

Write-Section "2. Core tenant endpoints"

$CoreBackendEndpoints = @(
    @{ Name = "Tenant dashboard"; Url = "$BackendBase/api/tenant/dashboard" },
    @{ Name = "Tenant patients"; Url = "$BackendBase/api/tenant/patients" },
    @{ Name = "Tenant devices"; Url = "$BackendBase/api/tenant/devices" },
    @{ Name = "Patient signals"; Url = "$BackendBase/api/tenant/patient-signals" },
    @{ Name = "ATLAS"; Url = "$BackendBase/api/tenant/atlas" },
    @{ Name = "ATLAS Action Center"; Url = "$BackendBase/api/tenant/atlas/action-center" },
    @{ Name = "Closed Loop Control Summary"; Url = "$BackendBase/api/tenant/closed-loop/control-summary" },
    @{ Name = "Unified Tasks"; Url = "$BackendBase/api/tenant/tasks-unified" }
)

foreach ($endpoint in $CoreBackendEndpoints) {
    Test-Url -Name $endpoint.Name -Url $endpoint.Url -Headers $Headers -WarningOnly
}

Write-Section "3. Frontend availability"

Test-Url -Name "Frontend root" -Url "$FrontendBase" -WarningOnly

Write-Section "4. Client-facing presentation pages"

$FrontendPages = @(
    @{ Name = "Demo Launcher"; Url = "$FrontendBase/demo/raftopoulos/start" },
    @{ Name = "Pilot Launcher"; Url = "$FrontendBase/demo/raftopoulos/pilot" },
    @{ Name = "Decision Launcher"; Url = "$FrontendBase/demo/raftopoulos/decision-room" },
    @{ Name = "Sales Snapshot"; Url = "$FrontendBase/sales/raftopoulos" },
    @{ Name = "Pilot Proposal"; Url = "$FrontendBase/sales/raftopoulos/pilot" },
    @{ Name = "Decision Room"; Url = "$FrontendBase/sales/raftopoulos/decision-room" },
    @{ Name = "Objections"; Url = "$FrontendBase/sales/raftopoulos/objections" },
    @{ Name = "Pilot Success"; Url = "$FrontendBase/sales/raftopoulos/pilot-success" },
    @{ Name = "Pilot Playbook"; Url = "$FrontendBase/sales/raftopoulos/pilot-playbook" },
    @{ Name = "Rollout Roadmap"; Url = "$FrontendBase/sales/raftopoulos/rollout-roadmap" },
    @{ Name = "Presentation Flow"; Url = "$FrontendBase/sales/raftopoulos/presentation-flow" },
    @{ Name = "Final Demo Script"; Url = "$FrontendBase/sales/raftopoulos/final-demo-script" },
    @{ Name = "Pilot Approval Decision"; Url = "$FrontendBase/sales/raftopoulos/pilot-approval-decision" },
    @{ Name = "Executive Pilot Close"; Url = "$FrontendBase/sales/raftopoulos/executive-pilot-close" },
    @{ Name = "Statistics"; Url = "$FrontendBase/tenant/statistics" },
    @{ Name = "Executive Statistics Report"; Url = "$FrontendBase/tenant/statistics/report" },
    @{ Name = "Business Impact"; Url = "$FrontendBase/tenant/business-impact" }
)

foreach ($page in $FrontendPages) {
    Test-Url -Name $page.Name -Url $page.Url -WarningOnly
}

Write-Section "5. Technical/internal pages"

$TechnicalPages = @(
    @{ Name = "Tenant Dashboard"; Url = "$FrontendBase/tenant/dashboard" },
    @{ Name = "Patient Signals"; Url = "$FrontendBase/tenant/patient-signals" },
    @{ Name = "ATLAS"; Url = "$FrontendBase/tenant/atlas" },
    @{ Name = "ATLAS Action Center"; Url = "$FrontendBase/tenant/atlas/action-center" },
    @{ Name = "Closed Loop"; Url = "$FrontendBase/tenant/closed-loop" },
    @{ Name = "Tenant Patients"; Url = "$FrontendBase/tenant/patients" },
    @{ Name = "Tenant Devices"; Url = "$FrontendBase/tenant/devices" },
    @{ Name = "Tenant Tasks"; Url = "$FrontendBase/tenant/tasks" }
)

foreach ($page in $TechnicalPages) {
    Test-Url -Name $page.Name -Url $page.Url -WarningOnly
}

Write-Section "6. Result"

Write-Host ""
Write-Host "Warnings: $($Warnings.Count)" -ForegroundColor Yellow
Write-Host "Failures: $($Failures.Count)" -ForegroundColor Red
Write-Host ""

if ($Warnings.Count -gt 0) {
    Write-Host "Warnings list:" -ForegroundColor Yellow
    foreach ($warning in $Warnings) {
        Write-Host " - $warning" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($Failures.Count -gt 0) {
    Write-Host "Failures list:" -ForegroundColor Red
    foreach ($failure in $Failures) {
        Write-Host " - $failure" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "FINAL STATUS: FAILED" -ForegroundColor Red
    exit 1
}

if ($Warnings.Count -gt 0) {
    Write-Host "FINAL STATUS: READY_WITH_WARNINGS" -ForegroundColor Yellow
    Write-Host "Controlled demo can continue if warnings are already accepted." -ForegroundColor Yellow
    exit 0
}

Write-Host "FINAL STATUS: READY" -ForegroundColor Green
exit 0