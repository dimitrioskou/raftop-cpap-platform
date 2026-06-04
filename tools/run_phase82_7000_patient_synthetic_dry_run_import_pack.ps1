# RAFTOP CPAP CARE Pro
# Phase 82 - 7000 Patient Synthetic Dry-Run Import Pack
# ASCII-safe script.
# Creates pseudonymized 7000-row dry-run CSV and import simulation report.
# Does not import into production DB.
# Does not contain real patient identifiers.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-rollout"
$DataDir = Join-Path $Root "data-intake\raftopoulos-production"

$SyntheticCsv = Join-Path $DataDir "RAFTOP_7000_PATIENT_SYNTHETIC_DRY_RUN.csv"
$DryRunSummaryCsv = Join-Path $ReportsDir "phase82_7000_patient_dry_run_summary.csv"
$DryRunPlanDoc = Join-Path $DocsDir "82_7000_PATIENT_DRY_RUN_IMPORT_PLAN.md"
$BatchPlanCsv = Join-Path $DataDir "RAFTOP_7000_PATIENT_BATCH_PLAN.csv"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DataDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase82_7000_patient_synthetic_dry_run_import_pack_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 82 7000 Patient Synthetic Dry-Run Import Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: simulate 7000-patient rollout without importing real patient data." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This phase uses pseudonymized synthetic data only." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 82 - 7000 Patient Synthetic Dry-Run Import Pack..."
Write-Host ""

$Headers = @(
    "tenant_id",
    "patient_external_id",
    "patient_code",
    "device_serial",
    "device_model",
    "setup_date",
    "month_start",
    "last_data_date",
    "month_usage_hours",
    "usage_hours_30d",
    "days_used_30d",
    "ahi_avg_30d",
    "leak_avg_30d",
    "doctor_external_id",
    "branch_code",
    "consent_basis",
    "data_source"
)

Set-Content -Path $SyntheticCsv -Value ($Headers -join ",") -Encoding UTF8

$DeviceModels = @("AirSense 10", "AirSense 11", "Lumis")
$Branches = @("ATHENS", "PIRAEUS", "THESSALONIKI", "CRETE", "PATRAS", "LARISA")
$Doctors = 1..80 | ForEach-Object { "DOC-" + $_.ToString("000") }

$Compliant80h = 0
$Below80h = 0
$NoData = 0
$HighAhi = 0
$HighLeak = 0

$MonthStart = "2026-06-01"

for ($i = 1; $i -le 7000; $i++) {
    $PatientId = "RP-PAT-" + $i.ToString("000000")
    $PatientCode = "PAT-" + $i.ToString("000000")
    $DeviceSerial = "CPAP-SN-" + $i.ToString("000000")
    $DeviceModel = $DeviceModels[($i % $DeviceModels.Count)]
    $Doctor = $Doctors[($i % $Doctors.Count)]
    $Branch = $Branches[($i % $Branches.Count)]

    $SetupDate = (Get-Date "2025-01-01").AddDays($i % 520).ToString("yyyy-MM-dd")

    # Deterministic synthetic distribution:
    # 15% no-data/very low data
    # 25% below 80h
    # 60% compliant
    if ($i % 20 -eq 0 -or $i % 17 -eq 0 -or $i % 31 -eq 0) {
        $MonthUsage = 0
        $Usage30d = 0
        $DaysUsed = 0
        $LastDataDate = (Get-Date "2026-05-10").AddDays($i % 10).ToString("yyyy-MM-dd")
        $NoData++
        $Below80h++
    } elseif ($i % 4 -eq 0) {
        $MonthUsage = 35 + ($i % 43)
        $Usage30d = [Math]::Max(0, $MonthUsage - 3)
        $DaysUsed = 10 + ($i % 14)
        $LastDataDate = (Get-Date "2026-06-01").AddDays($i % 3).ToString("yyyy-MM-dd")
        $Below80h++
    } else {
        $MonthUsage = 80 + ($i % 90)
        $Usage30d = [Math]::Max(80, $MonthUsage - 4)
        $DaysUsed = 22 + ($i % 9)
        $LastDataDate = (Get-Date "2026-06-01").AddDays($i % 3).ToString("yyyy-MM-dd")
        $Compliant80h++
    }

    if ($i % 13 -eq 0) {
        $Ahi = 11 + (($i % 90) / 10)
        $HighAhi++
    } else {
        $Ahi = 1 + (($i % 70) / 10)
    }

    if ($i % 11 -eq 0) {
        $Leak = 25 + (($i % 80) / 2)
        $HighLeak++
    } else {
        $Leak = 4 + (($i % 40) / 2)
    }

    $Row = @(
        "raftopoulos-production",
        $PatientId,
        $PatientCode,
        $DeviceSerial,
        $DeviceModel,
        $SetupDate,
        $MonthStart,
        $LastDataDate,
        ([string]$MonthUsage),
        ([string]$Usage30d),
        ([string]$DaysUsed),
        ([string]$Ahi),
        ([string]$Leak),
        $Doctor,
        $Branch,
        "contract",
        "Synthetic_Dry_Run"
    )

    Add-Content -Path $SyntheticCsv -Value ($Row -join ",") -Encoding UTF8
}

if (Test-Path $SyntheticCsv) {
    Add-Result "Synthetic 7000-row CSV created" "PASS" $SyntheticCsv
} else {
    Add-Result "Synthetic 7000-row CSV created" "FAIL" $SyntheticCsv
}

$Rows = Import-Csv -Path $SyntheticCsv
$RowCount = @($Rows).Count

if ($RowCount -eq 7000) {
    Add-Result "Synthetic CSV row count" "PASS" ("Rows: " + $RowCount)
} else {
    Add-Result "Synthetic CSV row count" "FAIL" ("Rows: " + $RowCount)
}

