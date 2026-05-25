# RAFTOP CPAP CARE Pro
# Phase 41.12 - Admin Login End-to-End Verification
# Safe ASCII-only script
# Uses admin password from env only. Does not print password or token.

param(
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com",
    [string]$FrontendUrl = "https://raftop-cpap-frontend.onrender.com",
    [string]$TenantId = "raftopoulos-live",
    [string]$AdminEmail = "dimitrisgelly@gmail.com"
)

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase41_admin_login_e2e_verification_" + $Timestamp + ".md")

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

function Invoke-Get {
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
                try {
                    $Reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $Result.Body = $Reader.ReadToEnd()
                } catch {
                    $Result.Body = ""
                }
            } catch {
                $Result.Error = $_.Exception.Message
            }
        } else {
            $Result.Error = $_.Exception.Message
        }
    }

    return $Result
}

function Invoke-PostJson {
    param(
        [string]$Url,
        [hashtable]$Headers,
        [hashtable]$Body
    )

    $Result = @{
        Code = $null
        Body = ""
        Error = ""
    }

    try {
        $JsonBody = $Body | ConvertTo-Json -Depth 10
        $Response = Invoke-WebRequest -Uri $Url -Method POST -Headers $Headers -Body $JsonBody -ContentType "application/json" -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        $Result.Code = [int]$Response.StatusCode
        $Result.Body = $Response.Content
    } catch {
        if ($_.Exception.Response -ne $null) {
            try {
                $Result.Code = [int]$_.Exception.Response.StatusCode.value__
                try {
                    $Reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $Result.Body = $Reader.ReadToEnd()
                } catch {
                    $Result.Body = ""
                }
            } catch {
                $Result.Error = $_.Exception.Message
            }
        } else {
            $Result.Error = $_.Exception.Message
        }
    }

    return $Result
}

function Extract-Token {
    param([string]$Body)

    if ([string]::IsNullOrWhiteSpace($Body)) {
        return ""
    }

    try {
        $Json = $Body | ConvertFrom-Json -ErrorAction Stop
    } catch {
        return ""
    }

    $Candidates = @(
        $Json.token,
        $Json.accessToken,
        $Json.access_token,
        $Json.jwt,
        $Json.authToken,
        $Json.data.token,
        $Json.data.accessToken,
        $Json.data.access_token
    )

    foreach ($Candidate in $Candidates) {
        if (![string]::IsNullOrWhiteSpace($Candidate)) {
            return [string]$Candidate
        }
    }

    return ""
}

function Extract-UserRole {
    param([string]$Body)

    if ([string]::IsNullOrWhiteSpace($Body)) {
        return ""
    }

    try {
        $Json = $Body | ConvertFrom-Json -ErrorAction Stop
    } catch {
        return ""
    }

    $Candidates = @(
        $Json.user.role,
        $Json.data.user.role,
        $Json.role
    )

    foreach ($Candidate in $Candidates) {
        if (![string]::IsNullOrWhiteSpace($Candidate)) {
            return [string]$Candidate
        }
    }

    return ""
}

function Extract-UserTenant {
    param([string]$Body)

    if ([string]::IsNullOrWhiteSpace($Body)) {
        return ""
    }

    try {
        $Json = $Body | ConvertFrom-Json -ErrorAction Stop
    } catch {
        return ""
    }

    $Candidates = @(
        $Json.user.tenant_id,
        $Json.user.tenantId,
        $Json.data.user.tenant_id,
        $Json.data.user.tenantId,
        $Json.tenant_id,
        $Json.tenantId
    )

    foreach ($Candidate in $Candidates) {
        if (![string]::IsNullOrWhiteSpace($Candidate)) {
            return [string]$Candidate
        }
    }

    return ""
}

