# RAFTOP CPAP CARE Pro
# Phase 42.5B - Pilot Demo API Route Verification
# Safe ASCII-only script
# Tests protected pilot demo API routes using admin login token.
# Does not print password or token.

param(
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com",
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
$ReportPath = Join-Path $ReportsDir ("phase42_pilot_demo_api_route_verification_" + $Timestamp + ".md")

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

function Parse-Json {
    param([string]$Body)

    try {
        return $Body | ConvertFrom-Json -ErrorAction Stop
    } catch {
        return $null
    }
}

function Check-AuthenticatedRoute {
    param(
        [string]$Name,
        [string]$Path,
        [hashtable]$Headers
    )

    $Result = Invoke-Get ($BackendUrl + $Path) $Headers

    if ($Result.Code -eq 200) {
        $Json = Parse-Json $Result.Body

        if ($Json -eq $null) {
            Add-Result $Name "WARN" "Returned HTTP 200 but response was not parseable JSON."
            return
        }

        if ($Json.ok -eq $true) {
            Add-Result $Name "PASS" "Returned HTTP 200 with ok=true."
        } else {
            Add-Result $Name "WARN" "Returned HTTP 200 but ok was not true."
        }

        return
    }

    if ($Result.Code -eq 401 -or $Result.Code -eq 403) {
        Add-Result $Name "FAIL" ("Authenticated request was rejected. HTTP " + $Result.Code)
        return
    }

    if ($Result.Code -eq 404) {
        Add-Result $Name "FAIL" "Route returned HTTP 404. Pilot demo route may not be mounted."
        return
    }

    if ($Result.Code -eq 500) {
        Add-Result $Name "FAIL" "Route returned HTTP 500. Backend route implementation failed."
        Write-ReportLine ("FAILED_BODY_" + $Name.Replace(" ", "_") + ": " + $Result.Body)
        return
    }

    Add-Result $Name "WARN" ("Unexpected HTTP status: " + $Result.Code + " Error: " + $Result.Error)
}

$BackendUrl = Normalize-Url $BackendUrl
$AdminPassword = $env:RAFTOP_BOOTSTRAP_ADMIN_PASSWORD

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 42.5B Pilot Demo API Route Verification" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report verifies protected pilot demo API routes after backend deployment."
Write-ReportLine "It uses admin login token but does not print token or password."
Write-ReportLine ""
Write-ReportLine "Backend:"
Write-ReportLine $BackendUrl
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
Write-Host "Running RAFTOP Phase 42.5B pilot demo API route verification..."
Write-Host ""

if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    Add-Result "Admin password environment variable" "FAIL" "RAFTOP_BOOTSTRAP_ADMIN_PASSWORD is missing."
} else {
    Add-Result "Admin password environment variable" "PASS" "Admin password present. Value not printed."
}

$Health = Invoke-Get ($BackendUrl + "/api/health") $null

if ($Health.Code -eq 200) {
    Add-Result "Backend health" "PASS" "Backend /api/health returned HTTP 200."
} else {
    Add-Result "Backend health" "FAIL" ("Backend /api/health failed. HTTP " + $Health.Code)
}

