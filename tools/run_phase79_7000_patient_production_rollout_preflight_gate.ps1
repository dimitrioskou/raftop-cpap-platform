# RAFTOP CPAP CARE Pro
# Phase 79 - 7000 Patient Production Rollout Preflight Gate
# ASCII-safe script.
# Purpose: verify that the project is ready to START a controlled 7000-patient production rollout.
# This does NOT import real patient data.
# Real patient data must not be imported before commercial agreement, GDPR/DPA, and acceptance rules.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$ToolsDir = Join-Path $Root "tools"

$BuyerPublicIndex = Join-Path $Root "enterprise-frontend\public\raftopoulos-buyer-view\index.html"

$DeliveryRoot = Join-Path $Root "client-delivery"
$BuyerPackDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0"
$BuyerZip = Join-Path $DeliveryRoot "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip"
$BuyerIndex = Join-Path $BuyerPackDir "index.html"
$BuyerFullPdf = Join-Path $BuyerPackDir "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_FULL_GUIDE.pdf"
$BuyerFullHtml = Join-Path $BuyerPackDir "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_FULL_GUIDE.html"

$FrontendBuyerUrl = "https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/"
$ForbiddenLoginUrl = "https://raftop-cpap-frontend.onrender.com/login"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase79_7000_patient_production_rollout_preflight_gate_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    Write-ReportLine ("CHECK: " + $Name)
    Write-ReportLine ("STATUS: " + $Status)
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($Status + " - " + $Name)
}

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try {
            return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop
        } catch {
            return ""
        }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function ContainsCharCode {
    param([string]$Content, [int]$Code)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }

    foreach ($Char in $Content.ToCharArray()) {
        if ([int][char]$Char -eq $Code) {
            return $true
        }
    }

    return $false
}

function Test-PathExists {
    param([string]$Name, [string]$Path)

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
    }
}

function Test-FileMarker {
    param([string]$Name, [string]$Path, [string]$Marker)

    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ($Name + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ($Name + ": " + $Marker) "FAIL" "Marker missing."
    }
}

