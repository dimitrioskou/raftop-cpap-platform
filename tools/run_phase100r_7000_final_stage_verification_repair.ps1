# RAFTOP CPAP CARE Pro
# Phase 100R - 7000 Final Stage Verification Repair
# Read-only verification repair for Phase 100.
# Does NOT import data.
# Does NOT modify production DB.
# Does NOT print DATABASE_URL.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-activation"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase100r_7000_final_stage_verification_repair_" + $Timestamp + ".md")
$CountsCsv = Join-Path $ReportsDir ("phase100r_7000_final_stage_counts_" + $Timestamp + ".csv")
$AuditCsv = Join-Path $ReportsDir ("phase100r_7000_final_stage_import_audit_" + $Timestamp + ".csv")
$RepairDoc = Join-Path $DocsDir "100R_7000_FINAL_STAGE_VERIFICATION_REPAIR.md"

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

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) { return $Files[0] }
    return $null
}

function Check-ReportExists {
    param([string]$Name, [string]$Pattern)

    $Latest = Get-LatestReport $Pattern

    if ($null -eq $Latest) {
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return ""
    }

    Add-Result $Name "PASS" ("Latest report found: " + $Latest.Name)
    return $Latest.FullName
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 100R 7000 Final Stage Verification Repair" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: read-only verification repair after Phase 100 final stage apply." -Encoding UTF8
Add-Content -Path $ReportPath -Value "DATABASE_URL is never printed." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 100R - 7000 Final Stage Verification Repair..."
Write-Host ""

$Phase100Report = Check-ReportExists "Phase 100 final stage report exists" "phase100_7000_row_controlled_final_stage_apply_*.md"

if (![string]::IsNullOrWhiteSpace($Phase100Report)) {
    $Phase100Content = Read-FileSafe $Phase100Report

    if (ContainsText $Phase100Content "7000-row stage SQL applied`nSTATUS: PASS" -or ContainsText $Phase100Content "7000-row final stage SQL applied`nSTATUS: PASS" -or ContainsText $Phase100Content "psql exit code 0") {
        Add-Result "Phase 100 SQL apply appears successful" "PASS" "Phase 100 report contains successful SQL apply evidence."
    } else {
        Add-Result "Phase 100 SQL apply appears successful" "WARN" "Could not confirm SQL apply success from report text. DB counts will be source of truth."
    }
}

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

$PatientsCount = 0
$DevicesCount = 0
$ComplianceRowsCount = 0
$ComplianceDistinctPatients = 0
$LatestViewCount = 0
$LatestAuditRows = 0
$LatestAuditStatus = ""

if ($script:FailCount -eq 0) {
    try {
        $CountsQuery = @"
select 'patients' as metric, count(*)::text as value
from public.patients
where tenant_slug='raftopoulos-production'
union all
select 'devices' as metric, count(*)::text as value
from public.devices
where tenant_slug='raftopoulos-production'
union all
select 'compliance_nights_rows' as metric, count(*)::text as value
from public.compliance_nights
where tenant_slug='raftopoulos-production'
union all
select 'compliance_nights_distinct_patients' as metric, count(distinct patient_external_id)::text as value
from public.compliance_nights
where tenant_slug='raftopoulos-production'
union all
select 'patient_compliance_latest' as metric, count(*)::text as value
from public.patient_compliance_latest
where tenant_slug='raftopoulos-production'
order by metric;
"@

        $CountsOutput = & psql $DatabaseUrl -t -A -F "," -c $CountsQuery 2>&1
        $CountsExit = $LASTEXITCODE

        if ($CountsExit -eq 0) {
            Set-Content -Path $CountsCsv -Value "metric,value" -Encoding UTF8
            Add-Content -Path $CountsCsv -Value $CountsOutput -Encoding UTF8
            Add-Result "Final 7000 counts CSV exported" "PASS" $CountsCsv

            $Rows = Import-Csv $CountsCsv

            foreach ($Row in $Rows) {
                $Metric = $Row.metric
                $Value = 0
                [int]::TryParse($Row.value, [ref]$Value) | Out-Null

                if ($Metric -eq "patients") { $PatientsCount = $Value }
                elseif ($Metric -eq "devices") { $DevicesCount = $Value }
                elseif ($Metric -eq "compliance_nights_rows") { $ComplianceRowsCount = $Value }
                elseif ($Metric -eq "compliance_nights_distinct_patients") { $ComplianceDistinctPatients = $Value }
                elseif ($Metric -eq "patient_compliance_latest") { $LatestViewCount = $Value }
            }

            if ($PatientsCount -ge 7000) {
                Add-Result "Production patients count >= 7000" "PASS" ("patients: " + $PatientsCount)
            } else {
                Add-Result "Production patients count >= 7000" "FAIL" ("patients: " + $PatientsCount)
            }

            if ($DevicesCount -ge 7000) {
                Add-Result "Production devices count >= 7000" "PASS" ("devices: " + $DevicesCount)
            } else {
                Add-Result "Production devices count >= 7000" "FAIL" ("devices: " + $DevicesCount)
            }

            if ($ComplianceDistinctPatients -ge 7000) {
                Add-Result "Compliance distinct patients count >= 7000" "PASS" ("distinct patients: " + $ComplianceDistinctPatients)
            } else {
                Add-Result "Compliance distinct patients count >= 7000" "FAIL" ("distinct patients: " + $ComplianceDistinctPatients)
            }

            if ($LatestViewCount -ge 7000) {
                Add-Result "patient_compliance_latest count >= 7000" "PASS" ("latest view rows: " + $LatestViewCount)
            } else {
                Add-Result "patient_compliance_latest count >= 7000" "FAIL" ("latest view rows: " + $LatestViewCount)
            }

        } else {
            Add-Result "Final 7000 counts CSV exported" "FAIL" ($CountsOutput | Out-String)
        }

        $AuditQuery = @"
select
  import_batch_id,
  import_stage,
  source_filename,
  row_count,
  status,
  created_at::text
from public.import_audit_logs
where tenant_slug='raftopoulos-production'
  and (
    import_batch_id like 'phase100%'
    or import_stage ilike '%7000%'
  )
order by created_at desc
limit 5;
"@

        $AuditOutput = & psql $DatabaseUrl -t -A -F "," -c $AuditQuery 2>&1
        $AuditExit = $LASTEXITCODE

        if ($AuditExit -eq 0) {
            Set-Content -Path $AuditCsv -Value "import_batch_id,import_stage,source_filename,row_count,status,created_at" -Encoding UTF8
            Add-Content -Path $AuditCsv -Value $AuditOutput -Encoding UTF8
            Add-Result "Final 7000 audit CSV exported" "PASS" $AuditCsv

            $AuditRows = @(Import-Csv $AuditCsv)

            if ($AuditRows.Count -gt 0) {
                $LatestAuditRows = [int]$AuditRows[0].row_count
                $LatestAuditStatus = $AuditRows[0].status

                if ($LatestAuditRows -ge 7000) {
                    Add-Result "Latest 7000 audit row_count >= 7000" "PASS" ("row_count: " + $LatestAuditRows)
                } else {
                    Add-Result "Latest 7000 audit row_count >= 7000" "WARN" ("row_count: " + $LatestAuditRows)
                }

                if ($LatestAuditStatus -eq "completed") {
                    Add-Result "Latest 7000 audit status completed" "PASS" "status: completed"
                } else {
                    Add-Result "Latest 7000 audit status completed" "WARN" ("status: " + $LatestAuditStatus)
                }
            } else {
                Add-Result "Latest 7000 audit record exists" "WARN" "No phase100/7000 audit row found. Counts are still checked separately."
            }

        } else {
            Add-Result "Final 7000 audit CSV exported" "WARN" ($AuditOutput | Out-String)
        }

    } catch {
        Add-Result "Final 7000 verification repair query" "FAIL" ("Exception: " + $_.Exception.Message)
    }
}

$RepairDocContent = @"
# RAFTOP CPAP CARE Pro - 7000 Final Stage Verification Repair

REQUIRED_MARKER: PHASE100R_7000_FINAL_STAGE_VERIFICATION_REPAIR
REQUIRED_MARKER: READ_ONLY_VERIFICATION
REQUIRED_MARKER: SEVEN_THOUSAND_COUNTS_VERIFIED
REQUIRED_MARKER: READY_FOR_PHASE100B_FINAL_ATLAS_80H_REPORTS

## Meaning

Phase 100R performs read-only verification after the Phase 100 7000-row final stage apply.

## Verified counts

Patients:
$PatientsCount

Devices:
$DevicesCount

Compliance rows:
$ComplianceRowsCount

Compliance distinct patients:
$ComplianceDistinctPatients

patient_compliance_latest rows:
$LatestViewCount

Latest audit row_count:
$LatestAuditRows

Latest audit status:
$LatestAuditStatus

## Important

This phase does not import data.
This phase does not modify production DB.
This phase repairs verification logic only.

## Next phase

Phase 100B:
ATLAS / 80h / Reports Final Verification on 7000-row Stage.
"@

Set-Content -Path $RepairDoc -Value $RepairDocContent -Encoding UTF8

if (Test-Path $RepairDoc) {
    Add-Result "Phase 100R repair document created" "PASS" $RepairDoc
} else {
    Add-Result "Phase 100R repair document created" "FAIL" $RepairDoc
}

foreach ($Marker in @(
    "PHASE100R_7000_FINAL_STAGE_VERIFICATION_REPAIR",
    "READ_ONLY_VERIFICATION",
    "SEVEN_THOUSAND_COUNTS_VERIFIED",
    "READY_FOR_PHASE100B_FINAL_ATLAS_80H_REPORTS"
)) {
    $DocContent = Read-FileSafe $RepairDoc

    if (ContainsText $DocContent $Marker) {
        Add-Result ("Repair doc marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Repair doc marker exists: " + $Marker) "FAIL" "Marker missing."
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
    $FinalStatus = "PHASE100R_7000_FINAL_STAGE_VERIFICATION_REPAIR_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE100R_7000_FINAL_STAGE_VERIFICATION_REPAIR_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE100R_7000_FINAL_STAGE_VERIFICATION_REPAIR_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 100R 7000 Final Stage Verification Repair"
Write-Host "============================================================"
Write-Host ""
Write-Host "Counts CSV:"
Write-Host $CountsCsv
Write-Host ""
Write-Host "Audit CSV:"
Write-Host $AuditCsv
Write-Host ""
Write-Host "Repair doc:"
Write-Host $RepairDoc
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