$LoginUrl = $BackendUrl + "/api/auth/login"
$LoginHeaders = @{
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
$LoginMode = ""
$LastLoginStatus = $null

foreach ($Attempt in $LoginAttempts) {
    if (![string]::IsNullOrWhiteSpace($Token)) {
        break
    }

    $Result = Invoke-PostJson $LoginUrl $LoginHeaders $Attempt.Body
    $LastLoginStatus = $Result.Code
    $CandidateToken = Extract-Token $Result.Body

    if ($Result.Code -eq 200 -and ![string]::IsNullOrWhiteSpace($CandidateToken)) {
        $Token = $CandidateToken
        $LoginMode = $Attempt.Name
    }
}

if (![string]::IsNullOrWhiteSpace($Token)) {
    Add-Result "Backend admin login" "PASS" ("Login returned usable token using mode: " + $LoginMode)
    Write-ReportLine "LOGIN_TOKEN_PRESENT: true"
    Write-ReportLine "LOGIN_TOKEN_VALUE: hidden"
} else {
    Add-Result "Backend admin login" "FAIL" ("Login did not return usable token. Last status: " + $LastLoginStatus)
    Write-ReportLine "LOGIN_TOKEN_PRESENT: false"
}

$UnauthSummary = Invoke-Get ($BackendUrl + "/api/tenant/pilot-demo/summary") $null

if ($UnauthSummary.Code -eq 401 -or $UnauthSummary.Code -eq 403) {
    Add-Result "Unauthenticated pilot demo summary blocked" "PASS" ("Unauthenticated route blocked with HTTP " + $UnauthSummary.Code)
} elseif ($UnauthSummary.Code -eq 200) {
    Add-Result "Unauthenticated pilot demo summary blocked" "FAIL" "Pilot demo summary returned HTTP 200 without token."
} else {
    Add-Result "Unauthenticated pilot demo summary blocked" "WARN" ("Unexpected unauthenticated status: " + $UnauthSummary.Code)
}

if (![string]::IsNullOrWhiteSpace($Token)) {
    $AuthHeaders = @{
        "Authorization" = "Bearer " + $Token
        "x-tenant-id" = $TenantId
    }

    Check-AuthenticatedRoute "Pilot demo root" "/api/tenant/pilot-demo" $AuthHeaders
    Check-AuthenticatedRoute "Pilot demo summary" "/api/tenant/pilot-demo/summary" $AuthHeaders
    Check-AuthenticatedRoute "Pilot demo dashboard" "/api/tenant/pilot-demo/dashboard" $AuthHeaders
    Check-AuthenticatedRoute "Pilot demo patients" "/api/tenant/pilot-demo/patients" $AuthHeaders
    Check-AuthenticatedRoute "Pilot demo devices" "/api/tenant/pilot-demo/devices" $AuthHeaders
    Check-AuthenticatedRoute "Pilot demo compliance" "/api/tenant/pilot-demo/compliance" $AuthHeaders
    Check-AuthenticatedRoute "Pilot demo ATLAS tasks" "/api/tenant/pilot-demo/atlas/tasks" $AuthHeaders
    Check-AuthenticatedRoute "Pilot demo notes" "/api/tenant/pilot-demo/notes" $AuthHeaders
    Check-AuthenticatedRoute "Pilot demo patient overview" "/api/tenant/pilot-demo/patient/PILOT-003/overview" $AuthHeaders

    $SummaryResult = Invoke-Get ($BackendUrl + "/api/tenant/pilot-demo/summary") $AuthHeaders
    $SummaryJson = Parse-Json $SummaryResult.Body

    if ($SummaryResult.Code -eq 200 -and $SummaryJson -ne $null) {
        $Data = $SummaryJson.data

        if ($Data.patients_count -eq 8) {
            Add-Result "Pilot demo summary patients count" "PASS" "Summary shows 8 patients."
        } else {
            Add-Result "Pilot demo summary patients count" "FAIL" ("Expected 8 patients. Actual: " + $Data.patients_count)
        }

        if ($Data.devices_count -eq 8) {
            Add-Result "Pilot demo summary devices count" "PASS" "Summary shows 8 devices."
        } else {
            Add-Result "Pilot demo summary devices count" "FAIL" ("Expected 8 devices. Actual: " + $Data.devices_count)
        }

        if ($Data.compliance_nights_count -eq 56) {
            Add-Result "Pilot demo summary compliance count" "PASS" "Summary shows 56 compliance nights."
        } else {
            Add-Result "Pilot demo summary compliance count" "FAIL" ("Expected 56 compliance nights. Actual: " + $Data.compliance_nights_count)
        }

        if ($Data.atlas_tasks_count -eq 7) {
            Add-Result "Pilot demo summary ATLAS count" "PASS" "Summary shows 7 ATLAS tasks."
        } else {
            Add-Result "Pilot demo summary ATLAS count" "FAIL" ("Expected 7 ATLAS tasks. Actual: " + $Data.atlas_tasks_count)
        }
    } else {
        Add-Result "Pilot demo summary payload counts" "FAIL" "Could not parse summary payload for counts."
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "PILOT DEMO API INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "PASS means protected pilot demo routes are mounted, authenticated and returning isolated demo data."
Write-ReportLine "FAIL means frontend should not yet be connected to these routes."
Write-ReportLine ""
Write-ReportLine "Next phase if no FAIL:"
Write-ReportLine "Phase 42.6 - Frontend Pilot Demo Dashboard Page"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE42_PILOT_DEMO_API_ROUTES_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE42_PILOT_DEMO_API_ROUTES_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE42_PILOT_DEMO_API_ROUTES_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 42.5B Pilot Demo API Route Verification"
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