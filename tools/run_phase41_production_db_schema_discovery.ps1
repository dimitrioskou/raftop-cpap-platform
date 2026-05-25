# RAFTOP CPAP CARE Pro
# Phase 41.3 - Production DB Schema Discovery v2
# Safe ASCII-only script
# Reads schema only. Does not print secrets. Does not modify database.
# Fix: no JavaScript backticks / no template literals.

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
$ReportPath = Join-Path $ReportsDir ("phase41_production_db_schema_discovery_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase41_schema_discovery_runner.js"

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
        [string]$Status,
        [string]$Details
    )

    if ($Status -eq "PASS") {
        $script:PassCount++
    } elseif ($Status -eq "WARN") {
        $script:WarnCount++
    } else {
        $script:FailCount++
    }

    Write-ReportLine ("CHECK: " + $Name)
    Write-ReportLine ("STATUS: " + $Status)
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($Status + " - " + $Name)
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

function Test-FileExists {
    param(
        [string]$RelativePath,
        [string]$Name,
        [string]$Required
    )

    $FullPath = Join-Path $Root $RelativePath

    if (Test-Path $FullPath) {
        Add-Result $Name "PASS" ("Found: " + $RelativePath)
    } else {
        if ($Required -eq "YES") {
            Add-Result $Name "FAIL" ("Missing required file: " + $RelativePath)
        } else {
            Add-Result $Name "WARN" ("Optional file missing: " + $RelativePath)
        }
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.3 Production DB Schema Discovery v2" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This script reads production PostgreSQL schema metadata to determine the safest tenant/admin bootstrap method."
Write-ReportLine "It does not print secrets and does not modify the database."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.3 production DB schema discovery v2..."
Write-Host ""

Test-FileExists "enterprise-backend\package.json" "Backend package.json" "YES"
Test-FileExists "tools\run_phase41_tenant_bootstrap_discovery.ps1" "Phase 41.2 discovery script" "YES"

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
    Add-Result "Production database URL environment variable" "PASS" "Database URL is present in environment. Secret value not printed."
}

if (Test-Path (Join-Path $BackendDir "node_modules\pg")) {
    Add-Result "Node pg dependency" "PASS" "pg dependency found in enterprise-backend node_modules."
} else {
    Add-Result "Node pg dependency" "WARN" "pg dependency not found locally. Run npm install inside enterprise-backend if Node runner fails."
}

Set-Content -Path $JsPath -Value "// RAFTOP Phase 41.3 schema discovery runner v2" -Encoding UTF8

Write-JsLine 'const fs = require("fs");'
Write-JsLine 'const path = require("path");'
Write-JsLine 'const reportPath = process.env.RAFTOP_SCHEMA_DISCOVERY_REPORT;'
Write-JsLine 'const dbUrl = process.env.RAFTOP_PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;'
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
Write-JsLine '  console.error("Missing RAFTOP_SCHEMA_DISCOVERY_REPORT");'
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
Write-JsLine '    const version = await client.query("select version() as version");'
Write-JsLine '    w("POSTGRES_VERSION: " + version.rows[0].version);'
Write-JsLine ''
Write-JsLine '    const tablesSql = "select table_schema, table_name from information_schema.tables where table_schema not in ($1,$2) and table_type=$3 order by table_schema, table_name";'
Write-JsLine '    const tables = await client.query(tablesSql, ["pg_catalog", "information_schema", "BASE TABLE"]);'
Write-JsLine ''
Write-JsLine '    w("");'
Write-JsLine '    w("TABLE_COUNT: " + tables.rows.length);'
Write-JsLine '    w("");'
Write-JsLine '    w("TABLES:");'
Write-JsLine '    for (const r of tables.rows) {'
Write-JsLine '      w("- " + r.table_schema + "." + r.table_name);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const columnsSql = "select table_schema, table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema not in ($1,$2) order by table_schema, table_name, ordinal_position";'
Write-JsLine '    const columns = await client.query(columnsSql, ["pg_catalog", "information_schema"]);'
Write-JsLine ''
Write-JsLine '    w("");'
Write-JsLine '    w("COLUMNS:");'
Write-JsLine '    let current = "";'
Write-JsLine '    for (const c of columns.rows) {'
Write-JsLine '      const key = c.table_schema + "." + c.table_name;'
Write-JsLine '      if (key !== current) {'
Write-JsLine '        current = key;'
Write-JsLine '        w("");'
Write-JsLine '        w("TABLE: " + key);'
Write-JsLine '      }'
Write-JsLine '      w("  - " + c.column_name + " | " + c.data_type + " | nullable=" + c.is_nullable);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const names = tables.rows.map(r => String(r.table_name).toLowerCase());'
Write-JsLine '    function hasAny(words) {'
Write-JsLine '      return names.filter(n => words.some(word => n.includes(word)));'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const tenantTables = hasAny(["tenant"]);'
Write-JsLine '    const userTables = hasAny(["user", "account"]);'
Write-JsLine '    const subscriptionTables = hasAny(["subscription", "plan", "module", "entitlement"]);'
Write-JsLine '    const auditTables = hasAny(["audit", "activity", "login", "security"]);'
Write-JsLine '    const patientTables = hasAny(["patient"]);'
Write-JsLine '    const deviceTables = hasAny(["device"]);'
Write-JsLine '    const atlasTables = hasAny(["atlas", "signal", "action", "task"]);'
Write-JsLine ''
Write-JsLine '    w("");'
Write-JsLine '    w("DISCOVERY_GROUPS:");'
Write-JsLine '    w("tenant_tables=" + tenantTables.join(","));'
Write-JsLine '    w("user_tables=" + userTables.join(","));'
Write-JsLine '    w("subscription_module_tables=" + subscriptionTables.join(","));'
Write-JsLine '    w("audit_security_tables=" + auditTables.join(","));'
Write-JsLine '    w("patient_tables=" + patientTables.join(","));'
Write-JsLine '    w("device_tables=" + deviceTables.join(","));'
Write-JsLine '    w("atlas_task_tables=" + atlasTables.join(","));'
Write-JsLine ''
Write-JsLine '    w("");'
Write-JsLine '    if (tenantTables.length > 0 && userTables.length > 0) {'
Write-JsLine '      w("BOOTSTRAP_RECOMMENDATION: controlled_db_bootstrap_possible");'
Write-JsLine '    } else {'
Write-JsLine '      w("BOOTSTRAP_RECOMMENDATION: schema_incomplete_or_nonstandard_review_required");'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    await client.end();'
Write-JsLine '    safeExit("SCHEMA_DISCOVERY_COMPLETED", 0);'
Write-JsLine '  } catch (err) {'
Write-JsLine '    w("DB_CONNECTION_OR_QUERY_ERROR: " + err.message);'
Write-JsLine '    try { await client.end(); } catch (e) {}'
Write-JsLine '    safeExit("SCHEMA_DISCOVERY_FAILED", 1);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'main();'

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_SCHEMA_DISCOVERY_REPORT = $ReportPath
    $NodeOutput = node $JsPath 2>&1
    $NodeCode = $LASTEXITCODE

    Pop-Location

    Write-ReportLine ""
    Write-ReportLine "NODE_OUTPUT:"
    Write-ReportLine ($NodeOutput | Out-String)
    Write-ReportLine ""

    if ($NodeCode -eq 0) {
        Add-Result "Schema discovery node runner" "PASS" "Node schema discovery completed."
    } else {
        Add-Result "Schema discovery node runner" "FAIL" ("Node schema discovery failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($ReportContent -match "TABLE_COUNT: 0") {
    Add-Result "Database table count" "WARN" "Database has zero discovered application tables."
} elseif ($ReportContent -match "TABLE_COUNT:") {
    Add-Result "Database table count" "PASS" "Database tables discovered."
} else {
    Add-Result "Database table count" "WARN" "Could not determine table count."
}

if ($ReportContent -match "tenant_tables=.+") {
    Add-Result "Tenant tables discovered" "PASS" "Tenant-related table names discovered."
} else {
    Add-Result "Tenant tables discovered" "WARN" "No tenant-related table names discovered."
}

if ($ReportContent -match "user_tables=.+") {
    Add-Result "User tables discovered" "PASS" "User/account-related table names discovered."
} else {
    Add-Result "User tables discovered" "WARN" "No user/account-related table names discovered."
}

if ($ReportContent -match "BOOTSTRAP_RECOMMENDATION: controlled_db_bootstrap_possible") {
    Add-Result "Bootstrap recommendation" "PASS" "Controlled DB bootstrap appears possible."
} elseif ($ReportContent -match "BOOTSTRAP_RECOMMENDATION: schema_incomplete_or_nonstandard_review_required") {
    Add-Result "Bootstrap recommendation" "WARN" "Schema requires manual review before tenant bootstrap."
} else {
    Add-Result "Bootstrap recommendation" "WARN" "No bootstrap recommendation found."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "NEXT PHASE"
Write-ReportLine ""
Write-ReportLine "Phase 41.4 - Controlled Tenant Bootstrap Script"
Write-ReportLine ""
Write-ReportLine "This must only be created after reviewing discovered tenant/user/subscription table structure."
Write-ReportLine ""
Write-ReportLine "Target tenant:"
Write-ReportLine "tenant_id: raftopoulos-live"
Write-ReportLine "tenant_name: RAFTOPOULOS"
Write-ReportLine "plan: enterprise"
Write-ReportLine "status: active"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_PRODUCTION_DB_SCHEMA_DISCOVERY_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_PRODUCTION_DB_SCHEMA_DISCOVERY_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_PRODUCTION_DB_SCHEMA_DISCOVERY_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.3 Production DB Schema Discovery v2"
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