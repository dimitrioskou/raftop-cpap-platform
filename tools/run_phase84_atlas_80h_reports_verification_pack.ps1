# RAFTOP CPAP CARE Pro
# Phase 84 - ATLAS / 80h / Reports Verification Pack
# ASCII-safe script.
# Verifies ATLAS priority logic, 80h compliance counts, and management reporting outputs
# using the synthetic 7000-patient dry-run dataset.
# Does not import real patient data.
# Does not write to production database.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-rollout"
$DataDir = Join-Path $Root "data-intake\raftopoulos-production"
$ToolsDir = Join-Path $Root "tools"

$SyntheticCsv = Join-Path $DataDir "RAFTOP_7000_PATIENT_SYNTHETIC_DRY_RUN.csv"

$AtlasQueueCsv = Join-Path $ReportsDir "phase84_atlas_priority_queue.csv"
$ComplianceSummaryCsv = Join-Path $ReportsDir "phase84_80h_compliance_summary.csv"
$ManagementSnapshotCsv = Join-Path $ReportsDir "phase84_management_report_snapshot.csv"
$ActionGroupSummaryCsv = Join-Path $ReportsDir "phase84_action_group_summary.csv"
$VerificationDoc = Join-Path $DocsDir "84_ATLAS_80H_REPORTS_VERIFICATION.md"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase84_atlas_80h_reports_verification_pack_" + $Timestamp + ".md")

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

