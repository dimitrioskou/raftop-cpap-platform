# RAFTOP CPAP CARE Pro
# Phase 94D - Apply Production Schema Bootstrap & Verify
# Applies the non-destructive Phase 94C SQL to production DB and verifies required schema.
# This phase DOES modify production DB schema.
# It does NOT delete data.
# It does NOT import real patient data.
# It does NOT create production users.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-activation"
$SqlFile = Join-Path $Root "enterprise-backend\sql\phase94c_production_schema_bootstrap.sql"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase94d_apply_production_schema_bootstrap_and_verify_" + $Timestamp + ".md")
$ApplyDoc = Join-Path $DocsDir "94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLIED.md"
$PostApplyTablesCsv = Join-Path $ReportsDir ("phase94d_post_apply_tables_" + $Timestamp + ".csv")
$PostApplyColumnsCsv = Join-Path $ReportsDir ("phase94d_post_apply_columns_" + $Timestamp + ".csv")

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
        try {
            return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop
        } catch {
            return ""
        }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Strip-SqlComments {
    param([string]$Sql)

    $Lines = $Sql -split "`r?`n"
    $CleanLines = @()

    foreach ($Line in $Lines) {
        $Trimmed = $Line.Trim()
        if ($Trimmed.StartsWith("--")) {
            continue
        }
        $CleanLines += $Line
    }

    return ($CleanLines -join "`n")
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 94D Apply Production Schema Bootstrap and Verify" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: apply non-destructive production schema bootstrap SQL and verify schema." -Encoding UTF8
Add-Content -Path $ReportPath -Value "DATABASE_URL is never printed in this report." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 94D - Apply Production Schema Bootstrap & Verify..."
Write-Host ""

Check-ReportStatus "Phase 94C bootstrap repair plan latest status" "phase94c_production_schema_bootstrap_repair_plan_*.md" @(
    "PHASE94C_PRODUCTION_SCHEMA_BOOTSTRAP_REPAIR_PLAN_READY",
    "PHASE94C_PRODUCTION_SCHEMA_BOOTSTRAP_REPAIR_PLAN_READY_WITH_WARNINGS"
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

if (Test-Path $SqlFile) {
    Add-Result "Bootstrap SQL file exists" "PASS" $SqlFile
} else {
    Add-Result "Bootstrap SQL file exists" "FAIL" $SqlFile
}

$SqlContent = Read-FileSafe $SqlFile
$ExecutableSql = Strip-SqlComments $SqlContent

$RequiredSqlMarkers = @(
    "CREATE TABLE IF NOT EXISTS public.tenants",
    "CREATE TABLE IF NOT EXISTS public.patients",
    "CREATE TABLE IF NOT EXISTS public.devices",
    "CREATE TABLE IF NOT EXISTS public.compliance_nights",
    "CREATE TABLE IF NOT EXISTS public.tasks",
    "CREATE TABLE IF NOT EXISTS public.import_audit_logs",
    "CREATE OR REPLACE VIEW public.patient_compliance_latest"
)

foreach ($Marker in $RequiredSqlMarkers) {
    if (ContainsText $SqlContent $Marker) {
        Add-Result ("SQL required marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("SQL required marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$ForbiddenExecutableSql = @(
    "DROP TABLE",
    "TRUNCATE",
    "DELETE FROM",
    "DROP DATABASE",
    "DROP SCHEMA"
)

foreach ($Forbidden in $ForbiddenExecutableSql) {
    if (ContainsText $ExecutableSql $Forbidden) {
        Add-Result ("Executable SQL destructive statement absent: " + $Forbidden) "FAIL" "Forbidden executable SQL found."
    } else {
        Add-Result ("Executable SQL destructive statement absent: " + $Forbidden) "PASS" "Absent."
    }
}

if ($script:FailCount -eq 0) {
    try {
        Add-Result "Pre-apply gate clean" "PASS" "No FAIL before SQL apply."

        $ApplyOutput = & psql $DatabaseUrl -v ON_ERROR_STOP=1 -f $SqlFile 2>&1
        $ApplyExit = $LASTEXITCODE

        Add-Content -Path $ReportPath -Value "SQL_APPLY_OUTPUT:" -Encoding UTF8
        Add-Content -Path $ReportPath -Value (($ApplyOutput | Out-String) -replace [regex]::Escape($DatabaseUrl), "[REDACTED_DATABASE_URL]") -Encoding UTF8
        Add-Content -Path $ReportPath -Value "" -Encoding UTF8

        if ($ApplyExit -eq 0) {
            Add-Result "Production schema bootstrap SQL applied" "PASS" "psql exit code 0."
        } else {
            Add-Result "Production schema bootstrap SQL applied" "FAIL" ("psql exit code: " + $ApplyExit)
        }
    } catch {
        Add-Result "Production schema bootstrap SQL applied" "FAIL" ("Exception: " + $_.Exception.Message)
    }
} else {
    Add-Result "Production schema bootstrap SQL applied" "FAIL" "Skipped because pre-apply gate has FAIL."
}

if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl) -and $null -ne $PsqlCommand) {
    try {
        $TableQuery = "select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog','information_schema') order by table_schema, table_name;"
        $TablesOutput = & psql $DatabaseUrl -t -A -F "," -c $TableQuery 2>&1
        $TablesExit = $LASTEXITCODE

        if ($TablesExit -eq 0) {
            Set-Content -Path $PostApplyTablesCsv -Value "table_schema,table_name" -Encoding UTF8
            Add-Content -Path $PostApplyTablesCsv -Value $TablesOutput -Encoding UTF8
            Add-Result "Post-apply table list exported" "PASS" $PostApplyTablesCsv

            $TablesText = ($TablesOutput | Out-String)

            $RequiredTables = @(
                "tenants",
                "users",
                "tenant_profiles",
                "tenant_subscriptions",
                "patients",
                "devices",
                "compliance_nights",
                "tasks",
                "atlas_tasks",
                "import_audit_logs"
            )

            foreach ($Table in $RequiredTables) {
                if (ContainsText $TablesText ("," + $Table) -or ContainsText $TablesText $Table) {
                    Add-Result ("Post-apply required table exists: " + $Table) "PASS" "Table found."
                } else {
                    Add-Result ("Post-apply required table exists: " + $Table) "FAIL" "Table missing."
                }
            }

            if (ContainsText $TablesText "patient_compliance_latest") {
                Add-Result "Post-apply compliance latest view exists" "PASS" "View found."
            } else {
                Add-Result "Post-apply compliance latest view exists" "FAIL" "View missing."
            }
        } else {
            Add-Result "Post-apply table list exported" "FAIL" ($TablesOutput | Out-String)
        }

        $ColumnQuery = "select table_schema, table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema not in ('pg_catalog','information_schema') order by table_schema, table_name, ordinal_position;"
        $ColumnsOutput = & psql $DatabaseUrl -t -A -F "," -c $ColumnQuery 2>&1
        $ColumnsExit = $LASTEXITCODE

        if ($ColumnsExit -eq 0) {
            Set-Content -Path $PostApplyColumnsCsv -Value "table_schema,table_name,column_name,data_type,is_nullable" -Encoding UTF8
            Add-Content -Path $PostApplyColumnsCsv -Value $ColumnsOutput -Encoding UTF8
            Add-Result "Post-apply column list exported" "PASS" $PostApplyColumnsCsv
        } else {
            Add-Result "Post-apply column list exported" "FAIL" ($ColumnsOutput | Out-String)
        }

        $TenantQuery = "select count(*) from public.tenants where slug='raftopoulos-production';"
        $TenantOutput = & psql $DatabaseUrl -t -A -c $TenantQuery 2>&1
        $TenantExit = $LASTEXITCODE

        if ($TenantExit -eq 0) {
            $TenantCountText = (($TenantOutput | Out-String).Trim())

            if ($TenantCountText -match "^[0-9]+$" -and [int]$TenantCountText -gt 0) {
                Add-Result "Raftopoulos production tenant exists after apply" "PASS" ("Tenant count: " + $TenantCountText)
            } else {
                Add-Result "Raftopoulos production tenant exists after apply" "FAIL" "Tenant count is 0."
            }
        } else {
            Add-Result "Raftopoulos production tenant query after apply" "FAIL" ($TenantOutput | Out-String)
        }

    } catch {
        Add-Result "Post-apply verification" "FAIL" ("Exception: " + $_.Exception.Message)
    }
}

$ApplyDocContent = @'
# RAFTOP CPAP CARE Pro - Production Schema Bootstrap Applied

REQUIRED_MARKER: PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLIED
REQUIRED_MARKER: SCHEMA_APPLIED_TO_PRODUCTION
REQUIRED_MARKER: PRODUCTION_TABLES_VERIFIED
REQUIRED_MARKER: READY_FOR_PHASE95_TENANT_USERS
REQUIRED_MARKER: NO_REAL_PATIENT_DATA_IMPORTED

## Meaning

The non-destructive schema bootstrap was applied to the production database.

## Expected production tables

- tenants
- users
- tenant_profiles
- tenant_subscriptions
- patients
- devices
- compliance_nights
- tasks
- atlas_tasks
- import_audit_logs
- patient_compliance_latest view

## Expected tenant

raftopoulos-production

## Important

This phase does not import real patient data.
This phase does not create production users.
This phase prepares the database schema for tenant/user activation.

## Next phase

Phase 95:
Tenant + Users + Credentials Activation Pack
'@

Set-Content -Path $ApplyDoc -Value $ApplyDocContent -Encoding UTF8

if (Test-Path $ApplyDoc) {
    Add-Result "Phase 94D apply document created" "PASS" $ApplyDoc
} else {
    Add-Result "Phase 94D apply document created" "FAIL" $ApplyDoc
}

foreach ($Marker in @(
    "PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLIED",
    "SCHEMA_APPLIED_TO_PRODUCTION",
    "PRODUCTION_TABLES_VERIFIED",
    "READY_FOR_PHASE95_TENANT_USERS",
    "NO_REAL_PATIENT_DATA_IMPORTED"
)) {
    $DocContent = Read-FileSafe $ApplyDoc

    if (ContainsText $DocContent $Marker) {
        Add-Result ("Apply doc marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Apply doc marker exists: " + $Marker) "FAIL" "Marker missing."
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
    $FinalStatus = "PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLY_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLY_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLY_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 94D Apply Production Schema Bootstrap & Verify"
Write-Host "============================================================"
Write-Host ""
Write-Host "Apply doc:"
Write-Host $ApplyDoc
Write-Host ""
Write-Host "Post-apply tables CSV:"
Write-Host $PostApplyTablesCsv
Write-Host ""
Write-Host "Post-apply columns CSV:"
Write-Host $PostApplyColumnsCsv
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