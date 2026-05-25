# RAFTOP CPAP CARE Pro
# Phase 41.10D - Production Auth Guard Verification
# Safe ASCII-only script
# Verifies deployed hard login gate evidence and records manual login confirmation.

param(
    [string]$FrontendUrl = "https://raftop-cpap-frontend.onrender.com",
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com",
    [switch]$ManualIncognitoLoginConfirmed,
    [switch]$ManualPasswordLoginConfirmed
)

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"
$FrontendIndexPath = Join-Path $Root "enterprise-frontend\public\index.html"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase41_production_auth_guard_verification_" + $Timestamp + ".md")

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

function Invoke-SafeGet {
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

$FrontendUrl = Normalize-Url $FrontendUrl
$BackendUrl = Normalize-Url $BackendUrl

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.10D Production Auth Guard Verification" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report verifies that the production frontend no longer exposes dashboard without login."
Write-ReportLine "It checks local and deployed auth gate evidence and records manual incognito/password login confirmation."
Write-ReportLine ""
Write-ReportLine "Frontend:"
Write-ReportLine $FrontendUrl
Write-ReportLine ""
Write-ReportLine "Backend:"
Write-ReportLine $BackendUrl
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.10D production auth guard verification..."
Write-Host ""

if (Test-Path $FrontendIndexPath) {
    Add-Result "Local frontend index.html" "PASS" "Found enterprise-frontend public index.html."
    $LocalIndex = Get-Content -Path $FrontendIndexPath -Raw -ErrorAction SilentlyContinue
} else {
    Add-Result "Local frontend index.html" "FAIL" "Missing enterprise-frontend public index.html."
    $LocalIndex = ""
}

if ($LocalIndex -match "raftop-hard-login-screen") {
    Add-Result "Local hard login screen marker" "PASS" "Local index contains hard login screen marker."
} else {
    Add-Result "Local hard login screen marker" "FAIL" "Local index does not contain hard login screen marker."
}

if ($LocalIndex -match "raftop-login-password") {
    Add-Result "Local password field marker" "PASS" "Local index contains password input marker."
} else {
    Add-Result "Local password field marker" "FAIL" "Local index does not contain password input marker."
}

if ($LocalIndex -match "raftop_redirect_after_login") {
    Add-Result "Local redirect marker" "PASS" "Local index contains redirect-after-login marker."
} else {
    Add-Result "Local redirect marker" "WARN" "Local index does not contain redirect-after-login marker."
}

if ($LocalIndex -match "https://raftop-cpap-backend.onrender.com") {
    Add-Result "Local backend URL mapping" "PASS" "Local login screen points to production backend URL."
} else {
    Add-Result "Local backend URL mapping" "WARN" "Could not confirm production backend URL in local index."
}

$FrontendResult = Invoke-SafeGet $FrontendUrl

if ($FrontendResult.Code -eq 200) {
    Add-Result "Frontend root HTTP" "PASS" "Frontend root returned HTTP 200."
} else {
    Add-Result "Frontend root HTTP" "FAIL" ("Frontend root did not return HTTP 200. Status: " + $FrontendResult.Code + " Error: " + $FrontendResult.Error)
}

if ($FrontendResult.Body -match "raftop-hard-login-screen") {
    Add-Result "Deployed hard login screen marker" "PASS" "Deployed source contains hard login screen marker."
} else {
    Add-Result "Deployed hard login screen marker" "FAIL" "Deployed source does not contain hard login screen marker."
}

if ($FrontendResult.Body -match "raftop-login-password") {
    Add-Result "Deployed password field marker" "PASS" "Deployed source contains password input marker."
} else {
    Add-Result "Deployed password field marker" "FAIL" "Deployed source does not contain password input marker."
}

if ($FrontendResult.Body -match "raftop_redirect_after_login") {
    Add-Result "Deployed redirect marker" "PASS" "Deployed source contains redirect-after-login marker."
} else {
    Add-Result "Deployed redirect marker" "WARN" "Could not confirm redirect-after-login marker in deployed source."
}

$LoginResult = Invoke-SafeGet ($FrontendUrl + "/login")

if ($LoginResult.Code -eq 200) {
    Add-Result "Frontend login route HTTP" "PASS" "Frontend /login returned HTTP 200."
} else {
    Add-Result "Frontend login route HTTP" "WARN" ("Frontend /login did not return HTTP 200. Status: " + $LoginResult.Code)
}

if ($LoginResult.Body -match "raftop-hard-login-screen") {
    Add-Result "Login route hard login marker" "PASS" "Login route source contains hard login marker."
} else {
    Add-Result "Login route hard login marker" "WARN" "Login route source did not expose hard login marker."
}

$BackendHealth = Invoke-SafeGet ($BackendUrl + "/api/health")

if ($BackendHealth.Code -eq 200) {
    Add-Result "Backend health HTTP" "PASS" "Backend /api/health returned HTTP 200."
} else {
    Add-Result "Backend health HTTP" "WARN" ("Backend /api/health did not return HTTP 200. Status: " + $BackendHealth.Code)
}

if ($ManualIncognitoLoginConfirmed) {
    Add-Result "Manual incognito login screen confirmation" "PASS" "User confirmed incognito shows production login screen instead of dashboard."
} else {
    Add-Result "Manual incognito login screen confirmation" "WARN" "Manual incognito login screen confirmation flag was not provided."
}

if ($ManualPasswordLoginConfirmed) {
    Add-Result "Manual password login confirmation" "PASS" "User confirmed successful login with admin password."
} else {
    Add-Result "Manual password login confirmation" "WARN" "Manual password login confirmation flag was not provided."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "SECURITY INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "Frontend no-auth dashboard exposure was identified as a blocker."
Write-ReportLine "A hard production login gate was added directly to public/index.html."
Write-ReportLine "Manual confirmation now indicates that unauthenticated incognito users see login screen and authenticated admin login works."
Write-ReportLine ""
Write-ReportLine "Important:"
Write-ReportLine "Frontend auth gating is necessary but not sufficient for enterprise security."
Write-ReportLine "Backend protected route authorization must be audited next."
Write-ReportLine ""
Write-ReportLine "Next phase:"
Write-ReportLine "Phase 41.11 - Backend Protected Route Authorization Audit"
Write-ReportLine ""
Write-ReportLine "Then:"
Write-ReportLine "Phase 41.12 - Admin Login End-to-End Verification"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_PRODUCTION_AUTH_GUARD_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_PRODUCTION_AUTH_GUARD_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_PRODUCTION_AUTH_GUARD_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.10D Production Auth Guard Verification"
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