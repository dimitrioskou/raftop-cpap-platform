# RAFTOP CPAP CARE Pro
# Phase 44.1E - Robust Login Flow Verification
# Verifies frontend robust login integration and backend token login.
# Safe: does not modify DB/backend. It reads files, runs optional build, and tests login if admin password is present.

param(
    [switch]$RunBuild,
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com",
    [string]$FrontendUrl = "https://raftop-cpap-frontend.onrender.com",
    [string]$TenantId = "raftopoulos-live",
    [string]$AdminEmail = "dimitrisgelly@gmail.com"
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendDir = Join-Path $Root "enterprise-frontend"
$FrontendSrc = Join-Path $FrontendDir "src"
$PagesDir = Join-Path $FrontendSrc "pages"
$AppPath = Join-Path $FrontendSrc "App.js"
$LoginPagePath = Join-Path $PagesDir "LoginPage.js"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase44_robust_login_flow_verification_" + $Timestamp + ".md")

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

function ContainsText {
    param(
        [string]$Content,
        [string]$Needle
    )

    return $Content -match [regex]::Escape($Needle)
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

function Test-Url {
    param(
        [string]$Name,
        [string]$Url
    )

    $Result = Invoke-Get $Url $null

    if ($Result.Code -eq 200) {
        Add-Result $Name "PASS" ("HTTP 200: " + $Url)
    } else {
        Add-Result $Name "WARN" ("Unexpected status: " + $Result.Code + " / " + $Result.Error)
    }
}

function Try-BackendLogin {
    param(
        [string]$Password
    )

    $LoginUrl = $BackendUrl.TrimEnd("/") + "/api/auth/login"

    $Attempts = @(
        @{
            Name = "tenantId payload plus x-tenant-id"
            Headers = @{
                "x-tenant-id" = $TenantId
            }
            Body = @{
                email = $AdminEmail
                password = $Password
                tenantId = $TenantId
            }
        },
        @{
            Name = "tenant_id payload plus x-tenant-id"
            Headers = @{
                "x-tenant-id" = $TenantId
            }
            Body = @{
                email = $AdminEmail
                password = $Password
                tenant_id = $TenantId
            }
        },
        @{
            Name = "x-tenant-id only"
            Headers = @{
                "x-tenant-id" = $TenantId
            }
            Body = @{
                email = $AdminEmail
                password = $Password
            }
        },
        @{
            Name = "no tenant header tenantId payload"
            Headers = @{}
            Body = @{
                email = $AdminEmail
                password = $Password
                tenantId = $TenantId
            }
        },
        @{
            Name = "no tenant header tenant_id payload"
            Headers = @{}
            Body = @{
                email = $AdminEmail
                password = $Password
                tenant_id = $TenantId
            }
        }
    )

    foreach ($Attempt in $Attempts) {
        $Result = Invoke-PostJson $LoginUrl $Attempt.Headers $Attempt.Body
        $Token = Extract-Token $Result.Body

        Write-ReportLine ("LOGIN_ATTEMPT: " + $Attempt.Name + " | HTTP " + $Result.Code + " | TOKEN " + (![string]::IsNullOrWhiteSpace($Token)))

        if ($Result.Code -eq 200 -and ![string]::IsNullOrWhiteSpace($Token)) {
            return @{
                Ok = $true
                Token = $Token
                Mode = $Attempt.Name
            }
        }
    }

    return @{
        Ok = $false
        Token = ""
        Mode = ""
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 44.1E Robust Login Flow Verification" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report verifies the robust frontend login flow and backend token compatibility."
Write-ReportLine "It does not print password or token values."
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 44.1E Robust Login Flow Verification..."
Write-Host ""

if (Test-Path $LoginPagePath) {
    Add-Result "LoginPage file" "PASS" "Found enterprise-frontend/src/pages/LoginPage.js."
    $LoginContent = Get-Content -Path $LoginPagePath -Raw -ErrorAction SilentlyContinue
} else {
    Add-Result "LoginPage file" "FAIL" "Missing enterprise-frontend/src/pages/LoginPage.js."
    $LoginContent = ""
}

if (Test-Path $AppPath) {
    Add-Result "Frontend App.js" "PASS" "Found App.js."
    $AppContent = Get-Content -Path $AppPath -Raw -ErrorAction SilentlyContinue
} else {
    Add-Result "Frontend App.js" "FAIL" "Missing App.js."
    $AppContent = ""
}

if (ContainsText $AppContent "import LoginPage from './pages/LoginPage';") {
    Add-Result "LoginPage App.js import" "PASS" "App.js imports LoginPage."
} else {
    Add-Result "LoginPage App.js import" "FAIL" "App.js does not import LoginPage."
}

if (ContainsText $AppContent 'path="/login"') {
    Add-Result "Login route" "PASS" "App.js contains /login route."
} else {
    Add-Result "Login route" "FAIL" "App.js does not contain /login route."
}

if (ContainsText $AppContent "getFrontendAuthToken" -and ContainsText $AppContent "raftop_redirect_after_login" -and ContainsText $AppContent "Navigate to=") {
    Add-Result "Global auth guard" "PASS" "App.js contains global auth guard signals."
} else {
    Add-Result "Global auth guard" "FAIL" "App.js global auth guard signals missing."
}

$LoginMarkers = @(
    "Robust production login page",
    "tenantId payload plus x-tenant-id",
    "tenant_id payload plus x-tenant-id",
    "x-tenant-id only",
    "raftop_auth_token",
    "raftop_redirect_after_login",
    "commercial_demo_mode"
)

foreach ($Marker in $LoginMarkers) {
    if (ContainsText $LoginContent $Marker) {
        Add-Result ("Login marker: " + $Marker) "PASS" ("Found marker: " + $Marker)
    } else {
        Add-Result ("Login marker: " + $Marker) "FAIL" ("Missing marker: " + $Marker)
    }
}

if ($RunBuild) {
    if (Test-Path $FrontendDir) {
        Push-Location $FrontendDir
        $BuildOutput = npm run build 2>&1
        $BuildExitCode = $LASTEXITCODE
        Pop-Location

        Write-ReportLine "BUILD_OUTPUT:"
        Write-ReportLine ($BuildOutput | Out-String)
        Write-ReportLine ""

        if ($BuildExitCode -eq 0) {
            Add-Result "Frontend production build" "PASS" "npm run build completed successfully."
        } else {
            Add-Result "Frontend production build" "FAIL" ("npm run build failed. Exit code: " + $BuildExitCode)
        }
    } else {
        Add-Result "Frontend production build" "FAIL" "enterprise-frontend directory missing."
    }
} else {
    Add-Result "Frontend production build" "WARN" "Build was not run. Use -RunBuild for build verification."
}

Test-Url "Production login URL" ($FrontendUrl.TrimEnd("/") + "/login")
Test-Url "Production Quality Profit URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/quality-profit")
Test-Url "Production backend health" ($BackendUrl.TrimEnd("/") + "/api/health")

$AdminPassword = $env:RAFTOP_BOOTSTRAP_ADMIN_PASSWORD

if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    Add-Result "Backend login token test" "WARN" "RAFTOP_BOOTSTRAP_ADMIN_PASSWORD not set. Skipping backend login token test."
} else {
    $LoginResult = Try-BackendLogin -Password $AdminPassword

    if ($LoginResult.Ok -eq $true) {
        Add-Result "Backend login token test" "PASS" ("Backend returned token. Mode: " + $LoginResult.Mode)

        $Headers = @{
            "Authorization" = "Bearer " + $LoginResult.Token
            "x-tenant-id" = $TenantId
        }

        $ProtectedResult = Invoke-Get ($BackendUrl.TrimEnd("/") + "/api/tenant/pilot-demo/dashboard") $Headers

        if ($ProtectedResult.Code -eq 200) {
            Add-Result "Protected pilot demo API with login token" "PASS" "Protected API returned HTTP 200 with token."
        } else {
            Add-Result "Protected pilot demo API with login token" "FAIL" ("Protected API failed. HTTP " + $ProtectedResult.Code)
        }
    } else {
        Add-Result "Backend login token test" "FAIL" "Backend did not return token with provided admin password."
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "ROBUST LOGIN INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "PASS means the frontend login page is wired, the build passes, production URLs are reachable, and backend token login works when password env is provided."
Write-ReportLine "Manual incognito test is still required because HTTP 200 for SPA URLs does not prove browser redirect behavior."
Write-ReportLine ""
Write-ReportLine "Manual test:"
Write-ReportLine "1. Open a new incognito window."
Write-ReportLine "2. Visit /sales/raftopoulos/quality-profit."
Write-ReportLine "3. Confirm redirect to /login."
Write-ReportLine "4. Login manually."
Write-ReportLine "5. Confirm Quality & Profit Excellence Center loads."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE44_ROBUST_LOGIN_FLOW_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE44_ROBUST_LOGIN_FLOW_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE44_ROBUST_LOGIN_FLOW_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 44.1E Robust Login Flow Verification"
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