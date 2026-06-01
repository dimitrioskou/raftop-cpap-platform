# RAFTOP CPAP CARE Pro
# Phase 67.1 - Final Client Delivery Message Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$DeliveryMessageDir = Join-Path $DocsDir "client-delivery-message"
$DeliveryRoot = Join-Path $Root "client-delivery"
$ZipPath = Join-Path $DeliveryRoot "RAFTOP_CLIENT_START_PACK_v1.0.zip"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase67_final_client_delivery_message_readiness_gate_" + $Timestamp + ".md")

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
            return Get-Content -Path $Path -Raw -ErrorAction Stop
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

function Test-DocMarker {
    param([string]$DocName, [string]$Marker)

    $Path = Join-Path $DeliveryMessageDir $DocName
    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "FAIL" "Marker missing."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 67 Final Client Delivery Message Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 67.1 Final Client Delivery Message Readiness Gate..."
Write-Host ""

# Previous readiness gates
Check-ReportStatus "Phase 67 client delivery message pack" "phase67_client_delivery_message_pack_*.md" @(
    "PHASE67_CLIENT_DELIVERY_MESSAGE_PACK_READY"
)

Check-ReportStatus "Phase 66 final client delivery master" "phase66_final_client_delivery_master_gate_*.md" @(
    "PHASE66_FINAL_CLIENT_DELIVERY_MASTER_READY"
)

Check-ReportStatus "Phase 65 final client delivery ZIP readiness" "phase65_1_final_client_delivery_zip_readiness_gate_*.md" @(
    "PHASE65_FINAL_CLIENT_DELIVERY_ZIP_READINESS_READY"
)

# Required final delivery ZIP
Test-PathExists "Final client delivery ZIP exists" $ZipPath

# Delivery message docs
$MessageDocs = @(
    "01_CLIENT_DELIVERY_EMAIL.md",
    "02_SHORT_DELIVERY_MESSAGE.md",
    "03_DELIVERY_ATTACHMENT_RULES.md",
    "04_HANDOVER_CALL_AGENDA.md",
    "05_CLIENT_RECEIPT_CONFIRMATION.md",
    "06_CREDENTIAL_DELIVERY_SEPARATION.md",
    "07_CLIENT_DELIVERY_MESSAGE_INDEX.md"
)

foreach ($Doc in $MessageDocs) {
    Test-PathExists ("Client delivery message doc exists: " + $Doc) (Join-Path $DeliveryMessageDir $Doc)
}

# Marker checks
Test-DocMarker "01_CLIENT_DELIVERY_EMAIL.md" "Client Start Pack v1.0"
Test-DocMarker "01_CLIENT_DELIVERY_EMAIL.md" "Credentials must be delivered separately"
Test-DocMarker "01_CLIENT_DELIVERY_EMAIL.md" "60 minute kickoff"

Test-DocMarker "02_SHORT_DELIVERY_MESSAGE.md" "00_START_HERE.md"
Test-DocMarker "02_SHORT_DELIVERY_MESSAGE.md" "source code"
Test-DocMarker "02_SHORT_DELIVERY_MESSAGE.md" "controlled channel"

Test-DocMarker "03_DELIVERY_ATTACHMENT_RULES.md" "Attach only"
Test-DocMarker "03_DELIVERY_ATTACHMENT_RULES.md" "RAFTOP_CLIENT_START_PACK_v1.0.zip"
Test-DocMarker "03_DELIVERY_ATTACHMENT_RULES.md" "not source-code handover"

Test-DocMarker "04_HANDOVER_CALL_AGENDA.md" "Required attendees"
Test-DocMarker "04_HANDOVER_CALL_AGENDA.md" "first review date"
Test-DocMarker "04_HANDOVER_CALL_AGENDA.md" "real patient data without legal"

Test-DocMarker "05_CLIENT_RECEIPT_CONFIRMATION.md" "We confirm receipt"
Test-DocMarker "05_CLIENT_RECEIPT_CONFIRMATION.md" "controlled channel"
Test-DocMarker "05_CLIENT_RECEIPT_CONFIRMATION.md" "next kickoff date"

Test-DocMarker "06_CREDENTIAL_DELIVERY_SEPARATION.md" "Delivery package first"
Test-DocMarker "06_CREDENTIAL_DELIVERY_SEPARATION.md" "Credentials second"
Test-DocMarker "06_CREDENTIAL_DELIVERY_SEPARATION.md" "Login test third"

Test-DocMarker "07_CLIENT_DELIVERY_MESSAGE_INDEX.md" "First document to use"
Test-DocMarker "07_CLIENT_DELIVERY_MESSAGE_INDEX.md" "RAFTOP_CLIENT_START_PACK_v1.0.zip"
Test-DocMarker "07_CLIENT_DELIVERY_MESSAGE_INDEX.md" "Do not deliver credentials"

# Required scripts
$RequiredTools = @(
    "run_phase67_create_client_delivery_message_pack.ps1",
    "run_phase67_final_client_delivery_message_readiness_gate.ps1"
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
    $FinalStatus = "PHASE67_FINAL_CLIENT_DELIVERY_MESSAGE_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE67_FINAL_CLIENT_DELIVERY_MESSAGE_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE67_FINAL_CLIENT_DELIVERY_MESSAGE_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 67 Final Client Delivery Message Readiness Gate"
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