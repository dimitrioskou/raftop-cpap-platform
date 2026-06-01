# RAFTOP CPAP CARE Pro
# Phase 58.1 - Final Master Handover Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$HandoverDir = Join-Path $DocsDir "master-handover"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase58_final_master_handover_readiness_gate_" + $Timestamp + ".md")

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

    $Path = Join-Path $HandoverDir $DocName
    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "FAIL" "Marker missing."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 58 Final Master Handover Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 58.1 Final Master Handover Readiness Gate..."
Write-Host ""

# Previous readiness gates
Check-ReportStatus "Phase 58 master handover index pack" "phase58_master_handover_index_pack_*.md" @(
    "PHASE58_MASTER_HANDOVER_INDEX_PACK_READY"
)

Check-ReportStatus "Phase 57 final executive one page readiness" "phase57_final_executive_one_page_readiness_gate_*.md" @(
    "PHASE57_FINAL_EXECUTIVE_ONE_PAGE_READINESS_READY"
)

Check-ReportStatus "Phase 56 final resale and scale readiness" "phase56_final_resale_scale_readiness_gate_*.md" @(
    "PHASE56_FINAL_RESALE_SCALE_READINESS_READY"
)

Check-ReportStatus "Phase 55 final master commercial delivery" "phase55_final_master_commercial_delivery_gate_*.md" @(
    "PHASE55_FINAL_MASTER_COMMERCIAL_DELIVERY_READY"
)

# Master handover docs
$HandoverDocs = @(
    "01_MASTER_HANDOVER_INDEX.md",
    "02_RELEASE_TAG_MAP.md",
    "03_FINAL_PHASE_STATUS_MAP.md",
    "04_BUYER_FACING_VS_INTERNAL.md",
    "05_NO_MORE_BUILD_RULE.md",
    "06_NEXT_ACTION_COMMAND.md"
)

foreach ($Doc in $HandoverDocs) {
    Test-PathExists ("Master handover doc exists: " + $Doc) (Join-Path $HandoverDir $Doc)
}

# Marker checks
Test-DocMarker "01_MASTER_HANDOVER_INDEX.md" "Master Handover Index"
Test-DocMarker "01_MASTER_HANDOVER_INDEX.md" "90 Day Operational Pilot"
Test-DocMarker "02_RELEASE_TAG_MAP.md" "raftop-buyer-ready-v1.0.0"
Test-DocMarker "02_RELEASE_TAG_MAP.md" "Anything after these tags is a new version"
Test-DocMarker "03_FINAL_PHASE_STATUS_MAP.md" "PHASE57_FINAL_EXECUTIVE_ONE_PAGE_READINESS_READY"
Test-DocMarker "03_FINAL_PHASE_STATUS_MAP.md" "No further product development"
Test-DocMarker "04_BUYER_FACING_VS_INTERNAL.md" "Internal materials"
Test-DocMarker "04_BUYER_FACING_VS_INTERNAL.md" "Safe buyer flow"
Test-DocMarker "05_NO_MORE_BUILD_RULE.md" "Do not add new features"
Test-DocMarker "05_NO_MORE_BUILD_RULE.md" "sales execution"
Test-DocMarker "06_NEXT_ACTION_COMMAND.md" "Book meeting"
Test-DocMarker "06_NEXT_ACTION_COMMAND.md" "90 Day Operational Pilot"

# Required script
$RequiredTools = @(
    "run_phase58_create_master_handover_index_pack.ps1",
    "run_phase58_final_master_handover_readiness_gate.ps1"
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
    $FinalStatus = "PHASE58_FINAL_MASTER_HANDOVER_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE58_FINAL_MASTER_HANDOVER_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE58_FINAL_MASTER_HANDOVER_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 58 Final Master Handover Readiness Gate"
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