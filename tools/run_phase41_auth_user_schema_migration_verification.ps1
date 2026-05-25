# RAFTOP CPAP CARE Pro
# Phase 41.6 - Auth/User Schema Migration Verification
# Safe ASCII-only script
# Reads production schema only. Does not modify database. Does not print secrets.

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
$ReportPath = Join-Path $ReportsDir ("phase41_auth_user_schema_migration_verification_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase41_auth_user_schema_migration_verification_runner.js"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.6 Auth/User Schema Migration Verification" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This script verifies that the production users table exists after Phase 41.5 migration."
Write-ReportLine "It reads schema only and does not modify the database."
Write-ReportLine "It does not print secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.6 auth/user schema migration verification..."
Write-Host ""

Test-FileExists "enterprise-backend\package.json" "Backend package.json" "YES"
Test-FileExists "tools\run_phase41_auth_user_schema_migration.ps1" "Phase 41.5 auth/user migration script" "YES"
Test-FileExists "tools\run_phase41_auth_user_schema_migration_plan.ps1" "Phase 41.4C auth/user migration plan script" "YES"

$LatestApplyReport = Get-LatestReport "phase41_auth_user_schema_migration_apply_*.md"

if ($LatestApplyReport -eq $null) {
    Add-Result "Latest auth/user migration apply report" "FAIL" "No Phase 41.5 apply report found."
} else {
    $ApplyContent = Get-Content -Path $LatestApplyReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($ApplyContent -match "FINAL STATUS: PHASE41_AUTH_USER_SCHEMA_MIGRATION_APPLIED" -or $ApplyContent -match "FINAL STATUS: PHASE41_AUTH_USER_SCHEMA_MIGRATION_APPLIED_WITH_WARNINGS") {
        Add-Result "Latest auth/user migration apply status" "PASS" "Latest apply report has acceptable final status."
    } else {
        Add-Result "Latest auth/user migration apply status" "FAIL" "Latest apply report final status is not acceptable."
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

Set-Content -Path $JsPath -Value "// RAFTOP Phase 41.6 auth/user schema migration verification runner" -Encoding UTF8

Write-JsLine 'const fs = require("fs");'
Write-JsLine 'const path = require("path");'
Write-JsLine 'const reportPath = process.env.RAFTOP_AUTH_USER_VERIFY_REPORT;'
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
Write-JsLine '  console.error("Missing RAFTOP_AUTH_USER_VERIFY_REPORT");'
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
Write-JsLine '    const tableResult = await client.query("select to_regclass($1) as reg", ["public.users"]);'
Write-JsLine '    const usersExists = tableResult.rows[0] && tableResult.rows[0].reg !== null;'
Write-JsLine '    w("USERS_TABLE_EXISTS: " + usersExists);'
Write-JsLine ''
Write-JsLine '    const columnsSql = "select column_name, data_type, is_nullable from information_schema.columns where table_schema=$1 and table_name=$2 order by ordinal_position";'
Write-JsLine '    const columns = await client.query(columnsSql, ["public", "users"]);'
Write-JsLine '    w("USERS_COLUMNS_COUNT: " + columns.rows.length);'
Write-JsLine '    for (const c of columns.rows) {'
Write-JsLine '      w("USERS_COLUMN: " + c.column_name + " | " + c.data_type + " | nullable=" + c.is_nullable);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const indexesSql = "select indexname, indexdef from pg_indexes where schemaname=$1 and tablename=$2 order by indexname";'
Write-JsLine '    const indexes = await client.query(indexesSql, ["public", "users"]);'
Write-JsLine '    w("USERS_INDEXES_COUNT: " + indexes.rows.length);'
Write-JsLine '    for (const i of indexes.rows) {'
Write-JsLine '      w("USERS_INDEX: " + i.indexname);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const required = ["id", "tenant_id", "email", "password_hash", "name", "role", "status", "created_at", "updated_at", "last_login_at"];'
Write-JsLine '    const existing = columns.rows.map(c => c.column_name);'
Write-JsLine '    const missing = required.filter(r => !existing.includes(r));'
Write-JsLine '    w("USERS_REQUIRED_COLUMNS_MISSING: " + missing.join(","));'
Write-JsLine ''
Write-JsLine '    const indexNames = indexes.rows.map(i => i.indexname);'
Write-JsLine '    const requiredIndexes = ["users_tenant_email_unique", "users_tenant_id_idx", "users_email_idx", "users_role_idx", "users_status_idx"];'
Write-JsLine '    const missingIndexes = requiredIndexes.filter(r => !indexNames.includes(r));'
Write-JsLine '    w("USERS_REQUIRED_INDEXES_MISSING: " + missingIndexes.join(","));'
Write-JsLine ''
Write-JsLine '    await client.end();'
Write-JsLine '    safeExit("AUTH_USER_SCHEMA_VERIFICATION_COMPLETED", 0);'
Write-JsLine '  } catch (err) {'
Write-JsLine '    w("AUTH_USER_SCHEMA_VERIFICATION_ERROR: " + err.message);'
Write-JsLine '    try { await client.end(); } catch (e) {}'
Write-JsLine '    safeExit("AUTH_USER_SCHEMA_VERIFICATION_FAILED", 1);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'main();'

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_AUTH_USER_VERIFY_REPORT = $ReportPath
    $NodeOutput = node $JsPath 2>&1
    $NodeCode = $LASTEXITCODE

    Pop-Location

    Write-ReportLine ""
    Write-ReportLine "NODE_OUTPUT:"
    Write-ReportLine ($NodeOutput | Out-String)
    Write-ReportLine ""

    if ($NodeCode -eq 0) {
        Add-Result "Auth/user verification node runner" "PASS" "Node runner completed."
    } else {
        Add-Result "Auth/user verification node runner" "FAIL" ("Node runner failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($ReportContent -match "USERS_TABLE_EXISTS: true") {
    Add-Result "Users table exists" "PASS" "public.users exists."
} else {
    Add-Result "Users table exists" "FAIL" "public.users was not confirmed."
}

if ($ReportContent -match "USERS_REQUIRED_COLUMNS_MISSING:\s*$") {
    Add-Result "Users required columns" "PASS" "No required users columns are missing."
} else {
    Add-Result "Users required columns" "WARN" "Some required users columns may be missing. Review report."
}

if ($ReportContent -match "USERS_REQUIRED_INDEXES_MISSING:\s*$") {
    Add-Result "Users required indexes" "PASS" "No required users indexes are missing."
} else {
    Add-Result "Users required indexes" "WARN" "Some required users indexes may be missing. Review report."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "VERIFICATION INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "If public.users exists with required columns and indexes, the auth/user schema migration is verified."
Write-ReportLine "This does not mean admin user exists yet."
Write-ReportLine ""
Write-ReportLine "Next phase:"
Write-ReportLine "Phase 41.7 - Controlled Tenant Bootstrap Script"
Write-ReportLine ""
Write-ReportLine "Then:"
Write-ReportLine "Phase 41.8 - Controlled Admin User Bootstrap Script"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.6 Auth/User Schema Migration Verification"
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