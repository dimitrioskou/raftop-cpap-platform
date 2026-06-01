# RAFTOP CPAP CARE Pro
# Phase 62.1 - Final Buyer Onboarding Runbook Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsDir "client-start-pack"
$RunbookDir = Join-Path $ClientDir "buyer-onboarding-runbook"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase62_final_buyer_onboarding_runbook_readiness_gate_" + $Timestamp + ".md")

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

    $Path = Join-Path $RunbookDir $DocName
    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "FAIL" "Marker missing."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 62 Final Buyer Onboarding Runbook Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 62.1 Final Buyer Onboarding Runbook Readiness Gate..."
Write-Host ""

# Previous readiness gates
Check-ReportStatus "Phase 62 buyer onboarding runbook pack" "phase62_buyer_onboarding_runbook_pack_*.md" @(
    "PHASE62_BUYER_ONBOARDING_RUNBOOK_PACK_READY"
)

Check-ReportStatus "Phase 61 final data intake CSV template readiness" "phase61_final_data_intake_csv_template_readiness_gate_*.md" @(
    "PHASE61_FINAL_DATA_INTAKE_CSV_TEMPLATE_READINESS_READY"
)

Check-ReportStatus "Phase 60 final production access tenant activation readiness" "phase60_final_production_access_tenant_activation_readiness_gate_*.md" @(
    "PHASE60_FINAL_PRODUCTION_ACCESS_TENANT_ACTIVATION_READINESS_READY"
)

# Runbook docs
$RunbookDocs = @(
    "01_BUYER_ONBOARDING_RUNBOOK.md",
    "02_KICKOFF_MEETING_SCRIPT.md",
    "03_FIRST_WEEK_EXECUTION_CHECKLIST.md",
    "04_FIRST_MONTH_OPERATING_RHYTHM.md",
    "05_ATLAS_DAILY_BOARD_ROUTINE.md",
    "06_MANAGEMENT_REVIEW_ROUTINE.md",
    "07_BLOCKER_AND_ESCALATION_PROCESS.md",
    "08_ONBOARDING_RUNBOOK_INDEX.md"
)

foreach ($Doc in $RunbookDocs) {
    Test-PathExists ("Buyer onboarding runbook doc exists: " + $Doc) (Join-Path $RunbookDir $Doc)
}

# Marker checks
Test-DocMarker "01_BUYER_ONBOARDING_RUNBOOK.md" "Onboarding stages"
Test-DocMarker "01_BUYER_ONBOARDING_RUNBOOK.md" "agreed scope"
Test-DocMarker "01_BUYER_ONBOARDING_RUNBOOK.md" "data boundary confirmed"

Test-DocMarker "02_KICKOFF_MEETING_SCRIPT.md" "Required attendees"
Test-DocMarker "02_KICKOFF_MEETING_SCRIPT.md" "Kickoff outputs"
Test-DocMarker "02_KICKOFF_MEETING_SCRIPT.md" "open-ended custom development"

Test-DocMarker "03_FIRST_WEEK_EXECUTION_CHECKLIST.md" "Day 1"
Test-DocMarker "03_FIRST_WEEK_EXECUTION_CHECKLIST.md" "Day 7"
Test-DocMarker "03_FIRST_WEEK_EXECUTION_CHECKLIST.md" "Success condition"

Test-DocMarker "04_FIRST_MONTH_OPERATING_RHYTHM.md" "Week 4"
Test-DocMarker "04_FIRST_MONTH_OPERATING_RHYTHM.md" "management summary"
Test-DocMarker "04_FIRST_MONTH_OPERATING_RHYTHM.md" "which ATLAS actions are open"

Test-DocMarker "05_ATLAS_DAILY_BOARD_ROUTINE.md" "owner and status"
Test-DocMarker "05_ATLAS_DAILY_BOARD_ROUTINE.md" "operational control"
Test-DocMarker "05_ATLAS_DAILY_BOARD_ROUTINE.md" "escalate blocked cases"

Test-DocMarker "06_MANAGEMENT_REVIEW_ROUTINE.md" "Management review items"
Test-DocMarker "06_MANAGEMENT_REVIEW_ROUTINE.md" "next review date"
Test-DocMarker "06_MANAGEMENT_REVIEW_ROUTINE.md" "active patient/sample scope"

Test-DocMarker "07_BLOCKER_AND_ESCALATION_PROCESS.md" "Escalation rule"
Test-DocMarker "07_BLOCKER_AND_ESCALATION_PROCESS.md" "change request"
Test-DocMarker "07_BLOCKER_AND_ESCALATION_PROCESS.md" "Blocker fields"

Test-DocMarker "08_ONBOARDING_RUNBOOK_INDEX.md" "First document to open"
Test-DocMarker "08_ONBOARDING_RUNBOOK_INDEX.md" "client-facing"
Test-DocMarker "08_ONBOARDING_RUNBOOK_INDEX.md" "01_BUYER_ONBOARDING_RUNBOOK.md"

# Required scripts
$RequiredTools = @(
    "run_phase62_create_buyer_onboarding_runbook_pack.ps1",
    "run_phase62_final_buyer_onboarding_runbook_readiness_gate.ps1"
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
    $FinalStatus = "PHASE62_FINAL_BUYER_ONBOARDING_RUNBOOK_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE62_FINAL_BUYER_ONBOARDING_RUNBOOK_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE62_FINAL_BUYER_ONBOARDING_RUNBOOK_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 62 Final Buyer Onboarding Runbook Readiness Gate"
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