function Test-ForbiddenTextAbsent {
    param([string]$Name, [string]$Path, [string]$Forbidden)

    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Forbidden) {
        Add-Result ($Name + ": " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ($Name + ": " + $Forbidden) "PASS" "Forbidden text absent."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 79 7000 Patient Production Rollout Preflight Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""
Write-ReportLine "Purpose: verify readiness to START controlled 7000-patient production rollout."
Write-ReportLine "This gate does not import real patient data."
Write-ReportLine "Real patient data requires commercial agreement, GDPR/DPA, role approval, and acceptance rules."
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 79 - 7000 Patient Production Rollout Preflight Gate..."
Write-Host ""

# Git clean check
Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean" "PASS" "Working tree is clean."
} else {
    Add-Result "Git working tree clean" "FAIL" "There are uncommitted or untracked changes."
    Write-ReportLine "GIT_STATUS:"
    Write-ReportLine ($GitStatus | Out-String)
    Write-ReportLine ""
}

# Required buyer delivery assets
Test-PathExists "Buyer public index exists" $BuyerPublicIndex
Test-PathExists "Buyer delivery pack folder exists" $BuyerPackDir
Test-PathExists "Buyer delivery ZIP exists" $BuyerZip
Test-PathExists "Buyer pack index exists" $BuyerIndex
Test-PathExists "Buyer full guide PDF exists" $BuyerFullPdf
Test-PathExists "Buyer full guide HTML exists" $BuyerFullHtml

# Buyer markers
Test-FileMarker "Buyer public marker" $BuyerPublicIndex "RAFTOP CPAP CARE Pro"
Test-FileMarker "Buyer public marker" $BuyerPublicIndex "BUYER_ONLY_VIEW"
Test-FileMarker "Buyer public marker" $BuyerPublicIndex "AIRVIEW_CONTEXT"
Test-FileMarker "Buyer public marker" $BuyerPublicIndex "SLEEPHQ_CONTEXT"
Test-FileMarker "Buyer public marker" $BuyerPublicIndex "EIGHTY_HOURS_COMPLIANCE"

Test-FileMarker "Buyer pack marker" $BuyerIndex "RAFTOP CPAP CARE Pro"
Test-FileMarker "Buyer pack marker" $BuyerIndex "BUYER_ONLY_VIEW"
Test-FileMarker "Buyer pack marker" $BuyerIndex "AIRVIEW_CONTEXT"
Test-FileMarker "Buyer pack marker" $BuyerIndex "SLEEPHQ_CONTEXT"
Test-FileMarker "Buyer pack marker" $BuyerIndex "EIGHTY_HOURS_COMPLIANCE"

Test-FileMarker "Full guide marker" $BuyerFullHtml "FULL_EXPANDED_BUYER_GUIDE"
Test-FileMarker "Full guide marker" $BuyerFullHtml "ATLAS / AirView-like Monitoring"
Test-FileMarker "Full guide marker" $BuyerFullHtml "SleepHQ-style CPAP Analysis"
Test-FileMarker "Full guide marker" $BuyerFullHtml "80 Hours Compliance"
Test-FileMarker "Full guide marker" $BuyerFullHtml "Compliance Rescue"
Test-FileMarker "Full guide marker" $BuyerFullHtml "Doctor / Clinic View"

# Forbidden buyer-facing content
$ForbiddenText = @(
    "Executive Demo Script",
    "Pilot Proposal",
    "Decision Launcher",
    "Objections",
    "Bearer token",
    "fallback active",
    "Authorization",
    "ChatGPT",
    "do not give",
    "do not send",
    "GitHub secrets",
    "Render secrets",
    ".env",
    $ForbiddenLoginUrl
)

foreach ($Text in $ForbiddenText) {
    Test-ForbiddenTextAbsent "Buyer public forbidden text absent" $BuyerPublicIndex $Text
    Test-ForbiddenTextAbsent "Buyer pack forbidden text absent" $BuyerIndex $Text
    Test-ForbiddenTextAbsent "Full guide forbidden text absent" $BuyerFullHtml $Text
}

# Mojibake checks using char codes
$PublicHtml = Read-FileSafe $BuyerPublicIndex
$PackHtml = Read-FileSafe $BuyerIndex
$FullGuideHtml = Read-FileSafe $BuyerFullHtml

if (ContainsCharCode $PublicHtml 0x039E) { Add-Result "Public mojibake Xi absent" "FAIL" "U+039E found." } else { Add-Result "Public mojibake Xi absent" "PASS" "Absent." }
if (ContainsCharCode $PackHtml 0x039E) { Add-Result "Pack mojibake Xi absent" "FAIL" "U+039E found." } else { Add-Result "Pack mojibake Xi absent" "PASS" "Absent." }
if (ContainsCharCode $FullGuideHtml 0x039E) { Add-Result "Full guide mojibake Xi absent" "FAIL" "U+039E found." } else { Add-Result "Full guide mojibake Xi absent" "PASS" "Absent." }

if (ContainsCharCode $PublicHtml 0x20AC) { Add-Result "Public mojibake Euro absent" "FAIL" "U+20AC found." } else { Add-Result "Public mojibake Euro absent" "PASS" "Absent." }
if (ContainsCharCode $PackHtml 0x20AC) { Add-Result "Pack mojibake Euro absent" "FAIL" "U+20AC found." } else { Add-Result "Pack mojibake Euro absent" "PASS" "Absent." }
if (ContainsCharCode $FullGuideHtml 0x20AC) { Add-Result "Full guide mojibake Euro absent" "FAIL" "U+20AC found." } else { Add-Result "Full guide mojibake Euro absent" "PASS" "Absent." }

# PDF size
if (Test-Path $BuyerFullPdf) {
    $PdfItem = Get-Item $BuyerFullPdf
    if ($PdfItem.Length -gt 50000) {
        Add-Result "Buyer full guide PDF size" "PASS" ("PDF size bytes: " + $PdfItem.Length)
    } else {
        Add-Result "Buyer full guide PDF size" "WARN" ("PDF may be small. Size bytes: " + $PdfItem.Length)
    }
}

# ZIP inspection
if (Test-Path $BuyerZip) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($BuyerZip)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        $RequiredEntries = @(
            "index.html",
            "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.pdf",
            "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_FULL_GUIDE.pdf",
            "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_FULL_GUIDE.html"
        )

        foreach ($Entry in $RequiredEntries) {
            if ($ZipEntries -contains $Entry) {
                Add-Result ("ZIP entry exists: " + $Entry) "PASS" "Entry found."
            } else {
                Add-Result ("ZIP entry exists: " + $Entry) "FAIL" "Entry missing."
            }
        }

        $ForbiddenZipEntries = @(
            "tools/",
            "reports/",
            "enterprise-backend/",
            "enterprise-frontend/",
            "node_modules/",
            ".git/",
            ".env"
        )

        foreach ($Forbidden in $ForbiddenZipEntries) {
            $Matches = $ZipEntries | Where-Object { $_ -like ("*" + $Forbidden + "*") }

            if ($Matches.Count -eq 0) {
                Add-Result ("Forbidden ZIP content absent: " + $Forbidden) "PASS" "No matching entries."
            } else {
                Add-Result ("Forbidden ZIP content absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches -join "; "))
            }
        }
    } catch {
        Add-Result "ZIP inspection" "FAIL" ("Could not inspect ZIP: " + $_.Exception.Message)
    }
}

