# RAFTOP CPAP CARE Pro
# Phase 41.8 - Controlled Admin User Bootstrap Script v2
# Safe ASCII-only script
# Dry-run by default. Use -Apply to insert/update admin user.
# Dynamic tenant table mapping. Does not print passwords or secrets.

param(
    [switch]$Apply,
    [string]$TenantId = "raftopoulos-live",
    [string]$AdminEmail = "dimitrisgelly@gmail.com",
    [string]$AdminName = "RAFTOP Platform Admin",
    [string]$AdminRole = "admin",
    [string]$AdminStatus = "active"
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

$ReportPath = Join-Path $ReportsDir ("phase41_controlled_admin_user_bootstrap_" + $Mode.ToLower() + "_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase41_controlled_admin_user_bootstrap_runner.js"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.8 Controlled Admin User Bootstrap v2" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ("Mode: " + $Mode)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This script safely prepares or creates the initial tenant admin user."
Write-ReportLine "Dry run mode does not modify the database."
Write-ReportLine "Apply mode inserts or updates the admin user for the target tenant."
Write-ReportLine "Tenant table mapping is dynamic."
Write-ReportLine "This script does not print passwords or secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.8 controlled admin user bootstrap v2..."
Write-Host ("Mode: " + $Mode)
Write-Host ""

Test-FileExists "enterprise-backend\package.json" "Backend package.json" "YES"
Test-FileExists "tools\run_phase41_controlled_tenant_bootstrap_verification.ps1" "Phase 41.7B tenant verification script" "YES"
Test-FileExists "tools\run_phase41_auth_user_schema_migration_verification.ps1" "Phase 41.6 auth/user verification script" "YES"

$LatestTenantVerifyReport = Get-LatestReport "phase41_controlled_tenant_bootstrap_verification_*.md"

if ($LatestTenantVerifyReport -eq $null) {
    Add-Result "Latest tenant verification report" "FAIL" "No Phase 41.7B tenant verification report found."
} else {
    $TenantVerifyContent = Get-Content -Path $LatestTenantVerifyReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($TenantVerifyContent -match "FINAL STATUS: PHASE41_CONTROLLED_TENANT_BOOTSTRAP_VERIFIED" -or $TenantVerifyContent -match "FINAL STATUS: PHASE41_CONTROLLED_TENANT_BOOTSTRAP_VERIFIED_WITH_WARNINGS") {
        Add-Result "Latest tenant verification status" "PASS" "Latest tenant verification has acceptable final status."
    } else {
        Add-Result "Latest tenant verification status" "FAIL" "Latest tenant verification final status is not acceptable."
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

$AdminPassword = $env:RAFTOP_BOOTSTRAP_ADMIN_PASSWORD

if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    Add-Result "Admin password environment variable" "FAIL" "Set RAFTOP_BOOTSTRAP_ADMIN_PASSWORD in the current PowerShell session."
} elseif ($AdminPassword.Length -lt 12) {
    Add-Result "Admin password strength" "FAIL" "Admin password must be at least 12 characters."
} else {
    Add-Result "Admin password environment variable" "PASS" "Admin password is present. Value not printed."
}

if (Test-Path (Join-Path $BackendDir "node_modules\pg")) {
    Add-Result "Node pg dependency" "PASS" "pg dependency found in enterprise-backend node_modules."
} else {
    Add-Result "Node pg dependency" "WARN" "pg dependency not found locally. Run npm install inside enterprise-backend if Node runner fails."
}

if (Test-Path (Join-Path $BackendDir "node_modules\bcryptjs")) {
    Add-Result "Node bcryptjs dependency" "PASS" "bcryptjs dependency found in enterprise-backend node_modules."
} else {
    Add-Result "Node bcryptjs dependency" "WARN" "bcryptjs dependency not found locally."
}

if ($Apply) {
    Add-Result "Admin user bootstrap execution mode" "WARN" "APPLY mode selected. This can insert/update the production admin user."
} else {
    Add-Result "Admin user bootstrap execution mode" "PASS" "DRY_RUN mode selected. No database changes will be made."
}

Set-Content -Path $JsPath -Value "// RAFTOP Phase 41.8 controlled admin user bootstrap runner v2" -Encoding UTF8

Write-JsLine 'const fs = require("fs");'
Write-JsLine 'const path = require("path");'
Write-JsLine 'const reportPath = process.env.RAFTOP_ADMIN_BOOTSTRAP_REPORT;'
Write-JsLine 'const dbUrl = process.env.RAFTOP_PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;'
Write-JsLine 'const applyMode = process.env.RAFTOP_ADMIN_BOOTSTRAP_APPLY === "true";'
Write-JsLine 'const tenantId = process.env.RAFTOP_ADMIN_TENANT_ID || "raftopoulos-live";'
Write-JsLine 'const adminEmail = process.env.RAFTOP_ADMIN_EMAIL || "dimitrisgelly@gmail.com";'
Write-JsLine 'const adminName = process.env.RAFTOP_ADMIN_NAME || "RAFTOP Platform Admin";'
Write-JsLine 'const adminRole = process.env.RAFTOP_ADMIN_ROLE || "admin";'
Write-JsLine 'const adminStatus = process.env.RAFTOP_ADMIN_STATUS || "active";'
Write-JsLine 'const adminPassword = process.env.RAFTOP_BOOTSTRAP_ADMIN_PASSWORD || "";'
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
Write-JsLine 'function quoteIdent(value) {'
Write-JsLine '  return "\"" + String(value).replace(/"/g, "\"\"") + "\"";'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'function columnByNames(columns, names) {'
Write-JsLine '  const lower = columns.map(c => ({ name: c.column_name, lower: String(c.column_name).toLowerCase(), type: c.data_type }));'
Write-JsLine '  for (const n of names) {'
Write-JsLine '    const found = lower.find(c => c.lower === n);'
Write-JsLine '    if (found) return found;'
Write-JsLine '  }'
Write-JsLine '  return null;'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'function isTextCompatible(col) {'
Write-JsLine '  if (!col) return false;'
Write-JsLine '  const t = String(col.type).toLowerCase();'
Write-JsLine '  return t.includes("text") || t.includes("character") || t.includes("varchar");'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'function scoreTenantTable(tableName, columns) {'
Write-JsLine '  const name = String(tableName).toLowerCase();'
Write-JsLine '  const colNames = columns.map(c => String(c.column_name).toLowerCase());'
Write-JsLine '  let score = 0;'
Write-JsLine '  if (name === "tenants") score += 100;'
Write-JsLine '  if (name === "tenant") score += 90;'
Write-JsLine '  if (name.includes("tenant")) score += 20;'
Write-JsLine '  if (colNames.includes("tenant_id")) score += 50;'
Write-JsLine '  if (colNames.includes("id")) score += 20;'
Write-JsLine '  if (colNames.includes("tenant_name")) score += 30;'
Write-JsLine '  if (colNames.includes("name")) score += 20;'
Write-JsLine '  if (colNames.includes("plan")) score += 10;'
Write-JsLine '  if (colNames.includes("status")) score += 10;'
Write-JsLine '  const badWords = ["subscription", "module", "user", "patient", "device", "task", "audit", "activity", "setting", "branding", "integration"];'
Write-JsLine '  if (badWords.some(w => name.includes(w))) score -= 80;'
Write-JsLine '  return score;'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'if (!reportPath) {'
Write-JsLine '  console.error("Missing RAFTOP_ADMIN_BOOTSTRAP_REPORT");'
Write-JsLine '  process.exit(2);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'if (!dbUrl) {'
Write-JsLine '  w("DB_URL_PRESENT: false");'
Write-JsLine '  safeExit("MISSING_DATABASE_URL", 2);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'if (!adminPassword || adminPassword.length < 12) {'
Write-JsLine '  w("ADMIN_PASSWORD_PRESENT: false_or_too_short");'
Write-JsLine '  safeExit("ADMIN_PASSWORD_MISSING_OR_WEAK", 2);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'w("DB_URL_PRESENT: true");'
Write-JsLine 'w("DB_URL_VALUE: hidden");'
Write-JsLine 'w("APPLY_MODE: " + applyMode);'
Write-JsLine 'w("ADMIN_EMAIL: " + adminEmail);'
Write-JsLine 'w("ADMIN_NAME: " + adminName);'
Write-JsLine 'w("ADMIN_ROLE: " + adminRole);'
Write-JsLine 'w("ADMIN_STATUS: " + adminStatus);'
Write-JsLine 'w("ADMIN_PASSWORD_VALUE: hidden");'
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
Write-JsLine 'let bcrypt;'
Write-JsLine 'try {'
Write-JsLine '  bcrypt = require(path.join(process.cwd(), "node_modules", "bcryptjs"));'
Write-JsLine '} catch (e1) {'
Write-JsLine '  try {'
Write-JsLine '    bcrypt = require("bcryptjs");'
Write-JsLine '  } catch (e2) {'
Write-JsLine '    w("BCRYPT_REQUIRE_ERROR: bcryptjs module not available");'
Write-JsLine '    safeExit("BCRYPT_MODULE_MISSING", 2);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'async function getColumns(client, tableName) {'
Write-JsLine '  const sql = "select column_name, data_type, is_nullable from information_schema.columns where table_schema=$1 and table_name=$2 order by ordinal_position";'
Write-JsLine '  const result = await client.query(sql, ["public", tableName]);'
Write-JsLine '  return result.rows;'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'async function resolveTenantMapping(client) {'
Write-JsLine '  const tablesSql = "select table_name from information_schema.tables where table_schema=$1 and table_type=$2 order by table_name";'
Write-JsLine '  const tablesResult = await client.query(tablesSql, ["public", "BASE TABLE"]);'
Write-JsLine '  const candidates = [];'
Write-JsLine '  for (const row of tablesResult.rows) {'
Write-JsLine '    const tableName = row.table_name;'
Write-JsLine '    if (!String(tableName).toLowerCase().includes("tenant")) continue;'
Write-JsLine '    const columns = await getColumns(client, tableName);'
Write-JsLine '    const score = scoreTenantTable(tableName, columns);'
Write-JsLine '    candidates.push({ tableName, columns, score });'
Write-JsLine '    w("TENANT_CANDIDATE: " + tableName + " | score=" + score);'
Write-JsLine '  }'
Write-JsLine '  candidates.sort((a, b) => b.score - a.score);'
Write-JsLine '  const selected = candidates.length > 0 ? candidates[0] : null;'
Write-JsLine '  if (!selected || selected.score < 50) return null;'
Write-JsLine '  const idCol = columnByNames(selected.columns, ["tenant_id", "id", "slug", "code"]);'
Write-JsLine '  const nameCol = columnByNames(selected.columns, ["tenant_name", "name", "display_name", "title"]);'
Write-JsLine '  if (!idCol || !isTextCompatible(idCol)) return null;'
Write-JsLine '  if (!nameCol || !isTextCompatible(nameCol)) return null;'
Write-JsLine '  return { tableName: selected.tableName, idCol, nameCol, score: selected.score };'
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
Write-JsLine '    const tenantMapping = await resolveTenantMapping(client);'
Write-JsLine '    if (!tenantMapping) {'
Write-JsLine '      w("TENANT_MAPPING: not_safe");'
Write-JsLine '      safeExit("TENANT_MAPPING_NOT_SAFE", 1);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    w("TENANT_TABLE_SELECTED: " + tenantMapping.tableName);'
Write-JsLine '    w("TENANT_TABLE_SELECTED_SCORE: " + tenantMapping.score);'
Write-JsLine '    w("TENANT_ID_COLUMN: " + tenantMapping.idCol.name + " | " + tenantMapping.idCol.type);'
Write-JsLine '    w("TENANT_NAME_COLUMN: " + tenantMapping.nameCol.name + " | " + tenantMapping.nameCol.type);'
Write-JsLine ''
Write-JsLine '    const tableSql = quoteIdent("public") + "." + quoteIdent(tenantMapping.tableName);'
Write-JsLine '    const idSql = quoteIdent(tenantMapping.idCol.name);'
Write-JsLine '    const tenantCheck = await client.query("select * from " + tableSql + " where " + idSql + "=$1 limit 1", [tenantId]);'
Write-JsLine '    if (tenantCheck.rows.length === 0) {'
Write-JsLine '      w("TENANT_EXISTS: false");'
Write-JsLine '      safeExit("TARGET_TENANT_NOT_FOUND", 1);'
Write-JsLine '    }'
Write-JsLine '    w("TENANT_EXISTS: true");'
Write-JsLine ''
Write-JsLine '    const usersTable = await client.query("select to_regclass($1) as reg", ["public.users"]);'
Write-JsLine '    const usersExists = usersTable.rows[0] && usersTable.rows[0].reg !== null;'
Write-JsLine '    w("USERS_TABLE_EXISTS: " + usersExists);'
Write-JsLine '    if (!usersExists) {'
Write-JsLine '      safeExit("USERS_TABLE_NOT_FOUND", 1);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const existing = await client.query("select id, tenant_id, email, role, status from users where tenant_id=$1 and lower(email)=lower($2) limit 1", [tenantId, adminEmail]);'
Write-JsLine '    w("ADMIN_EXISTS_BEFORE: " + (existing.rows.length > 0));'
Write-JsLine ''
Write-JsLine '    if (!applyMode) {'
Write-JsLine '      w("DRY_RUN_ACTION: would_insert_or_update_admin_user");'
Write-JsLine '      await client.end();'
Write-JsLine '      safeExit("ADMIN_USER_BOOTSTRAP_DRY_RUN_COMPLETED", 0);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const passwordHash = await bcrypt.hash(adminPassword, 12);'
Write-JsLine '    await client.query("BEGIN");'
Write-JsLine ''
Write-JsLine '    if (existing.rows.length > 0) {'
Write-JsLine '      await client.query("update users set name=$1, role=$2, status=$3, password_hash=$4, updated_at=NOW() where tenant_id=$5 and lower(email)=lower($6)", [adminName, adminRole, adminStatus, passwordHash, tenantId, adminEmail]);'
Write-JsLine '      w("ADMIN_ACTION: updated_existing");'
Write-JsLine '    } else {'
Write-JsLine '      await client.query("insert into users (tenant_id, email, password_hash, name, role, status, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,NOW(),NOW())", [tenantId, adminEmail, passwordHash, adminName, adminRole, adminStatus]);'
Write-JsLine '      w("ADMIN_ACTION: inserted_new");'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    await client.query("COMMIT");'
Write-JsLine ''
Write-JsLine '    const after = await client.query("select id, tenant_id, email, role, status from users where tenant_id=$1 and lower(email)=lower($2) limit 1", [tenantId, adminEmail]);'
Write-JsLine '    w("ADMIN_EXISTS_AFTER: " + (after.rows.length > 0));'
Write-JsLine '    if (after.rows.length > 0) {'
Write-JsLine '      w("ADMIN_TENANT_ID_VALUE: " + after.rows[0].tenant_id);'
Write-JsLine '      w("ADMIN_EMAIL_VALUE: " + after.rows[0].email);'
Write-JsLine '      w("ADMIN_ROLE_VALUE: " + after.rows[0].role);'
Write-JsLine '      w("ADMIN_STATUS_VALUE: " + after.rows[0].status);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    await client.end();'
Write-JsLine '    safeExit("ADMIN_USER_BOOTSTRAP_APPLIED", 0);'
Write-JsLine '  } catch (err) {'
Write-JsLine '    w("ADMIN_BOOTSTRAP_ERROR: " + err.message);'
Write-JsLine '    try { await client.query("ROLLBACK"); } catch (e) {}'
Write-JsLine '    try { await client.end(); } catch (e) {}'
Write-JsLine '    safeExit("ADMIN_USER_BOOTSTRAP_FAILED", 1);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'main();'

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_ADMIN_BOOTSTRAP_REPORT = $ReportPath

    if ($Apply) {
        $env:RAFTOP_ADMIN_BOOTSTRAP_APPLY = "true"
    } else {
        $env:RAFTOP_ADMIN_BOOTSTRAP_APPLY = "false"
    }

    $env:RAFTOP_ADMIN_TENANT_ID = $TenantId
    $env:RAFTOP_ADMIN_EMAIL = $AdminEmail
    $env:RAFTOP_ADMIN_NAME = $AdminName
    $env:RAFTOP_ADMIN_ROLE = $AdminRole
    $env:RAFTOP_ADMIN_STATUS = $AdminStatus

    $NodeOutput = node $JsPath 2>&1
    $NodeCode = $LASTEXITCODE

    Pop-Location

    Write-ReportLine ""
    Write-ReportLine "NODE_OUTPUT:"
    Write-ReportLine ($NodeOutput | Out-String)
    Write-ReportLine ""

    if ($NodeCode -eq 0) {
        Add-Result "Admin bootstrap node runner" "PASS" "Node runner completed."
    } else {
        Add-Result "Admin bootstrap node runner" "FAIL" ("Node runner failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($ReportContent -match "TENANT_EXISTS: true") {
    Add-Result "Target tenant exists" "PASS" "Target tenant exists."
} else {
    Add-Result "Target tenant exists" "FAIL" "Target tenant not confirmed."
}

if ($ReportContent -match "USERS_TABLE_EXISTS: true") {
    Add-Result "Users table exists" "PASS" "users table exists."
} else {
    Add-Result "Users table exists" "FAIL" "users table not confirmed."
}

if ($Apply) {
    if ($ReportContent -match "ADMIN_EXISTS_AFTER: true") {
        Add-Result "Admin user exists after apply" "PASS" "Admin user exists after apply."
    } else {
        Add-Result "Admin user exists after apply" "FAIL" "Admin user not confirmed after apply."
    }

    if ($ReportContent -match "ADMIN_ROLE_VALUE: " + [regex]::Escape($AdminRole)) {
        Add-Result "Admin role value" "PASS" "Admin role matches target."
    } else {
        Add-Result "Admin role value" "WARN" "Admin role not confirmed."
    }

    if ($ReportContent -match "ADMIN_STATUS_VALUE: " + [regex]::Escape($AdminStatus)) {
        Add-Result "Admin status value" "PASS" "Admin status matches target."
    } else {
        Add-Result "Admin status value" "WARN" "Admin status not confirmed."
    }
} else {
    if ($ReportContent -match "ADMIN_USER_BOOTSTRAP_DRY_RUN_COMPLETED") {
        Add-Result "Admin bootstrap dry run completion" "PASS" "Dry run completed without modifying database."
    } else {
        Add-Result "Admin bootstrap dry run completion" "FAIL" "Dry run completion not confirmed."
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "ADMIN BOOTSTRAP INTERPRETATION"
Write-ReportLine ""

if ($Apply) {
    Write-ReportLine "Apply mode was used."
    Write-ReportLine "The target admin user should now exist or be updated."
    Write-ReportLine "Password value was not printed."
    Write-ReportLine ""
    Write-ReportLine "Next phase:"
    Write-ReportLine "Phase 41.9 - Admin Login Verification"
} else {
    Write-ReportLine "Dry run mode was used."
    Write-ReportLine "No database changes were made."
    Write-ReportLine ""
    Write-ReportLine "If dry run is clean, next command is:"
    Write-ReportLine ".\tools\run_phase41_controlled_admin_user_bootstrap.ps1 -Apply"
}

Write-ReportLine ""
Write-ReportLine "Target admin:"
Write-ReportLine ("tenant_id: " + $TenantId)
Write-ReportLine ("email: " + $AdminEmail)
Write-ReportLine ("name: " + $AdminName)
Write-ReportLine ("role: " + $AdminRole)
Write-ReportLine ("status: " + $AdminStatus)
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_CONTROLLED_ADMIN_USER_BOOTSTRAP_FAILED"
    $ExitCode = 1
} elseif ($Apply) {
    if ($script:WarnCount -gt 0) {
        $FinalStatus = "PHASE41_CONTROLLED_ADMIN_USER_BOOTSTRAP_APPLIED_WITH_WARNINGS"
    } else {
        $FinalStatus = "PHASE41_CONTROLLED_ADMIN_USER_BOOTSTRAP_APPLIED"
    }
    $ExitCode = 0
} else {
    if ($script:WarnCount -gt 0) {
        $FinalStatus = "PHASE41_CONTROLLED_ADMIN_USER_BOOTSTRAP_DRY_RUN_READY_WITH_WARNINGS"
    } else {
        $FinalStatus = "PHASE41_CONTROLLED_ADMIN_USER_BOOTSTRAP_DRY_RUN_READY"
    }
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.8 Controlled Admin User Bootstrap v2"
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