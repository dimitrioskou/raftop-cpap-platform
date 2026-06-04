# RAFTOP CPAP CARE Pro
# Phase 83 - Production Import Staging Gate
# ASCII-safe script.
# Creates and validates staged production import controls for 100 / 500 / 2000 / 7000 rows.
# Does not import real patient data.
# Does not write to production database.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-rollout"
$DataDir = Join-Path $Root "data-intake\raftopoulos-production"
$ToolsDir = Join-Path $Root "tools"

$StageGateDoc = Join-Path $DocsDir "83_PRODUCTION_IMPORT_STAGING_GATE.md"
$StageChecklistCsv = Join-Path $DocsDir "83_STAGE_ACCEPTANCE_CHECKLIST.csv"
$BatchExecutionCsv = Join-Path $DataDir "83_IMPORT_BATCH_EXECUTION_PLAN.csv"
$RollbackRulesDoc = Join-Path $DocsDir "83_IMPORT_ROLLBACK_AND_STOP_RULES.md"

$Phase81Script = Join-Path $ToolsDir "run_phase81_7000_patient_csv_master_validator.ps1"
$Phase82Script = Join-Path $ToolsDir "run_phase82_7000_patient_synthetic_dry_run_import_pack.ps1"

$SyntheticCsv = Join-Path $DataDir "RAFTOP_7000_PATIENT_SYNTHETIC_DRY_RUN.csv"
$BatchPlanCsv = Join-Path $DataDir "RAFTOP_7000_PATIENT_BATCH_PLAN.csv"
$TemplateCsv = Join-Path $DataDir "RAFTOP_7000_PATIENT_MASTER_TEMPLATE.csv"
$SampleCsv = Join-Path $DataDir "RAFTOP_7000_PATIENT_MASTER_SAMPLE_10_ROWS.csv"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DataDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase83_production_import_staging_gate_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    Add-Content -Path $ReportPath -Value ("CHECK: " + $Name) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("STATUS: " + $Status) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("DETAILS: " + $Details) -Encoding UTF8
    Add-Content -Path $ReportPath -Value "" -Encoding UTF8

    Write-Host ($Status + " - " + $Name)
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try {
            return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop
        } catch {
            return ""
        }
    }

    return ""
}

function Test-PathExists {
    param([string]$Name, [string]$Path)

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
    }
}

