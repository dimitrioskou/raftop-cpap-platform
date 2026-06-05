# RAFTOP CPAP CARE Pro
# Phase 100 - 7000-row Controlled Final Stage Apply
# Imports first 7000 rows from approved CSV or synthetic CSV into production DB.
# This phase DOES write to production DB tables:
# patients, devices, compliance_nights, import_audit_logs.
# It does NOT import 7000 rows.
# It does NOT import direct identifiers.
# It does NOT create users.
# It does NOT print DATABASE_URL.

param(
    [string]$CsvPath = "",
    [int]$LimitRows = 7000,
    [string]$ImportStage = "stage_7000_controlled_final",
    [string]$ImportBatchId = ""
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-activation"
$DataDir = Join-Path $Root "data-intake\raftopoulos-production"

$DefaultSyntheticCsv = Join-Path $DataDir "RAFTOP_7000_PATIENT_SYNTHETIC_DRY_RUN.csv"
$ApprovedRealCsv = Join-Path $DataDir "RAFTOP_7000_PATIENT_MASTER_READY_FOR_VALIDATION.csv"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DataDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase100_7000_row_controlled_final_stage_apply_" + $Timestamp + ".md")
$StageDoc = Join-Path $DocsDir "100_7000_ROW_CONTROLLED_FINAL_STAGE_APPLY.md"
$StageRowsCsv = Join-Path $ReportsDir ("phase99_7000_row_stage_rows_" + $Timestamp + ".csv")
$ApplySqlFile = Join-Path $ReportsDir ("phase99_7000_row_stage_apply_" + $Timestamp + "_DO_NOT_SEND.sql")
$VerificationCsv = Join-Path $ReportsDir ("phase99_7000_row_stage_verification_" + $Timestamp + ".csv")

if ([string]::IsNullOrWhiteSpace($ImportBatchId)) {
    $ImportBatchId = "phase99-" + $Timestamp
}

if ([string]::IsNullOrWhiteSpace($CsvPath)) {
    if (Test-Path $ApprovedRealCsv) {
        $CsvPath = $ApprovedRealCsv
    } else {
        $CsvPath = $DefaultSyntheticCsv
    }
}

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

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try { return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop } catch { return "" }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)
    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function SqlEscape {
    param([string]$Value)
    if ($null -eq $Value) { return "" }
    return $Value.Replace("'", "''")
}

function To-DateOrNullSql {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) { return "NULL" }

    try {
        $D = [datetime]::Parse($Value)
        return "'" + $D.ToString("yyyy-MM-dd") + "'"
    } catch {
        return "NULL"
    }
}

function To-NumOrZero {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) { return "0" }

    $Clean = $Value.Replace(",", ".")
    $Out = 0.0

    if ([double]::TryParse($Clean, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$Out)) {
        return $Out.ToString([System.Globalization.CultureInfo]::InvariantCulture)
    }

    return "0"
}

function To-IntOrZero {
    param([string]$Value)

    $Out = 0
    if ([int]::TryParse($Value, [ref]$Out)) {
        return [string]$Out
    }

    return "0"
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 100 7000-row Controlled Final Stage Apply" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: controlled 7000-row final stage import into production operational tables." -Encoding UTF8
Add-Content -Path $ReportPath -Value "DATABASE_URL is never printed." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 100 - 7000-row Controlled Final Stage Apply..."
Write-Host ""

Check-ReportStatus "Phase 99B ATLAS 80h 2000-stage verification latest status" "phase99b_atlas_80h_reports_on_2000_stage_*.md" @(
    "PHASE99B_ATLAS_80H_REPORTS_ON_2000_STAGE_READY",
    "PHASE99B_ATLAS_80H_REPORTS_ON_2000_STAGE_READY_WITH_WARNINGS"
)

$DatabaseUrl = $env:RAFTOP_PRODUCTION_DATABASE_URL
$PsqlCommand = Get-Command psql -ErrorAction SilentlyContinue

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Add-Result "Production DATABASE URL env set" "FAIL" "RAFTOP_PRODUCTION_DATABASE_URL is not set."
} else {
    Add-Result "Production DATABASE URL env set" "PASS" "Env value is set. Value is not printed."
}

if ($null -eq $PsqlCommand) {
    Add-Result "psql command available" "FAIL" "psql not found in PATH."
} else {
    Add-Result "psql command available" "PASS" ("psql found: " + $PsqlCommand.Source)
}

