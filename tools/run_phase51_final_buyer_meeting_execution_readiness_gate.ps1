# RAFTOP CPAP CARE Pro
# Phase 51.5 - Final Buyer Meeting Execution Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$MeetingDir = Join-Path $DocsDir "buyer-meeting-execution"
$OutreachDir = Join-Path $MeetingDir "outreach-sequence"
$ResponseDir = Join-Path $MeetingDir "response-handling"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase51_final_buyer_meeting_execution_readiness_gate_" + $Timestamp + ".md")

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
    param(
        [string]$Content,
        [string]$Needle
    )

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
    param(
        [string]$Name,
        [string]$Pattern,
        [string[]]$AcceptedStatuses
    )

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
    param(
        [string]$Name,
        [string]$Path
    )

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 51 Final Buyer Meeting Execution Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 51.5 Final Buyer Meeting Execution Readiness Gate..."
Write-Host ""

# 1. Previous presentation readiness gate
Check-ReportStatus "Phase 50 final buyer presentation readiness" "phase50_final_buyer_presentation_readiness_gate_*.md" @(
    "PHASE50_FINAL_BUYER_PRESENTATION_READINESS_READY"
)

Check-ReportStatus "Phase 51 buyer meeting execution pack" "phase51_buyer_meeting_execution_pack_*.md" @(
    "PHASE51_BUYER_MEETING_EXECUTION_PACK_READY"
)

Check-ReportStatus "Phase 51 actual outreach sequence" "phase51_actual_outreach_sequence_*.md" @(
    "PHASE51_ACTUAL_OUTREACH_SEQUENCE_READY"
)

Check-ReportStatus "Phase 51 buyer response handling pack" "phase51_buyer_response_handling_pack_*.md" @(
    "PHASE51_BUYER_RESPONSE_HANDLING_PACK_READY"
)

# 2. Meeting execution docs
$MeetingDocs = @(
    "01_MEETING_BOOKING_MESSAGE.md",
    "02_REQUIRED_ATTENDEES.md",
    "03_MEETING_AGENDA.md",
    "04_BUYER_QUALIFICATION_QUESTIONS.md",
    "05_CLOSE_AND_NEXT_STEP_SCRIPT.md",
    "06_TECHNICAL_REVIEW_BOUNDARY.md",
    "07_POST_MEETING_FOLLOWUP_DECISION_TREE.md",
    "08_MEETING_OUTCOME_TRACKER.md"
)

foreach ($Doc in $MeetingDocs) {
    Test-PathExists ("Meeting execution doc: " + $Doc) (Join-Path $MeetingDir $Doc)
}

# 3. Outreach sequence docs
$OutreachDocs = @(
    "01_FIRST_MESSAGE_WHATSAPP_SMS.md",
    "02_PHONE_CALL_SCRIPT.md",
    "03_FOLLOW_UP_AFTER_NO_RESPONSE.md",
    "04_IF_THEY_REQUEST_LINK.md",
    "05_IF_THEY_REQUEST_TECHNICAL_REVIEW.md",
    "06_IF_THEY_ASK_FOR_PRICE.md",
    "07_MEETING_BOOKING_TRACKER.md"
)

foreach ($Doc in $OutreachDocs) {
    Test-PathExists ("Outreach sequence doc: " + $Doc) (Join-Path $OutreachDir $Doc)
}

# 4. Response handling docs
$ResponseDocs = @(
    "01_IF_BUYER_SAYS_YES.md",
    "02_IF_BUYER_SAYS_SEND_INFO.md",
    "03_IF_BUYER_ASKS_FOR_LINK.md",
    "04_IF_BUYER_ASKS_PRICE.md",
    "05_IF_BUYER_WANTS_TECHNICAL_REVIEW.md",
    "06_IF_BUYER_SAYS_NOT_NOW.md",
    "07_IF_BUYER_SAYS_FREE_TRIAL.md",
    "08_IF_BUYER_WANTS_ANNUAL.md"
)

foreach ($Doc in $ResponseDocs) {
    Test-PathExists ("Response handling doc: " + $Doc) (Join-Path $ResponseDir $Doc)
}

# 5. Required scripts
$RequiredTools = @(
    "run_phase51_create_buyer_meeting_execution_pack.ps1",
    "run_phase51_create_actual_outreach_sequence.ps1",
    "run_phase51_create_buyer_response_handling_pack.ps1",
    "run_phase51_final_buyer_meeting_execution_readiness_gate.ps1"
)

foreach ($Tool in $RequiredTools) {
    Test-PathExists ("Tool exists: " + $Tool) (Join-Path $ToolsDir $Tool)
}

# 6. Git status
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
    $FinalStatus = "PHASE51_FINAL_BUYER_MEETING_EXECUTION_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE51_FINAL_BUYER_MEETING_EXECUTION_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE51_FINAL_BUYER_MEETING_EXECUTION_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 51 Final Buyer Meeting Execution Readiness Gate"
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