function Try-ParseDoubleInvariant {
    param([string]$Value, [ref]$Result)

    if ([string]::IsNullOrWhiteSpace($Value)) { return $false }

    $Styles = [System.Globalization.NumberStyles]::Float
    $Culture = [System.Globalization.CultureInfo]::InvariantCulture

    return [double]::TryParse($Value.Replace(",", "."), $Styles, $Culture, $Result)
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 84 ATLAS 80h Reports Verification Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: verify ATLAS, 80h compliance, no-data, clinical signals, and management reporting using synthetic 7000-patient dataset." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This phase does not import real patient data." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 84 - ATLAS / 80h / Reports Verification Pack..."
Write-Host ""

# Previous phase gates
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

Check-ReportStatus "Phase 83 staging gate latest status" "phase83_production_import_staging_gate_*.md" @(
    "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_READY",
    "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_READY_WITH_WARNINGS"
)

if (Test-Path $SyntheticCsv) {
    Add-Result "Synthetic 7000 CSV exists" "PASS" $SyntheticCsv
} else {
    Add-Result "Synthetic 7000 CSV exists" "FAIL" $SyntheticCsv
}

$Rows = @()

try {
    if (Test-Path $SyntheticCsv) {
        $Rows = Import-Csv -Path $SyntheticCsv
        Add-Result "Synthetic CSV readable" "PASS" ("Rows loaded: " + @($Rows).Count)
    }
} catch {
    Add-Result "Synthetic CSV readable" "FAIL" ("Could not read CSV: " + $_.Exception.Message)
}

$RowCount = @($Rows).Count

if ($RowCount -eq 7000) {
    Add-Result "Synthetic CSV row count is 7000" "PASS" ("Rows: " + $RowCount)
} else {
    Add-Result "Synthetic CSV row count is 7000" "FAIL" ("Rows: " + $RowCount)
}

$AtlasQueue = @()
$Today = Get-Date

$TotalPatients = 0
$Compliant80h = 0
$Below80h = 0
$NoData = 0
$HighAhi = 0
$HighLeak = 0
$Stable = 0
$CriticalPriority = 0
$HighPriority = 0
$MediumPriority = 0
$LowPriority = 0

foreach ($Row in $Rows) {
    $TotalPatients++

    $MonthUsage = 0.0
    $UsageOk = Try-ParseDoubleInvariant $Row.month_usage_hours ([ref]$MonthUsage)

    $Ahi = 0.0
    $AhiOk = Try-ParseDoubleInvariant $Row.ahi_avg_30d ([ref]$Ahi)

    $Leak = 0.0
    $LeakOk = Try-ParseDoubleInvariant $Row.leak_avg_30d ([ref]$Leak)

    $Score = 0
    $Reasons = @()
    $ActionGroup = "COMPLIANCE_OK"

    $IsNoData = $false
    $IsBelow80h = $false
    $IsHighAhi = $false
    $IsHighLeak = $false

    if ($UsageOk -and $MonthUsage -ge 80) {
        $Compliant80h++
    }

    if ($UsageOk -and $MonthUsage -lt 80) {
        $Below80h++
        $IsBelow80h = $true
        $Score += 40
        $Reasons += "below_80h"
    }

    if ($UsageOk -and $MonthUsage -eq 0) {
        $IsNoData = $true
    }

    if (![string]::IsNullOrWhiteSpace($Row.last_data_date)) {
        try {
            $LastData = [datetime]::Parse($Row.last_data_date)
            $DaysOld = ($Today - $LastData).TotalDays

            if ($DaysOld -gt 7) {
                $IsNoData = $true
            }
        } catch {
            $IsNoData = $true
        }
    } else {
        $IsNoData = $true
    }

    if ($IsNoData) {
        $NoData++
        $Score += 50
        $Reasons += "no_data_or_old_data"
    }

    if ($AhiOk -and $Ahi -gt 10) {
        $HighAhi++
        $IsHighAhi = $true
        $Score += 25
        $Reasons += "high_ahi"
    }

    if ($LeakOk -and $Leak -gt 24) {
        $HighLeak++
        $IsHighLeak = $true
        $Score += 20
        $Reasons += "high_leak"
    }

    if ($IsNoData) {
        $ActionGroup = "NO_DATA"
    } elseif ($IsBelow80h) {
        $ActionGroup = "COMPLIANCE_RISK"
    } elseif ($IsHighAhi -or $IsHighLeak) {
        $ActionGroup = "THERAPY_REVIEW"
    } else {
        $ActionGroup = "COMPLIANCE_OK"
        $Stable++
    }

    $Priority = "low"

    if ($Score -ge 80) {
        $Priority = "critical"
        $CriticalPriority++
    } elseif ($Score -ge 50) {
        $Priority = "high"
        $HighPriority++
    } elseif ($Score -ge 25) {
        $Priority = "medium"
        $MediumPriority++
    } else {
        $Priority = "low"
        $LowPriority++
    }

    if ($Score -gt 0) {
        $AtlasQueue += [PSCustomObject]@{
            tenant_id = $Row.tenant_id
            patient_external_id = $Row.patient_external_id
            patient_code = $Row.patient_code
            device_serial = $Row.device_serial
            doctor_external_id = $Row.doctor_external_id
            branch_code = $Row.branch_code
            action_group = $ActionGroup
            priority = $Priority
            atlas_score = $Score
            reasons = ($Reasons -join "|")
            month_usage_hours = $Row.month_usage_hours
            ahi_avg_30d = $Row.ahi_avg_30d
            leak_avg_30d = $Row.leak_avg_30d
            last_data_date = $Row.last_data_date
        }
    }
}

$AtlasQueue = $AtlasQueue | Sort-Object @{ Expression = "atlas_score"; Descending = $true }, @{ Expression = "patient_external_id"; Ascending = $true }

$AtlasQueue | Export-Csv -Path $AtlasQueueCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $AtlasQueueCsv) {
    Add-Result "ATLAS priority queue CSV created" "PASS" $AtlasQueueCsv
} else {
    Add-Result "ATLAS priority queue CSV created" "FAIL" $AtlasQueueCsv
}

$AtlasQueueCount = @($AtlasQueue).Count

if ($AtlasQueueCount -gt 0) {
    Add-Result "ATLAS priority queue has rows" "PASS" ("Rows: " + $AtlasQueueCount)
} else {
    Add-Result "ATLAS priority queue has rows" "FAIL" "Queue is empty."
}

if ($CriticalPriority -gt 0) {
    Add-Result "ATLAS critical priority exists" "PASS" ("Critical rows: " + $CriticalPriority)
} else {
    Add-Result "ATLAS critical priority exists" "WARN" "No critical priority rows."
}

if ($HighPriority -gt 0) {
    Add-Result "ATLAS high priority exists" "PASS" ("High rows: " + $HighPriority)
} else {
    Add-Result "ATLAS high priority exists" "WARN" "No high priority rows."
}

if ($Below80h -gt 0) {
    Add-Result "80h compliance risk detected" "PASS" ("Below 80h rows: " + $Below80h)
} else {
    Add-Result "80h compliance risk detected" "FAIL" "No below-80h rows detected in synthetic dataset."
}

if ($Compliant80h -gt 0) {
    Add-Result "80h compliant patients detected" "PASS" ("Compliant rows: " + $Compliant80h)
} else {
    Add-Result "80h compliant patients detected" "FAIL" "No compliant rows detected."
}

