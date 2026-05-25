# RAFTOP CPAP CARE Pro
# Phase 40.3 - Frontend Production Deployment Verification
# Safe ASCII-only script
# Does not print or store secrets.

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
$ReportPath = Join-Path $ReportsDir ("phase40_frontend_production_verification_" + $Timestamp + ".md")

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
        Headers = $null
    }

    try {
        $Response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        $Result.Code = [int]$Response.StatusCode
        $Result.Body = $Response.Content
        $Result.Headers = $Response.Headers
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

function Invoke-OriginGet {
    param(
        [string]$Url,
        [string]$Origin
    )

    $Result = @{
        Code = $null
        Body = ""
        Error = ""
        Headers = $null
    }

    try {
        $Headers = @{ "Origin" = $Origin }
        $Response = Invoke-WebRequest -Uri $Url -Method GET -Headers $Headers -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        $Result.Code = [int]$Response.StatusCode
        $Result.Body = $Response.Content
        $Result.Headers = $Response.Headers
    } catch {
        if ($_.Exception.Response -ne $null) {
            try {
                $Result.Code = [int]$_.Exception.Response.StatusCode.value__
                $Result.Headers = $_.Exception.Response.Headers
            } catch {
                $Result.Error = $_.Exception.Message
            }
        } else {
            $Result.Error = $_.Exception.Message
        }
    }

    return $Result
}

function Get-HeaderValue {
    param(
        $Headers,
        [string]$Key
    )

    if ($Headers -eq $null) {
        return ""
    }

    try {
        $Value = $Headers[$Key]
        if ($Value -eq $null) {
            return ""
        }
        return ($Value | Out-String).Trim()
    } catch {
        return ""
    }
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 40.3 Frontend Production Deployment Verification" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This verification checks the live frontend deployment, backend health, SPA routing behavior, and backend CORS response."
Write-ReportLine "It does not print or store secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 40.3 frontend production verification..."
Write-Host ""

$FrontendUrl = Normalize-Url $FrontendUrl
$BackendUrl = Normalize-Url $BackendUrl

Test-UrlShape $FrontendUrl "Frontend URL production check"
Test-UrlShape $BackendUrl "Backend URL production check"

Test-FileExists "tools\run_phase40_frontend_production_preparation.ps1" "Phase 40.1 frontend preparation script" "YES"
Test-FileExists "tools\run_phase39_backend_first_deploy_verification.ps1" "Phase 39.6 backend verification script" "YES"
Test-FileExists "tools\run_phase37_production_smoke_test.ps1" "Production smoke test runner" "YES"

$FrontendRootResult = Invoke-Get $FrontendUrl

if ($FrontendRootResult.Code -eq 200) {
    Add-Result "Frontend root HTTP status" "PASS" "Frontend root returned HTTP 200."
} else {
    Add-Result "Frontend root HTTP status" "FAIL" ("Frontend root did not return HTTP 200. Status: " + $FrontendRootResult.Code + " Error: " + $FrontendRootResult.Error)
}

if ($FrontendRootResult.Body -match "Not Found") {
    Add-Result "Frontend root content" "FAIL" "Frontend root contains Not Found."
} elseif ($FrontendRootResult.Body -match "<html" -or $FrontendRootResult.Body -match "<!doctype html") {
    Add-Result "Frontend root content" "PASS" "Frontend root returned HTML."
} else {
    Add-Result "Frontend root content" "WARN" "Frontend root response did not clearly look like HTML. Review manually."
}

$SpaRoutes = @(
    "/login",
    "/dashboard",
    "/patients",
    "/devices",
    "/tenant/atlas/action-center"
)

foreach ($Route in $SpaRoutes) {
    $RouteUrl = $FrontendUrl + $Route
    $RouteResult = Invoke-Get $RouteUrl

    if ($RouteResult.Code -eq 200) {
        if ($RouteResult.Body -match "Not Found") {
            Add-Result ("SPA route " + $Route) "WARN" "Route returned HTTP 200 but body contains Not Found."
        } else {
            Add-Result ("SPA route " + $Route) "PASS" "Route returned HTTP 200. Rewrite appears active."
        }
    } elseif ($RouteResult.Code -eq 404) {
        Add-Result ("SPA route " + $Route) "FAIL" "Route returned 404. Rewrite rule may be missing."
    } else {
        Add-Result ("SPA route " + $Route) "WARN" ("Route returned status: " + $RouteResult.Code)
    }
}

$HealthUrl = $BackendUrl + "/api/health"
$HealthResult = Invoke-Get $HealthUrl

if ($HealthResult.Code -eq 200) {
    Add-Result "Backend health HTTP status" "PASS" "Backend /api/health returned HTTP 200."
} else {
    Add-Result "Backend health HTTP status" "FAIL" ("Backend /api/health did not return HTTP 200. Status: " + $HealthResult.Code + " Error: " + $HealthResult.Error)
}

if ($HealthResult.Body -match '"ok"\s*:\s*true' -or $HealthResult.Body -match '"status"\s*:\s*"OK"') {
    Add-Result "Backend health payload" "PASS" "Backend health payload indicates OK."
} else {
    Add-Result "Backend health payload" "WARN" "Backend health payload did not match expected OK pattern."
}

if ($HealthResult.Body -match '"fallback"\s*:\s*false') {
    Add-Result "Backend fallback state" "PASS" "Backend reports fallback=false."
} elseif ($HealthResult.Body -match '"fallback"\s*:\s*true') {
    Add-Result "Backend fallback state" "WARN" "Backend reports fallback=true."
} else {
    Add-Result "Backend fallback state" "WARN" "Backend health payload does not expose fallback state."
}

$CorsResult = Invoke-OriginGet $HealthUrl $FrontendUrl
$AllowOrigin = Get-HeaderValue $CorsResult.Headers "Access-Control-Allow-Origin"

if ($CorsResult.Code -eq 200) {
    Add-Result "CORS origin request HTTP status" "PASS" "Backend health request with frontend Origin returned HTTP 200."
} else {
    Add-Result "CORS origin request HTTP status" "WARN" ("Origin request returned status: " + $CorsResult.Code + " Error: " + $CorsResult.Error)
}

if ($AllowOrigin -eq $FrontendUrl) {
    Add-Result "CORS allow-origin header" "PASS" ("Access-Control-Allow-Origin matches frontend URL: " + $AllowOrigin)
} elseif ($AllowOrigin -eq "*") {
    Add-Result "CORS allow-origin header" "WARN" "Access-Control-Allow-Origin is wildcard. This is not ideal for production."
} elseif ([string]::IsNullOrWhiteSpace($AllowOrigin)) {
    Add-Result "CORS allow-origin header" "WARN" "Access-Control-Allow-Origin header was not detected on health response. Browser verification may still be needed."
} else {
    Add-Result "CORS allow-origin header" "FAIL" ("Access-Control-Allow-Origin mismatch. Header: " + $AllowOrigin + " Expected: " + $FrontendUrl)
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "FRONTEND PRODUCTION VERIFICATION SUMMARY"
Write-ReportLine ""
Write-ReportLine "Frontend URL:"
Write-ReportLine $FrontendUrl
Write-ReportLine ""
Write-ReportLine "Backend URL:"
Write-ReportLine $BackendUrl
Write-ReportLine ""
Write-ReportLine "Backend health URL:"
Write-ReportLine $HealthUrl
Write-ReportLine ""
Write-ReportLine "Interpretation:"
Write-ReportLine "- Frontend root must return HTTP 200."
Write-ReportLine "- SPA routes should return HTTP 200 because of rewrite rule."
Write-ReportLine "- Backend health must return HTTP 200."
Write-ReportLine "- CORS should allow the final frontend origin."
Write-ReportLine ""
Write-ReportLine "Next phase:"
Write-ReportLine "Phase 41 - Production Tenant Bootstrap and Admin Setup"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE40_FRONTEND_PRODUCTION_DEPLOYMENT_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE40_FRONTEND_PRODUCTION_DEPLOYMENT_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE40_FRONTEND_PRODUCTION_DEPLOYMENT_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 40.3 Frontend Production Verification"
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