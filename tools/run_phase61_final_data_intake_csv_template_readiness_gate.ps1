# RAFTOP CPAP CARE Pro
# Phase 61.1 - Final Data Intake and CSV Template Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsDir "client-start-pack"
$DataDir = Join-Path $ClientDir "data-intake-csv-template"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase61_final_data_intake_csv_template_readiness_gate_" + $Timestamp + ".md")

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

    $Path = Join-Path $DataDir $DocName
    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "FAIL" "Marker missing."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 61 Final Data Intake and CSV Template Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 61.1 Final Data Intake and CSV Template Readiness Gate..."
Write-Host ""

# Previous readiness gates
Check-ReportStatus "Phase 61 data intake and CSV template pack" "phase61_data_intake_csv_template_pack_*.md" @(
    "PHASE61_DATA_INTAKE_CSV_TEMPLATE_PACK_READY"
)

Check-ReportStatus "Phase 60 final production access and tenant activation readiness" "phase60_final_production_access_tenant_activation_readiness_gate_*.md" @(
    "PHASE60_FINAL_PRODUCTION_ACCESS_TENANT_ACTIVATION_READINESS_READY"
)

Check-ReportStatus "Phase 59 final client start pack readiness" "phase59_final_client_start_pack_readiness_gate_*.md" @(
    "PHASE59_FINAL_CLIENT_START_PACK_READINESS_READY"
)

# Data intake docs
$DataDocs = @(
    "01_DATA_INTAKE_REQUIREMENTS.md",
    "02_RAFTOP_CPAP_DATA_TEMPLATE.csv",
    "03_DATA_FIELD_DICTIONARY.md",
    "04_SAMPLE_DATA_ROWS.csv",
    "05_DATA_VALIDATION_CHECKLIST.md",
    "06_DATA_PRIVACY_AND_IDENTIFIER_RULES.md",
    "07_IMPORT_PREVIEW_AND_APPROVAL.md",
    "08_DATA_INTAKE_PACK_INDEX.md"
)

foreach ($Doc in $DataDocs) {
    Test-PathExists ("Data intake doc exists: " + $Doc) (Join-Path $DataDir $Doc)
}

# Marker checks
Test-DocMarker "01_DATA_INTAKE_REQUIREMENTS.md" "CSV UTF-8"
Test-DocMarker "01_DATA_INTAKE_REQUIREMENTS.md" "patient_reference_code"
Test-DocMarker "01_DATA_INTAKE_REQUIREMENTS.md" "do not import before preview and approval"

Test-DocMarker "02_RAFTOP_CPAP_DATA_TEMPLATE.csv" "patient_reference_code"
Test-DocMarker "02_RAFTOP_CPAP_DATA_TEMPLATE.csv" "usage_hours"
Test-DocMarker "02_RAFTOP_CPAP_DATA_TEMPLATE.csv" "assigned_owner"

Test-DocMarker "03_DATA_FIELD_DICTIONARY.md" "YYYY-MM-DD"
Test-DocMarker "03_DATA_FIELD_DICTIONARY.md" "no_data_status"
Test-DocMarker "03_DATA_FIELD_DICTIONARY.md" "does not replace physician judgment"

Test-DocMarker "04_SAMPLE_DATA_ROWS.csv" "P-0001"
Test-DocMarker "04_SAMPLE_DATA_ROWS.csv" "compliance_risk"
Test-DocMarker "04_SAMPLE_DATA_ROWS.csv" "no_data_case"

Test-DocMarker "05_DATA_VALIDATION_CHECKLIST.md" "Approval rule"
Test-DocMarker "05_DATA_VALIDATION_CHECKLIST.md" "no_data_status"
Test-DocMarker "05_DATA_VALIDATION_CHECKLIST.md" "patient names removed or approved"

Test-DocMarker "06_DATA_PRIVACY_AND_IDENTIFIER_RULES.md" "Minimum data principle"
Test-DocMarker "06_DATA_PRIVACY_AND_IDENTIFIER_RULES.md" "Real patient data"
Test-DocMarker "06_DATA_PRIVACY_AND_IDENTIFIER_RULES.md" "not a diagnostic medical device"

Test-DocMarker "07_IMPORT_PREVIEW_AND_APPROVAL.md" "Preview first"
Test-DocMarker "07_IMPORT_PREVIEW_AND_APPROVAL.md" "Reject file"
Test-DocMarker "07_IMPORT_PREVIEW_AND_APPROVAL.md" "approved by"

Test-DocMarker "08_DATA_INTAKE_PACK_INDEX.md" "First file to use"
Test-DocMarker "08_DATA_INTAKE_PACK_INDEX.md" "client-facing"
Test-DocMarker "08_DATA_INTAKE_PACK_INDEX.md" "02_RAFTOP_CPAP_DATA_TEMPLATE.csv"

# Required scripts
$RequiredTools = @(
    "run_phase61_create_data_intake_csv_template_pack.ps1",
    "run_phase61_final_data_intake_csv_template_readiness_gate.ps1"
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
    $FinalStatus = "PHASE61_FINAL_DATA_INTAKE_CSV_TEMPLATE_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE61_FINAL_DATA_INTAKE_CSV_TEMPLATE_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE61_FINAL_DATA_INTAKE_CSV_TEMPLATE_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 61 Final Data Intake and CSV Template Readiness Gate"
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