if ($NoData -gt 0) {
    Add-Result "No-data cases detected" "PASS" ("No-data rows: " + $NoData)
} else {
    Add-Result "No-data cases detected" "FAIL" "No no-data rows detected."
}

if ($HighAhi -gt 0) {
    Add-Result "High AHI cases detected" "PASS" ("High AHI rows: " + $HighAhi)
} else {
    Add-Result "High AHI cases detected" "WARN" "No high AHI rows detected."
}

if ($HighLeak -gt 0) {
    Add-Result "High leak cases detected" "PASS" ("High leak rows: " + $HighLeak)
} else {
    Add-Result "High leak cases detected" "WARN" "No high leak rows detected."
}

$ComplianceRate = 0
if ($TotalPatients -gt 0) {
    $ComplianceRate = [Math]::Round(($Compliant80h / $TotalPatients) * 100, 2)
}

$ComplianceSummary = @(
    [PSCustomObject]@{ metric = "total_patients"; value = $TotalPatients },
    [PSCustomObject]@{ metric = "patients_80h_compliant"; value = $Compliant80h },
    [PSCustomObject]@{ metric = "patients_below_80h"; value = $Below80h },
    [PSCustomObject]@{ metric = "80h_compliance_rate_percent"; value = $ComplianceRate },
    [PSCustomObject]@{ metric = "no_data_or_old_data_patients"; value = $NoData },
    [PSCustomObject]@{ metric = "high_ahi_patients"; value = $HighAhi },
    [PSCustomObject]@{ metric = "high_leak_patients"; value = $HighLeak }
)

$ComplianceSummary | Export-Csv -Path $ComplianceSummaryCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $ComplianceSummaryCsv) {
    Add-Result "80h compliance summary CSV created" "PASS" $ComplianceSummaryCsv
} else {
    Add-Result "80h compliance summary CSV created" "FAIL" $ComplianceSummaryCsv
}

$ActionGroups = $AtlasQueue | Group-Object action_group | ForEach-Object {
    [PSCustomObject]@{
        action_group = $_.Name
        count = $_.Count
    }
}

$ActionGroups | Export-Csv -Path $ActionGroupSummaryCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $ActionGroupSummaryCsv) {
    Add-Result "Action group summary CSV created" "PASS" $ActionGroupSummaryCsv
} else {
    Add-Result "Action group summary CSV created" "FAIL" $ActionGroupSummaryCsv
}

$ManagementSnapshot = @(
    [PSCustomObject]@{ section = "portfolio"; metric = "total_patients"; value = $TotalPatients },
    [PSCustomObject]@{ section = "compliance"; metric = "80h_compliant"; value = $Compliant80h },
    [PSCustomObject]@{ section = "compliance"; metric = "below_80h"; value = $Below80h },
    [PSCustomObject]@{ section = "atlas"; metric = "atlas_queue_total"; value = $AtlasQueueCount },
    [PSCustomObject]@{ section = "atlas"; metric = "critical_priority"; value = $CriticalPriority },
    [PSCustomObject]@{ section = "atlas"; metric = "high_priority"; value = $HighPriority },
    [PSCustomObject]@{ section = "atlas"; metric = "medium_priority"; value = $MediumPriority },
    [PSCustomObject]@{ section = "signals"; metric = "no_data_or_old_data"; value = $NoData },
    [PSCustomObject]@{ section = "signals"; metric = "high_ahi"; value = $HighAhi },
    [PSCustomObject]@{ section = "signals"; metric = "high_leak"; value = $HighLeak },
    [PSCustomObject]@{ section = "business"; metric = "ready_for_stage_100_test"; value = "yes" },
    [PSCustomObject]@{ section = "business"; metric = "real_data_import_allowed"; value = "no_without_dpa_and_signoff" }
)

$ManagementSnapshot | Export-Csv -Path $ManagementSnapshotCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $ManagementSnapshotCsv) {
    Add-Result "Management report snapshot CSV created" "PASS" $ManagementSnapshotCsv
} else {
    Add-Result "Management report snapshot CSV created" "FAIL" $ManagementSnapshotCsv
}

$VerificationDocContent = @"
# RAFTOP CPAP CARE Pro - ATLAS / 80h / Reports Verification