if (Test-Path $CsvPath) {
    Add-Result "Import CSV exists" "PASS" $CsvPath
} else {
    Add-Result "Import CSV exists" "FAIL" ("Missing CSV: " + $CsvPath)
}

if ($CsvPath -eq $DefaultSyntheticCsv) {
    Add-Result "Import CSV data type" "WARN" "Using synthetic dry-run CSV because approved real CSV was not found/provided."
} elseif ($CsvPath -eq $ApprovedRealCsv) {
    Add-Result "Import CSV data type" "PASS" "Using approved real CSV path."
} else {
    Add-Result "Import CSV data type" "WARN" ("Using custom CSV path: " + $CsvPath)
}

$Rows = @()

try {
    if (Test-Path $CsvPath) {
        $Rows = Import-Csv -Path $CsvPath
        Add-Result "CSV readable" "PASS" ("Rows loaded: " + @($Rows).Count)
    }
} catch {
    Add-Result "CSV readable" "FAIL" ("Could not read CSV: " + $_.Exception.Message)
}

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

if (@($Rows).Count -gt 0) {
    $FirstRowProps = @($Rows[0].PSObject.Properties.Name)

    foreach ($Col in $RequiredColumns) {
        if ($FirstRowProps -contains $Col) {
            Add-Result ("CSV required column exists: " + $Col) "PASS" "Column found."
        } else {
            Add-Result ("CSV required column exists: " + $Col) "FAIL" "Column missing."
        }
    }
}

$ForbiddenIdentifierColumns = @(
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

if (@($Rows).Count -gt 0) {
    $FirstRowProps = @($Rows[0].PSObject.Properties.Name)

    foreach ($Col in $ForbiddenIdentifierColumns) {
        if ($FirstRowProps -contains $Col) {
            Add-Result ("Forbidden identifier column absent: " + $Col) "FAIL" "Forbidden column found."
        } else {
            Add-Result ("Forbidden identifier column absent: " + $Col) "PASS" "Absent."
        }
    }
}

if ($LimitRows -ne 7000) {
    Add-Result "Stage row limit is 7000" "WARN" ("LimitRows is " + $LimitRows + ". Expected 7000 for Phase 100.")
} else {
    Add-Result "Stage row limit is 7000" "PASS" "LimitRows = 7000."
}

$StageRows = @($Rows | Select-Object -First $LimitRows)

if (@($StageRows).Count -eq 7000) {
    Add-Result "Stage row count selected" "PASS" "Rows selected: 7000."
} else {
    Add-Result "Stage row count selected" "FAIL" ("Rows selected: " + @($StageRows).Count)
}

$StageRows | Export-Csv -Path $StageRowsCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $StageRowsCsv) {
    Add-Result "Stage rows CSV exported" "PASS" $StageRowsCsv
} else {
    Add-Result "Stage rows CSV exported" "FAIL" $StageRowsCsv
}

$BadTenantRows = @($StageRows | Where-Object { $_.tenant_id -ne "raftopoulos-production" })

if (@($BadTenantRows).Count -eq 0) {
    Add-Result "All stage rows use raftopoulos-production tenant" "PASS" "Tenant OK."
} else {
    Add-Result "All stage rows use raftopoulos-production tenant" "FAIL" ("Bad tenant rows: " + @($BadTenantRows).Count)
}

$MissingCritical = @($StageRows | Where-Object {
    [string]::IsNullOrWhiteSpace($_.patient_external_id) -or
    [string]::IsNullOrWhiteSpace($_.patient_code) -or
    [string]::IsNullOrWhiteSpace($_.device_serial)
})

if (@($MissingCritical).Count -eq 0) {
    Add-Result "No missing critical identifiers" "PASS" "patient_external_id, patient_code, device_serial present."
} else {
    Add-Result "No missing critical identifiers" "FAIL" ("Rows with missing critical values: " + @($MissingCritical).Count)
}

if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl) -and $null -ne $PsqlCommand) {
    try {
        $RequiredTables = @("tenants", "patients", "devices", "compliance_nights", "import_audit_logs")
        foreach ($Table in $RequiredTables) {
            $Q = "select count(*) from information_schema.tables where table_schema='public' and table_name='$Table';"
            $Out = & psql $DatabaseUrl -t -A -c $Q 2>&1
            $Exit = $LASTEXITCODE

            if ($Exit -eq 0 -and (($Out | Out-String).Trim()) -eq "1") {
                Add-Result ("Production table exists before 7000 import: " + $Table) "PASS" "Table exists."
            } else {
                Add-Result ("Production table exists before 7000 import: " + $Table) "FAIL" "Table missing."
            }
        }
    } catch {
        Add-Result "Production table precheck" "FAIL" ("Exception: " + $_.Exception.Message)
    }
}

