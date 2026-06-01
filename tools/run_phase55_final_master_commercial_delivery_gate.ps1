# RAFTOP CPAP CARE Pro
# Phase 55 - Final Master Commercial Delivery Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase55_final_master_commercial_delivery_gate_" + $Timestamp + ".md")

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
        try { return Get-Content -Path $Path -Raw -ErrorAction Stop } catch { return "" }
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

function Test-PathExists {
    param([string]$Name, [string]$Path)

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 55 Final Master Commercial Delivery Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 55 Final Master Commercial Delivery Gate..."
Write-Host ""

# Required final gates
Check-ReportStatus "Phase 49 final product completion" "phase49_final_100_percent_product_completion_gate_*.md" @(
    "PHASE49_FINAL_100_PERCENT_PRODUCT_COMPLETION_READY"
)

Check-ReportStatus "Phase 50 final buyer presentation readiness" "phase50_final_buyer_presentation_readiness_gate_*.md" @(
    "PHASE50_FINAL_BUYER_PRESENTATION_READINESS_READY"
)

Check-ReportStatus "Phase 51 final buyer meeting execution readiness" "phase51_final_buyer_meeting_execution_readiness_gate_*.md" @(
    "PHASE51_FINAL_BUYER_MEETING_EXECUTION_READINESS_READY"
)

Check-ReportStatus "Phase 52 final commercial proposal readiness" "phase52_final_commercial_proposal_readiness_gate_*.md" @(
    "PHASE52_FINAL_COMMERCIAL_PROPOSAL_READINESS_READY"
)

Check-ReportStatus "Phase 53 final deal acceptance readiness" "phase53_final_deal_acceptance_readiness_gate_*.md" @(
    "PHASE53_FINAL_DEAL_ACCEPTANCE_READINESS_READY"
)

Check-ReportStatus "Phase 54 final onboarding execution readiness" "phase54_final_onboarding_execution_readiness_gate_*.md" @(
    "PHASE54_FINAL_ONBOARDING_EXECUTION_READINESS_READY"
)

# Required doc folders
Test-PathExists "Buyer delivery docs folder" (Join-Path $DocsDir "buyer-delivery")
Test-PathExists "Buyer presentation docs folder" (Join-Path $DocsDir "buyer-presentation")
Test-PathExists "Buyer meeting execution docs folder" (Join-Path $DocsDir "buyer-meeting-execution")
Test-PathExists "Commercial proposal docs folder" (Join-Path $DocsDir "commercial-proposal")
Test-PathExists "Deal acceptance docs folder" (Join-Path $DocsDir "commercial-proposal\deal-acceptance")
Test-PathExists "Onboarding execution docs folder" (Join-Path $DocsDir "commercial-proposal\onboarding-execution")

# Required tools
$RequiredTools = @(
    "run_phase49_final_100_percent_product_completion_gate.ps1",
    "run_phase50_final_buyer_presentation_readiness_gate.ps1",
    "run_phase51_final_buyer_meeting_execution_readiness_gate.ps1",
    "run_phase52_final_commercial_proposal_readiness_gate.ps1",
    "run_phase53_final_deal_acceptance_readiness_gate.ps1",
    "run_phase54_final_onboarding_execution_readiness_gate.ps1",
    "run_phase55_final_master_commercial_delivery_gate.ps1"
)

foreach ($Tool in $RequiredTools) {
    Test-PathExists ("Tool exists: " + $Tool) (Join-Path $ToolsDir $Tool)
}

# Required tags
Push-Location $Root
$Tags = git tag --list "raftop-*" 2>&1
$GitTagExit = $LASTEXITCODE
Pop-Location

if ($GitTagExit -ne 0) {
    Add-Result "Git tags readable" "WARN" "Could not read git tags."
} else {
    Add-Result "Git tags readable" "PASS" "Git tags read successfully."

    $RequiredTags = @(
        "raftop-buyer-ready-v1.0.0",
        "raftop-buyer-presentation-ready-v1.0.0",
        "raftop-buyer-meeting-ready-v1.0.0",
        "raftop-commercial-proposal-ready-v1.0.0",
        "raftop-deal-acceptance-ready-v1.0.0",
        "raftop-onboarding-execution-ready-v1.0.0"
    )

    foreach ($Tag in $RequiredTags) {
        if ($Tags -contains $Tag) {
            Add-Result ("Release tag exists: " + $Tag) "PASS" "Tag exists."
        } else {
            Add-Result ("Release tag exists: " + $Tag) "WARN" "Tag not found locally. Create/push tag if this milestone is intended to be locked."
        }
    }
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
    $FinalStatus = "PHASE55_FINAL_MASTER_COMMERCIAL_DELIVERY_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE55_FINAL_MASTER_COMMERCIAL_DELIVERY_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE55_FINAL_MASTER_COMMERCIAL_DELIVERY_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 55 Final Master Commercial Delivery Gate"
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