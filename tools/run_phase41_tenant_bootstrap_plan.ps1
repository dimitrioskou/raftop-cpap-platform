# RAFTOP CPAP CARE Pro
# Phase 41.1 - Production Tenant Bootstrap Plan
# Safe ASCII-only script
# Does not create users, tenants, or secrets.

param(
    [string]$FrontendUrl = "https://raftop-cpap-frontend.onrender.com",
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com"
)

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase41_tenant_bootstrap_plan_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Details
    )

    if ($Status -eq "PASS") {
        $script:PassCount++
    } elseif ($Status -eq "WARN") {
        $script:WarnCount++
    } else {
        $script:FailCount++
    }

    Write-ReportLine ("CHECK: " + $Name)
    Write-ReportLine ("STATUS: " + $Status)
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($Status + " - " + $Name)
}

function Normalize-Url {
    param([string]$Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        return ""
    }

    return $Url.Trim().TrimEnd("/")
}

function Test-UrlShape {
    param(
        [string]$Url,
        [string]$Name
    )

    if ([string]::IsNullOrWhiteSpace($Url)) {
        Add-Result $Name "FAIL" "URL is empty."
    } elseif ($Url -match "localhost" -or $Url -match "127.0.0.1") {
        Add-Result $Name "FAIL" ("URL points to local address: " + $Url)
    } elseif ($Url -notmatch "^https://") {
        Add-Result $Name "FAIL" ("URL must use https: " + $Url)
    } else {
        Add-Result $Name "PASS" ("URL accepted: " + $Url)
    }
}

function Invoke-Get {
    param([string]$Url)

    $Result = @{
        Code = $null
        Body = ""
        Error = ""
    }

    try {
        $Response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        $Result.Code = [int]$Response.StatusCode
        $Result.Body = $Response.Content
    } catch {
        if ($_.Exception.Response -ne $null) {
            try {
                $Result.Code = [int]$_.Exception.Response.StatusCode.value__
            } catch {
                $Result.Error = $_.Exception.Message
            }
        } else {
            $Result.Error = $_.Exception.Message
        }
    }

    return $Result
}

function Test-FileExists {
    param(
        [string]$RelativePath,
        [string]$Name,
        [string]$Required
    )

    $FullPath = Join-Path $Root $RelativePath

    if (Test-Path $FullPath) {
        Add-Result $Name "PASS" ("Found: " + $RelativePath)
    } else {
        if ($Required -eq "YES") {
            Add-Result $Name "FAIL" ("Missing required file: " + $RelativePath)
        } else {
            Add-Result $Name "WARN" ("Optional file missing: " + $RelativePath)
        }
    }
}

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) {
        return $Files[0]
    }

    return $null
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.1 Production Tenant Bootstrap Plan" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report defines the production tenant and admin bootstrap plan for RAFTOP CPAP CARE Pro."
Write-ReportLine "It does not create tenants, users, passwords, or secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.1 tenant bootstrap plan..."
Write-Host ""

$FrontendUrl = Normalize-Url $FrontendUrl
$BackendUrl = Normalize-Url $BackendUrl

Test-UrlShape $FrontendUrl "Frontend URL production check"
Test-UrlShape $BackendUrl "Backend URL production check"

$HealthUrl = $BackendUrl + "/api/health"
$HealthResult = Invoke-Get $HealthUrl

if ($HealthResult.Code -eq 200) {
    Add-Result "Backend health" "PASS" "Backend /api/health returned HTTP 200."
} else {
    Add-Result "Backend health" "FAIL" ("Backend /api/health did not return 200. Status: " + $HealthResult.Code)
}

if ($HealthResult.Body -match '"ok"\s*:\s*true') {
    Add-Result "Backend health payload" "PASS" "Backend reports ok=true."
} else {
    Add-Result "Backend health payload" "WARN" "Backend health payload did not expose ok=true."
}

if ($HealthResult.Body -match '"fallback"\s*:\s*false') {
    Add-Result "Backend fallback state" "PASS" "Backend reports fallback=false."
} else {
    Add-Result "Backend fallback state" "WARN" "Backend fallback state not confirmed as false."
}

$FrontendReport = Get-LatestReport "phase40_frontend_production_verification_*.md"
if ($FrontendReport -eq $null) {
    Add-Result "Latest Phase 40.3 frontend verification report" "WARN" "No Phase 40.3 report found."
} else {
    $Content = Get-Content -Path $FrontendReport.FullName -Raw -ErrorAction SilentlyContinue
    if ($Content -match "FINAL STATUS: PHASE40_FRONTEND_PRODUCTION_DEPLOYMENT_VERIFIED") {
        Add-Result "Phase 40.3 frontend verification status" "PASS" "Frontend production deployment verified."
    } elseif ($Content -match "FINAL STATUS: PHASE40_FRONTEND_PRODUCTION_DEPLOYMENT_VERIFIED_WITH_WARNINGS") {
        Add-Result "Phase 40.3 frontend verification status" "WARN" "Frontend production deployment verified with warnings."
    } else {
        Add-Result "Phase 40.3 frontend verification status" "WARN" "Could not confirm final Phase 40.3 status."
    }
}

