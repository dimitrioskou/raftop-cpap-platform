# RAFTOP CPAP CARE Pro
# Phase 42.2 - Dedicated Pilot Demo Schema Plan
# Safe ASCII-only script
# Dry-run by default. Use -Apply to create dedicated pilot_demo_* tables.
# Does not touch production patients/users/devices tables.

param(
    [switch]$Apply,
    [string]$TenantId = "raftopoulos-live"
)

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ToolsDir = Join-Path $Root "tools"
$BackendDir = Join-Path $Root "enterprise-backend"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

if (!(Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

if ($Apply) {
    $Mode = "APPLY"
} else {
    $Mode = "DRY_RUN"
}

$ReportPath = Join-Path $ReportsDir ("phase42_dedicated_pilot_demo_schema_plan_" + $Mode.ToLower() + "_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase42_dedicated_pilot_demo_schema_plan_runner.js"

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param(
        [string]$Name,
        [string]$StatusValue,
        [string]$Details
    )

    if ($StatusValue -eq "PASS") {
        $script:PassCount++
    } elseif ($StatusValue -eq "WARN") {
        $script:WarnCount++
    } else {
        $script:FailCount++
    }

    Write-ReportLine ("CHECK: " + $Name)
    Write-ReportLine ("STATUS: " + $StatusValue)
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($StatusValue + " - " + $Name)
}

function Write-JsLine {
    param([string]$Text)
    Add-Content -Path $JsPath -Value $Text -Encoding UTF8
}

function Test-CommandExists {
    param([string]$Command)

    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 42.2 Dedicated Pilot Demo Schema Plan" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ("Mode: " + $Mode)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This phase prepares dedicated pilot demo tables for Raftopoulos demo data."
Write-ReportLine "It avoids unsafe insertion into users, atlas_tasks, or unrelated production tables."
Write-ReportLine "Dry run mode does not modify the database."
Write-ReportLine "Apply mode creates only pilot_demo_* tables."
Write-ReportLine ""
Write-ReportLine "Target tenant:"
Write-ReportLine $TenantId
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 42.2 dedicated pilot demo schema plan..."
Write-Host ("Mode: " + $Mode)
Write-Host ""

$LatestStrictReport = Get-LatestReport "phase42_strict_demo_schema_discovery_*.md"

if ($LatestStrictReport -eq $null) {
    Add-Result "Latest strict schema discovery report" "WARN" "No Phase 42.1B strict discovery report found."
} else {
    $StrictContent = Get-Content -Path $LatestStrictReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($StrictContent -match "FINAL STATUS: PHASE42_STRICT_DEMO_SCHEMA_DISCOVERY_READY") {
        Add-Result "Latest strict schema discovery status" "PASS" "Strict discovery has ready final status."
    } else {
        Add-Result "Latest strict schema discovery status" "WARN" "Strict discovery final status not confirmed ready."
    }

    if ($StrictContent -match "STRICT_SELECTED_PATIENTS_TABLE:\s*$") {
        Add-Result "Production patients table mapping" "PASS" "No safe production patients table selected. Dedicated demo table required."
    } else {
        Add-Result "Production patients table mapping" "WARN" "A patients table was selected. Dedicated demo table still preferred for pilot isolation."
    }

    if ($StrictContent -match "STRICT_SELECTED_DEVICES_TABLE:\s*$") {
        Add-Result "Production devices table mapping" "PASS" "No safe production devices table selected. Dedicated demo table required."
    } else {
        Add-Result "Production devices table mapping" "WARN" "A devices table was selected. Dedicated demo table still preferred for pilot isolation."
    }

    if ($StrictContent -match "STRICT_SELECTED_COMPLIANCE_TABLE:\s*$") {
        Add-Result "Production compliance table mapping" "PASS" "No safe production compliance table selected. Dedicated demo table required."
    } else {
        Add-Result "Production compliance table mapping" "WARN" "A compliance table was selected. Dedicated demo table still preferred for pilot isolation."
    }
}

if (Test-CommandExists "node") {
    Add-Result "Node available" "PASS" "node command is available."
} else {
    Add-Result "Node available" "FAIL" "node command is not available."
}

$DbUrl = $env:RAFTOP_PRODUCTION_DATABASE_URL
if ([string]::IsNullOrWhiteSpace($DbUrl)) {
    $DbUrl = $env:DATABASE_URL
}

if ([string]::IsNullOrWhiteSpace($DbUrl)) {
    Add-Result "Production database URL environment variable" "FAIL" "Set RAFTOP_PRODUCTION_DATABASE_URL in the current PowerShell session."
} else {
    Add-Result "Production database URL environment variable" "PASS" "Database URL is present. Secret value not printed."
}

if (Test-Path (Join-Path $BackendDir "node_modules\pg")) {
    Add-Result "Node pg dependency" "PASS" "pg dependency found in enterprise-backend node_modules."
} else {
    Add-Result "Node pg dependency" "WARN" "pg dependency not found locally."
}

if ($Apply) {
    Add-Result "Schema execution mode" "WARN" "APPLY mode selected. This will create dedicated pilot_demo_* tables."
} else {
    Add-Result "Schema execution mode" "PASS" "DRY_RUN mode selected. No database changes will be made."
}

Set-Content -Path $JsPath -Value "// RAFTOP Phase 42.2 dedicated pilot demo schema plan runner" -Encoding UTF8

Write-JsLine 'const fs = require("fs");'
Write-JsLine 'const path = require("path");'
Write-JsLine 'const reportPath = process.env.RAFTOP_PHASE42_DEMO_SCHEMA_REPORT;'
Write-JsLine 'const dbUrl = process.env.RAFTOP_PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;'
Write-JsLine 'const applyMode = process.env.RAFTOP_PHASE42_APPLY === "true";'
Write-JsLine 'const tenantId = process.env.RAFTOP_PHASE42_TENANT_ID || "raftopoulos-live";'
Write-JsLine ''
Write-JsLine 'function w(line) { fs.appendFileSync(reportPath, String(line) + "\n", "utf8"); }'
Write-JsLine 'function safeExit(status, code) { w(""); w("NODE_RUNNER_STATUS: " + status); console.log("NODE_RUNNER_STATUS: " + status); process.exit(code); }'
Write-JsLine ''
Write-JsLine 'if (!reportPath) { console.error("Missing RAFTOP_PHASE42_DEMO_SCHEMA_REPORT"); process.exit(2); }'
Write-JsLine 'if (!dbUrl) { w("DB_URL_PRESENT: false"); safeExit("MISSING_DATABASE_URL", 2); }'
Write-JsLine ''
Write-JsLine 'w("DB_URL_PRESENT: true");'
Write-JsLine 'w("DB_URL_VALUE: hidden");'
Write-JsLine 'w("APPLY_MODE: " + applyMode);'
Write-JsLine 'w("TENANT_ID: " + tenantId);'
Write-JsLine ''
Write-JsLine 'let Client;'
Write-JsLine 'try { Client = require(path.join(process.cwd(), "node_modules", "pg")).Client; }'
Write-JsLine 'catch (e1) { try { Client = require("pg").Client; } catch (e2) { w("PG_REQUIRE_ERROR: pg module not available"); safeExit("PG_MODULE_MISSING", 2); } }'
Write-JsLine ''
Write-JsLine 'const ddl = [];'
Write-JsLine ''
Write-JsLine 'ddl.push(`'
Write-JsLine 'create table if not exists pilot_demo_patients ('
Write-JsLine '  id uuid primary key,'
Write-JsLine '  tenant_id text not null,'
Write-JsLine '  demo_code text not null,'
Write-JsLine '  full_name text not null,'
Write-JsLine '  age integer,'
Write-JsLine '  sex text,'
Write-JsLine '  phone text,'
Write-JsLine '  city text,'
Write-JsLine '  risk_segment text not null,'
Write-JsLine '  cpap_status text not null,'
Write-JsLine '  compliance_status text not null,'
Write-JsLine '  clinical_summary text,'
Write-JsLine '  created_at timestamptz not null default now(),'
Write-JsLine '  updated_at timestamptz not null default now(),'
Write-JsLine '  unique (tenant_id, demo_code)'
Write-JsLine ');'
Write-JsLine '`);'
Write-JsLine ''
Write-JsLine 'ddl.push(`'
Write-JsLine 'create table if not exists pilot_demo_devices ('
Write-JsLine '  id uuid primary key,'
Write-JsLine '  tenant_id text not null,'
Write-JsLine '  patient_demo_code text not null,'
Write-JsLine '  device_brand text not null,'
Write-JsLine '  device_model text not null,'
Write-JsLine '  serial_number text not null,'
Write-JsLine '  mask_type text,'
Write-JsLine '  setup_date date,'
Write-JsLine '  status text not null,'
Write-JsLine '  created_at timestamptz not null default now(),'
Write-JsLine '  updated_at timestamptz not null default now(),'
Write-JsLine '  unique (tenant_id, serial_number)'
Write-JsLine ');'
Write-JsLine '`);'
Write-JsLine ''
Write-JsLine 'ddl.push(`'
Write-JsLine 'create table if not exists pilot_demo_compliance_nights ('
Write-JsLine '  id uuid primary key,'
Write-JsLine '  tenant_id text not null,'
Write-JsLine '  patient_demo_code text not null,'
Write-JsLine '  therapy_date date not null,'
Write-JsLine '  usage_hours numeric(5,2) not null,'
Write-JsLine '  ahi numeric(5,2),'
Write-JsLine '  leak_l_min numeric(6,2),'
Write-JsLine '  pressure_p95 numeric(5,2),'
Write-JsLine '  compliance_flag text not null,'
Write-JsLine '  created_at timestamptz not null default now(),'
Write-JsLine '  unique (tenant_id, patient_demo_code, therapy_date)'
Write-JsLine ');'
Write-JsLine '`);'
Write-JsLine ''
Write-JsLine 'ddl.push(`'
Write-JsLine 'create table if not exists pilot_demo_atlas_tasks ('
Write-JsLine '  id uuid primary key,'
Write-JsLine '  tenant_id text not null,'
Write-JsLine '  patient_demo_code text not null,'
Write-JsLine '  action_group text not null,'
Write-JsLine '  priority text not null,'
Write-JsLine '  title text not null,'
Write-JsLine '  description text,'
Write-JsLine '  status text not null,'
Write-JsLine '  due_at timestamptz,'
Write-JsLine '  created_at timestamptz not null default now(),'
Write-JsLine '  updated_at timestamptz not null default now()'
Write-JsLine ');'
Write-JsLine '`);'
Write-JsLine ''
Write-JsLine 'ddl.push(`'
Write-JsLine 'create table if not exists pilot_demo_notes ('
Write-JsLine '  id uuid primary key,'
Write-JsLine '  tenant_id text not null,'
Write-JsLine '  patient_demo_code text not null,'
Write-JsLine '  note_type text not null,'
Write-JsLine '  body text not null,'
Write-JsLine '  created_by text,'
Write-JsLine '  created_at timestamptz not null default now()'
Write-JsLine ');'
Write-JsLine '`);'
Write-JsLine ''
Write-JsLine 'const indexes = [];'
Write-JsLine 'indexes.push("create index if not exists idx_pilot_demo_patients_tenant on pilot_demo_patients (tenant_id);");'
Write-JsLine 'indexes.push("create index if not exists idx_pilot_demo_devices_tenant on pilot_demo_devices (tenant_id);");'
Write-JsLine 'indexes.push("create index if not exists idx_pilot_demo_compliance_tenant_patient on pilot_demo_compliance_nights (tenant_id, patient_demo_code);");'
Write-JsLine 'indexes.push("create index if not exists idx_pilot_demo_atlas_tenant_status on pilot_demo_atlas_tasks (tenant_id, status);");'
Write-JsLine 'indexes.push("create index if not exists idx_pilot_demo_notes_tenant_patient on pilot_demo_notes (tenant_id, patient_demo_code);");'
Write-JsLine ''
Write-JsLine 'async function tableExists(client, tableName) {'
Write-JsLine '  const result = await client.query("select to_regclass($1) as reg", ["public." + tableName]);'
Write-JsLine '  return !!(result.rows[0] && result.rows[0].reg);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'async function main() {'
Write-JsLine '  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });'
Write-JsLine '  try {'
Write-JsLine '    await client.connect();'
Write-JsLine '    w("DB_CONNECTION: OK");'
Write-JsLine '    const tables = ["pilot_demo_patients", "pilot_demo_devices", "pilot_demo_compliance_nights", "pilot_demo_atlas_tasks", "pilot_demo_notes"];'
Write-JsLine '    for (const table of tables) {'
Write-JsLine '      w("TABLE_EXISTS_BEFORE_" + table.toUpperCase() + ": " + await tableExists(client, table));'
Write-JsLine '    }'
Write-JsLine '    if (!applyMode) {'
Write-JsLine '      w("DRY_RUN_ACTION: would_create_dedicated_pilot_demo_tables");'
Write-JsLine '      for (const statement of ddl) w("DDL_PLAN: " + statement.replace(/\s+/g, " ").trim());'
Write-JsLine '      for (const statement of indexes) w("INDEX_PLAN: " + statement);'
Write-JsLine '      await client.end();'
Write-JsLine '      safeExit("DEDICATED_DEMO_SCHEMA_DRY_RUN_COMPLETED", 0);'
Write-JsLine '    }'
Write-JsLine '    await client.query("BEGIN");'
Write-JsLine '    for (const statement of ddl) await client.query(statement);'
Write-JsLine '    for (const statement of indexes) await client.query(statement);'
Write-JsLine '    await client.query("COMMIT");'
Write-JsLine '    for (const table of tables) {'
Write-JsLine '      w("TABLE_EXISTS_AFTER_" + table.toUpperCase() + ": " + await tableExists(client, table));'
Write-JsLine '    }'
Write-JsLine '    await client.end();'
Write-JsLine '    safeExit("DEDICATED_DEMO_SCHEMA_APPLIED", 0);'
Write-JsLine '  } catch (err) {'
Write-JsLine '    w("DEDICATED_DEMO_SCHEMA_ERROR: " + err.message);'
Write-JsLine '    try { await client.query("ROLLBACK"); } catch(e) {}'
Write-JsLine '    try { await client.end(); } catch(e) {}'
Write-JsLine '    safeExit("DEDICATED_DEMO_SCHEMA_FAILED", 1);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine 'main();'

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_PHASE42_DEMO_SCHEMA_REPORT = $ReportPath
    $env:RAFTOP_PHASE42_TENANT_ID = $TenantId

    if ($Apply) {
        $env:RAFTOP_PHASE42_APPLY = "true"
    } else {
        $env:RAFTOP_PHASE42_APPLY = "false"
    }

    $NodeOutput = node $JsPath 2>&1
    $NodeCode = $LASTEXITCODE

    Pop-Location

    Write-ReportLine ""
    Write-ReportLine "NODE_OUTPUT:"
    Write-ReportLine ($NodeOutput | Out-String)
    Write-ReportLine ""

    if ($NodeCode -eq 0) {
        Add-Result "Dedicated demo schema node runner" "PASS" "Node runner completed."
    } else {
        Add-Result "Dedicated demo schema node runner" "FAIL" ("Node runner failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($Apply) {
    if ($ReportContent -match "TABLE_EXISTS_AFTER_PILOT_DEMO_PATIENTS: true") {
        Add-Result "pilot_demo_patients table" "PASS" "Table exists after apply."
    } else {
        Add-Result "pilot_demo_patients table" "FAIL" "Table was not confirmed after apply."
    }

    if ($ReportContent -match "TABLE_EXISTS_AFTER_PILOT_DEMO_DEVICES: true") {
        Add-Result "pilot_demo_devices table" "PASS" "Table exists after apply."
    } else {
        Add-Result "pilot_demo_devices table" "FAIL" "Table was not confirmed after apply."
    }

    if ($ReportContent -match "TABLE_EXISTS_AFTER_PILOT_DEMO_COMPLIANCE_NIGHTS: true") {
        Add-Result "pilot_demo_compliance_nights table" "PASS" "Table exists after apply."
    } else {
        Add-Result "pilot_demo_compliance_nights table" "FAIL" "Table was not confirmed after apply."
    }

    if ($ReportContent -match "TABLE_EXISTS_AFTER_PILOT_DEMO_ATLAS_TASKS: true") {
        Add-Result "pilot_demo_atlas_tasks table" "PASS" "Table exists after apply."
    } else {
        Add-Result "pilot_demo_atlas_tasks table" "FAIL" "Table was not confirmed after apply."
    }

    if ($ReportContent -match "TABLE_EXISTS_AFTER_PILOT_DEMO_NOTES: true") {
        Add-Result "pilot_demo_notes table" "PASS" "Table exists after apply."
    } else {
        Add-Result "pilot_demo_notes table" "FAIL" "Table was not confirmed after apply."
    }
} else {
    if ($ReportContent -match "DEDICATED_DEMO_SCHEMA_DRY_RUN_COMPLETED") {
        Add-Result "Dedicated demo schema dry run" "PASS" "Dry run completed. No database changes made."
    } else {
        Add-Result "Dedicated demo schema dry run" "FAIL" "Dry run completion not confirmed."
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "DEDICATED DEMO SCHEMA INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "These tables isolate pilot demo data from production operational tables."
Write-ReportLine "This prevents unsafe writes into users, atlas_tasks, or unrelated tables."
Write-ReportLine ""
Write-ReportLine "Next phase after apply:"
Write-ReportLine "Phase 42.3 - Pilot Demo Data Seed Dry Run"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE42_DEDICATED_PILOT_DEMO_SCHEMA_FAILED"
    $ExitCode = 1
} elseif ($Apply) {
    if ($script:WarnCount -gt 0) {
        $FinalStatus = "PHASE42_DEDICATED_PILOT_DEMO_SCHEMA_APPLIED_WITH_WARNINGS"
    } else {
        $FinalStatus = "PHASE42_DEDICATED_PILOT_DEMO_SCHEMA_APPLIED"
    }
    $ExitCode = 0
} else {
    if ($script:WarnCount -gt 0) {
        $FinalStatus = "PHASE42_DEDICATED_PILOT_DEMO_SCHEMA_DRY_RUN_READY_WITH_WARNINGS"
    } else {
        $FinalStatus = "PHASE42_DEDICATED_PILOT_DEMO_SCHEMA_DRY_RUN_READY"
    }
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 42.2 Dedicated Pilot Demo Schema Plan"
Write-Host "============================================================"
Write-Host ""
Write-Host "Mode:"
Write-Host $Mode
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