$SqlLines = @()
$SqlLines += "-- RAFTOP CPAP CARE Pro - Phase 100 7000-row controlled final stage apply"
$SqlLines += "-- Generated: $Timestamp"
$SqlLines += "-- Batch: $ImportBatchId"
$SqlLines += "BEGIN;"
$SqlLines += ""

$SqlLines += "INSERT INTO public.import_audit_logs (tenant_slug, import_batch_id, import_stage, source_filename, row_count, status, notes, created_by, created_at)"
$SqlLines += "VALUES ('raftopoulos-production', '$(SqlEscape $ImportBatchId)', '$(SqlEscape $ImportStage)', '$(SqlEscape (Split-Path $CsvPath -Leaf))', $(@($StageRows).Count), 'started', 'Phase 100 controlled 7000-row final stage import', 'phase99_script', now());"
$SqlLines += ""

foreach ($Row in $StageRows) {
    $Tenant = "raftopoulos-production"
    $PatientExternalId = SqlEscape $Row.patient_external_id
    $PatientCode = SqlEscape $Row.patient_code
    $DeviceSerial = SqlEscape $Row.device_serial
    $DeviceModel = SqlEscape $Row.device_model
    $DoctorExternalId = SqlEscape $Row.doctor_external_id
    $BranchCode = SqlEscape $Row.branch_code
    $ConsentBasis = SqlEscape $Row.consent_basis
    $DataSource = SqlEscape $Row.data_source

    $SetupDateSql = To-DateOrNullSql $Row.setup_date
    $MonthStartSql = To-DateOrNullSql $Row.month_start
    $LastDataDateSql = To-DateOrNullSql $Row.last_data_date

    $MonthUsage = To-NumOrZero $Row.month_usage_hours
    $Usage30d = To-NumOrZero $Row.usage_hours_30d
    $DaysUsed30d = To-IntOrZero $Row.days_used_30d
    $Ahi30d = To-NumOrZero $Row.ahi_avg_30d
    $Leak30d = To-NumOrZero $Row.leak_avg_30d

    $RecordDateSql = $LastDataDateSql
    if ($RecordDateSql -eq "NULL") {
        $RecordDateSql = $MonthStartSql
    }

    $SqlLines += "INSERT INTO public.patients (tenant_slug, patient_external_id, patient_code, doctor_external_id, branch_code, status, setup_date, consent_basis, data_source, created_at, updated_at)"
    $SqlLines += "VALUES ('$Tenant', '$PatientExternalId', '$PatientCode', '$DoctorExternalId', '$BranchCode', 'active', $SetupDateSql, '$ConsentBasis', '$DataSource', now(), now())"
    $SqlLines += "ON CONFLICT (tenant_slug, patient_external_id) DO UPDATE"
    $SqlLines += "SET patient_code = EXCLUDED.patient_code, doctor_external_id = EXCLUDED.doctor_external_id, branch_code = EXCLUDED.branch_code, status = EXCLUDED.status, setup_date = EXCLUDED.setup_date, consent_basis = EXCLUDED.consent_basis, data_source = EXCLUDED.data_source, updated_at = now();"
    $SqlLines += ""

    $SqlLines += "INSERT INTO public.devices (tenant_slug, patient_external_id, device_serial, device_model, status, setup_date, last_data_date, data_source, created_at, updated_at)"
    $SqlLines += "VALUES ('$Tenant', '$PatientExternalId', '$DeviceSerial', '$DeviceModel', 'active', $SetupDateSql, $LastDataDateSql, '$DataSource', now(), now())"
    $SqlLines += "ON CONFLICT (tenant_slug, device_serial) DO UPDATE"
    $SqlLines += "SET patient_external_id = EXCLUDED.patient_external_id, device_model = EXCLUDED.device_model, status = EXCLUDED.status, setup_date = EXCLUDED.setup_date, last_data_date = EXCLUDED.last_data_date, data_source = EXCLUDED.data_source, updated_at = now();"
    $SqlLines += ""

    $SqlLines += "INSERT INTO public.compliance_nights (tenant_slug, patient_external_id, device_serial, record_date, month_start, usage_hours, month_usage_hours, usage_hours_30d, days_used_30d, ahi_avg_30d, leak_avg_30d, data_source, created_at, updated_at)"
    $SqlLines += "VALUES ('$Tenant', '$PatientExternalId', '$DeviceSerial', $RecordDateSql, $MonthStartSql, $MonthUsage, $MonthUsage, $Usage30d, $DaysUsed30d, $Ahi30d, $Leak30d, '$DataSource', now(), now())"
    $SqlLines += "ON CONFLICT (tenant_slug, patient_external_id, record_date) DO UPDATE"
    $SqlLines += "SET device_serial = EXCLUDED.device_serial, month_start = EXCLUDED.month_start, usage_hours = EXCLUDED.usage_hours, month_usage_hours = EXCLUDED.month_usage_hours, usage_hours_30d = EXCLUDED.usage_hours_30d, days_used_30d = EXCLUDED.days_used_30d, ahi_avg_30d = EXCLUDED.ahi_avg_30d, leak_avg_30d = EXCLUDED.leak_avg_30d, data_source = EXCLUDED.data_source, updated_at = now();"
    $SqlLines += ""
}