function Evaluate-AuthenticatedEndpoint {
    param(
        [string]$Name,
        [object]$Result
    )

    $Code = $Result.Code

    if ($Code -eq 200) {
        Add-Result $Name "PASS" "Authenticated endpoint returned HTTP 200."
        return
    }

    if ($Code -eq 202) {
        Add-Result $Name "PASS" "Authenticated endpoint returned HTTP 202."
        return
    }

    if ($Code -eq 401 -or $Code -eq 403) {
        Add-Result $Name "FAIL" ("Authenticated endpoint rejected valid login token. HTTP " + $Code)
        return
    }

    if ($Code -eq 404) {
        Add-Result $Name "WARN" "Authenticated endpoint returned HTTP 404. Route may be missing or renamed."
        return
    }

    if ($Code -eq 405) {
        Add-Result $Name "WARN" "Authenticated endpoint returned HTTP 405. Method may not be supported."
        return
    }

    if ($Code -eq 500) {
        Add-Result $Name "WARN" "Authenticated endpoint returned HTTP 500. Backend route implementation needs review."
        return
    }

    if ($Code -eq 501) {
        Add-Result $Name "WARN" "Authenticated endpoint returned HTTP 501 safe fallback. Route implementation pending."
        return
    }

    if ($Code -eq $null) {
        Add-Result $Name "WARN" ("No HTTP status captured. Error: " + $Result.Error)
        return
    }

    Add-Result $Name "WARN" ("Unexpected HTTP status: " + $Code)
}

$BackendUrl = Normalize-Url $BackendUrl
$FrontendUrl = Normalize-Url $FrontendUrl
$AdminPassword = $env:RAFTOP_BOOTSTRAP_ADMIN_PASSWORD

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.12 Admin Login End-to-End Verification" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report verifies end-to-end production admin login and authenticated backend access."
Write-ReportLine "It does not print password or token."
Write-ReportLine ""
Write-ReportLine "Backend:"
Write-ReportLine $BackendUrl
Write-ReportLine ""
Write-ReportLine "Frontend:"
Write-ReportLine $FrontendUrl
Write-ReportLine ""
Write-ReportLine "Tenant:"
Write-ReportLine $TenantId
Write-ReportLine ""
Write-ReportLine "Admin email:"
Write-ReportLine $AdminEmail
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.12 admin login E2E verification..."
Write-Host ""

if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    Add-Result "Admin password environment variable" "FAIL" "RAFTOP_BOOTSTRAP_ADMIN_PASSWORD is missing."
} elseif ($AdminPassword.Length -lt 12) {
    Add-Result "Admin password strength" "FAIL" "Admin password is shorter than 12 characters."
} else {
    Add-Result "Admin password environment variable" "PASS" "Admin password present. Value not printed."
}

$FrontendResult = Invoke-Get $FrontendUrl $null

if ($FrontendResult.Code -eq 200) {
    Add-Result "Frontend root HTTP" "PASS" "Frontend root returned HTTP 200."
} else {
    Add-Result "Frontend root HTTP" "WARN" ("Frontend root status: " + $FrontendResult.Code)
}

$FrontendLoginResult = Invoke-Get ($FrontendUrl + "/login") $null

if ($FrontendLoginResult.Code -eq 200) {
    Add-Result "Frontend login HTTP" "PASS" "Frontend /login returned HTTP 200."
} else {
    Add-Result "Frontend login HTTP" "WARN" ("Frontend /login status: " + $FrontendLoginResult.Code)
}

if ($FrontendLoginResult.Body -match "raftop-hard-login-screen" -or $FrontendLoginResult.Body -match "raftop-login-password") {
    Add-Result "Frontend hard login marker" "PASS" "Frontend login source contains hard login marker."
} else {
    Add-Result "Frontend hard login marker" "WARN" "Could not confirm hard login marker from /login source."
}

$HealthResult = Invoke-Get ($BackendUrl + "/api/health") $null

if ($HealthResult.Code -eq 200) {
    Add-Result "Backend health" "PASS" "Backend /api/health returned HTTP 200."
} else {
    Add-Result "Backend health" "FAIL" ("Backend /api/health did not return HTTP 200. Status: " + $HealthResult.Code)
}

$LoginUrl = $BackendUrl + "/api/auth/login"
$BaseHeaders = @{
    "x-tenant-id" = $TenantId
}

$LoginAttempts = @(
    @{
        Name = "tenantId payload"
        Body = @{
            email = $AdminEmail
            password = $AdminPassword
            tenantId = $TenantId
        }
    },
    @{
        Name = "tenant_id payload"
        Body = @{
            email = $AdminEmail
            password = $AdminPassword
            tenant_id = $TenantId
        }
    },
    @{
        Name = "header tenant only"
        Body = @{
            email = $AdminEmail
            password = $AdminPassword
        }
    }
)