function Test-Marker {
    param([string]$Name, [string]$Path, [string]$Marker)

    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ($Name + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ($Name + ": " + $Marker) "FAIL" "Marker missing."
    }
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 83 Production Import Staging Gate" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: enforce staged import controls before any 7000-patient production import." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This phase does not import real patient data." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 83 - Production Import Staging Gate..."
Write-Host ""

$StageGateContent = @'
# RAFTOP CPAP CARE Pro - Production Import Staging Gate

REQUIRED_MARKER: PHASE83_PRODUCTION_IMPORT_STAGING_GATE
REQUIRED_MARKER: STAGE_100_500_2000_7000
REQUIRED_MARKER: NO_DIRECT_7000_IMPORT
REQUIRED_MARKER: BUYER_SIGNOFF_REQUIRED
REQUIRED_MARKER: STOP_RULES_REQUIRED

## Purpose

This document controls the staged rollout for the Raftopoulos 7000-patient CPAP production import.

The system must not import all 7000 records directly without stage validation.

## Required stages

Stage 1:
100 rows

Stage 2:
500 rows

Stage 3:
2000 rows

Stage 4:
7000 rows

## Stage checks

Each stage must confirm:
- CSV validation passed
- tenant_id is raftopoulos-production
- no direct identifiers are present
- patients are created correctly
- devices are linked correctly
- ATLAS priorities calculate correctly
- 80 Hours Compliance counts are correct
- no-data cases are visible
- reports load correctly
- operations users can view assigned data
- no cross-tenant leakage exists

## Approval rule

Each stage requires signoff before proceeding to the next stage.

## Hard stop

If any stage fails, the next stage is blocked.
'@

Set-Content -Path $StageGateDoc -Value $StageGateContent -Encoding UTF8

$StageChecklist = @(
    "stage,batch_size,csv_validated,tenant_verified,no_direct_identifiers,patients_verified,devices_verified,atlas_verified,80h_verified,reports_verified,access_verified,signoff_required,status",
    "stage_1,100,no,no,no,no,no,no,no,no,no,yes,pending",
    "stage_2,500,no,no,no,no,no,no,no,no,no,yes,pending",
    "stage_3,2000,no,no,no,no,no,no,no,no,no,yes,pending",
    "stage_4,7000,no,no,no,no,no,no,no,no,no,yes,pending"
)

Set-Content -Path $StageChecklistCsv -Value $StageChecklist -Encoding UTF8

$BatchExecution = @(
    "stage,batch_size,start_row,end_row,execution_mode,allowed_after,required_gate",
    "stage_1,100,1,100,dry_run_or_controlled_import,phase81_validation,stage_1_signoff",
    "stage_2,500,101,500,controlled_import,stage_1_signoff,stage_2_signoff",
    "stage_3,2000,501,2000,controlled_import,stage_2_signoff,stage_3_signoff",
    "stage_4,7000,2001,7000,controlled_import,stage_3_signoff,stage_4_signoff"
)

Set-Content -Path $BatchExecutionCsv -Value $BatchExecution -Encoding UTF8

$RollbackDoc = @'
# RAFTOP CPAP CARE Pro - Import Rollback and Stop Rules

REQUIRED_MARKER: PHASE83_IMPORT_ROLLBACK_STOP_RULES
REQUIRED_MARKER: HARD_STOP_ON_VALIDATION_FAIL
REQUIRED_MARKER: NO_NEXT_STAGE_WITHOUT_SIGNOFF
REQUIRED_MARKER: NO_REAL_PATIENT_DATA_WITHOUT_DPA

## Hard stop rules

Stop the import if:
- CSV validation fails
- tenant_id is wrong
- direct identifiers are present
- duplicate patient_external_id exists
- device_serial is missing
- consent_basis is missing
- ATLAS calculation fails
- 80 Hours Compliance calculation fails
- reports do not load
- user access is incorrect
- data appears outside the Raftopoulos tenant

## Rollback principle

Each stage must be reversible or isolated before proceeding.

## No next stage

No next stage is allowed without written signoff.

## Real patient data

Real patient data requires:
- commercial agreement
- GDPR / DPA agreement
- named access approval
- production tenant confirmation
- data processing responsibility confirmation
'@

Set-Content -Path $RollbackRulesDoc -Value $RollbackDoc -Encoding UTF8

# Verify previous phases
Check-ReportStatus "Phase 79 preflight latest status" "phase79_7000_patient_production_rollout_preflight_gate_*.md" @(
    "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_READY",
    "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 80 tenant roles access latest status" "phase80_production_tenant_roles_access_pack_*.md" @(
    "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_READY",
    "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 81 CSV validator latest status" "phase81_7000_patient_csv_master_validator_*.md" @(
    "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_READY",
    "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 82 synthetic dry-run latest status" "phase82_7000_patient_synthetic_dry_run_import_pack_*.md" @(
    "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_READY",
    "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_READY_WITH_WARNINGS"
)

# Verify files
Test-PathExists "Phase 81 validator script exists" $Phase81Script
Test-PathExists "Phase 82 dry-run script exists" $Phase82Script
Test-PathExists "CSV template exists" $TemplateCsv
Test-PathExists "Sample CSV exists" $SampleCsv
Test-PathExists "Synthetic 7000 CSV exists" $SyntheticCsv
Test-PathExists "Batch plan CSV exists" $BatchPlanCsv

Test-PathExists "Stage gate doc exists" $StageGateDoc
Test-PathExists "Stage checklist CSV exists" $StageChecklistCsv
Test-PathExists "Batch execution CSV exists" $BatchExecutionCsv
Test-PathExists "Rollback rules doc exists" $RollbackRulesDoc

# Verify markers
Test-Marker "Stage gate marker" $StageGateDoc "PHASE83_PRODUCTION_IMPORT_STAGING_GATE"
Test-Marker "Stage gate marker" $StageGateDoc "STAGE_100_500_2000_7000"
Test-Marker "Stage gate marker" $StageGateDoc "NO_DIRECT_7000_IMPORT"
Test-Marker "Stage gate marker" $StageGateDoc "BUYER_SIGNOFF_REQUIRED"

Test-Marker "Rollback marker" $RollbackRulesDoc "PHASE83_IMPORT_ROLLBACK_STOP_RULES"
Test-Marker "Rollback marker" $RollbackRulesDoc "HARD_STOP_ON_VALIDATION_FAIL"
Test-Marker "Rollback marker" $RollbackRulesDoc "NO_NEXT_STAGE_WITHOUT_SIGNOFF"
Test-Marker "Rollback marker" $RollbackRulesDoc "NO_REAL_PATIENT_DATA_WITHOUT_DPA"

# Validate synthetic row count
if (Test-Path $SyntheticCsv) {
    try {
        $Rows = Import-Csv -Path $SyntheticCsv
        $RowCount = @($Rows).Count

        if ($RowCount -eq 7000) {
            Add-Result "Synthetic CSV has 7000 rows" "PASS" ("Rows: " + $RowCount)
        } else {
            Add-Result "Synthetic CSV has 7000 rows" "FAIL" ("Rows: " + $RowCount)
        }
    } catch {
        Add-Result "Synthetic CSV readable" "FAIL" ("Could not read CSV: " + $_.Exception.Message)
    }
}

# Validate batch execution rows
if (Test-Path $BatchExecutionCsv) {
    $BatchContent = Read-FileSafe $BatchExecutionCsv

    foreach ($Stage in @("stage_1", "stage_2", "stage_3", "stage_4")) {
        if (ContainsText $BatchContent $Stage) {
            Add-Result ("Batch execution contains: " + $Stage) "PASS" "Stage found."
        } else {
            Add-Result ("Batch execution contains: " + $Stage) "FAIL" "Stage missing."
        }
    }

    foreach ($Size in @("100", "500", "2000", "7000")) {
        if (ContainsText $BatchContent $Size) {
            Add-Result ("Batch execution contains size: " + $Size) "PASS" "Batch size found."
        } else {
            Add-Result ("Batch execution contains size: " + $Size) "FAIL" "Batch size missing."
        }
    }
}

# Forbidden operational mistakes in docs
$ForbiddenText = @(
    "direct 7000 import allowed",
    "skip signoff",
    "ignore validation",
    "real patient data allowed before DPA",
    "source code handover"
)

foreach ($Text in $ForbiddenText) {
    $StageDocContent = Read-FileSafe $StageGateDoc
    $RollbackContent = Read-FileSafe $RollbackRulesDoc

    if (ContainsText $StageDocContent $Text) {
        Add-Result ("Stage gate forbidden text absent: " + $Text) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Stage gate forbidden text absent: " + $Text) "PASS" "Forbidden text absent."
    }

    if (ContainsText $RollbackContent $Text) {
        Add-Result ("Rollback forbidden text absent: " + $Text) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Rollback forbidden text absent: " + $Text) "PASS" "Forbidden text absent."
    }
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 83 Production Import Staging Gate"
Write-Host "============================================================"
Write-Host ""
Write-Host "Stage gate doc:"
Write-Host $StageGateDoc
Write-Host ""
Write-Host "Stage checklist:"
Write-Host $StageChecklistCsv
Write-Host ""
Write-Host "Batch execution:"
Write-Host $BatchExecutionCsv
Write-Host ""
Write-Host "Rollback rules:"
Write-Host $RollbackRulesDoc
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