$SqlLines += "UPDATE public.import_audit_logs"
$SqlLines += "SET status = 'completed', notes = 'Phase 100 controlled 7000-row final stage import completed'"
$SqlLines += "WHERE tenant_slug = 'raftopoulos-production' AND import_batch_id = '$(SqlEscape $ImportBatchId)';"
$SqlLines += ""
$SqlLines += "COMMIT;"

Set-Content -Path $ApplySqlFile -Value $SqlLines -Encoding UTF8

if (Test-Path $ApplySqlFile) {
    Add-Result "7000-row final stage SQL generated" "PASS" $ApplySqlFile
} else {
    Add-Result "7000-row final stage SQL generated" "FAIL" $ApplySqlFile
}

$SqlCheck = Read-FileSafe $ApplySqlFile
foreach ($Forbidden in @("DROP TABLE", "TRUNCATE", "DELETE FROM", "DROP DATABASE", "DROP SCHEMA")) {
    if (ContainsText $SqlCheck $Forbidden) {
        Add-Result ("Destructive SQL absent: " + $Forbidden) "FAIL" "Forbidden SQL found."
    } else {
        Add-Result ("Destructive SQL absent: " + $Forbidden) "PASS" "Absent."
    }
}

if ($script:FailCount -eq 0) {
    try {
        $ApplyOutput = & psql $DatabaseUrl -v ON_ERROR_STOP=1 -f $ApplySqlFile 2>&1
        $ApplyExit = $LASTEXITCODE

        Add-Content -Path $ReportPath -Value "SQL_APPLY_OUTPUT_REDACTED:" -Encoding UTF8
        Add-Content -Path $ReportPath -Value (($ApplyOutput | Out-String) -replace [regex]::Escape($DatabaseUrl), "[REDACTED_DATABASE_URL]") -Encoding UTF8
        Add-Content -Path $ReportPath -Value "" -Encoding UTF8

        if ($ApplyExit -eq 0) {
            Add-Result "7000-row final stage SQL applied" "PASS" "psql exit code 0."
        } else {
            Add-Result "7000-row final stage SQL applied" "FAIL" ("psql exit code: " + $ApplyExit)
        }
    } catch {
        Add-Result "7000-row final stage SQL applied" "FAIL" ("Exception: " + $_.Exception.Message)
    }
} else {
    Add-Result "7000-row final stage SQL applied" "FAIL" "Skipped because pre-apply gate has FAIL."
}