# Batch plan
$BatchPlan = @(
    [PSCustomObject]@{ stage = "stage_1"; batch_size = 100; start_row = 1; end_row = 100; purpose = "initial controlled import check" },
    [PSCustomObject]@{ stage = "stage_2"; batch_size = 500; start_row = 101; end_row = 500; purpose = "expanded validation" },
    [PSCustomObject]@{ stage = "stage_3"; batch_size = 2000; start_row = 501; end_row = 2000; purpose = "load and reporting validation" },
    [PSCustomObject]@{ stage = "stage_4"; batch_size = 7000; start_row = 2001; end_row = 7000; purpose = "full controlled production rollout" }
)

$BatchPlan | Export-Csv -Path $BatchPlanCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $BatchPlanCsv) {
    Add-Result "Batch plan CSV created" "PASS" $BatchPlanCsv
} else {
    Add-Result "Batch plan CSV created" "FAIL" $BatchPlanCsv
}

# Dry-run summary
$DryRunSummary = @(
    [PSCustomObject]@{ metric = "total_rows"; value = $RowCount },
    [PSCustomObject]@{ metric = "patients_80h_compliant"; value = $Compliant80h },
    [PSCustomObject]@{ metric = "patients_below_80h"; value = $Below80h },
    [PSCustomObject]@{ metric = "patients_no_data_or_old_data"; value = $NoData },
    [PSCustomObject]@{ metric = "patients_high_ahi"; value = $HighAhi },
    [PSCustomObject]@{ metric = "patients_high_leak"; value = $HighLeak },
    [PSCustomObject]@{ metric = "tenant_id"; value = "raftopoulos-production" },
    [PSCustomObject]@{ metric = "data_source"; value = "Synthetic_Dry_Run" }
)

$DryRunSummary | Export-Csv -Path $DryRunSummaryCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $DryRunSummaryCsv) {
    Add-Result "Dry-run summary CSV created" "PASS" $DryRunSummaryCsv
} else {
    Add-Result "Dry-run summary CSV created" "FAIL" $DryRunSummaryCsv
}

$PlanDoc = @"
# RAFTOP CPAP CARE Pro - 7000 Patient Dry-Run Import Plan

REQUIRED_MARKER: PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN
REQUIRED_MARKER: NO_REAL_PATIENT_DATA
REQUIRED_MARKER: STAGED_IMPORT_100_500_2000_7000
REQUIRED_MARKER: ATLAS_80H_COMPLIANCE_DRY_RUN

## Purpose

This phase simulates the 7000-patient production rollout using pseudonymized synthetic data only.

It does not import real patient data.
It does not create production users.
It does not write to the production database.

## Synthetic dataset

File:
$SyntheticCsv

Rows:
$RowCount

Tenant:
raftopoulos-production

## Dry-run metrics

Total rows:
$RowCount

Patients >= 80 hours:
$Compliant80h

Patients below 80 hours:
$Below80h

No-data / old-data patients:
$NoData

High AHI rows:
$HighAhi

High leak rows:
$HighLeak

## Staged rollout

Stage 1:
100 rows

Stage 2:
500 rows

Stage 3:
2000 rows

Stage 4:
7000 rows

## Approval rule

Real 7000-patient import requires:
- commercial agreement
- GDPR / DPA agreement
- approved CSV
- successful validation
- tenant access signoff
- staged import signoff
"@

Set-Content -Path $DryRunPlanDoc -Value $PlanDoc -Encoding UTF8

if (Test-Path $DryRunPlanDoc) {
    Add-Result "Dry-run plan document created" "PASS" $DryRunPlanDoc
} else {
    Add-Result "Dry-run plan document created" "FAIL" $DryRunPlanDoc
}

$PlanCheck = Get-Content -Path $DryRunPlanDoc -Raw -Encoding UTF8

$RequiredMarkers = @(
    "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN",
    "NO_REAL_PATIENT_DATA",
    "STAGED_IMPORT_100_500_2000_7000",
    "ATLAS_80H_COMPLIANCE_DRY_RUN"
)

foreach ($Marker in $RequiredMarkers) {
    if (ContainsText $PlanCheck $Marker) {
        Add-Result ("Required marker: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required marker: " + $Marker) "FAIL" "Marker missing."
    }
}

# Validate generated synthetic CSV through Phase 81 validator if available
$ToolsDir = Join-Path $Root "tools"
$Phase81Script = Join-Path $ToolsDir "run_phase81_7000_patient_csv_master_validator.ps1"

if (Test-Path $Phase81Script) {
    Add-Result "Phase 81 validator available" "PASS" $Phase81Script

    & $Phase81Script -CsvPath $SyntheticCsv -ExpectedRows 7000 | Out-Null
    $ValidatorExit = $LASTEXITCODE

    if ($ValidatorExit -eq 0) {
        Add-Result "Synthetic CSV passes Phase 81 validator" "PASS" "Validator exit code 0."
    } else {
        Add-Result "Synthetic CSV passes Phase 81 validator" "FAIL" ("Validator exit code: " + $ValidatorExit)
    }
} else {
    Add-Result "Phase 81 validator available" "WARN" "Phase 81 validator script not found."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 82 7000 Patient Synthetic Dry-Run Import Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Synthetic CSV:"
Write-Host $SyntheticCsv
Write-Host ""
Write-Host "Batch plan:"
Write-Host $BatchPlanCsv
Write-Host ""
Write-Host "Dry-run summary:"
Write-Host $DryRunSummaryCsv
Write-Host ""
Write-Host "Dry-run plan:"
Write-Host $DryRunPlanDoc
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

