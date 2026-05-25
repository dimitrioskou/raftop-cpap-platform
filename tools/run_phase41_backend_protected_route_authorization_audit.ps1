# RAFTOP CPAP CARE Pro
# Phase 41.11 - Backend Protected Route Authorization Audit
# Safe ASCII-only script
# Checks that protected backend APIs do not expose data without authentication.
# Does not use secrets. Does not modify database.

param(
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com",
    [string]$TenantId = "raftopoulos-live"
)

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BackendSrcDir = Join-Path $Root "enterprise-backend\src"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase41_backend_protected_route_authorization_audit_" + $Timestamp + ".md")

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
        [string]$StatusValue,
        [string]$Details
    )

    if ($StatusValue -eq "PASS") {
        $script:PassCount++
    } elseif ($StatusValue -eq "WARN") {
        $script:WarnCount++
    } else {
        $script:FailCount++
    }

    Write-ReportLine ("CHECK: " + $Name)
    Write-ReportLine ("STATUS: " + $StatusValue)
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($StatusValue + " - " + $Name)
}

function Normalize-Url {
    param([string]$Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        return ""
    }

    return $Url.Trim().TrimEnd("/")
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

function Get-BackendFiles {
    if (!(Test-Path $BackendSrcDir)) {
        return @()
    }

    return Get-ChildItem -Path $BackendSrcDir -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.Extension -in @(".js", ".ts", ".json")
    }
}

