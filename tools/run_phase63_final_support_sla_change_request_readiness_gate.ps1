# RAFTOP CPAP CARE Pro
# Phase 63.1 - Final Support SLA and Change Request Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsDir "client-start-pack"
$SupportDir = Join-Path $ClientDir "support-sla-change-requests"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase63_final_support_sla_change_request_readiness_gate_" + $Timestamp + ".md")

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

    $Path = Join-Path $SupportDir $DocName
    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "FAIL" "Marker missing."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 63 Final Support SLA and Change Request Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 63.1 Final Support SLA and Change Request Readiness Gate..."
Write-Host ""

# Previous readiness gates
Check-ReportStatus "Phase 63 support SLA and change request pack" "phase63_support_sla_change_request_pack_*.md" @(
    "PHASE63_SUPPORT_SLA_CHANGE_REQUEST_PACK_READY"
)

Check-ReportStatus "Phase 62 final buyer onboarding runbook readiness" "phase62_final_buyer_onboarding_runbook_readiness_gate_*.md" @(
    "PHASE62_FINAL_BUYER_ONBOARDING_RUNBOOK_READINESS_READY"
)

Check-ReportStatus "Phase 61 final data intake CSV template readiness" "phase61_final_data_intake_csv_template_readiness_gate_*.md" @(
    "PHASE61_FINAL_DATA_INTAKE_CSV_TEMPLATE_READINESS_READY"
)

# Support docs
$SupportDocs = @(
    "01_SUPPORT_SCOPE_OVERVIEW.md",
    "02_SUPPORT_CHANNELS_AND_RESPONSE_TIMES.md",
    "03_INCIDENT_SEVERITY_LEVELS.md",
    "04_BUG_VS_CHANGE_REQUEST.md",
    "05_CHANGE_REQUEST_TEMPLATE.md",
    "06_OUT_OF_SCOPE_ITEMS.md",
    "07_SUPPORT_REQUEST_FORM.md",
    "08_SLA_AND_CHANGE_REQUEST_INDEX.md"
)

foreach ($Doc in $SupportDocs) {
    Test-PathExists ("Support SLA doc exists: " + $Doc) (Join-Path $SupportDir $Doc)
}

# Marker checks
Test-DocMarker "01_SUPPORT_SCOPE_OVERVIEW.md" "Included support"
Test-DocMarker "01_SUPPORT_SCOPE_OVERVIEW.md" "Not included as standard support"
Test-DocMarker "01_SUPPORT_SCOPE_OVERVIEW.md" "New functionality requires change request approval"

Test-DocMarker "02_SUPPORT_CHANNELS_AND_RESPONSE_TIMES.md" "Critical access blocker"
Test-DocMarker "02_SUPPORT_CHANNELS_AND_RESPONSE_TIMES.md" "same business day"
Test-DocMarker "02_SUPPORT_CHANNELS_AND_RESPONSE_TIMES.md" "Change request"

Test-DocMarker "03_INCIDENT_SEVERITY_LEVELS.md" "Severity 1"
Test-DocMarker "03_INCIDENT_SEVERITY_LEVELS.md" "Severity 4"
Test-DocMarker "03_INCIDENT_SEVERITY_LEVELS.md" "paid change requests"

Test-DocMarker "04_BUG_VS_CHANGE_REQUEST.md" "If it was agreed and it fails"
Test-DocMarker "04_BUG_VS_CHANGE_REQUEST.md" "expanded scope"
Test-DocMarker "04_BUG_VS_CHANGE_REQUEST.md" "price or commercial approval"

Test-DocMarker "05_CHANGE_REQUEST_TEMPLATE.md" "approval owner"
Test-DocMarker "05_CHANGE_REQUEST_TEMPLATE.md" "scope, cost, and timeline"
Test-DocMarker "05_CHANGE_REQUEST_TEMPLATE.md" "doctor/clinic expansion"

Test-DocMarker "06_OUT_OF_SCOPE_ITEMS.md" "live AirView integration"
Test-DocMarker "06_OUT_OF_SCOPE_ITEMS.md" "unrestricted source code handover"
Test-DocMarker "06_OUT_OF_SCOPE_ITEMS.md" "separate approval and pricing"

Test-DocMarker "07_SUPPORT_REQUEST_FORM.md" "Required fields"
Test-DocMarker "07_SUPPORT_REQUEST_FORM.md" "Do not include"
Test-DocMarker "07_SUPPORT_REQUEST_FORM.md" "uncontrolled patient identifiers"

Test-DocMarker "08_SLA_AND_CHANGE_REQUEST_INDEX.md" "First document to open"
Test-DocMarker "08_SLA_AND_CHANGE_REQUEST_INDEX.md" "client-facing"
Test-DocMarker "08_SLA_AND_CHANGE_REQUEST_INDEX.md" "Support is not unlimited custom development"

# Required scripts
$RequiredTools = @(
    "run_phase63_create_support_sla_change_request_pack.ps1",
    "run_phase63_final_support_sla_change_request_readiness_gate.ps1"
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
    $FinalStatus = "PHASE63_FINAL_SUPPORT_SLA_CHANGE_REQUEST_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE63_FINAL_SUPPORT_SLA_CHANGE_REQUEST_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE63_FINAL_SUPPORT_SLA_CHANGE_REQUEST_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 63 Final Support SLA and Change Request Readiness Gate"
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