# Live buyer URL check
try {
    $Response = Invoke-WebRequest -Uri $FrontendBuyerUrl -UseBasicParsing -TimeoutSec 30

    if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 300) {
        Add-Result "Live buyer URL HTTP status" "PASS" ("Status: " + $Response.StatusCode)
    } else {
        Add-Result "Live buyer URL HTTP status" "FAIL" ("Status: " + $Response.StatusCode)
    }

    $LiveHtml = $Response.Content

    if (ContainsText $LiveHtml "RAFTOP CPAP CARE Pro") {
        Add-Result "Live buyer URL content marker" "PASS" "RAFTOP marker found."
    } else {
        Add-Result "Live buyer URL content marker" "FAIL" "RAFTOP marker missing."
    }

    if (ContainsText $LiveHtml "ATLAS") {
        Add-Result "Live buyer URL ATLAS marker" "PASS" "ATLAS marker found."
    } else {
        Add-Result "Live buyer URL ATLAS marker" "FAIL" "ATLAS marker missing."
    }

    if (ContainsText $LiveHtml "80 Hours Compliance") {
        Add-Result "Live buyer URL 80h marker" "PASS" "80h marker found."
    } else {
        Add-Result "Live buyer URL 80h marker" "WARN" "80h marker not found in raw live HTML. It may be generated client-side."
    }

    foreach ($Text in $ForbiddenText) {
        if (ContainsText $LiveHtml $Text) {
            Add-Result ("Live buyer forbidden text absent: " + $Text) "FAIL" "Forbidden text found."
        } else {
            Add-Result ("Live buyer forbidden text absent: " + $Text) "PASS" "Forbidden text absent."
        }
    }

    if (ContainsCharCode $LiveHtml 0x039E) { Add-Result "Live buyer mojibake Xi absent" "FAIL" "U+039E found." } else { Add-Result "Live buyer mojibake Xi absent" "PASS" "Absent." }
    if (ContainsCharCode $LiveHtml 0x20AC) { Add-Result "Live buyer mojibake Euro absent" "FAIL" "U+20AC found." } else { Add-Result "Live buyer mojibake Euro absent" "PASS" "Absent." }

} catch {
    Add-Result "Live buyer URL reachable" "WARN" ("Could not verify live URL: " + $_.Exception.Message)
}

# Optional backend health check
$BackendHealthUrl = $env:RAFTOP_PRODUCTION_BACKEND_HEALTH_URL

if ([string]::IsNullOrWhiteSpace($BackendHealthUrl)) {
    Add-Result "Production backend health URL env set" "WARN" "RAFTOP_PRODUCTION_BACKEND_HEALTH_URL is not set. Backend health not checked."
} else {
    try {
        $HealthResponse = Invoke-WebRequest -Uri $BackendHealthUrl -UseBasicParsing -TimeoutSec 30

        if ($HealthResponse.StatusCode -ge 200 -and $HealthResponse.StatusCode -lt 300) {
            Add-Result "Production backend health reachable" "PASS" ("Status: " + $HealthResponse.StatusCode)
        } else {
            Add-Result "Production backend health reachable" "FAIL" ("Status: " + $HealthResponse.StatusCode)
        }
    } catch {
        Add-Result "Production backend health reachable" "FAIL" ("Could not reach backend health: " + $_.Exception.Message)
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 79 7000 Patient Production Rollout Preflight Gate"
Write-Host "============================================================"
Write-Host ""
Write-Host "Buyer URL:"
Write-Host $FrontendBuyerUrl
Write-Host ""
Write-Host "Buyer ZIP:"
Write-Host $BuyerZip
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