function Find-Matches {
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

    $Max = [Math]::Min($Matches.Count, 25)
    $Items = @()

    for ($i = 0; $i -lt $Max; $i++) {
        $Relative = $Matches[$i].Path.Replace($Root + "\", "")
        $Items += ($Relative + ": line " + $Matches[$i].LineNumber)
    }

    if ($Matches.Count -gt 25) {
        $Items += ("... plus " + ($Matches.Count - 25) + " more")
    }

    return ($Items -join "; ")
}

function Count-Matches {
    param([array]$Matches)

    if ($Matches -eq $null) {
        return 0
    }

    return $Matches.Count
}

function Invoke-ApiGet {
    param(
        [string]$Url,
        [hashtable]$Headers
    )

    $Result = @{
        Code = $null
        Body = ""
        Error = ""
    }

    try {
        if ($Headers -eq $null) {
            $Response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        } else {
            $Response = Invoke-WebRequest -Uri $Url -Method GET -Headers $Headers -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        }

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

function Evaluate-ProtectedResponse {
    param(
        [string]$Name,
        [string]$Mode,
        [object]$Result
    )

    $Code = $Result.Code
    $Body = $Result.Body
    $ErrorText = $Result.Error

    if ($Code -eq 200) {
        Add-Result ($Name + " - " + $Mode) "FAIL" ("Protected endpoint returned HTTP 200 without token. This may expose data.")
        return
    }

    if ($Code -eq 401 -or $Code -eq 403) {
        Add-Result ($Name + " - " + $Mode) "PASS" ("Protected endpoint blocked request. HTTP " + $Code)
        return
    }

    if ($Code -eq 404) {
        Add-Result ($Name + " - " + $Mode) "WARN" "Endpoint returned HTTP 404. No data exposed, but route may be missing or renamed."
        return
    }

    if ($Code -eq 405) {
        Add-Result ($Name + " - " + $Mode) "WARN" "Endpoint returned HTTP 405. Method may not be supported for GET."
        return
    }

    if ($Code -eq 500) {
        Add-Result ($Name + " - " + $Mode) "WARN" "Endpoint returned HTTP 500 without token. No 200 exposure, but error handling should be reviewed."
        return
    }

    if ($Code -eq $null) {
        Add-Result ($Name + " - " + $Mode) "WARN" ("No HTTP status captured. Error: " + $ErrorText)
        return
    }

    Add-Result ($Name + " - " + $Mode) "WARN" ("Unexpected HTTP status without token: " + $Code)
}

$BackendUrl = Normalize-Url $BackendUrl

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.11 Backend Protected Route Authorization Audit" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report checks whether production backend APIs expose protected data without authentication."
Write-ReportLine "It does not use secrets and does not modify the database."
Write-ReportLine ""
Write-ReportLine "Backend:"
Write-ReportLine $BackendUrl
Write-ReportLine ""
Write-ReportLine "Tenant:"
Write-ReportLine $TenantId
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.11 backend protected route authorization audit..."
Write-Host ""

$LatestAuthGuardReport = Get-LatestReport "phase41_production_auth_guard_verification_*.md"

if ($LatestAuthGuardReport -eq $null) {
    Add-Result "Latest frontend auth guard verification report" "WARN" "No Phase 41.10D auth guard verification report found."
} else {
    $AuthGuardContent = Get-Content -Path $LatestAuthGuardReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($AuthGuardContent -match "FINAL STATUS: PHASE41_PRODUCTION_AUTH_GUARD_VERIFIED" -or $AuthGuardContent -match "FINAL STATUS: PHASE41_PRODUCTION_AUTH_GUARD_VERIFIED_WITH_WARNINGS") {
        Add-Result "Latest frontend auth guard verification status" "PASS" "Frontend auth guard verification has acceptable final status."
    } else {
        Add-Result "Latest frontend auth guard verification status" "WARN" "Frontend auth guard verification report exists but final status is not confirmed acceptable."
    }
}

if (Test-Path $BackendSrcDir) {
    Add-Result "Backend source directory" "PASS" "Backend src directory found."
} else {
    Add-Result "Backend source directory" "FAIL" "Backend src directory missing."
}

$BackendFiles = Get-BackendFiles

if ($BackendFiles.Count -gt 0) {
    Add-Result "Backend source scan scope" "PASS" ("Scannable backend files: " + $BackendFiles.Count)
} else {
    Add-Result "Backend source scan scope" "FAIL" "No backend source files found."
}

$JwtMatches = Find-Matches $BackendFiles "jwt"
$VerifyMatches = Find-Matches $BackendFiles "jwt.verify"
$AuthHeaderMatches = Find-Matches $BackendFiles "authorization"
$BearerMatches = Find-Matches $BackendFiles "Bearer"
$TenantMatches = Find-Matches $BackendFiles "x-tenant-id"
$SuperAdminMatches = Find-Matches $BackendFiles "x-super-admin-key"
$RequireAuthMatches = Find-Matches $BackendFiles "requireAuth"
$AuthenticateMatches = Find-Matches $BackendFiles "authenticate"
$UnauthorizedMatches = Find-Matches $BackendFiles "Unauthorized"
$ForbiddenMatches = Find-Matches $BackendFiles "Forbidden"
$RouteMatches = Find-Matches $BackendFiles "router."
$AppGetMatches = Find-Matches $BackendFiles "app.get"
$AppUseMatches = Find-Matches $BackendFiles "app.use"

if ((Count-Matches $JwtMatches) -gt 0) {
    Add-Result "JWT source references" "PASS" (Format-MatchLocations $JwtMatches)
} else {
    Add-Result "JWT source references" "WARN" "No JWT references found in backend source."
}

if ((Count-Matches $VerifyMatches) -gt 0) {
    Add-Result "JWT verify references" "PASS" (Format-MatchLocations $VerifyMatches)
} else {
    Add-Result "JWT verify references" "WARN" "No jwt.verify references found in backend source."
}

if ((Count-Matches $AuthHeaderMatches) -gt 0 -or (Count-Matches $BearerMatches) -gt 0) {
    Add-Result "Authorization header references" "PASS" ((Format-MatchLocations $AuthHeaderMatches) + " | " + (Format-MatchLocations $BearerMatches))
} else {
    Add-Result "Authorization header references" "WARN" "No Authorization/Bearer references found."
}

if ((Count-Matches $TenantMatches) -gt 0) {
    Add-Result "Tenant header references" "PASS" (Format-MatchLocations $TenantMatches)
} else {
    Add-Result "Tenant header references" "WARN" "No x-tenant-id references found."
}

if ((Count-Matches $SuperAdminMatches) -gt 0) {
    Add-Result "Super admin key references" "PASS" (Format-MatchLocations $SuperAdminMatches)
} else {
    Add-Result "Super admin key references" "WARN" "No x-super-admin-key references found."
}

if ((Count-Matches $RequireAuthMatches) -gt 0 -or (Count-Matches $AuthenticateMatches) -gt 0) {
    Add-Result "Auth middleware naming references" "PASS" ((Format-MatchLocations $RequireAuthMatches) + " | " + (Format-MatchLocations $AuthenticateMatches))
} else {
    Add-Result "Auth middleware naming references" "WARN" "No requireAuth/authenticate references found."
}

if ((Count-Matches $UnauthorizedMatches) -gt 0 -or (Count-Matches $ForbiddenMatches) -gt 0) {
    Add-Result "Unauthorized/Forbidden response references" "PASS" ((Format-MatchLocations $UnauthorizedMatches) + " | " + (Format-MatchLocations $ForbiddenMatches))
} else {
    Add-Result "Unauthorized/Forbidden response references" "WARN" "No Unauthorized/Forbidden response references found."
}

if ((Count-Matches $RouteMatches) -gt 0 -or (Count-Matches $AppGetMatches) -gt 0 -or (Count-Matches $AppUseMatches) -gt 0) {
    Add-Result "Route source references" "PASS" "Route references found in backend source."
} else {
    Add-Result "Route source references" "WARN" "Could not find route references."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "LIVE API AUTHORIZATION TESTS"
Write-ReportLine ""

$Health = Invoke-ApiGet ($BackendUrl + "/api/health") $null

if ($Health.Code -eq 200) {
    Add-Result "Public health endpoint" "PASS" "Public /api/health returned HTTP 200."
} else {
    Add-Result "Public health endpoint" "WARN" ("Public /api/health did not return HTTP 200. Status: " + $Health.Code)
}

$ProtectedEndpoints = @(
    @{ Name = "Tenant subscription status"; Path = "/api/tenant/subscription/status?tenantId=" + $TenantId },
    @{ Name = "Tenant patients"; Path = "/api/tenant/patients" },
    @{ Name = "Tenant devices"; Path = "/api/tenant/devices" },
    @{ Name = "Tenant users"; Path = "/api/tenant/users" },
    @{ Name = "Tenant compliance"; Path = "/api/tenant/compliance" },
    @{ Name = "Tenant followup"; Path = "/api/tenant/followup" },
    @{ Name = "Tenant tasks unified"; Path = "/api/tenant/tasks-unified" },
    @{ Name = "Tenant notes"; Path = "/api/tenant/notes" },
    @{ Name = "Tenant referrals"; Path = "/api/tenant/referrals" },
    @{ Name = "Tenant notifications"; Path = "/api/tenant/notifications" },
    @{ Name = "ATLAS summary"; Path = "/api/tenant/atlas/summary" },
    @{ Name = "ATLAS queue"; Path = "/api/tenant/atlas/queue" },
    @{ Name = "ATLAS daily"; Path = "/api/tenant/atlas/daily" },
    @{ Name = "ATLAS tasks"; Path = "/api/tenant/atlas/tasks" },
    @{ Name = "ATLAS alerts"; Path = "/api/tenant/atlas/alerts" },
    @{ Name = "ATLAS auto actions"; Path = "/api/tenant/atlas/auto-actions" },
    @{ Name = "ATLAS action center"; Path = "/api/tenant/atlas/action-center" },
    @{ Name = "Admin tenants"; Path = "/api/admin/tenants" },
    @{ Name = "Admin users"; Path = "/api/admin/users" },
    @{ Name = "System live verification"; Path = "/api/system/live-verification" }
)

$TenantOnlyHeaders = @{
    "x-tenant-id" = $TenantId
}

foreach ($Endpoint in $ProtectedEndpoints) {
    $Name = $Endpoint.Name
    $Path = $Endpoint.Path
    $Url = $BackendUrl + $Path

    Write-ReportLine ("TEST_ENDPOINT: " + $Name)
    Write-ReportLine ("URL_PATH: " + $Path)

    $NoHeaderResult = Invoke-ApiGet $Url $null
    Evaluate-ProtectedResponse $Name "no headers" $NoHeaderResult

    $TenantOnlyResult = Invoke-ApiGet $Url $TenantOnlyHeaders
    Evaluate-ProtectedResponse $Name "tenant header only" $TenantOnlyResult

    Write-ReportLine ""
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "AUDIT INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "PASS means the endpoint blocked access with 401/403."
Write-ReportLine "WARN means no data exposure was confirmed, but route behavior needs review."
Write-ReportLine "FAIL means an endpoint returned HTTP 200 without authentication and may expose protected data."
Write-ReportLine ""
Write-ReportLine "If any FAIL exists, do not proceed to pilot/demo data until backend authorization is fixed."
Write-ReportLine ""
Write-ReportLine "Next phase if no FAIL:"
Write-ReportLine "Phase 41.12 - Admin Login End-to-End Verification"
Write-ReportLine ""
Write-ReportLine "Next phase if FAIL exists:"
Write-ReportLine "Phase 41.11B - Backend Authorization Enforcement Fix"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_BACKEND_PROTECTED_ROUTE_AUTHORIZATION_AUDIT_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_BACKEND_PROTECTED_ROUTE_AUTHORIZATION_AUDIT_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_BACKEND_PROTECTED_ROUTE_AUTHORIZATION_AUDIT_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.11 Backend Protected Route Authorization Audit"
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