Test-FileExists "tools\run_phase40_frontend_production_verification.ps1" "Phase 40.3 frontend verification script" "YES"
Test-FileExists "tools\run_phase39_backend_first_deploy_verification.ps1" "Phase 39.6 backend verification script" "YES"

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "PRODUCTION TENANT TARGET"
Write-ReportLine ""
Write-ReportLine "tenant_id:"
Write-ReportLine "raftopoulos-live"
Write-ReportLine ""
Write-ReportLine "tenant_name:"
Write-ReportLine "RAFTOPOULOS"
Write-ReportLine ""
Write-ReportLine "plan:"
Write-ReportLine "enterprise"
Write-ReportLine ""
Write-ReportLine "status:"
Write-ReportLine "active"
Write-ReportLine ""
Write-ReportLine "commercial stage:"
Write-ReportLine "controlled pilot / enterprise production candidate"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "MODULES TO ENABLE"
Write-ReportLine ""
Write-ReportLine "- compliance dashboard"
Write-ReportLine "- patient management"
Write-ReportLine "- device management"
Write-ReportLine "- ATLAS action system"
Write-ReportLine "- follow-up tasks"
Write-ReportLine "- audit logs"
Write-ReportLine "- failed login audit"
Write-ReportLine "- security command center"
Write-ReportLine "- patient portal"
Write-ReportLine "- patient therapy pages"
Write-ReportLine "- patient nightly analysis"
Write-ReportLine "- patient night compare"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "ROLE MODEL"
Write-ReportLine ""
Write-ReportLine "Super Admin:"
Write-ReportLine "- controlled by platform owner"
Write-ReportLine "- can manage tenants"
Write-ReportLine "- can disable/block tenant if required"
Write-ReportLine "- must not be shared with Raftopoulos users"
Write-ReportLine ""
Write-ReportLine "Raftopoulos Admin:"
Write-ReportLine "- belongs to raftopoulos-live tenant"
Write-ReportLine "- can manage users, patients, devices, tasks"
Write-ReportLine "- cannot access other tenants"
Write-ReportLine ""
Write-ReportLine "Provider/Staff:"
Write-ReportLine "- belongs to raftopoulos-live tenant"
Write-ReportLine "- can work operational queues"
Write-ReportLine "- cannot access super admin controls"
Write-ReportLine ""
Write-ReportLine "Patient:"
Write-ReportLine "- patient portal only"
Write-ReportLine "- cannot access tenant admin routes"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "BOOTSTRAP ACCEPTANCE CHECKLIST"
Write-ReportLine ""
Write-ReportLine "- production tenant exists: PENDING"
Write-ReportLine "- tenant_id is raftopoulos-live: PENDING"
Write-ReportLine "- tenant status is active: PENDING"
Write-ReportLine "- enterprise plan is configured: PENDING"
Write-ReportLine "- required modules are enabled: PENDING"
Write-ReportLine "- super admin access exists: PENDING"
Write-ReportLine "- Raftopoulos admin user exists: PENDING"
Write-ReportLine "- staff/provider role tested: PENDING"
Write-ReportLine "- patient role tested: PENDING"
Write-ReportLine "- tenant isolation verified: PENDING"
Write-ReportLine "- patient portal guard verified: PENDING"
Write-ReportLine "- audit event created for bootstrap: PENDING"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "COMMERCIAL PILOT READINESS IMPLICATION"
Write-ReportLine ""
Write-ReportLine "After tenant bootstrap, the platform can move from production deployment verification to controlled Raftopoulos pilot preparation."
Write-ReportLine ""
Write-ReportLine "Do not import real patient data until backup, restore, access control, and patient import policy are verified."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "NEXT PHASE"
Write-ReportLine ""
Write-ReportLine "Phase 41.2 - Tenant Bootstrap Endpoint Discovery and Admin Setup Method"
Write-ReportLine ""
Write-ReportLine "This will determine whether tenant/admin bootstrap can be executed through an existing API, DB seed/bootstrap script, or controlled SQL migration."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_TENANT_BOOTSTRAP_PLAN_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_TENANT_BOOTSTRAP_PLAN_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_TENANT_BOOTSTRAP_PLAN_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.1 Tenant Bootstrap Plan"
Write-Host "============================================================"
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host ("PASS_COUNT: " + $script:PassCount)
Write-Host ("WARN_COUNT: " + $script:WarnCount)
Write-Host ("FAIL_COUNT: " + $script:FailCount)
Write-Host ""
Write-Host ("FINAL STATUS: " + $FinalStatus)
Write-Host ""

exit $ExitCode