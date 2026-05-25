# RAFTOP CPAP CARE Pro
# Phase 39.6 - Backend First Deploy Verification
# Safe ASCII-only script
# Does not print secrets and does not store secrets.

param(
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
$ReportPath = Join-Path $ReportsDir ("phase39_backend_first_deploy_verification_" + $Timestamp + ".md")

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

function Get-LatestSmokeReport {
    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like "phase37_production_smoke_test_result_*.md"
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) {
        return $Files[0]
    }

    return $null
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 39.6 Backend First Deploy Verification" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This verification confirms the first Render backend deployment status."
Write-ReportLine "It checks the live health endpoint and the latest production smoke test result."
Write-ReportLine "It does not print or store secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 39.6 backend first deploy verification..."
Write-Host ""

$BackendUrl = Normalize-Url $BackendUrl

if ([string]::IsNullOrWhiteSpace($BackendUrl)) {
    Add-Result "Backend URL provided" "FAIL" "BackendUrl is empty."
} elseif ($BackendUrl -match "localhost" -or $BackendUrl -match "127.0.0.1") {
    Add-Result "Backend URL production check" "FAIL" "BackendUrl points to localhost, not production Render."
} elseif ($BackendUrl -notmatch "^https://") {
    Add-Result "Backend URL HTTPS check" "FAIL" "BackendUrl must use https."
} else {
    Add-Result "Backend URL provided" "PASS" ("BackendUrl: " + $BackendUrl)
}

Test-FileExists "tools\run_phase37_production_smoke_test.ps1" "Production smoke test runner" "YES"
Test-FileExists "tools\run_phase39_render_backend_web_service_checklist.ps1" "Phase 39.5 backend web service checklist" "YES"

$HealthUrl = $BackendUrl + "/api/health"
$HealthCode = $null
$HealthBody = ""
$HealthError = ""

try {
    $HealthResponse = Invoke-WebRequest -Uri $HealthUrl -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
    $HealthCode = [int]$HealthResponse.StatusCode
    $HealthBody = $HealthResponse.Content
} catch {
    if ($_.Exception.Response -ne $null) {
        try {
            $HealthCode = [int]$_.Exception.Response.StatusCode.value__
        } catch {
            $HealthError = $_.Exception.Message
        }
    } else {
        $HealthError = $_.Exception.Message
    }
}

if ($HealthCode -eq 200) {
    Add-Result "Health endpoint HTTP status" "PASS" "GET /api/health returned HTTP 200."
} else {
    Add-Result "Health endpoint HTTP status" "FAIL" ("GET /api/health did not return HTTP 200. Status: " + $HealthCode + " Error: " + $HealthError)
}

if ($HealthBody -match '"ok"\s*:\s*true' -or $HealthBody -match '"status"\s*:\s*"OK"') {
    Add-Result "Health endpoint payload" "PASS" "Health payload indicates OK."
} else {
    Add-Result "Health endpoint payload" "WARN" "Health payload did not match expected ok/status pattern. Review response manually."
}

if ($HealthBody -match '"fallback"\s*:\s*false') {
    Add-Result "Health fallback state" "PASS" "Health payload reports fallback=false."
} elseif ($HealthBody -match '"fallback"\s*:\s*true') {
    Add-Result "Health fallback state" "WARN" "Health payload reports fallback=true."
} else {
    Add-Result "Health fallback state" "WARN" "Health payload does not expose fallback state."
}

$LatestSmokeReport = Get-LatestSmokeReport

if ($LatestSmokeReport -eq $null) {
    Add-Result "Latest production smoke test report" "FAIL" "No phase37 production smoke test result report found."
} else {
    Add-Result "Latest production smoke test report" "PASS" ("Found: " + $LatestSmokeReport.FullName)

    $SmokeContent = Get-Content -Path $LatestSmokeReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($SmokeContent -match "FINAL STATUS: PHASE37_PRODUCTION_SMOKE_TEST_PASSED") {
        Add-Result "Production smoke test status" "PASS" "Smoke test passed."
    } elseif ($SmokeContent -match "FINAL STATUS: PHASE37_PRODUCTION_SMOKE_TEST_READY_WITH_WARNINGS") {
        Add-Result "Production smoke test status" "WARN" "Smoke test ready with warnings. Acceptable for first backend deploy, but must be reviewed before full production."
    } elseif ($SmokeContent -match "FINAL STATUS: PHASE37_PRODUCTION_SMOKE_TEST_FAILED") {
        Add-Result "Production smoke test status" "FAIL" "Smoke test failed."
    } else {
        Add-Result "Production smoke test status" "WARN" "Could not identify smoke test final status."
    }

    if ($SmokeContent -match "FAIL_COUNT:\s*0") {
        Add-Result "Smoke test fail count" "PASS" "Smoke test report contains FAIL_COUNT: 0."
    } elseif ($SmokeContent -match "FAIL_COUNT:") {
        Add-Result "Smoke test fail count" "FAIL" "Smoke test report contains non-zero or unclear FAIL_COUNT."
    } else {
        Add-Result "Smoke test fail count" "WARN" "Smoke test report does not expose FAIL_COUNT."
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "BACKEND FIRST DEPLOY VERDICT"
Write-ReportLine ""
Write-ReportLine "Backend URL:"
Write-ReportLine $BackendUrl
Write-ReportLine ""
Write-ReportLine "Health URL:"
Write-ReportLine $HealthUrl
Write-ReportLine ""
Write-ReportLine "Interpretation:"
Write-ReportLine "- HTTP 200 health means backend is live."
Write-ReportLine "- fallback=false is a strong signal for clean runtime."
Write-ReportLine "- smoke test warnings are acceptable for first deploy but not enough for full production go-live."
Write-ReportLine ""
Write-ReportLine "Next required phase:"
Write-ReportLine "Phase 40 - Frontend Production Deployment"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE39_BACKEND_FIRST_DEPLOY_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE39_BACKEND_FIRST_DEPLOY_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE39_BACKEND_FIRST_DEPLOY_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 39.6 Backend First Deploy Verification"
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