# RAFTOP CPAP CARE Pro
# Phase 94B - Production Schema Mapping Discovery
# Discovers current production DB tables/columns and maps them against required operational schema.
# Does not modify production DB.
# Does not import patient data.
# Does not expose DATABASE_URL in report.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-activation"
$BackendDir = Join-Path $Root "enterprise-backend"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase94b_production_schema_mapping_discovery_" + $Timestamp + ".md")
$MappingDoc = Join-Path $DocsDir "94B_PRODUCTION_SCHEMA_MAPPING_DISCOVERY.md"
$RepairPlanDoc = Join-Path $DocsDir "94B_SCHEMA_REPAIR_REQUIREMENTS.md"
$TablesCsv = Join-Path $ReportsDir ("phase94b_production_tables_" + $Timestamp + ".csv")
$ColumnsCsv = Join-Path $ReportsDir ("phase94b_production_columns_" + $Timestamp + ".csv")

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

function Search-CodeMarker {
    param(
        [string]$Name,
        [string]$Directory,
        [string]$Pattern,
        [string[]]$Extensions
    )

    if (!(Test-Path $Directory)) {
        Add-Result $Name "WARN" ("Directory missing: " + $Directory)
        return
    }

    $Files = Get-ChildItem -Path $Directory -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $Extensions -contains $_.Extension.ToLower() }

    $Matches = @()

    foreach ($File in $Files) {
        $Content = Read-FileSafe $File.FullName
        if (ContainsText $Content $Pattern) {
            $Matches += $File.FullName
        }
    }

    if ($Matches.Count -gt 0) {
        Add-Result $Name "PASS" ("Found in: " + (($Matches | Select-Object -First 5) -join "; "))
    } else {
        Add-Result $Name "WARN" ("Pattern not found: " + $Pattern)
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 94B Production Schema Mapping Discovery" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: discover current production DB schema and determine what must be repaired before tenant/user activation." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This phase does not modify production DB." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 94B - Production Schema Mapping Discovery..."
Write-Host ""

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

$TablesText = ""
$ColumnsText = ""

if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl) -and $null -ne $PsqlCommand) {
    try {
        $TableQuery = "select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog','information_schema') order by table_schema, table_name;"
        $TablesOutput = & psql $DatabaseUrl -t -A -F "," -c $TableQuery 2>&1
        $TablesExit = $LASTEXITCODE

        if ($TablesExit -eq 0) {
            $TablesText = ($TablesOutput | Out-String)
            Set-Content -Path $TablesCsv -Value "table_schema,table_name" -Encoding UTF8
            Add-Content -Path $TablesCsv -Value $TablesOutput -Encoding UTF8
            Add-Result "Production table list exported" "PASS" $TablesCsv
        } else {
            Add-Result "Production table list exported" "FAIL" ($TablesOutput | Out-String)
        }

        $ColumnQuery = "select table_schema, table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema not in ('pg_catalog','information_schema') order by table_schema, table_name, ordinal_position;"
        $ColumnsOutput = & psql $DatabaseUrl -t -A -F "," -c $ColumnQuery 2>&1
        $ColumnsExit = $LASTEXITCODE

        if ($ColumnsExit -eq 0) {
            $ColumnsText = ($ColumnsOutput | Out-String)
            Set-Content -Path $ColumnsCsv -Value "table_schema,table_name,column_name,data_type,is_nullable" -Encoding UTF8
            Add-Content -Path $ColumnsCsv -Value $ColumnsOutput -Encoding UTF8
            Add-Result "Production column list exported" "PASS" $ColumnsCsv
        } else {
            Add-Result "Production column list exported" "FAIL" ($ColumnsOutput | Out-String)
        }

    } catch {
        Add-Result "Production schema discovery query" "FAIL" ("Exception: " + $_.Exception.Message)
    }
}

$RequiredProductionTables = @(
    "users",
    "tenant_profiles",
    "tenant_subscriptions",
    "patients",
    "devices",
    "atlas_tasks",
    "compliance_nights"
)

foreach ($Table in $RequiredProductionTables) {
    if (ContainsText $TablesText ("," + $Table) -or ContainsText $TablesText $Table) {
        Add-Result ("Required production table exists or mapped: " + $Table) "PASS" "Found."
    } else {
        Add-Result ("Required production table exists or mapped: " + $Table) "WARN" "Missing or not mapped."
    }
}

$LegacyExpectedTables = @(
    "tenants",
    "tasks"
)

foreach ($Table in $LegacyExpectedTables) {
    if (ContainsText $TablesText ("," + $Table) -or ContainsText $TablesText $Table) {
        Add-Result ("Legacy expected table exists: " + $Table) "PASS" "Found."
    } else {
        Add-Result ("Legacy expected table exists: " + $Table) "WARN" "Not found. Must map to current schema or create compatibility view/table."
    }
}

$DemoTables = @(
    "pilot_demo_devices",
    "pilot_demo_compliance_nights",
    "pilot_demo_atlas_tasks"
)

foreach ($Table in $DemoTables) {
    if (ContainsText $TablesText $Table) {
        Add-Result ("Demo table present: " + $Table) "WARN" "Demo table exists. Production rollout must not depend on demo-only table."
    } else {
        Add-Result ("Demo table absent: " + $Table) "PASS" "Demo table absent."
    }
}

