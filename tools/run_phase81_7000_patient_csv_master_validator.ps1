# RAFTOP CPAP CARE Pro
# Phase 81 - 7000 Patient CSV Master Validator
# ASCII-safe script.
# Creates CSV template + schema docs and validates a 7000-patient rollout CSV.
# Does not import data into production.
# Does not allow direct identifiable patient data in the rollout CSV.

param(
    [string]$CsvPath = "",
    [int]$ExpectedRows = 7000
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$ToolsDir = Join-Path $Root "tools"
$DocsDir = Join-Path $Root "docs\production-rollout"
$DataDir = Join-Path $Root "data-intake\raftopoulos-production"

$TemplatePath = Join-Path $DataDir "RAFTOP_7000_PATIENT_MASTER_TEMPLATE.csv"
$SamplePath = Join-Path $DataDir "RAFTOP_7000_PATIENT_MASTER_SAMPLE_10_ROWS.csv"
$DefaultCsvPath = Join-Path $DataDir "RAFTOP_7000_PATIENT_MASTER_READY_FOR_VALIDATION.csv"
$SchemaDoc = Join-Path $DocsDir "81_7000_PATIENT_CSV_SCHEMA.md"
$ValidationRulesDoc = Join-Path $DocsDir "81_CSV_VALIDATION_RULES.md"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DataDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase81_7000_patient_csv_master_validator_" + $Timestamp + ".md")
$RowIssueCsv = Join-Path $ReportsDir ("phase81_7000_patient_csv_row_issues_" + $Timestamp + ".csv")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0
$script:RowIssues = @()

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

function Add-RowIssue {
    param(
        [int]$RowNumber,
        [string]$Severity,
        [string]$Field,
        [string]$Issue
    )

    $script:RowIssues += [PSCustomObject]@{
        row_number = $RowNumber
        severity = $Severity
        field = $Field
        issue = $Issue
    }
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Try-ParseDoubleInvariant {
    param([string]$Value, [ref]$Result)

    if ([string]::IsNullOrWhiteSpace($Value)) { return $false }

    $Styles = [System.Globalization.NumberStyles]::Float
    $Culture = [System.Globalization.CultureInfo]::InvariantCulture

    return [double]::TryParse($Value.Replace(",", "."), $Styles, $Culture, $Result)
}

function Try-ParseDate {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) { return $false }

    $Parsed = [datetime]::MinValue
    return [datetime]::TryParse($Value, [ref]$Parsed)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 81 7000 Patient CSV Master Validator" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: validate the CSV structure before any 7000-patient rollout import." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This script does not import real patient data." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 81 - 7000 Patient CSV Master Validator..."
Write-Host ""

$RequiredColumns = @(
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

$ForbiddenColumns = @(
    "first_name",
    "last_name",
    "full_name",
    "name",
    "surname",
    "phone",
    "mobile",
    "email",
    "address",
    "amka",
    "adt",
    "id_number",
    "date_of_birth",
    "dob",
    "birth_date"
)

$TemplateHeader = ($RequiredColumns -join ",")

Set-Content -Path $TemplatePath -Value $TemplateHeader -Encoding UTF8

$SampleRows = @(
    "raftopoulos-production,RP-PAT-000001,PAT-000001,CPAP-SN-000001,AirSense 10,2026-01-10,2026-06-01,2026-06-03,92.5,88.0,26,3.1,12.4,DOC-001,ATHENS,contract,AirView_CSV",
    "raftopoulos-production,RP-PAT-000002,PAT-000002,CPAP-SN-000002,AirSense 11,2026-02-12,2026-06-01,2026-06-02,65.0,62.0,20,6.2,18.9,DOC-001,ATHENS,contract,AirView_CSV",
    "raftopoulos-production,RP-PAT-000003,PAT-000003,CPAP-SN-000003,Lumis,2026-03-05,2026-06-01,2026-05-20,0,0,0,0,0,DOC-002,PIRAEUS,contract,AirView_CSV",
    "raftopoulos-production,RP-PAT-000004,PAT-000004,CPAP-SN-000004,AirSense 10,2025-12-18,2026-06-01,2026-06-03,110.2,105.1,29,2.4,8.5,DOC-003,ATHENS,contract,AirView_CSV",
    "raftopoulos-production,RP-PAT-000005,PAT-000005,CPAP-SN-000005,AirSense 11,2026-04-02,2026-06-01,2026-06-01,78.5,74.0,24,4.8,14.2,DOC-003,ATHENS,contract,AirView_CSV",
    "raftopoulos-production,RP-PAT-000006,PAT-000006,CPAP-SN-000006,AirSense 10,2026-01-22,2026-06-01,2026-06-03,154.0,149.0,30,1.9,6.0,DOC-004,THESSALONIKI,contract,AirView_CSV",
    "raftopoulos-production,RP-PAT-000007,PAT-000007,CPAP-SN-000007,AirSense 11,2026-05-01,2026-06-01,2026-06-03,33.0,30.0,11,8.2,22.0,DOC-004,THESSALONIKI,contract,AirView_CSV",
    "raftopoulos-production,RP-PAT-000008,PAT-000008,CPAP-SN-000008,AirSense 10,2026-02-10,2026-06-01,2026-05-28,82.0,80.5,25,3.8,11.7,DOC-005,CRETE,contract,AirView_CSV",
    "raftopoulos-production,RP-PAT-000009,PAT-000009,CPAP-SN-000009,AirSense 11,2026-03-14,2026-06-01,2026-06-03,120.0,116.0,28,2.1,9.2,DOC-005,CRETE,contract,AirView_CSV",
    "raftopoulos-production,RP-PAT-000010,PAT-000010,CPAP-SN-000010,AirSense 10,2025-11-30,2026-06-01,2026-06-03,55.0,52.0,18,7.5,19.3,DOC-006,PATRAS,contract,AirView_CSV"
)

Set-Content -Path $SamplePath -Value $TemplateHeader -Encoding UTF8
Add-Content -Path $SamplePath -Value $SampleRows -Encoding UTF8

$SchemaDocContent = @"
# RAFTOP CPAP CARE Pro - 7000 Patient CSV Schema

REQUIRED_MARKER: PHASE81_7000_PATIENT_CSV_SCHEMA
REQUIRED_MARKER: NO_DIRECT_IDENTIFIABLE_PATIENT_FIELDS
REQUIRED_MARKER: EIGHTY_HOURS_COMPLIANCE_INPUT
REQUIRED_MARKER: ATLAS_INPUT_READY

Required columns:

$($RequiredColumns -join "`n")

Forbidden direct identifiable columns:

$($ForbiddenColumns -join "`n")

Rules:
- tenant_id must be raftopoulos-production
- patient_external_id must be unique
- patient_code must be pseudonymized
- device_serial must not be empty
- month_usage_hours must be numeric
- usage_hours_30d must be numeric
- days_used_30d must be 0 to 31
- ahi_avg_30d must be numeric
- leak_avg_30d must be numeric
- consent_basis must not be empty
- no real patient names, phones, AMKA, addresses, or emails are allowed in this master CSV

80 Hours Compliance:
- month_usage_hours >= 80 means compliant for the month
- month_usage_hours < 80 means compliance risk
- no data / old data requires ATLAS follow-up
"@

Set-Content -Path $SchemaDoc -Value $SchemaDocContent -Encoding UTF8

$ValidationRulesContent = @'
# RAFTOP CPAP CARE Pro - CSV Validation Rules

REQUIRED_MARKER: PHASE81_CSV_VALIDATION_RULES
REQUIRED_MARKER: CONTROLLED_7000_IMPORT_ONLY
REQUIRED_MARKER: STAGED_IMPORT_100_500_2000_7000

Import stages:
1. Validate file structure
2. Validate 100 rows
3. Validate 500 rows
4. Validate 2000 rows
5. Validate 7000 rows
6. Import only after signoff

Hard blockers:
- missing required columns
- forbidden direct patient identifiers
- duplicate patient_external_id
- invalid tenant_id
- invalid numeric fields
- empty consent_basis
- empty device_serial

Warnings:
- row count below expected number
- duplicate device serials
- no-data patients
- old last_data_date
- high leak
- high AHI
- usage below 80 hours
'@

Set-Content -Path $ValidationRulesDoc -Value $ValidationRulesContent -Encoding UTF8

if (Test-Path $TemplatePath) { Add-Result "CSV template created" "PASS" $TemplatePath } else { Add-Result "CSV template created" "FAIL" $TemplatePath }
if (Test-Path $SamplePath) { Add-Result "Sample CSV created" "PASS" $SamplePath } else { Add-Result "Sample CSV created" "FAIL" $SamplePath }
if (Test-Path $SchemaDoc) { Add-Result "CSV schema doc created" "PASS" $SchemaDoc } else { Add-Result "CSV schema doc created" "FAIL" $SchemaDoc }
if (Test-Path $ValidationRulesDoc) { Add-Result "CSV validation rules doc created" "PASS" $ValidationRulesDoc } else { Add-Result "CSV validation rules doc created" "FAIL" $ValidationRulesDoc }

if ([string]::IsNullOrWhiteSpace($CsvPath)) {
    $CsvPath = $DefaultCsvPath
}

if (!(Test-Path $CsvPath)) {
    Add-Result "7000-patient CSV provided" "WARN" ("CSV not found yet: " + $CsvPath)
    Add-Result "Validator ready for CSV" "PASS" "Place the CSV at the expected path or pass -CsvPath."
} else {
    Add-Result "7000-patient CSV provided" "PASS" $CsvPath

    try {
        $Rows = Import-Csv -Path $CsvPath
        $RowCount = @($Rows).Count

        Add-Result "CSV readable" "PASS" ("Rows loaded: " + $RowCount)

        if ($RowCount -eq $ExpectedRows) {
            Add-Result "CSV row count equals expected" "PASS" ("Rows: " + $RowCount)
        } elseif ($RowCount -gt 0 -and $RowCount -lt $ExpectedRows) {
            Add-Result "CSV row count equals expected" "WARN" ("Rows: " + $RowCount + " / expected: " + $ExpectedRows)
        } else {
            Add-Result "CSV row count equals expected" "FAIL" ("Rows: " + $RowCount + " / expected: " + $ExpectedRows)
        }

        $Headers = @()
        if ($RowCount -gt 0) {
            $Headers = $Rows[0].PSObject.Properties.Name
        } else {
            $RawHeader = Get-Content $CsvPath -First 1
            $Headers = $RawHeader.Split(",")
        }

        foreach ($Column in $RequiredColumns) {
            if ($Headers -contains $Column) {
                Add-Result ("Required column exists: " + $Column) "PASS" "Column found."
            } else {
                Add-Result ("Required column exists: " + $Column) "FAIL" "Column missing."
            }
        }

        foreach ($Column in $ForbiddenColumns) {
            if ($Headers -contains $Column) {
                Add-Result ("Forbidden column absent: " + $Column) "FAIL" "Forbidden identifiable column found."
            } else {
                Add-Result ("Forbidden column absent: " + $Column) "PASS" "Column absent."
            }
        }

        $PatientIds = @{}
        $PatientCodes = @{}
        $DeviceSerials = @{}
        $Compliant80h = 0
        $RiskBelow80h = 0
        $NoDataRows = 0
        $HighAhiRows = 0
        $HighLeakRows = 0

        $Today = Get-Date
        $RowNumber = 1

        foreach ($Row in $Rows) {
            $RowNumber++

            if ($Row.tenant_id -ne "raftopoulos-production") {
                Add-RowIssue $RowNumber "FAIL" "tenant_id" "tenant_id must be raftopoulos-production"
            }

            if ([string]::IsNullOrWhiteSpace($Row.patient_external_id)) {
                Add-RowIssue $RowNumber "FAIL" "patient_external_id" "patient_external_id is empty"
            } elseif ($PatientIds.ContainsKey($Row.patient_external_id)) {
                Add-RowIssue $RowNumber "FAIL" "patient_external_id" "duplicate patient_external_id"
            } else {
                $PatientIds[$Row.patient_external_id] = $true
            }

            if ([string]::IsNullOrWhiteSpace($Row.patient_code)) {
                Add-RowIssue $RowNumber "FAIL" "patient_code" "patient_code is empty"
            } elseif ($PatientCodes.ContainsKey($Row.patient_code)) {
                Add-RowIssue $RowNumber "FAIL" "patient_code" "duplicate patient_code"
            } else {
                $PatientCodes[$Row.patient_code] = $true
            }

            if ([string]::IsNullOrWhiteSpace($Row.device_serial)) {
                Add-RowIssue $RowNumber "FAIL" "device_serial" "device_serial is empty"
            } elseif ($DeviceSerials.ContainsKey($Row.device_serial)) {
                Add-RowIssue $RowNumber "WARN" "device_serial" "duplicate device_serial"
            } else {
                $DeviceSerials[$Row.device_serial] = $true
            }

            if ([string]::IsNullOrWhiteSpace($Row.consent_basis)) {
                Add-RowIssue $RowNumber "FAIL" "consent_basis" "consent_basis is empty"
            }

            $MonthUsage = 0.0
            if (!(Try-ParseDoubleInvariant $Row.month_usage_hours ([ref]$MonthUsage))) {
                Add-RowIssue $RowNumber "FAIL" "month_usage_hours" "invalid numeric value"
            } else {
                if ($MonthUsage -lt 0 -or $MonthUsage -gt 744) {
                    Add-RowIssue $RowNumber "FAIL" "month_usage_hours" "out of monthly hour range 0-744"
                }

                if ($MonthUsage -ge 80) {
                    $Compliant80h++
                } else {
                    $RiskBelow80h++
                    Add-RowIssue $RowNumber "WARN" "month_usage_hours" "below 80 hours compliance threshold"
                }
            }

            $Usage30d = 0.0
            if (!(Try-ParseDoubleInvariant $Row.usage_hours_30d ([ref]$Usage30d))) {
                Add-RowIssue $RowNumber "FAIL" "usage_hours_30d" "invalid numeric value"
            } elseif ($Usage30d -lt 0 -or $Usage30d -gt 720) {
                Add-RowIssue $RowNumber "FAIL" "usage_hours_30d" "out of 30-day hour range 0-720"
            }

            $DaysUsed = 0.0
            if (!(Try-ParseDoubleInvariant $Row.days_used_30d ([ref]$DaysUsed))) {
                Add-RowIssue $RowNumber "FAIL" "days_used_30d" "invalid numeric value"
            } elseif ($DaysUsed -lt 0 -or $DaysUsed -gt 31) {
                Add-RowIssue $RowNumber "FAIL" "days_used_30d" "out of day range 0-31"
            }

            $Ahi = 0.0
            if (!(Try-ParseDoubleInvariant $Row.ahi_avg_30d ([ref]$Ahi))) {
                Add-RowIssue $RowNumber "FAIL" "ahi_avg_30d" "invalid numeric value"
            } elseif ($Ahi -gt 10) {
                $HighAhiRows++
                Add-RowIssue $RowNumber "WARN" "ahi_avg_30d" "AHI average above 10"
            }

            $Leak = 0.0
            if (!(Try-ParseDoubleInvariant $Row.leak_avg_30d ([ref]$Leak))) {
                Add-RowIssue $RowNumber "FAIL" "leak_avg_30d" "invalid numeric value"
            } elseif ($Leak -gt 24) {
                $HighLeakRows++
                Add-RowIssue $RowNumber "WARN" "leak_avg_30d" "leak average above 24"
            }

            if (!(Try-ParseDate $Row.setup_date)) {
                Add-RowIssue $RowNumber "FAIL" "setup_date" "invalid date"
            }

            if (!(Try-ParseDate $Row.month_start)) {
                Add-RowIssue $RowNumber "FAIL" "month_start" "invalid date"
            }

            if (!(Try-ParseDate $Row.last_data_date)) {
                Add-RowIssue $RowNumber "FAIL" "last_data_date" "invalid date"
            } else {
                $LastDataDate = [datetime]::Parse($Row.last_data_date)
                $DaysOld = ($Today - $LastDataDate).TotalDays

                if ($DaysOld -gt 7) {
                    $NoDataRows++
                    Add-RowIssue $RowNumber "WARN" "last_data_date" "last data older than 7 days"
                }
            }
        }

        $FailIssues = @($script:RowIssues | Where-Object { $_.severity -eq "FAIL" }).Count
        $WarnIssues = @($script:RowIssues | Where-Object { $_.severity -eq "WARN" }).Count

        if ($script:RowIssues.Count -gt 0) {
            $script:RowIssues | Export-Csv -Path $RowIssueCsv -NoTypeInformation -Encoding UTF8
            Add-Result "Row issue report created" "PASS" $RowIssueCsv
        } else {
            Add-Result "Row issue report created" "PASS" "No row issues found."
        }

        if ($FailIssues -eq 0) {
            Add-Result "CSV row-level FAIL issues" "PASS" "No FAIL row issues."
        } else {
            Add-Result "CSV row-level FAIL issues" "FAIL" ("FAIL row issues: " + $FailIssues)
        }

        if ($WarnIssues -eq 0) {
            Add-Result "CSV row-level WARN issues" "PASS" "No WARN row issues."
        } else {
            Add-Result "CSV row-level WARN issues" "WARN" ("WARN row issues: " + $WarnIssues)
        }

        Add-Result "80h compliant patient count" "PASS" ("Patients >= 80 hours: " + $Compliant80h)
        Add-Result "80h risk patient count" "PASS" ("Patients < 80 hours: " + $RiskBelow80h)
        Add-Result "No-data or old-data patient count" "PASS" ("Old/no data rows: " + $NoDataRows)
        Add-Result "High AHI patient count" "PASS" ("High AHI rows: " + $HighAhiRows)
        Add-Result "High leak patient count" "PASS" ("High leak rows: " + $HighLeakRows)

    } catch {
        Add-Result "CSV validation execution" "FAIL" ("Exception: " + $_.Exception.Message)
    }
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 81 7000 Patient CSV Master Validator"
Write-Host "============================================================"
Write-Host ""
Write-Host "Template:"
Write-Host $TemplatePath
Write-Host ""
Write-Host "Sample:"
Write-Host $SamplePath
Write-Host ""
Write-Host "Expected CSV path:"
Write-Host $DefaultCsvPath
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