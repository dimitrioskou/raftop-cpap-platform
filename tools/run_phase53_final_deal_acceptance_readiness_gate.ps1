# RAFTOP CPAP CARE Pro
# Phase 53.1 - Final Deal Acceptance Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$CommercialDir = Join-Path $DocsDir "commercial-proposal"
$DealDir = Join-Path $CommercialDir "deal-acceptance"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase53_final_deal_acceptance_readiness_gate_" + $Timestamp + ".md")

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

    $Path = Join-Path $DealDir $DocName
    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "FAIL" "Marker missing."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 53 Final Deal Acceptance Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 53.1 Final Deal Acceptance Readiness Gate..."
Write-Host ""

# 1. Previous readiness gates
Check-ReportStatus "Phase 53 deal acceptance pack" "phase53_deal_acceptance_pack_*.md" @(
    "PHASE53_DEAL_ACCEPTANCE_PACK_READY"
)

Check-ReportStatus "Phase 52 final commercial proposal readiness" "phase52_final_commercial_proposal_readiness_gate_*.md" @(
    "PHASE52_FINAL_COMMERCIAL_PROPOSAL_READINESS_READY"
)

Check-ReportStatus "Phase 51 final buyer meeting execution readiness" "phase51_final_buyer_meeting_execution_readiness_gate_*.md" @(
    "PHASE51_FINAL_BUYER_MEETING_EXECUTION_READINESS_READY"
)

# 2. Deal acceptance docs
$DealDocs = @(
    "01_DEAL_ACCEPTANCE_CHECKLIST.md",
    "02_BILLING_DETAILS_REQUEST.md",
    "03_30_DAY_PILOT_ACCEPTANCE_TEMPLATE.md",
    "04_90_DAY_PILOT_ACCEPTANCE_TEMPLATE.md",
    "05_ANNUAL_LICENSE_ACCEPTANCE_TEMPLATE.md",
    "06_START_AUTHORIZATION.md",
    "07_NO_START_RULES.md"
)

foreach ($Doc in $DealDocs) {
    Test-PathExists ("Deal acceptance doc exists: " + $Doc) (Join-Path $DealDir $Doc)
}

# 3. Marker checks
Test-DocMarker "01_DEAL_ACCEPTANCE_CHECKLIST.md" "No-start rule"
Test-DocMarker "02_BILLING_DETAILS_REQUEST.md" "billing email"
Test-DocMarker "03_30_DAY_PILOT_ACCEPTANCE_TEMPLATE.md" "4900 EUR plus VAT"
Test-DocMarker "04_90_DAY_PILOT_ACCEPTANCE_TEMPLATE.md" "15000 EUR plus VAT"
Test-DocMarker "05_ANNUAL_LICENSE_ACCEPTANCE_TEMPLATE.md" "42000 EUR per year plus VAT"
Test-DocMarker "05_ANNUAL_LICENSE_ACCEPTANCE_TEMPLATE.md" "7500 EUR plus VAT"
Test-DocMarker "06_START_AUTHORIZATION.md" "No start authorization"
Test-DocMarker "07_NO_START_RULES.md" "Do not start if"

# 4. Required scripts
$RequiredTools = @(
    "run_phase53_create_deal_acceptance_pack.ps1",
    "run_phase53_final_deal_acceptance_readiness_gate.ps1"
)

foreach ($Tool in $RequiredTools) {
    Test-PathExists ("Tool exists: " + $Tool) (Join-Path $ToolsDir $Tool)
}

# 5. Git status
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
    $FinalStatus = "PHASE53_FINAL_DEAL_ACCEPTANCE_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE53_FINAL_DEAL_ACCEPTANCE_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE53_FINAL_DEAL_ACCEPTANCE_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 53 Final Deal Acceptance Readiness Gate"
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