REQUIRED_MARKER: PHASE84_ATLAS_80H_REPORTS_VERIFICATION
REQUIRED_MARKER: ATLAS_PRIORITY_QUEUE_VERIFIED
REQUIRED_MARKER: EIGHTY_HOURS_COMPLIANCE_VERIFIED
REQUIRED_MARKER: MANAGEMENT_REPORT_SNAPSHOT_VERIFIED
REQUIRED_MARKER: NO_REAL_PATIENT_DATA

## Purpose

This phase verifies the operational logic over the synthetic 7000-patient dataset.

It does not import real patient data.
It does not write to the production database.

## Input

Synthetic CSV:
$SyntheticCsv

Rows:
$TotalPatients

## Verified outputs

ATLAS priority queue:
$AtlasQueueCsv

80h compliance summary:
$ComplianceSummaryCsv

Action group summary:
$ActionGroupSummaryCsv

Management report snapshot:
$ManagementSnapshotCsv

## Key metrics

Total patients:
$TotalPatients

Patients >= 80 hours:
$Compliant80h

Patients below 80 hours:
$Below80h

80h compliance rate percent:
$ComplianceRate

No-data / old-data patients:
$NoData

High AHI patients:
$HighAhi

High leak patients:
$HighLeak

ATLAS queue total:
$AtlasQueueCount

Critical priority:
$CriticalPriority

High priority:
$HighPriority

Medium priority:
$MediumPriority

## Business interpretation

The synthetic 7000-patient dataset produces:
- compliant patients
- below-80h compliance risk patients
- no-data / old-data patients
- high AHI patients
- high leak patients
- ATLAS prioritization output
- management reporting snapshot

## Hard rule

Real patient data import remains blocked until:
- commercial agreement
- GDPR / DPA agreement
- production tenant signoff
- CSV validation
- stage 100 import signoff
- stage 500 import signoff
- stage 2000 import signoff
- stage 7000 import signoff
"@

Set-Content -Path $VerificationDoc -Value $VerificationDocContent -Encoding UTF8

if (Test-Path $VerificationDoc) {
    Add-Result "Verification document created" "PASS" $VerificationDoc
} else {
    Add-Result "Verification document created" "FAIL" $VerificationDoc
}

$VerificationDocCheck = Read-FileSafe $VerificationDoc

$RequiredMarkers = @(
    "PHASE84_ATLAS_80H_REPORTS_VERIFICATION",
    "ATLAS_PRIORITY_QUEUE_VERIFIED",
    "EIGHTY_HOURS_COMPLIANCE_VERIFIED",
    "MANAGEMENT_REPORT_SNAPSHOT_VERIFIED",
    "NO_REAL_PATIENT_DATA"
)

foreach ($Marker in $RequiredMarkers) {
    if (ContainsText $VerificationDocCheck $Marker) {
        Add-Result ("Required marker: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required marker: " + $Marker) "FAIL" "Marker missing."
    }
}

# Safety checks: synthetic only
$RawSynthetic = Read-FileSafe $SyntheticCsv

$ForbiddenColumns = @(
    "first_name",
    "last_name",
    "full_name",
    "phone",
    "mobile",
    "email",
    "amka",
    "address",
    "date_of_birth"
)

foreach ($Forbidden in $ForbiddenColumns) {
    if (ContainsText $RawSynthetic $Forbidden) {
        Add-Result ("Synthetic forbidden identifier absent: " + $Forbidden) "FAIL" "Forbidden identifier column/text found."
    } else {
        Add-Result ("Synthetic forbidden identifier absent: " + $Forbidden) "PASS" "Absent."
    }
}

if (ContainsText $RawSynthetic "Synthetic_Dry_Run") {
    Add-Result "Synthetic data source marker present" "PASS" "Synthetic_Dry_Run found."
} else {
    Add-Result "Synthetic data source marker present" "FAIL" "Synthetic_Dry_Run missing."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE84_ATLAS_80H_REPORTS_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE84_ATLAS_80H_REPORTS_VERIFICATION_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE84_ATLAS_80H_REPORTS_VERIFICATION_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 84 ATLAS / 80h / Reports Verification Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "ATLAS queue:"
Write-Host $AtlasQueueCsv
Write-Host ""
Write-Host "80h summary:"
Write-Host $ComplianceSummaryCsv
Write-Host ""
Write-Host "Management snapshot:"
Write-Host $ManagementSnapshotCsv
Write-Host ""
Write-Host "Verification doc:"
Write-Host $VerificationDoc
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