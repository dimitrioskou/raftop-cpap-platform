# RAFTOP CPAP CARE Pro
# Phase 42.1 - Pilot Demo Data Readiness Discovery
# Safe ASCII-only script
# Reads production schema only. Does not insert, update, or delete data.
# Purpose: decide safe demo data seeding strategy for Raftopoulos pilot presentation.

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
$ReportPath = Join-Path $ReportsDir ("phase42_pilot_demo_data_readiness_discovery_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase42_pilot_demo_data_readiness_runner.js"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 42.1 Pilot Demo Data Readiness Discovery" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report discovers the production schema required for safe pilot demo data seeding."
Write-ReportLine "It does not insert, update, or delete data."
Write-ReportLine "It does not print secrets."
Write-ReportLine ""
Write-ReportLine "Target pilot tenant:"
Write-ReportLine "raftopoulos-live"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 42.1 pilot demo data readiness discovery..."
Write-Host ""

$LatestAuditReport = Get-LatestReport "phase41_backend_protected_route_authorization_audit_*.md"
$LatestE2EReport = Get-LatestReport "phase41_admin_login_e2e_verification_*.md"

if ($LatestAuditReport -eq $null) {
    Add-Result "Latest backend authorization audit report" "WARN" "No Phase 41.11 report found."
} else {
    $AuditContent = Get-Content -Path $LatestAuditReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($AuditContent -match "FINAL STATUS: PHASE41_BACKEND_PROTECTED_ROUTE_AUTHORIZATION_AUDIT_READY") {
        Add-Result "Latest backend authorization audit status" "PASS" "Backend authorization audit has ready final status."
    } else {
        Add-Result "Latest backend authorization audit status" "WARN" "Backend authorization audit final status not confirmed as READY."
    }
}

if ($LatestE2EReport -eq $null) {
    Add-Result "Latest admin login E2E report" "WARN" "No Phase 41.12 report found."
} else {
    $E2EContent = Get-Content -Path $LatestE2EReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($E2EContent -match "FINAL STATUS: PHASE41_ADMIN_LOGIN_E2E_VERIFIED" -or $E2EContent -match "FINAL STATUS: PHASE41_ADMIN_LOGIN_E2E_VERIFIED_WITH_WARNINGS") {
        Add-Result "Latest admin login E2E status" "PASS" "Admin login E2E has acceptable final status."
    } else {
        Add-Result "Latest admin login E2E status" "WARN" "Admin login E2E final status not confirmed acceptable."
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
    Add-Result "Node pg dependency" "WARN" "pg dependency not found locally. Run npm install inside enterprise-backend if Node runner fails."
}

Set-Content -Path $JsPath -Value "// RAFTOP Phase 42.1 pilot demo data readiness discovery runner" -Encoding UTF8

Write-JsLine 'const fs = require("fs");'
Write-JsLine 'const path = require("path");'
Write-JsLine 'const reportPath = process.env.RAFTOP_PHASE42_REPORT;'
Write-JsLine 'const dbUrl = process.env.RAFTOP_PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;'
Write-JsLine 'const tenantId = "raftopoulos-live";'
Write-JsLine ''
Write-JsLine 'function w(line) {'
Write-JsLine '  fs.appendFileSync(reportPath, String(line) + "\n", "utf8");'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'function safeExit(status, code) {'
Write-JsLine '  w("");'
Write-JsLine '  w("NODE_RUNNER_STATUS: " + status);'
Write-JsLine '  console.log("NODE_RUNNER_STATUS: " + status);'
Write-JsLine '  process.exit(code);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'if (!reportPath) {'
Write-JsLine '  console.error("Missing RAFTOP_PHASE42_REPORT");'
Write-JsLine '  process.exit(2);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'if (!dbUrl) {'
Write-JsLine '  w("DB_URL_PRESENT: false");'
Write-JsLine '  safeExit("MISSING_DATABASE_URL", 2);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'w("DB_URL_PRESENT: true");'
Write-JsLine 'w("DB_URL_VALUE: hidden");'
Write-JsLine ''
Write-JsLine 'let Client;'
Write-JsLine 'try {'
Write-JsLine '  Client = require(path.join(process.cwd(), "node_modules", "pg")).Client;'
Write-JsLine '} catch (e1) {'
Write-JsLine '  try {'
Write-JsLine '    Client = require("pg").Client;'
Write-JsLine '  } catch (e2) {'
Write-JsLine '    w("PG_REQUIRE_ERROR: pg module not available");'
Write-JsLine '    safeExit("PG_MODULE_MISSING", 2);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'function hasAny(value, terms) {'
Write-JsLine '  const v = String(value || "").toLowerCase();'
Write-JsLine '  return terms.some(t => v.includes(t));'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'async function getColumns(client, tableName) {'
Write-JsLine '  const result = await client.query('
Write-JsLine '    "select column_name, data_type, is_nullable from information_schema.columns where table_schema=$1 and table_name=$2 order by ordinal_position",'
Write-JsLine '    ["public", tableName]'
Write-JsLine '  );'
Write-JsLine '  return result.rows;'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'function scoreTable(tableName, columns, group) {'
Write-JsLine '  const name = String(tableName || "").toLowerCase();'
Write-JsLine '  const cols = columns.map(c => String(c.column_name).toLowerCase());'
Write-JsLine '  let score = 0;'
Write-JsLine ''
Write-JsLine '  if (group === "patients") {'
Write-JsLine '    if (name === "patients") score += 100;'
Write-JsLine '    if (name.includes("patient")) score += 40;'
Write-JsLine '    if (cols.includes("tenant_id")) score += 20;'
Write-JsLine '    if (cols.includes("name") || cols.includes("full_name")) score += 20;'
Write-JsLine '    if (cols.includes("email")) score += 10;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (group === "devices") {'
Write-JsLine '    if (name === "devices") score += 100;'
Write-JsLine '    if (name.includes("device")) score += 40;'
Write-JsLine '    if (cols.includes("serial_number") || cols.includes("serial")) score += 30;'
Write-JsLine '    if (cols.includes("tenant_id")) score += 20;'
Write-JsLine '    if (cols.includes("patient_id")) score += 20;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (group === "tasks") {'
Write-JsLine '    if (name === "tasks") score += 90;'
Write-JsLine '    if (name.includes("task")) score += 50;'
Write-JsLine '    if (cols.includes("tenant_id")) score += 20;'
Write-JsLine '    if (cols.includes("status")) score += 10;'
Write-JsLine '    if (cols.includes("priority")) score += 10;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (group === "notes") {'
Write-JsLine '    if (name === "notes") score += 90;'
Write-JsLine '    if (name.includes("note")) score += 50;'
Write-JsLine '    if (cols.includes("tenant_id")) score += 20;'
Write-JsLine '    if (cols.includes("patient_id")) score += 10;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (group === "atlas") {'
Write-JsLine '    if (name.includes("atlas")) score += 70;'
Write-JsLine '    if (name.includes("action")) score += 30;'
Write-JsLine '    if (name.includes("signal")) score += 30;'
Write-JsLine '    if (cols.includes("tenant_id")) score += 20;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (group === "compliance") {'
Write-JsLine '    if (name.includes("compliance")) score += 70;'
Write-JsLine '    if (name.includes("usage")) score += 30;'
Write-JsLine '    if (name.includes("therapy")) score += 20;'
Write-JsLine '    if (cols.includes("hours") || cols.includes("usage_hours")) score += 20;'
Write-JsLine '    if (cols.includes("tenant_id")) score += 20;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (name.includes("backup") || name.includes("audit_log")) score -= 50;'
Write-JsLine '  return score;'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'async function main() {'
Write-JsLine '  const client = new Client({'
Write-JsLine '    connectionString: dbUrl,'
Write-JsLine '    ssl: { rejectUnauthorized: false }'
Write-JsLine '  });'
Write-JsLine ''
Write-JsLine '  try {'
Write-JsLine '    await client.connect();'
Write-JsLine '    w("DB_CONNECTION: OK");'
Write-JsLine ''
Write-JsLine '    const tablesResult = await client.query("select table_name from information_schema.tables where table_schema=$1 and table_type=$2 order by table_name", ["public", "BASE TABLE"]);'
Write-JsLine '    const tableNames = tablesResult.rows.map(r => r.table_name);'
Write-JsLine '    w("TOTAL_TABLES: " + tableNames.length);'
Write-JsLine ''
Write-JsLine '    const groups = ["patients", "devices", "tasks", "notes", "atlas", "compliance"];'
Write-JsLine '    const selected = {};'
Write-JsLine ''
Write-JsLine '    for (const tableName of tableNames) {'
Write-JsLine '      const columns = await getColumns(client, tableName);'
Write-JsLine '      w("TABLE: " + tableName);'
Write-JsLine '      w("COLUMNS: " + columns.map(c => c.column_name + ":" + c.data_type).join(", "));'
Write-JsLine ''
Write-JsLine '      for (const group of groups) {'
Write-JsLine '        const score = scoreTable(tableName, columns, group);'
Write-JsLine '        if (score > 0) {'
Write-JsLine '          w("CANDIDATE_" + group.toUpperCase() + ": " + tableName + " | score=" + score);'
Write-JsLine '          if (!selected[group] || score > selected[group].score) {'
Write-JsLine '            selected[group] = { tableName, score, columns };'
Write-JsLine '          }'
Write-JsLine '        }'
Write-JsLine '      }'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    for (const group of groups) {'
Write-JsLine '      if (selected[group]) {'
Write-JsLine '        w("SELECTED_" + group.toUpperCase() + "_TABLE: " + selected[group].tableName);'
Write-JsLine '        w("SELECTED_" + group.toUpperCase() + "_SCORE: " + selected[group].score);'
Write-JsLine '      } else {'
Write-JsLine '        w("SELECTED_" + group.toUpperCase() + "_TABLE:");'
Write-JsLine '      }'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const tenantCheck = await client.query("select count(*)::int as count from information_schema.columns where table_schema=$1 and column_name=$2", ["public", "tenant_id"]);'
Write-JsLine '    w("TABLES_WITH_TENANT_ID_COLUMN_COUNT: " + tenantCheck.rows[0].count);'
Write-JsLine ''
Write-JsLine '    await client.end();'
Write-JsLine '    safeExit("PHASE42_SCHEMA_DISCOVERY_COMPLETED", 0);'
Write-JsLine '  } catch (err) {'
Write-JsLine '    w("PHASE42_DISCOVERY_ERROR: " + err.message);'
Write-JsLine '    try { await client.end(); } catch (e) {}'
Write-JsLine '    safeExit("PHASE42_SCHEMA_DISCOVERY_FAILED", 1);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'main();'

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_PHASE42_REPORT = $ReportPath
    $NodeOutput = node $JsPath 2>&1
    $NodeCode = $LASTEXITCODE

    Pop-Location

    Write-ReportLine ""
    Write-ReportLine "NODE_OUTPUT:"
    Write-ReportLine ($NodeOutput | Out-String)
    Write-ReportLine ""

    if ($NodeCode -eq 0) {
        Add-Result "Schema discovery node runner" "PASS" "Node runner completed."
    } else {
        Add-Result "Schema discovery node runner" "FAIL" ("Node runner failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($ReportContent -match "SELECTED_PATIENTS_TABLE:\s*\S+") {
    Add-Result "Patients table candidate" "PASS" "Patients table candidate selected."
} else {
    Add-Result "Patients table candidate" "WARN" "No patients table candidate selected."
}

if ($ReportContent -match "SELECTED_DEVICES_TABLE:\s*\S+") {
    Add-Result "Devices table candidate" "PASS" "Devices table candidate selected."
} else {
    Add-Result "Devices table candidate" "WARN" "No devices table candidate selected."
}

if ($ReportContent -match "SELECTED_TASKS_TABLE:\s*\S+") {
    Add-Result "Tasks table candidate" "PASS" "Tasks table candidate selected."
} else {
    Add-Result "Tasks table candidate" "WARN" "No tasks table candidate selected."
}

if ($ReportContent -match "SELECTED_ATLAS_TABLE:\s*\S+") {
    Add-Result "ATLAS table candidate" "PASS" "ATLAS/action table candidate selected."
} else {
    Add-Result "ATLAS table candidate" "WARN" "No ATLAS/action table candidate selected."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "READINESS INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "This phase only discovers schema. It does not seed demo data."
Write-ReportLine "If patients/devices/tasks tables are selected, Phase 42.2 can generate a safe dry-run demo seed plan."
Write-ReportLine "If ATLAS table is missing, Phase 42.2 can still seed patients/devices/tasks and leave ATLAS route demo to API fallback or later implementation."
Write-ReportLine ""
Write-ReportLine "Next phase:"
Write-ReportLine "Phase 42.2 - Pilot Demo Data Seed Plan"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE42_PILOT_DEMO_DATA_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE42_PILOT_DEMO_DATA_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE42_PILOT_DEMO_DATA_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 42.1 Pilot Demo Data Readiness Discovery"
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