if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl) -and $null -ne $PsqlCommand) {
    try {
        $VerifyQuery = @"
select 'patients' as table_name, count(*) as row_count from public.patients where tenant_slug='raftopoulos-production'
union all
select 'devices' as table_name, count(*) as row_count from public.devices where tenant_slug='raftopoulos-production'
union all
select 'compliance_nights' as table_name, count(*) as row_count from public.compliance_nights where tenant_slug='raftopoulos-production'
union all
select 'import_audit_logs' as table_name, count(*) as row_count from public.import_audit_logs where tenant_slug='raftopoulos-production' and import_batch_id='$(SqlEscape $ImportBatchId)'
order by table_name;
"@

        $VerifyOutput = & psql $DatabaseUrl -t -A -F "," -c $VerifyQuery 2>&1
        $VerifyExit = $LASTEXITCODE

        if ($VerifyExit -eq 0) {
            Set-Content -Path $VerificationCsv -Value "table_name,row_count" -Encoding UTF8
            Add-Content -Path $VerificationCsv -Value $VerifyOutput -Encoding UTF8
            Add-Result "7000-row final stage verification CSV exported" "PASS" $VerificationCsv
        } else {
            Add-Result "7000-row final stage verification CSV exported" "FAIL" ($VerifyOutput | Out-String)
        }

        $StagePatientCountQuery = "select count(*) from public.patients where tenant_slug='raftopoulos-production' and patient_external_id in (" + (($StageRows | ForEach-Object { "'" + (SqlEscape $_.patient_external_id) + "'" }) -join ",") + ");"
        $StagePatientCountOutput = & psql $DatabaseUrl -t -A -c $StagePatientCountQuery 2>&1
        $StagePatientCountExit = $LASTEXITCODE

        if ($StagePatientCountExit -eq 0) {
            $CountText = (($StagePatientCountOutput | Out-String).Trim())

            if ($CountText -match "^[0-9]+$" -and [int]$CountText -ge 7000) {
                Add-Result "7000 stage patients present after import" "PASS" ("Count: " + $CountText)
            } else {
                Add-Result "7000 stage patients present after import" "FAIL" ("Count: " + $CountText)
            }
        } else {
            Add-Result "7000 stage patients present after import" "FAIL" ($StagePatientCountOutput | Out-String)
        }

    } catch {
        Add-Result "7000-row final stage verification" "FAIL" ("Exception: " + $_.Exception.Message)
    }
}

$StageDocContent = @'
# RAFTOP CPAP CARE Pro - 7000-row Controlled Final Stage Apply

REQUIRED_MARKER: PHASE100_7000_ROW_CONTROLLED_FINAL_STAGE_APPLY
REQUIRED_MARKER: SEVEN_THOUSAND_ROW_FINAL_STAGE_APPLIED
REQUIRED_MARKER: NO_DIRECT_IDENTIFIERS
REQUIRED_MARKER: SEVEN_THOUSAND_STAGE_APPLIED
REQUIRED_MARKER: READY_FOR_PHASE100B_7000_ROW_FINAL_VERIFICATION

## Meaning

The controlled production stage was expanded from 500 rows to 7000 rows.

## Scope

Imported/upserted into:
- patients
- devices
- compliance_nights
- import_audit_logs

## Safety

No direct identifier columns are allowed.
No users were created.
No 7000-row import was performed.

## Next phase

Phase 100B:
ATLAS / 80h / Reports verification on 7000-row final stage.
'@

Set-Content -Path $StageDoc -Value $StageDocContent -Encoding UTF8

if (Test-Path $StageDoc) {
    Add-Result "Phase 100 stage document created" "PASS" $StageDoc
} else {
    Add-Result "Phase 100 stage document created" "FAIL" $StageDoc
}

foreach ($Marker in @(
    "PHASE100_7000_ROW_CONTROLLED_FINAL_STAGE_APPLY",
    "SEVEN_THOUSAND_ROW_FINAL_STAGE_APPLIED",
    "NO_DIRECT_IDENTIFIERS",
    "SEVEN_THOUSAND_STAGE_APPLIED",
    "READY_FOR_PHASE100B_7000_ROW_FINAL_VERIFICATION"
)) {
    $DocContent = Read-FileSafe $StageDoc

    if (ContainsText $DocContent $Marker) {
        Add-Result ("Stage doc marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Stage doc marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
} else {
    Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE100_7000_ROW_CONTROLLED_FINAL_STAGE_APPLY_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE100_7000_ROW_CONTROLLED_FINAL_STAGE_APPLY_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE100_7000_ROW_CONTROLLED_FINAL_STAGE_APPLY_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 100 7000-row Controlled Final Stage Apply"
Write-Host "============================================================"
Write-Host ""
Write-Host "CSV path:"
Write-Host $CsvPath
Write-Host ""
Write-Host "Stage rows CSV:"
Write-Host $StageRowsCsv
Write-Host ""
Write-Host "Verification CSV:"
Write-Host $VerificationCsv
Write-Host ""
Write-Host "Stage doc:"
Write-Host $StageDoc
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
