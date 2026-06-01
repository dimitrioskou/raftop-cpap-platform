# RAFTOP CPAP CARE Pro
# Phase 56.1 - Final Resale and Scale Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$CommercialDir = Join-Path $DocsDir "commercial-proposal"
$ResaleDir = Join-Path $CommercialDir "resale-scale-delivery"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase56_final_resale_scale_readiness_gate_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 56 Final Resale and Scale Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 56.1 Final Resale and Scale Readiness Gate..."
Write-Host ""

# Previous readiness gates
Check-ReportStatus "Phase 56 resale and scale delivery pack" "phase56_resale_scale_delivery_pack_*.md" @(
    "PHASE56_RESALE_SCALE_DELIVERY_PACK_READY"
)

Check-ReportStatus "Phase 55 final master commercial delivery gate" "phase55_final_master_commercial_delivery_gate_*.md" @(
    "PHASE55_FINAL_MASTER_COMMERCIAL_DELIVERY_READY"
)

Check-ReportStatus "Phase 54 final onboarding execution readiness" "phase54_final_onboarding_execution_readiness_gate_*.md" @(
    "PHASE54_FINAL_ONBOARDING_EXECUTION_READINESS_READY"
)

# Resale docs
$ResaleDocs = @(
    "01_RAFTOP_PURCHASE_SCOPE.md",
    "02_RAFTOP_INTERNAL_USE_MODEL.md",
    "03_RESALE_MODEL_FOR_DOCTORS_CLINICS.md",
    "04_TENANT_PROVISIONING_SOP.md",
    "05_RESELLER_SUPPORT_BOUNDARY.md",
    "06_RESALE_CONTRACT_POINTS.md",
    "07_SCALE_RISK_REGISTER.md",
    "08_RESALE_READINESS_CHECKLIST.md"
)

foreach ($Doc in $ResaleDocs) {
    Test-PathExists ("Resale doc exists: " + $Doc) (Join-Path $ResaleDir $Doc)
}

# Marker checks
Test-DocMarker "01_RAFTOP_PURCHASE_SCOPE.md" "Raftopoulos buys"
Test-DocMarker "01_RAFTOP_PURCHASE_SCOPE.md" "not a diagnostic medical device"
Test-DocMarker "02_RAFTOP_INTERNAL_USE_MODEL.md" "Do not sell externally"
Test-DocMarker "03_RESALE_MODEL_FOR_DOCTORS_CLINICS.md" "Doctor Dashboard"
Test-DocMarker "03_RESALE_MODEL_FOR_DOCTORS_CLINICS.md" "recurring revenue"
Test-DocMarker "04_TENANT_PROVISIONING_SOP.md" "billing status"
Test-DocMarker "04_TENANT_PROVISIONING_SOP.md" "No-start rule"
Test-DocMarker "05_RESELLER_SUPPORT_BOUNDARY.md" "unlimited development"
Test-DocMarker "06_RESALE_CONTRACT_POINTS.md" "unlimited resale rights"
Test-DocMarker "07_SCALE_RISK_REGISTER.md" "Scaling without governance"
Test-DocMarker "08_RESALE_READINESS_CHECKLIST.md" "Ready condition"

# Required scripts
$RequiredTools = @(
    "run_phase56_create_resale_scale_delivery_pack.ps1",
    "run_phase56_final_resale_scale_readiness_gate.ps1"
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
    $FinalStatus = "PHASE56_FINAL_RESALE_SCALE_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE56_FINAL_RESALE_SCALE_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE56_FINAL_RESALE_SCALE_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 56 Final Resale and Scale Readiness Gate"
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