$Token = ""
$LoginBody = ""
$LoginStatus = $null
$LoginMode = ""

foreach ($Attempt in $LoginAttempts) {
    if (![string]::IsNullOrWhiteSpace($Token)) {
        break
    }

    $Result = Invoke-PostJson $LoginUrl $BaseHeaders $Attempt.Body
    $LoginStatus = $Result.Code
    $CandidateToken = Extract-Token $Result.Body

    if ($Result.Code -eq 200 -and ![string]::IsNullOrWhiteSpace($CandidateToken)) {
        $Token = $CandidateToken
        $LoginBody = $Result.Body
        $LoginMode = $Attempt.Name
    }
}

if (![string]::IsNullOrWhiteSpace($Token)) {
    Add-Result "Backend admin login" "PASS" ("Login returned usable token using mode: " + $LoginMode)
    Write-ReportLine "LOGIN_TOKEN_PRESENT: true"
    Write-ReportLine "LOGIN_TOKEN_VALUE: hidden"
} else {
    Add-Result "Backend admin login" "FAIL" ("Login did not return usable token. Last HTTP status: " + $LoginStatus)
    Write-ReportLine "LOGIN_TOKEN_PRESENT: false"
}

$UserRole = Extract-UserRole $LoginBody
$UserTenant = Extract-UserTenant $LoginBody

if ([string]::IsNullOrWhiteSpace($UserRole)) {
    Add-Result "Login user role" "WARN" "Login response did not expose user role, or role is nested differently."
} elseif ($UserRole -eq "admin" -or $UserRole -eq "super_admin") {
    Add-Result "Login user role" "PASS" ("Login user role: " + $UserRole)
} else {
    Add-Result "Login user role" "WARN" ("Unexpected login user role: " + $UserRole)
}

if ([string]::IsNullOrWhiteSpace($UserTenant)) {
    Add-Result "Login user tenant" "WARN" "Login response did not expose tenant id, or tenant id is nested differently."
} elseif ($UserTenant -eq $TenantId) {
    Add-Result "Login user tenant" "PASS" "Login response tenant matches target tenant."
} else {
    Add-Result "Login user tenant" "WARN" ("Login response tenant differs. Value: " + $UserTenant)
}

if (![string]::IsNullOrWhiteSpace($Token)) {
    $AuthHeaders = @{
        "Authorization" = "Bearer " + $Token
        "x-tenant-id" = $TenantId
    }

    $ProtectedChecks = @(
        @{ Name = "Protected subscription status with token"; Path = "/api/tenant/subscription/status?tenantId=" + $TenantId },
        @{ Name = "Protected tenant users with token"; Path = "/api/tenant/users" },
        @{ Name = "Protected tenant patients with token"; Path = "/api/tenant/patients" },
        @{ Name = "Protected tenant devices with token"; Path = "/api/tenant/devices" },
        @{ Name = "Protected ATLAS summary with token"; Path = "/api/tenant/atlas/summary" },
        @{ Name = "Protected ATLAS action center with token"; Path = "/api/tenant/atlas/action-center" },
        @{ Name = "Protected tenant tasks with token"; Path = "/api/tenant/tasks-unified" },
        @{ Name = "Protected tenant notes with token"; Path = "/api/tenant/notes" }
    )

    foreach ($Check in $ProtectedChecks) {
        $EndpointResult = Invoke-Get ($BackendUrl + $Check.Path) $AuthHeaders
        Evaluate-AuthenticatedEndpoint $Check.Name $EndpointResult
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "E2E INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "PASS means production admin login works and protected backend routes accept authenticated access."
Write-ReportLine "WARN means route implementation, response shape or fallback route needs review but auth token was not rejected."
Write-ReportLine "FAIL means login or authenticated access is broken and must be fixed before pilot/demo data."
Write-ReportLine ""
Write-ReportLine "Next phase if no FAIL:"
Write-ReportLine "Phase 42 - Pilot Demo Data and Operational Readiness"
Write-ReportLine ""
Write-ReportLine "Next phase if FAIL exists:"
Write-ReportLine "Phase 41.12B - Login/Auth Integration Fix"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_ADMIN_LOGIN_E2E_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_ADMIN_LOGIN_E2E_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_ADMIN_LOGIN_E2E_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.12 Admin Login E2E Verification"
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