# RAFTOP CPAP CARE Pro
# Phase 64.1 - Final Resale Launch Kit Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsDir "client-start-pack"
$ResaleDir = Join-Path $ClientDir "resale-launch-kit"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase64_final_resale_launch_kit_readiness_gate_" + $Timestamp + ".md")

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

    $Path = Join-Path $ResaleDir $DocName
    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "FAIL" "Marker missing."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 64 Final Resale Launch Kit Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 64.1 Final Resale Launch Kit Readiness Gate..."
Write-Host ""

# Previous readiness gates
Check-ReportStatus "Phase 64 resale launch kit" "phase64_resale_launch_kit_*.md" @(
    "PHASE64_RESALE_LAUNCH_KIT_READY"
)

Check-ReportStatus "Phase 63 final support SLA change request readiness" "phase63_final_support_sla_change_request_readiness_gate_*.md" @(
    "PHASE63_FINAL_SUPPORT_SLA_CHANGE_REQUEST_READINESS_READY"
)

Check-ReportStatus "Phase 62 final buyer onboarding runbook readiness" "phase62_final_buyer_onboarding_runbook_readiness_gate_*.md" @(
    "PHASE62_FINAL_BUYER_ONBOARDING_RUNBOOK_READINESS_READY"
)

# Resale launch docs
$ResaleDocs = @(
    "01_RESALE_LAUNCH_OVERVIEW.md",
    "02_DOCTOR_CLINIC_PACKAGES.md",
    "03_DOCTOR_SALES_TALK_TRACK.md",
    "04_DOCTOR_ONBOARDING_FLOW.md",
    "05_RESALE_TENANT_PROVISIONING.md",
    "06_RESELLER_ROLES_AND_SUPPORT.md",
    "07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md",
    "08_RESALE_LAUNCH_KIT_INDEX.md"
)

foreach ($Doc in $ResaleDocs) {
    Test-PathExists ("Resale launch doc exists: " + $Doc) (Join-Path $ResaleDir $Doc)
}

# Marker checks
Test-DocMarker "01_RESALE_LAUNCH_OVERVIEW.md" "recurring revenue"
Test-DocMarker "01_RESALE_LAUNCH_OVERVIEW.md" "not a diagnostic medical device"
Test-DocMarker "01_RESALE_LAUNCH_OVERVIEW.md" "Doctors and clinics do not buy source code"

Test-DocMarker "02_DOCTOR_CLINIC_PACKAGES.md" "490 EUR"
Test-DocMarker "02_DOCTOR_CLINIC_PACKAGES.md" "990 EUR"
Test-DocMarker "02_DOCTOR_CLINIC_PACKAGES.md" "Clinic Plan"
Test-DocMarker "02_DOCTOR_CLINIC_PACKAGES.md" "Do not discount before scope is clear"

Test-DocMarker "03_DOCTOR_SALES_TALK_TRACK.md" "Doctor benefit"
Test-DocMarker "03_DOCTOR_SALES_TALK_TRACK.md" "Do not sell this as diagnosis"
Test-DocMarker "03_DOCTOR_SALES_TALK_TRACK.md" "periodic CPAP report"

Test-DocMarker "04_DOCTOR_ONBOARDING_FLOW.md" "No-start rule"
Test-DocMarker "04_DOCTOR_ONBOARDING_FLOW.md" "billing status"
Test-DocMarker "04_DOCTOR_ONBOARDING_FLOW.md" "reporting frequency confirmed"

Test-DocMarker "05_RESALE_TENANT_PROVISIONING.md" "Blocking rule"
Test-DocMarker "05_RESALE_TENANT_PROVISIONING.md" "agreed patient scope"
Test-DocMarker "05_RESALE_TENANT_PROVISIONING.md" "Inactive or unpaid tenants"

Test-DocMarker "06_RESELLER_ROLES_AND_SUPPORT.md" "Level 1"
Test-DocMarker "06_RESELLER_ROLES_AND_SUPPORT.md" "Level 2"
Test-DocMarker "06_RESELLER_ROLES_AND_SUPPORT.md" "unlimited custom development"

Test-DocMarker "07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md" "unrestricted resale rights"
Test-DocMarker "07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md" "Scaling without boundaries"
Test-DocMarker "07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md" "Real patient data requires appropriate legal"

Test-DocMarker "08_RESALE_LAUNCH_KIT_INDEX.md" "First document to open"
Test-DocMarker "08_RESALE_LAUNCH_KIT_INDEX.md" "client-facing"
Test-DocMarker "08_RESALE_LAUNCH_KIT_INDEX.md" "internal Raftopoulos workflow is stable"

# Required scripts
$RequiredTools = @(
    "run_phase64_create_resale_launch_kit.ps1",
    "run_phase64_final_resale_launch_kit_readiness_gate.ps1"
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
    $FinalStatus = "PHASE64_FINAL_RESALE_LAUNCH_KIT_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE64_FINAL_RESALE_LAUNCH_KIT_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE64_FINAL_RESALE_LAUNCH_KIT_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 64 Final Resale Launch Kit Readiness Gate"
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