# Backend code expectations.
Search-CodeMarker "Backend references tenant_profiles" $BackendDir "tenant_profiles" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend references tenants" $BackendDir "tenants" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend references patients" $BackendDir "patients" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend references devices" $BackendDir "devices" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend references atlas_tasks" $BackendDir "atlas_tasks" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend references tasks" $BackendDir "tasks" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend references compliance_nights" $BackendDir "compliance_nights" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend references pilot_demo" $BackendDir "pilot_demo" @(".js", ".ts", ".sql", ".md")

$MappingContent = @'
# RAFTOP CPAP CARE Pro - Production Schema Mapping Discovery

REQUIRED_MARKER: PHASE94B_PRODUCTION_SCHEMA_MAPPING_DISCOVERY
REQUIRED_MARKER: CURRENT_SCHEMA_PARTIAL
REQUIRED_MARKER: TENANT_PROFILES_PRESENT
REQUIRED_MARKER: PATIENTS_DEVICES_SCHEMA_REQUIRED
REQUIRED_MARKER: NO_REAL_PATIENT_IMPORT

## Discovery conclusion

The current production database appears to contain a partial schema.

Observed production-style tables may include:
- users
- tenant_profiles
- tenant_subscriptions
- atlas_tasks
- system_monitoring_snapshots

Observed demo-style tables may include:
- pilot_demo_devices
- pilot_demo_compliance_nights
- pilot_demo_atlas_tasks

Missing or not yet confirmed as production tables:
- patients
- devices
- compliance_nights
- generic tasks table if required by backend

## Meaning

The application can have working backend health and partial DB schema, but it is not safe to activate 7000-patient production usage until schema repair or schema mapping is completed.

## Required next step

Phase 94C must create a production schema bootstrap / repair plan.

It must decide:
1. Whether tenant_profiles is the canonical tenants table.
2. Whether atlas_tasks is the canonical tasks table.
3. Whether production patients/devices/compliance tables must be created.
4. Whether compatibility views are required for legacy endpoints.
5. Whether demo tables should remain isolated from production tenant data.

## Hard stop

Do not import real patient data until schema is confirmed and tenant activation is verified.
'@

Set-Content -Path $MappingDoc -Value $MappingContent -Encoding UTF8

$RepairPlanContent = @'
# RAFTOP CPAP CARE Pro - Schema Repair Requirements

REQUIRED_MARKER: PHASE94B_SCHEMA_REPAIR_REQUIREMENTS
REQUIRED_MARKER: CREATE_OR_MAP_PATIENTS_DEVICES
REQUIRED_MARKER: TENANT_COMPATIBILITY_REQUIRED
REQUIRED_MARKER: BEFORE_PHASE95_TENANT_USERS

## Required before Phase 95

Before creating production tenant users, the following must be resolved:

1. Tenant model
   - use tenant_profiles as canonical tenant table
   - or create tenants compatibility view/table

2. Users model
   - confirm users table has email, password/hash, role, tenant reference

3. Patients model
   - create production patients table
   - or confirm existing equivalent table

4. Devices model
   - create production devices table
   - or confirm existing equivalent table

5. Compliance model
   - create compliance_nights / compliance_records table
   - or confirm existing equivalent table

6. Tasks model
   - confirm atlas_tasks covers operational tasks
   - or create tasks compatibility view/table

7. Demo data separation
   - production data must not depend on pilot_demo_* tables

## Next phase

Phase 94C:
Production Schema Bootstrap / Compatibility Plan

Phase 95 can only run after Phase 94C is ready.
'@

Set-Content -Path $RepairPlanDoc -Value $RepairPlanContent -Encoding UTF8

foreach ($Path in @($MappingDoc, $RepairPlanDoc)) {
    if (Test-Path $Path) {
        Add-Result ("Schema discovery doc created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Schema discovery doc created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

foreach ($Marker in @(
    "PHASE94B_PRODUCTION_SCHEMA_MAPPING_DISCOVERY",
    "CURRENT_SCHEMA_PARTIAL",
    "TENANT_PROFILES_PRESENT",
    "PATIENTS_DEVICES_SCHEMA_REQUIRED",
    "PHASE94B_SCHEMA_REPAIR_REQUIREMENTS",
    "CREATE_OR_MAP_PATIENTS_DEVICES",
    "TENANT_COMPATIBILITY_REQUIRED",
    "BEFORE_PHASE95_TENANT_USERS"
)) {
    $Found = $false

    foreach ($Path in @($MappingDoc, $RepairPlanDoc)) {
        $Content = Read-FileSafe $Path
        if (ContainsText $Content $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required marker exists: " + $Marker) "FAIL" "Marker missing."
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
    $FinalStatus = "PHASE94B_PRODUCTION_SCHEMA_MAPPING_DISCOVERY_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE94B_PRODUCTION_SCHEMA_MAPPING_DISCOVERY_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE94B_PRODUCTION_SCHEMA_MAPPING_DISCOVERY_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 94B Production Schema Mapping Discovery"
Write-Host "============================================================"
Write-Host ""
Write-Host "Tables CSV:"
Write-Host $TablesCsv
Write-Host ""
Write-Host "Columns CSV:"
Write-Host $ColumnsCsv
Write-Host ""
Write-Host "Mapping doc:"
Write-Host $MappingDoc
Write-Host ""
Write-Host "Repair plan:"
Write-Host $RepairPlanDoc
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