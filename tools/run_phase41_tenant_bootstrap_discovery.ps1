# RAFTOP CPAP CARE Pro
# Phase 41.2 - Tenant Bootstrap Endpoint Discovery and Admin Setup Method
# Safe ASCII-only script
# Does not create tenants, users, passwords, or secrets.

param(
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com"
)

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BackendDir = Join-Path $Root "enterprise-backend"
$BackendSrcDir = Join-Path $BackendDir "src"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase41_tenant_bootstrap_discovery_" + $Timestamp + ".md")

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

function Invoke-PostEmpty {
    param([string]$Url)

    $Result = @{
        Code = $null
        Body = ""
        Error = ""
    }

    try {
        $Response = Invoke-WebRequest -Uri $Url -Method POST -ContentType "application/json" -Body "{}" -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
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

function Get-BackendFiles {
    if (!(Test-Path $BackendSrcDir)) {
        return @()
    }

    $Files = Get-ChildItem -Path $BackendSrcDir -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.Extension -in @(".js", ".ts", ".json")
    }

    return $Files
}

function Find-BackendMatches {
    param(
        [array]$Files,
        [string]$Pattern
    )

    $Matches = @()

    foreach ($File in $Files) {
        try {
            $Result = Select-String -Path $File.FullName -Pattern $Pattern -SimpleMatch -ErrorAction SilentlyContinue
            if ($Result) {
                $Matches += $Result
            }
        } catch {
        }
    }

    return $Matches
}

function Format-MatchLocations {
    param([array]$Matches)

    if ($Matches.Count -eq 0) {
        return "No matches."
    }

    $Max = [Math]::Min($Matches.Count, 20)
    $Items = @()

    for ($i = 0; $i -lt $Max; $i++) {
        $Relative = $Matches[$i].Path.Replace($Root + "\", "")
        $Items += ($Relative + ": line " + $Matches[$i].LineNumber)
    }

    if ($Matches.Count -gt 20) {
        $Items += ("... plus " + ($Matches.Count - 20) + " more")
    }

    return ($Items -join "; ")
}

function Test-EndpointExistsStatus {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [string]$Mode
    )

    $Url = $BackendUrl + $Path

    if ($Method -eq "POST") {
        $Result = Invoke-PostEmpty $Url
    } else {
        $Result = Invoke-Get $Url
    }

    $Code = $Result.Code

    if ($Mode -eq "RequiredProtected") {
        if ($Code -in @(200, 400, 401, 403, 405)) {
            Add-Result $Name "PASS" ("Endpoint responded with acceptable status: " + $Code)
        } elseif ($Code -eq 404) {
            Add-Result $Name "WARN" ("Endpoint returned 404. It may not exist: " + $Path)
        } else {
            Add-Result $Name "WARN" ("Endpoint returned status: " + $Code + " Error: " + $Result.Error)
        }
    } else {
        if ($Code -in @(200, 400, 401, 403, 405)) {
            Add-Result $Name "PASS" ("Endpoint responded with status: " + $Code)
        } elseif ($Code -eq 404) {
            Add-Result $Name "WARN" ("Optional endpoint returned 404: " + $Path)
        } else {
            Add-Result $Name "WARN" ("Optional endpoint returned status: " + $Code + " Error: " + $Result.Error)
        }
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.2 Tenant Bootstrap Discovery" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This discovery determines the safest method for creating the production tenant and admin setup."
Write-ReportLine "It does not create tenants, users, passwords, or secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.2 tenant bootstrap discovery..."
Write-Host ""

$BackendUrl = Normalize-Url $BackendUrl

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

Test-FileExists "enterprise-backend\src\server.js" "Backend server entry" "YES"
Test-FileExists "tools\run_phase41_tenant_bootstrap_plan.ps1" "Phase 41.1 tenant bootstrap plan script" "YES"
Test-FileExists "tools\run_phase40_frontend_production_verification.ps1" "Phase 40.3 frontend verification script" "YES"

$BackendFiles = Get-BackendFiles

if ($BackendFiles.Count -gt 0) {
    Add-Result "Backend source scan scope" "PASS" ("Scannable backend files: " + $BackendFiles.Count)
} else {
    Add-Result "Backend source scan scope" "FAIL" "No backend source files found."
}

$RestoreMatches = Find-BackendMatches $BackendFiles "restore-bootstrap"
if ($RestoreMatches.Count -gt 0) {
    Add-Result "Restore bootstrap route references" "PASS" (Format-MatchLocations $RestoreMatches)
} else {
    Add-Result "Restore bootstrap route references" "WARN" "No restore-bootstrap references found."
}

$BootstrapMatches = Find-BackendMatches $BackendFiles "bootstrap"
if ($BootstrapMatches.Count -gt 0) {
    Add-Result "Bootstrap references" "PASS" (Format-MatchLocations $BootstrapMatches)
} else {
    Add-Result "Bootstrap references" "WARN" "No bootstrap references found."
}

$TenantMatches = Find-BackendMatches $BackendFiles "tenant"
if ($TenantMatches.Count -gt 0) {
    Add-Result "Tenant references" "PASS" (Format-MatchLocations $TenantMatches)
} else {
    Add-Result "Tenant references" "WARN" "No tenant references found."
}

$UserMatches = Find-BackendMatches $BackendFiles "users"
if ($UserMatches.Count -gt 0) {
    Add-Result "User management references" "PASS" (Format-MatchLocations $UserMatches)
} else {
    Add-Result "User management references" "WARN" "No users references found."
}

$SubscriptionMatches = Find-BackendMatches $BackendFiles "subscription"
if ($SubscriptionMatches.Count -gt 0) {
    Add-Result "Subscription references" "PASS" (Format-MatchLocations $SubscriptionMatches)
} else {
    Add-Result "Subscription references" "WARN" "No subscription references found."
}

$AdminMatches = Find-BackendMatches $BackendFiles "admin"
if ($AdminMatches.Count -gt 0) {
    Add-Result "Admin references" "PASS" (Format-MatchLocations $AdminMatches)
} else {
    Add-Result "Admin references" "WARN" "No admin references found."
}

Test-EndpointExistsStatus "Auth login route live check" "POST" "/api/auth/login" "RequiredProtected"
Test-EndpointExistsStatus "Tenant subscription route live check" "GET" "/api/tenant/subscription/status" "RequiredProtected"
Test-EndpointExistsStatus "Tenant patients route live check" "GET" "/api/tenant/patients" "RequiredProtected"
Test-EndpointExistsStatus "Tenant users route live check" "GET" "/api/tenant/users" "Optional"
Test-EndpointExistsStatus "Admin restore bootstrap route live check" "POST" "/api/admin/restore-bootstrap" "Optional"
Test-EndpointExistsStatus "Admin tenants route live check" "GET" "/api/admin/tenants" "Optional"

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "DISCOVERY INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "Possible bootstrap methods:"
Write-ReportLine ""
Write-ReportLine "Method A - Existing restore/bootstrap API"
Write-ReportLine "- Use if /api/admin/restore-bootstrap exists and is protected by RESTORE_KEY."
Write-ReportLine "- Best when the route can safely create tenant/admin baseline."
Write-ReportLine ""
Write-ReportLine "Method B - Existing admin/tenant API"
Write-ReportLine "- Use if admin tenant/user routes exist and are protected."
Write-ReportLine "- Requires authenticated super admin or API key."
Write-ReportLine ""
Write-ReportLine "Method C - Controlled DB bootstrap script"
Write-ReportLine "- Use if API endpoints are incomplete or too risky."
Write-ReportLine "- Script must insert tenant, admin user, subscription, modules, and audit event."
Write-ReportLine "- Script must not hardcode secrets."
Write-ReportLine ""
Write-ReportLine "Method D - Manual SQL migration"
Write-ReportLine "- Last resort."
Write-ReportLine "- Must be backed up and documented."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "RECOMMENDED NEXT STEP"
Write-ReportLine ""
Write-ReportLine "Do not create the production tenant until the discovery result is reviewed."
Write-ReportLine ""
Write-ReportLine "If restore-bootstrap route exists and is protected, proceed to Phase 41.3A."
Write-ReportLine "If not, proceed to Phase 41.3B controlled DB bootstrap script."
Write-ReportLine ""
Write-ReportLine "Recommended default:"
Write-ReportLine "Phase 41.3B - Controlled DB Tenant Bootstrap Script"
Write-ReportLine ""
Write-ReportLine "Reason:"
Write-ReportLine "Production tenant creation must be deterministic, auditable, and repeatable."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "TARGET TENANT"
Write-ReportLine ""
Write-ReportLine "tenant_id: raftopoulos-live"
Write-ReportLine "tenant_name: RAFTOPOULOS"
Write-ReportLine "plan: enterprise"
Write-ReportLine "status: active"
Write-ReportLine "modules: compliance, atlas, patient-portal, security, audit"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_TENANT_BOOTSTRAP_DISCOVERY_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_TENANT_BOOTSTRAP_DISCOVERY_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_TENANT_BOOTSTRAP_DISCOVERY_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.2 Tenant Bootstrap Discovery"
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