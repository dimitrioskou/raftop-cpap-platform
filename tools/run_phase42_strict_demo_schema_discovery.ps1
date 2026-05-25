# RAFTOP CPAP CARE Pro
# Phase 42.1B - Strict Demo Schema Discovery
# Safe ASCII-only script
# Reads schema only. Does not write demo data.
# Purpose: prevent unsafe mapping such as patients=users or devices=atlas_tasks.

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
$ReportPath = Join-Path $ReportsDir ("phase42_strict_demo_schema_discovery_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase42_strict_demo_schema_discovery_runner.js"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 42.1B Strict Demo Schema Discovery" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "Strict schema discovery to avoid unsafe demo data insertion."
Write-ReportLine "This script does not insert, update, or delete data."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 42.1B strict demo schema discovery..."
Write-Host ""

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

Set-Content -Path $JsPath -Value "// Phase 42.1B strict demo schema discovery runner" -Encoding UTF8

Write-JsLine 'const fs = require("fs");'
Write-JsLine 'const path = require("path");'
Write-JsLine 'const reportPath = process.env.RAFTOP_PHASE42_STRICT_REPORT;'
Write-JsLine 'const dbUrl = process.env.RAFTOP_PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;'
Write-JsLine ''
Write-JsLine 'function w(line) { fs.appendFileSync(reportPath, String(line) + "\n", "utf8"); }'
Write-JsLine 'function safeExit(status, code) { w(""); w("NODE_RUNNER_STATUS: " + status); console.log("NODE_RUNNER_STATUS: " + status); process.exit(code); }'
Write-JsLine ''
Write-JsLine 'if (!reportPath) { console.error("Missing RAFTOP_PHASE42_STRICT_REPORT"); process.exit(2); }'
Write-JsLine 'if (!dbUrl) { w("DB_URL_PRESENT: false"); safeExit("MISSING_DATABASE_URL", 2); }'
Write-JsLine 'w("DB_URL_PRESENT: true");'
Write-JsLine 'w("DB_URL_VALUE: hidden");'
Write-JsLine ''
Write-JsLine 'let Client;'
Write-JsLine 'try { Client = require(path.join(process.cwd(), "node_modules", "pg")).Client; }'
Write-JsLine 'catch (e1) { try { Client = require("pg").Client; } catch (e2) { w("PG_REQUIRE_ERROR: pg module not available"); safeExit("PG_MODULE_MISSING", 2); } }'
Write-JsLine ''
Write-JsLine 'function lowerList(columns) { return columns.map(c => String(c.column_name).toLowerCase()); }'
Write-JsLine 'function has(cols, name) { return cols.includes(name); }'
Write-JsLine 'function hasAny(cols, names) { return names.some(n => cols.includes(n)); }'
Write-JsLine 'function includesAny(value, terms) { const v = String(value || "").toLowerCase(); return terms.some(t => v.includes(t)); }'
Write-JsLine ''
Write-JsLine 'function isForbiddenForGroup(tableName, group) {'
Write-JsLine '  const n = String(tableName || "").toLowerCase();'
Write-JsLine '  if (group === "patients" && ["users", "auth_users", "accounts"].includes(n)) return true;'
Write-JsLine '  if (group === "devices" && includesAny(n, ["atlas", "task", "note", "user", "subscription"])) return true;'
Write-JsLine '  if (group === "compliance" && includesAny(n, ["atlas", "task", "note", "user", "subscription"])) return true;'
Write-JsLine '  if (group === "notes" && includesAny(n, ["atlas_task", "task"])) return true;'
Write-JsLine '  return false;'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'function strictScore(tableName, columns, group) {'
Write-JsLine '  const n = String(tableName || "").toLowerCase();'
Write-JsLine '  const cols = lowerList(columns);'
Write-JsLine '  if (isForbiddenForGroup(n, group)) return -999;'
Write-JsLine '  let score = 0;'
Write-JsLine ''
Write-JsLine '  if (group === "patients") {'
Write-JsLine '    if (!(n === "patients" || n.includes("patient"))) return 0;'
Write-JsLine '    if (n === "patients") score += 100;'
Write-JsLine '    if (n.includes("patient")) score += 50;'
Write-JsLine '    if (has(cols, "tenant_id")) score += 30;'
Write-JsLine '    if (hasAny(cols, ["name", "full_name", "first_name", "last_name", "patient_name"])) score += 30;'
Write-JsLine '    if (hasAny(cols, ["id", "patient_id"])) score += 20;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (group === "devices") {'
Write-JsLine '    if (!(n === "devices" || n.includes("device") || n.includes("cpap"))) return 0;'
Write-JsLine '    if (n === "devices") score += 100;'
Write-JsLine '    if (n.includes("device")) score += 50;'
Write-JsLine '    if (has(cols, "tenant_id")) score += 30;'
Write-JsLine '    if (hasAny(cols, ["serial_number", "serial", "device_serial"])) score += 35;'
Write-JsLine '    if (hasAny(cols, ["patient_id", "user_id"])) score += 15;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (group === "tasks") {'
Write-JsLine '    if (!(n === "tasks" || n.includes("task"))) return 0;'
Write-JsLine '    if (n === "tasks") score += 100;'
Write-JsLine '    if (n.includes("task")) score += 50;'
Write-JsLine '    if (has(cols, "tenant_id")) score += 30;'
Write-JsLine '    if (hasAny(cols, ["title", "summary", "description"])) score += 20;'
Write-JsLine '    if (has(cols, "status")) score += 20;'
Write-JsLine '    if (has(cols, "priority")) score += 15;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (group === "notes") {'
Write-JsLine '    if (!(n === "notes" || n.includes("note"))) return 0;'
Write-JsLine '    if (n === "notes") score += 100;'
Write-JsLine '    if (n.includes("note")) score += 50;'
Write-JsLine '    if (has(cols, "tenant_id")) score += 30;'
Write-JsLine '    if (hasAny(cols, ["body", "content", "note", "text"])) score += 30;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (group === "atlas") {'
Write-JsLine '    if (!(n.includes("atlas") || n.includes("signal") || n.includes("action"))) return 0;'
Write-JsLine '    if (n.includes("atlas")) score += 70;'
Write-JsLine '    if (n.includes("task")) score += 30;'
Write-JsLine '    if (n.includes("signal")) score += 30;'
Write-JsLine '    if (n.includes("action")) score += 20;'
Write-JsLine '    if (has(cols, "tenant_id")) score += 30;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  if (group === "compliance") {'
Write-JsLine '    if (!(n.includes("compliance") || n.includes("usage") || n.includes("therapy") || n.includes("cpap"))) return 0;'
Write-JsLine '    if (n.includes("compliance")) score += 70;'
Write-JsLine '    if (n.includes("usage")) score += 40;'
Write-JsLine '    if (n.includes("therapy")) score += 30;'
Write-JsLine '    if (has(cols, "tenant_id")) score += 30;'
Write-JsLine '    if (hasAny(cols, ["hours", "usage_hours", "used_hours", "total_hours"])) score += 30;'
Write-JsLine '  }'
Write-JsLine ''
Write-JsLine '  return score;'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'async function main() {'
Write-JsLine '  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });'
Write-JsLine '  try {'
Write-JsLine '    await client.connect();'
Write-JsLine '    w("DB_CONNECTION: OK");'
Write-JsLine '    const tablesResult = await client.query("select table_name from information_schema.tables where table_schema=$1 and table_type=$2 order by table_name", ["public", "BASE TABLE"]);'
Write-JsLine '    const tableNames = tablesResult.rows.map(r => r.table_name);'
Write-JsLine '    w("TOTAL_TABLES: " + tableNames.length);'
Write-JsLine '    const groups = ["patients", "devices", "tasks", "notes", "atlas", "compliance"];'
Write-JsLine '    const selected = {};'
Write-JsLine '    for (const tableName of tableNames) {'
Write-JsLine '      const columnsResult = await client.query("select column_name, data_type, is_nullable from information_schema.columns where table_schema=$1 and table_name=$2 order by ordinal_position", ["public", tableName]);'
Write-JsLine '      const columns = columnsResult.rows;'
Write-JsLine '      w("TABLE: " + tableName);'
Write-JsLine '      w("COLUMNS: " + columns.map(c => c.column_name + ":" + c.data_type).join(", "));'
Write-JsLine '      for (const group of groups) {'
Write-JsLine '        const score = strictScore(tableName, columns, group);'
Write-JsLine '        if (score > 0) {'
Write-JsLine '          w("STRICT_CANDIDATE_" + group.toUpperCase() + ": " + tableName + " | score=" + score);'
Write-JsLine '          if (!selected[group] || score > selected[group].score) selected[group] = { tableName, score };'
Write-JsLine '        }'
Write-JsLine '      }'
Write-JsLine '    }'
Write-JsLine '    for (const group of groups) {'
Write-JsLine '      if (selected[group]) {'
Write-JsLine '        w("STRICT_SELECTED_" + group.toUpperCase() + "_TABLE: " + selected[group].tableName);'
Write-JsLine '        w("STRICT_SELECTED_" + group.toUpperCase() + "_SCORE: " + selected[group].score);'
Write-JsLine '      } else {'
Write-JsLine '        w("STRICT_SELECTED_" + group.toUpperCase() + "_TABLE:");'
Write-JsLine '      }'
Write-JsLine '    }'
Write-JsLine '    await client.end();'
Write-JsLine '    safeExit("STRICT_SCHEMA_DISCOVERY_COMPLETED", 0);'
Write-JsLine '  } catch (err) {'
Write-JsLine '    w("STRICT_SCHEMA_DISCOVERY_ERROR: " + err.message);'
Write-JsLine '    try { await client.end(); } catch(e) {}'
Write-JsLine '    safeExit("STRICT_SCHEMA_DISCOVERY_FAILED", 1);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine 'main();'

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_PHASE42_STRICT_REPORT = $ReportPath
    $NodeOutput = node $JsPath 2>&1
    $NodeCode = $LASTEXITCODE

    Pop-Location

    Write-ReportLine ""
    Write-ReportLine "NODE_OUTPUT:"
    Write-ReportLine ($NodeOutput | Out-String)
    Write-ReportLine ""

    if ($NodeCode -eq 0) {
        Add-Result "Strict schema discovery node runner" "PASS" "Node runner completed."
    } else {
        Add-Result "Strict schema discovery node runner" "FAIL" ("Node runner failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($ReportContent -match "STRICT_SELECTED_PATIENTS_TABLE:\s*\S+" -and $ReportContent -notmatch "STRICT_SELECTED_PATIENTS_TABLE:\s*users") {
    Add-Result "Strict patients table" "PASS" "Safe patients table selected."
} else {
    Add-Result "Strict patients table" "WARN" "No safe patients table selected."
}

if ($ReportContent -match "STRICT_SELECTED_DEVICES_TABLE:\s*\S+" -and $ReportContent -notmatch "STRICT_SELECTED_DEVICES_TABLE:\s*atlas_tasks") {
    Add-Result "Strict devices table" "PASS" "Safe devices table selected."
} else {
    Add-Result "Strict devices table" "WARN" "No safe devices table selected."
}

if ($ReportContent -match "STRICT_SELECTED_TASKS_TABLE:\s*\S+") {
    Add-Result "Strict tasks table" "PASS" "Tasks table selected."
} else {
    Add-Result "Strict tasks table" "WARN" "No tasks table selected."
}

if ($ReportContent -match "STRICT_SELECTED_ATLAS_TABLE:\s*\S+") {
    Add-Result "Strict ATLAS table" "PASS" "ATLAS/action table selected."
} else {
    Add-Result "Strict ATLAS table" "WARN" "No ATLAS table selected."
}

if ($ReportContent -match "STRICT_SELECTED_COMPLIANCE_TABLE:\s*\S+" -and $ReportContent -notmatch "STRICT_SELECTED_COMPLIANCE_TABLE:\s*atlas_tasks") {
    Add-Result "Strict compliance table" "PASS" "Safe compliance table selected."
} else {
    Add-Result "Strict compliance table" "WARN" "No safe compliance table selected."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "STRICT DISCOVERY INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "Unsafe mappings are intentionally rejected."
Write-ReportLine "If patients/devices/compliance tables are missing, do not seed business demo data directly."
Write-ReportLine "Next option is to create a dedicated pilot_demo_* schema/table set or seed only safe existing tables."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE42_STRICT_DEMO_SCHEMA_DISCOVERY_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE42_STRICT_DEMO_SCHEMA_DISCOVERY_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE42_STRICT_DEMO_SCHEMA_DISCOVERY_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 42.1B Strict Demo Schema Discovery"
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