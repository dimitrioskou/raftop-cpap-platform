# RAFTOP CPAP CARE Pro
# Phase 41.5 - Safe Auth/User Schema Migration
# Safe ASCII-only script
# Dry-run by default. Use -Apply to modify database.
# Does not print secrets. Does not create admin users.

param(
    [switch]$Apply
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

$ReportPath = Join-Path $ReportsDir ("phase41_auth_user_schema_migration_" + $Mode.ToLower() + "_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase41_auth_user_schema_migration_runner.js"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.5 Safe Auth/User Schema Migration" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ("Mode: " + $Mode)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This script safely prepares the production users table required before admin user bootstrap."
Write-ReportLine "Dry run mode does not modify the database."
Write-ReportLine "Apply mode creates the users table and indexes if they do not already exist."
Write-ReportLine "This script does not create admin users and does not print secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.5 auth/user schema migration..."
Write-Host ("Mode: " + $Mode)
Write-Host ""

Test-FileExists "enterprise-backend\package.json" "Backend package.json" "YES"
Test-FileExists "tools\run_phase41_auth_user_schema_migration_plan.ps1" "Phase 41.4C auth/user migration plan script" "YES"
Test-FileExists "tools\run_phase41_production_db_schema_discovery.ps1" "Phase 41.3 schema discovery script" "YES"

$LatestPlanReport = Get-LatestReport "phase41_auth_user_schema_migration_plan_*.md"

if ($LatestPlanReport -eq $null) {
    Add-Result "Latest auth/user migration plan report" "WARN" "No Phase 41.4C migration plan report found."
} else {
    $PlanContent = Get-Content -Path $LatestPlanReport.FullName -Raw -ErrorAction SilentlyContinue
    if ($PlanContent -match "FINAL STATUS: PHASE41_AUTH_USER_SCHEMA_MIGRATION_PLAN_READY" -or $PlanContent -match "FINAL STATUS: PHASE41_AUTH_USER_SCHEMA_MIGRATION_PLAN_READY_WITH_WARNINGS") {
        Add-Result "Latest auth/user migration plan status" "PASS" "Migration plan has acceptable final status."
    } else {
        Add-Result "Latest auth/user migration plan status" "WARN" "Could not confirm acceptable migration plan final status."
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
    Add-Result "Production database URL environment variable" "PASS" "Database URL is present in environment. Secret value not printed."
}

if (Test-Path (Join-Path $BackendDir "node_modules\pg")) {
    Add-Result "Node pg dependency" "PASS" "pg dependency found in enterprise-backend node_modules."
} else {
    Add-Result "Node pg dependency" "WARN" "pg dependency not found locally. Run npm install inside enterprise-backend if Node runner fails."
}

if ($Apply) {
    Add-Result "Migration execution mode" "WARN" "APPLY mode selected. This can modify the production database schema."
} else {
    Add-Result "Migration execution mode" "PASS" "DRY_RUN mode selected. No database changes will be made."
}

Set-Content -Path $JsPath -Value "// RAFTOP Phase 41.5 auth/user schema migration runner" -Encoding UTF8

Write-JsLine 'const fs = require("fs");'
Write-JsLine 'const path = require("path");'
Write-JsLine 'const reportPath = process.env.RAFTOP_AUTH_USER_MIGRATION_REPORT;'
Write-JsLine 'const dbUrl = process.env.RAFTOP_PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;'
Write-JsLine 'const applyMode = process.env.RAFTOP_AUTH_USER_MIGRATION_APPLY === "true";'
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
Write-JsLine '  console.error("Missing RAFTOP_AUTH_USER_MIGRATION_REPORT");'
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
Write-JsLine 'w("APPLY_MODE: " + applyMode);'
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
Write-JsLine 'async function tableExists(client, tableName) {'
Write-JsLine '  const result = await client.query("select to_regclass($1) as reg", [tableName]);'
Write-JsLine '  return result.rows[0] && result.rows[0].reg !== null;'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'async function columnList(client, tableName) {'
Write-JsLine '  const sql = "select column_name, data_type, is_nullable from information_schema.columns where table_schema=$1 and table_name=$2 order by ordinal_position";'
Write-JsLine '  const result = await client.query(sql, ["public", tableName]);'
Write-JsLine '  return result.rows;'
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
Write-JsLine '    const usersExistsBefore = await tableExists(client, "public.users");'
Write-JsLine '    w("USERS_TABLE_EXISTS_BEFORE: " + usersExistsBefore);'
Write-JsLine ''
Write-JsLine '    if (!applyMode) {'
Write-JsLine '      w("DRY_RUN_ACTION: would_create_users_table_if_missing");'
Write-JsLine '      w("DRY_RUN_ACTION: would_create_users_indexes_if_missing");'
Write-JsLine '      const cols = usersExistsBefore ? await columnList(client, "users") : [];'
Write-JsLine '      w("USERS_COLUMNS_BEFORE_COUNT: " + cols.length);'
Write-JsLine '      for (const c of cols) {'
Write-JsLine '        w("USERS_COLUMN_BEFORE: " + c.column_name + " | " + c.data_type + " | nullable=" + c.is_nullable);'
Write-JsLine '      }'
Write-JsLine '      await client.end();'
Write-JsLine '      safeExit("AUTH_USER_SCHEMA_MIGRATION_DRY_RUN_COMPLETED", 0);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    await client.query("BEGIN");'
Write-JsLine ''
Write-JsLine '    const createUsersSql = ['
Write-JsLine '      "CREATE TABLE IF NOT EXISTS users (",'
Write-JsLine '      "  id SERIAL PRIMARY KEY,",'
Write-JsLine '      "  tenant_id TEXT,",'
Write-JsLine '      "  email TEXT NOT NULL,",'
Write-JsLine '      "  password_hash TEXT,",'
Write-JsLine '      "  name TEXT,",'
Write-JsLine '      "  role TEXT NOT NULL DEFAULT $$staff$$,",'
Write-JsLine '      "  status TEXT NOT NULL DEFAULT $$active$$,",'
Write-JsLine '      "  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),",'
Write-JsLine '      "  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),",'
Write-JsLine '      "  last_login_at TIMESTAMPTZ",'
Write-JsLine '      ")"'
Write-JsLine '    ].join("\n");'
Write-JsLine ''
Write-JsLine '    await client.query(createUsersSql);'
Write-JsLine '    await client.query("CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_email_unique ON users (tenant_id, lower(email))");'
Write-JsLine '    await client.query("CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users (tenant_id)");'
Write-JsLine '    await client.query("CREATE INDEX IF NOT EXISTS users_email_idx ON users (lower(email))");'
Write-JsLine '    await client.query("CREATE INDEX IF NOT EXISTS users_role_idx ON users (role)");'
Write-JsLine '    await client.query("CREATE INDEX IF NOT EXISTS users_status_idx ON users (status)");'
Write-JsLine ''
Write-JsLine '    await client.query("COMMIT");'
Write-JsLine ''
Write-JsLine '    const usersExistsAfter = await tableExists(client, "public.users");'
Write-JsLine '    w("USERS_TABLE_EXISTS_AFTER: " + usersExistsAfter);'
Write-JsLine ''
Write-JsLine '    const colsAfter = await columnList(client, "users");'
Write-JsLine '    w("USERS_COLUMNS_AFTER_COUNT: " + colsAfter.length);'
Write-JsLine '    for (const c of colsAfter) {'
Write-JsLine '      w("USERS_COLUMN_AFTER: " + c.column_name + " | " + c.data_type + " | nullable=" + c.is_nullable);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    await client.end();'
Write-JsLine '    safeExit("AUTH_USER_SCHEMA_MIGRATION_APPLIED", 0);'
Write-JsLine '  } catch (err) {'
Write-JsLine '    w("AUTH_USER_MIGRATION_ERROR: " + err.message);'
Write-JsLine '    try { await client.query("ROLLBACK"); } catch (e) {}'
Write-JsLine '    try { await client.end(); } catch (e) {}'
Write-JsLine '    safeExit("AUTH_USER_SCHEMA_MIGRATION_FAILED", 1);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'main();'

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_AUTH_USER_MIGRATION_REPORT = $ReportPath

    if ($Apply) {
        $env:RAFTOP_AUTH_USER_MIGRATION_APPLY = "true"
    } else {
        $env:RAFTOP_AUTH_USER_MIGRATION_APPLY = "false"
    }

    $NodeOutput = node $JsPath 2>&1
    $NodeCode = $LASTEXITCODE

    Pop-Location

    Write-ReportLine ""
    Write-ReportLine "NODE_OUTPUT:"
    Write-ReportLine ($NodeOutput | Out-String)
    Write-ReportLine ""

    if ($NodeCode -eq 0) {
        Add-Result "Auth/user migration node runner" "PASS" "Node runner completed."
    } else {
        Add-Result "Auth/user migration node runner" "FAIL" ("Node runner failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($Apply) {
    if ($ReportContent -match "USERS_TABLE_EXISTS_AFTER: true") {
        Add-Result "Users table after apply" "PASS" "users table exists after apply."
    } else {
        Add-Result "Users table after apply" "FAIL" "users table was not confirmed after apply."
    }

    if ($ReportContent -match "USERS_COLUMN_AFTER: email" -and $ReportContent -match "USERS_COLUMN_AFTER: password_hash" -and $ReportContent -match "USERS_COLUMN_AFTER: role") {
        Add-Result "Users table required columns" "PASS" "Required users columns confirmed."
    } else {
        Add-Result "Users table required columns" "WARN" "Could not confirm all required users columns."
    }
} else {
    if ($ReportContent -match "AUTH_USER_SCHEMA_MIGRATION_DRY_RUN_COMPLETED") {
        Add-Result "Dry run completion" "PASS" "Dry run completed without modifying database."
    } else {
        Add-Result "Dry run completion" "FAIL" "Dry run completion not confirmed."
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "MIGRATION INTERPRETATION"
Write-ReportLine ""

if ($Apply) {
    Write-ReportLine "Apply mode was used."
    Write-ReportLine "The users table and indexes should now exist if they were missing."
    Write-ReportLine "This script did not create admin users."
    Write-ReportLine ""
    Write-ReportLine "Next phase:"
    Write-ReportLine "Phase 41.6 - Re-run Schema Discovery and Confirm Users Table"
} else {
    Write-ReportLine "Dry run mode was used."
    Write-ReportLine "No database changes were made."
    Write-ReportLine ""
    Write-ReportLine "If dry run is clean, next command is:"
    Write-ReportLine ".\tools\run_phase41_auth_user_schema_migration.ps1 -Apply"
}

Write-ReportLine ""
Write-ReportLine "Target after migration:"
Write-ReportLine "- users table exists"
Write-ReportLine "- admin user not created yet"
Write-ReportLine "- tenant bootstrap not yet executed"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_FAILED"
    $ExitCode = 1
} elseif ($Apply) {
    if ($script:WarnCount -gt 0) {
        $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_APPLIED_WITH_WARNINGS"
    } else {
        $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_APPLIED"
    }
    $ExitCode = 0
} else {
    if ($script:WarnCount -gt 0) {
        $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_DRY_RUN_READY_WITH_WARNINGS"
    } else {
        $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_DRY_RUN_READY"
    }
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.5 Auth/User Schema Migration"
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