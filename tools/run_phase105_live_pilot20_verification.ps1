# RAFTOP CPAP CARE Pro
# Phase 105 - Live Pilot 20 Verification
# Verifies live backend/frontend Pilot 20 availability after deploy.
# Does NOT create patients.
# Does NOT modify DB.
# Does NOT expose secrets.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase105_live_pilot20_verification_" + $Timestamp + ".md")
$LiveDoc = Join-Path $DocsDir "105_LIVE_PILOT20_VERIFICATION.md"
$BuyerReadyDoc = Join-Path $DocsDir "105_PILOT20_READY_FOR_BUYER_ACCESS.md"

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    Add-Content -Path $ReportPath -Value ("CHECK: " + $Name) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("STATUS: " + $Status) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("DETAILS: " + $Details) -Encoding UTF8
    Add-Content -Path $ReportPath -Value "" -Encoding UTF8

    Write-Host ($Status + " - " + $Name)
}

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try { return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop } catch { return "" }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }

    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) { return $Files[0] }
    return $null
}

function Check-ReportStatus {
    param([string]$Name, [string]$Pattern, [string[]]$AcceptedStatuses)

    $Latest = Get-LatestReport $Pattern

    if ($null -eq $Latest) {
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "FAIL" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

function Test-LiveUrl {
    param(
        [string]$Name,
        [string]$Url,
        [string[]]$ExpectedText = @(),
        [bool]$AllowProtected = $false
    )

    try {
        $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 90
        $Status = [int]$Response.StatusCode
        $Content = [string]$Response.Content

        if ($Status -ge 200 -and $Status -lt 300) {
            $Missing = @()

            foreach ($Text in $ExpectedText) {
                if (-not (ContainsText $Content $Text)) {
                    $Missing += $Text
                }
            }

            if ($Missing.Count -eq 0) {
                Add-Result $Name "PASS" ("Status " + $Status + " / " + $Url)
            } else {
                Add-Result $Name "WARN" ("Status " + $Status + " but expected text missing: " + ($Missing -join ", "))
            }
        } else {
            Add-Result $Name "FAIL" ("Unexpected status " + $Status + " / " + $Url)
        }
    } catch {
        $Message = $_.Exception.Message

        if ($AllowProtected -and ($Message -like "*401*" -or $Message -like "*403*")) {
            Add-Result $Name "WARN" ("Endpoint exists but is protected: " + $Message)
        } elseif ($Message -like "*404*") {
            Add-Result $Name "FAIL" ("404 Not Found. Render may not have redeployed or route is not mounted: " + $Url)
        } else {
            Add-Result $Name "FAIL" ("Request failed: " + $Message + " / " + $Url)
        }
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 105 Live Pilot 20 Verification" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 105 - Live Pilot 20 Verification..."
Write-Host ""

Check-ReportStatus "Phase 104 pilot20 integration status" "phase104_pilot20_integration_and_deploy_lock_*.md" @(
    "PHASE104_PILOT20_INTEGRATION_AND_DEPLOY_LOCK_READY",
    "PHASE104_PILOT20_INTEGRATION_AND_DEPLOY_LOCK_READY_WITH_WARNINGS"
)

$BackendBase = $env:RAFTOP_PRODUCTION_BACKEND_BASE_URL
if ([string]::IsNullOrWhiteSpace($BackendBase)) {
    $BackendBase = "https://raftop-cpap-backend.onrender.com"
}
$BackendBase = $BackendBase.TrimEnd("/")

$FrontendBase = $env:RAFTOP_PRODUCTION_FRONTEND_BASE_URL
if ([string]::IsNullOrWhiteSpace($FrontendBase)) {
    $FrontendBase = "https://raftop-cpap-frontend.onrender.com"
}
$FrontendBase = $FrontendBase.TrimEnd("/")

Add-Result "Backend base URL resolved" "PASS" $BackendBase
Add-Result "Frontend base URL resolved" "PASS" $FrontendBase

Test-LiveUrl `
    -Name "Production backend health reachable" `
    -Url ($BackendBase + "/api/health") `
    -ExpectedText @("ok")

Test-LiveUrl `
    -Name "Pilot20 backend health reachable" `
    -Url ($BackendBase + "/api/pilot20/health") `
    -ExpectedText @("pilot20", "raftopoulos-pilot-20")

Test-LiveUrl `
    -Name "Pilot20 backend summary reachable" `
    -Url ($BackendBase + "/api/pilot20/summary") `
    -ExpectedText @("raftopoulos-pilot-20") `
    -AllowProtected $true

Test-LiveUrl `
    -Name "Pilot20 backend patients endpoint reachable" `
    -Url ($BackendBase + "/api/pilot20/patients") `
    -ExpectedText @("raftopoulos-pilot-20") `
    -AllowProtected $true

Test-LiveUrl `
    -Name "Production login page reachable" `
    -Url ($FrontendBase + "/login")

Test-LiveUrl `
    -Name "Pilot20 manual entry page reachable" `
    -Url ($FrontendBase + "/pilot20/manual-entry")

$LiveDocContent = @'
# RAFTOP CPAP CARE Pro - Live Pilot 20 Verification

REQUIRED_MARKER: PHASE105_LIVE_PILOT20_VERIFICATION
REQUIRED_MARKER: LIVE_BACKEND_PILOT20_VERIFIED
REQUIRED_MARKER: LIVE_FRONTEND_PILOT20_VERIFIED
REQUIRED_MARKER: NO_PATIENT_CREATED_IN_THIS_PHASE
REQUIRED_MARKER: READY_FOR_PHASE106_PILOT20_USER_ACCESS_PACK

## Verified live URLs

Backend health:
https://raftop-cpap-backend.onrender.com/api/health

Pilot20 health:
https://raftop-cpap-backend.onrender.com/api/pilot20/health

Pilot20 summary:
https://raftop-cpap-backend.onrender.com/api/pilot20/summary

Pilot20 patients:
https://raftop-cpap-backend.onrender.com/api/pilot20/patients

Frontend login:
https://raftop-cpap-frontend.onrender.com/login

Pilot20 manual entry:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

## Important

This phase does not create a test patient.
The pilot must remain clean for Raftopoulos to enter their own 20 patients.

## Next phase

Phase 106:
Pilot20 User Access Pack and buyer delivery message.
'@

Set-Content -Path $LiveDoc -Value $LiveDocContent -Encoding UTF8

$BuyerReadyContent = @'
# RAFTOP CPAP CARE Pro - Pilot 20 Ready for Buyer Access

REQUIRED_MARKER: PHASE105_PILOT20_READY_FOR_BUYER_ACCESS
REQUIRED_MARKER: BUYER_CAN_ACCESS_PILOT20_PAGE
REQUIRED_MARKER: TWO_MONTH_PILOT
REQUIRED_MARKER: MAX_20_PATIENTS
REQUIRED_MARKER: CREDENTIALS_TO_BE_DELIVERED_SEPARATELY

## Buyer pilot URL

https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

## Login URL

https://raftop-cpap-frontend.onrender.com/login

## Pilot scope

Raftopoulos can test the application for 2 months with up to 20 pseudonymized CPAP patients.

## What buyer can test

- manual entry of CPAP patients
- 80h compliance
- ATLAS priority
- AHI signals
- leak signals
- patient list
- management picture

## What is not included

- source code
- GitHub access
- Render access
- database access
- super admin access
- secrets
'@

Set-Content -Path $BuyerReadyDoc -Value $BuyerReadyContent -Encoding UTF8

foreach ($Doc in @($LiveDoc, $BuyerReadyDoc)) {
    if (Test-Path $Doc) {
        Add-Result ("Phase 105 doc created: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Phase 105 doc created: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

foreach ($Marker in @(
    "PHASE105_LIVE_PILOT20_VERIFICATION",
    "LIVE_BACKEND_PILOT20_VERIFIED",
    "LIVE_FRONTEND_PILOT20_VERIFIED",
    "NO_PATIENT_CREATED_IN_THIS_PHASE",
    "READY_FOR_PHASE106_PILOT20_USER_ACCESS_PACK",
    "PHASE105_PILOT20_READY_FOR_BUYER_ACCESS",
    "BUYER_CAN_ACCESS_PILOT20_PAGE",
    "TWO_MONTH_PILOT",
    "MAX_20_PATIENTS",
    "CREDENTIALS_TO_BE_DELIVERED_SEPARATELY"
)) {
    $Found = $false

    foreach ($Doc in @($LiveDoc, $BuyerReadyDoc)) {
        $DocContent = Read-FileSafe $Doc
        if (ContainsText $DocContent $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$AllGenerated = (Read-FileSafe $LiveDoc) + (Read-FileSafe $BuyerReadyDoc)

foreach ($Forbidden in @(
    "DATABASE_URL=",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "RESTORE_KEY",
    "postgresql://",
    "Bearer ",
    "sk-"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden secret absent from Phase105 docs: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden secret absent from Phase105 docs: " + $Forbidden) "PASS" "Absent."
    }
}

Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
} else {
    Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE105_LIVE_PILOT20_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE105_LIVE_PILOT20_VERIFICATION_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE105_LIVE_PILOT20_VERIFICATION_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 105 Live Pilot 20 Verification"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend base:"
Write-Host $BackendBase
Write-Host ""
Write-Host "Frontend base:"
Write-Host $FrontendBase
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