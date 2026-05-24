# RAFTOP CPAP CARE Pro - Production Smoke Test
param(
    [string]$BackendUrl = $env:RAFTOP_PRODUCTION_BACKEND_URL,
    [string]$TenantId = "raftopoulos-live",
    [switch]$AllowLocalhost
)

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"
if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase37_production_smoke_test_result_" + $Timestamp + ".md")
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function R {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Normalize-Url {
    param([string]$Url)
    if ([string]::IsNullOrWhiteSpace($Url)) { return "" }
    return $Url.Trim().TrimEnd("/")
}

function Finish-SmokeTest {
    param(
        [string]$Status,
        [int]$ExitCode
    )
    R ""
    R ("FINAL STATUS: " + $Status)
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "RAFTOP CPAP CARE Pro - Production Smoke Test"
    Write-Host "============================================================"
    Write-Host ""
    Write-Host "Report created:"
    Write-Host $ReportPath
    Write-Host ""
    Write-Host ("FINAL STATUS: " + $Status)
    Write-Host ""
    exit $ExitCode
}

$BackendUrl = Normalize-Url $BackendUrl

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 37.6 Production Smoke Test Result" -Encoding UTF8
R ""
R ("Generated: " + $Now)
R ""
R ("BackendUrl: " + $BackendUrl)
R ("TenantId: " + $TenantId)
R ""
R "------------------------------------------------------------"
R ""

if ([string]::IsNullOrWhiteSpace($BackendUrl)) {
    R "Backend URL was not provided."
    R ""
    R "Run example:"
    R ".\tools\run_phase37_production_smoke_test.ps1 -BackendUrl https://your-backend.onrender.com -TenantId raftopoulos-live"
    Finish-SmokeTest "PHASE37_PRODUCTION_SMOKE_TEST_NEEDS_BACKEND_URL" 2
}

$IsLocalhost = (($BackendUrl -match "localhost") -or ($BackendUrl -match "127.0.0.1"))
if ($IsLocalhost -and -not $AllowLocalhost) {
    R "Localhost backend URL blocked for production smoke test."
    R "Use -AllowLocalhost only for local preflight testing."
    Finish-SmokeTest "PHASE37_PRODUCTION_SMOKE_TEST_BLOCKED_LOCALHOST_URL" 2
}

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Test-SmokeEndpoint {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Method,
        [string]$Mode
    )

    $Url = $BackendUrl + $Path
    $Code = $null
    $ErrorText = ""

    $Headers = @{ "x-tenant-id" = $TenantId }

    try {
        if ($Method -eq "POST") {
            $Response = Invoke-WebRequest -Uri $Url -Method POST -Headers $Headers -ContentType "application/json" -Body "{}" -TimeoutSec 20 -UseBasicParsing -ErrorAction Stop
        } else {
            $Response = Invoke-WebRequest -Uri $Url -Method GET -Headers $Headers -TimeoutSec 20 -UseBasicParsing -ErrorAction Stop
        }
        $Code = [int]$Response.StatusCode
    } catch {
        if ($_.Exception.Response -ne $null) {
            try {
                $Code = [int]$_.Exception.Response.StatusCode.value__
            } catch {
                $ErrorText = $_.Exception.Message
            }
        } else {
            $ErrorText = $_.Exception.Message
        }
    }

    $Result = "FAIL"
    $Reason = ""

    if ($Mode -eq "Health") {
        if ($Code -eq 200) {
            $Result = "PASS"
            $Reason = "Health endpoint returned 200."
        } else {
            $Reason = "Health endpoint did not return 200."
        }
    } elseif ($Mode -eq "RouteExists") {
        if ($Code -in @(200, 400, 401, 403, 405)) {
            $Result = "PASS"
            $Reason = "Route exists and returned an acceptable status."
        } else {
            $Reason = "Route may be missing or broken."
        }
    } elseif ($Mode -eq "Protected") {
        if ($Code -in @(200, 401, 403)) {
            $Result = "PASS"
            $Reason = "Protected route exists and returned acceptable protected response."
        } else {
            $Reason = "Protected route returned unacceptable status."
        }
    } elseif ($Mode -eq "Optional") {
        if ($Code -in @(200, 401, 403)) {
            $Result = "PASS"
            $Reason = "Optional route exists."
        } elseif ($Code -eq 404) {
            $Result = "WARN"
            $Reason = "Optional route not found."
        } else {
            $Result = "WARN"
            $Reason = "Optional route returned warning status."
        }
    }

    if ($Code -eq $null) {
        $Reason = "No HTTP status. " + $ErrorText
    }

    if ($Result -eq "PASS") { $script:PassCount++ }
    elseif ($Result -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    R ("CHECK: " + $Name)
    R ("URL: " + $Url)
    R ("STATUS_CODE: " + $Code)
    R ("RESULT: " + $Result)
    R ("REASON: " + $Reason)
    R ""

    Write-Host ($Result + " - " + $Name + " - " + $Code)
}

Write-Host ""
Write-Host "Running RAFTOP production smoke test..."
Write-Host ("BackendUrl: " + $BackendUrl)
Write-Host ("TenantId: " + $TenantId)
Write-Host ""

Test-SmokeEndpoint "Backend health" "/api/health" "GET" "Health"
Test-SmokeEndpoint "Auth login route" "/api/auth/login" "POST" "RouteExists"
Test-SmokeEndpoint "Tenant subscription route" "/api/tenant/subscription/status" "GET" "Protected"
Test-SmokeEndpoint "Tenant patients route" "/api/tenant/patients" "GET" "Protected"
Test-SmokeEndpoint "Tenant devices route" "/api/tenant/devices" "GET" "Protected"
Test-SmokeEndpoint "ATLAS summary route" "/api/tenant/atlas/summary" "GET" "Protected"
Test-SmokeEndpoint "Optional security command center route" "/api/tenant/security/command-center" "GET" "Optional"

R "------------------------------------------------------------"
R ""
R ("PASS_COUNT: " + $script:PassCount)
R ("WARN_COUNT: " + $script:WarnCount)
R ("FAIL_COUNT: " + $script:FailCount)
R ""

if ($script:FailCount -gt 0) {
    Finish-SmokeTest "PHASE37_PRODUCTION_SMOKE_TEST_FAILED" 1
} elseif ($script:WarnCount -gt 0) {
    Finish-SmokeTest "PHASE37_PRODUCTION_SMOKE_TEST_READY_WITH_WARNINGS" 0
} else {
    Finish-SmokeTest "PHASE37_PRODUCTION_SMOKE_TEST_PASSED" 0
}
