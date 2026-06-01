# RAFTOP CPAP CARE Pro
# Phase 69.4 - Final Buyer-Clean Portal Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DeliveryRoot = Join-Path $Root "client-delivery"
$PortalDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_v1.0"
$PortalZip = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_v1.0.zip"
$HtmlPath = Join-Path $PortalDir "index.html"
$PdfPath = Join-Path $PortalDir "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_v1.0.pdf"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase69_4_final_buyer_clean_portal_readiness_gate_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

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

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $false
    }

    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 69.4 Final Buyer-Clean Portal Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 69.4 Final Buyer-Clean Portal Readiness Gate..."
Write-Host ""

# Previous readiness chain
Check-ReportStatus "Phase 69.3 buyer-clean client portal" "phase69_3_buyer_clean_client_portal_*.md" @(
    "PHASE69_3_BUYER_CLEAN_CLIENT_PORTAL_READY"
)

Check-ReportStatus "Phase 69 final client portal readiness" "phase69_final_client_portal_readiness_gate_*.md" @(
    "PHASE69_FINAL_CLIENT_PORTAL_READINESS_READY"
)

Check-ReportStatus "Phase 68 final delivery execution kickoff readiness" "phase68_final_delivery_execution_kickoff_readiness_gate_*.md" @(
    "PHASE68_FINAL_DELIVERY_EXECUTION_KICKOFF_READINESS_READY"
)

Check-ReportStatus "Phase 67 final client delivery message readiness" "phase67_final_client_delivery_message_readiness_gate_*.md" @(
    "PHASE67_FINAL_CLIENT_DELIVERY_MESSAGE_READINESS_READY"
)

Check-ReportStatus "Phase 66 final client delivery master" "phase66_final_client_delivery_master_gate_*.md" @(
    "PHASE66_FINAL_CLIENT_DELIVERY_MASTER_READY"
)

# Artifact checks
Test-PathExists "Buyer-clean portal folder exists" $PortalDir
Test-PathExists "Buyer-clean portal ZIP exists" $PortalZip
Test-PathExists "Buyer-clean index.html exists" $HtmlPath
Test-PathExists "Buyer-clean PDF exists" $PdfPath

# HTML required markers
Test-FileMarker "HTML required marker" $HtmlPath "Client Portal v1.0"
Test-FileMarker "HTML required marker" $HtmlPath "Operational Start Sequence"
Test-FileMarker "HTML required marker" $HtmlPath "First 7 Days Plan"
Test-FileMarker "HTML required marker" $HtmlPath "Data Intake Template"
Test-FileMarker "HTML required marker" $HtmlPath "Support and Change Request Boundary"
Test-FileMarker "HTML required marker" $HtmlPath "Resale Preparation"
Test-FileMarker "HTML required marker" $HtmlPath "Handover Checklist"
Test-FileMarker "HTML required marker" $HtmlPath "not a diagnostic medical device"

# It must be self-contained: no links to external markdown/csv files
$HtmlContent = Read-FileSafe $HtmlPath

if (ContainsText $HtmlContent "href=") {
    Add-Result "Self-contained HTML has no href dependencies" "FAIL" "href attribute found."
} else {
    Add-Result "Self-contained HTML has no href dependencies" "PASS" "No href attributes found."
}

# Buyer-clean forbidden text
$ForbiddenText = @(
    "do not give",
    "do not send",
    "ChatGPT",
    "developer-only",
    "internal scripts",
    "GitHub",
    "source code",
    ".env",
    "Render secrets",
    "GitHub secrets",
    "raw logs",
    "uncontrolled technical chaos",
    "tools/",
    "reports/"
)

foreach ($Forbidden in $ForbiddenText) {
    Test-ForbiddenTextAbsent "Buyer-clean HTML forbidden text absent" $HtmlPath $Forbidden
}

# PDF size check
if (Test-Path $PdfPath) {
    $PdfItem = Get-Item $PdfPath
    if ($PdfItem.Length -gt 1000) {
        Add-Result "Buyer-clean PDF file size" "PASS" ("PDF size bytes: " + $PdfItem.Length)
    } else {
        Add-Result "Buyer-clean PDF file size" "WARN" ("PDF exists but size is small: " + $PdfItem.Length)
    }
}

# ZIP content inspection
if (Test-Path $PortalZip) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($PortalZip)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        $RequiredZipEntries = @(
            "index.html",
            "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_v1.0.pdf"
        )

        foreach ($Entry in $RequiredZipEntries) {
            if ($ZipEntries -contains $Entry) {
                Add-Result ("Buyer-clean ZIP entry exists: " + $Entry) "PASS" "Entry found."
            } else {
                Add-Result ("Buyer-clean ZIP entry exists: " + $Entry) "FAIL" "Entry missing."
            }
        }

        $ForbiddenEntries = @(
            "tools/",
            "reports/",
            "enterprise-backend/",
            "enterprise-frontend/",
            "node_modules/",
            ".git/",
            ".env",
            "RAFTOP_BACKUPS_ARCHIVE",
            "RAFTOP_EXTERNAL_BACKUPS",
            "RAFTOP_CLIENT_PORTAL_SELF_CONTAINED",
            "RAFTOP_CLIENT_PORTAL_v1.0/02_CLIENT_START_PACK"
        )

        foreach ($Forbidden in $ForbiddenEntries) {
            $Matches = $ZipEntries | Where-Object {
                $_ -like ("*" + $Forbidden + "*")
            }

            if ($Matches.Count -eq 0) {
                Add-Result ("Forbidden buyer-clean ZIP content absent: " + $Forbidden) "PASS" "No matching ZIP entries."
            } else {
                Add-Result ("Forbidden buyer-clean ZIP content absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches -join "; "))
            }
        }
    } catch {
        Add-Result "Buyer-clean ZIP content readable" "FAIL" ("Could not inspect ZIP: " + $_.Exception.Message)
    }
}

# Required scripts
$RequiredTools = @(
    "run_phase69_3_create_buyer_clean_client_portal.ps1",
    "run_phase69_4_final_buyer_clean_portal_readiness_gate.ps1"
)

foreach ($Tool in $RequiredTools) {
    Test-PathExists ("Tool exists: " + $Tool) (Join-Path $ToolsDir $Tool)
}

# Git status
Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree" "PASS" "Working tree is clean."
} else {
    Add-Result "Git working tree" "WARN" "There are uncommitted/untracked changes."
    Write-ReportLine "GIT_STATUS:"
    Write-ReportLine ($GitStatus | Out-String)
    Write-ReportLine ""
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE69_4_FINAL_BUYER_CLEAN_PORTAL_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE69_4_FINAL_BUYER_CLEAN_PORTAL_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE69_4_FINAL_BUYER_CLEAN_PORTAL_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 69.4 Final Buyer-Clean Portal Readiness Gate"
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