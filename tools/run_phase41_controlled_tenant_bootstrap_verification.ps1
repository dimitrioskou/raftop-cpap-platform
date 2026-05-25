# RAFTOP CPAP CARE Pro
# Phase 41.7B - Controlled Tenant Bootstrap Verification
# Safe ASCII-only script
# Reads production tenant only. Does not modify database. Does not print secrets.

param(
    [string]$TenantId = "raftopoulos-live",
    [string]$TenantName = "RAFTOPOULOS",
    [string]$Plan = "enterprise",
    [string]$Status = "active"
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
$ReportPath = Join-Path $ReportsDir ("phase41_controlled_tenant_bootstrap_verification_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase41_controlled_tenant_bootstrap_verification_runner.js"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.7B Controlled Tenant Bootstrap Verification" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This script verifies that the production tenant exists after Phase 41.7 apply."
Write-ReportLine "It reads production tenant data only and does not modify the database."
Write-ReportLine "It does not print secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.7B tenant bootstrap verification..."
Write-Host ""

Test-FileExists "enterprise-backend\package.json" "Backend package.json" "YES"
Test-FileExists "tools\run_phase41_controlled_tenant_bootstrap.ps1" "Phase 41.7 tenant bootstrap script" "YES"
Test-FileExists "tools\run_phase41_auth_user_schema_migration_verification.ps1" "Phase 41.6 auth/user verification script" "YES"

$LatestApplyReport = Get-LatestReport "phase41_controlled_tenant_bootstrap_apply_*.md"

if ($LatestApplyReport -eq $null) {
    Add-Result "Latest tenant bootstrap apply report" "FAIL" "No Phase 41.7 apply report found."
} else {
    $ApplyContent = Get-Content -Path $LatestApplyReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($ApplyContent -match "FINAL STATUS: PHASE41_CONTROLLED_TENANT_BOOTSTRAP_APPLIED" -or $ApplyContent -match "FINAL STATUS: PHASE41_CONTROLLED_TENANT_BOOTSTRAP_APPLIED_WITH_WARNINGS") {
        Add-Result "Latest tenant bootstrap apply status" "PASS" "Latest tenant apply report has acceptable final status."
    } else {
        Add-Result "Latest tenant bootstrap apply status" "FAIL" "Latest tenant apply report final status is not acceptable."
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

Set-Content -Path $JsPath -Value "// RAFTOP Phase 41.7B controlled tenant bootstrap verification runner" -Encoding UTF8

Write-JsLine 'const fs = require("fs");'
Write-JsLine 'const path = require("path");'
Write-JsLine 'const reportPath = process.env.RAFTOP_TENANT_VERIFY_REPORT;'
Write-JsLine 'const dbUrl = process.env.RAFTOP_PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;'
Write-JsLine 'const targetTenantId = process.env.RAFTOP_TENANT_ID || "raftopoulos-live";'
Write-JsLine 'const targetTenantName = process.env.RAFTOP_TENANT_NAME || "RAFTOPOULOS";'
Write-JsLine 'const targetPlan = process.env.RAFTOP_TENANT_PLAN || "enterprise";'
Write-JsLine 'const targetStatus = process.env.RAFTOP_TENANT_STATUS || "active";'
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
Write-JsLine '  console.error("Missing RAFTOP_TENANT_VERIFY_REPORT");'
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
Write-JsLine 'w("TARGET_TENANT_ID: " + targetTenantId);'
Write-JsLine 'w("TARGET_TENANT_NAME: " + targetTenantName);'
Write-JsLine 'w("TARGET_TENANT_PLAN: " + targetPlan);'
Write-JsLine 'w("TARGET_TENANT_STATUS: " + targetStatus);'
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
Write-JsLine 'async function getColumns(client, tableName) {'
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
Write-JsLine '    const tablesSql = "select table_name from information_schema.tables where table_schema=$1 and table_type=$2 order by table_name";'
Write-JsLine '    const tablesResult = await client.query(tablesSql, ["public", "BASE TABLE"]);'
Write-JsLine '    const tenantCandidates = [];'
Write-JsLine ''
Write-JsLine '    for (const row of tablesResult.rows) {'
Write-JsLine '      const tableName = row.table_name;'
Write-JsLine '      if (!String(tableName).toLowerCase().includes("tenant")) continue;'
Write-JsLine '      const columns = await getColumns(client, tableName);'
Write-JsLine '      const score = scoreTenantTable(tableName, columns);'
Write-JsLine '      tenantCandidates.push({ tableName, columns, score });'
Write-JsLine '      w("TENANT_CANDIDATE: " + tableName + " | score=" + score);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    tenantCandidates.sort((a, b) => b.score - a.score);'
Write-JsLine '    const selected = tenantCandidates.length > 0 ? tenantCandidates[0] : null;'
Write-JsLine ''
Write-JsLine '    if (!selected || selected.score < 50) {'
Write-JsLine '      w("TENANT_TABLE_SELECTED: none");'
Write-JsLine '      safeExit("TENANT_TABLE_MAPPING_NOT_SAFE", 1);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    w("TENANT_TABLE_SELECTED: " + selected.tableName);'
Write-JsLine '    w("TENANT_TABLE_SELECTED_SCORE: " + selected.score);'
Write-JsLine ''
Write-JsLine '    const idCol = columnByNames(selected.columns, ["tenant_id", "id", "slug", "code"]);'
Write-JsLine '    const nameCol = columnByNames(selected.columns, ["tenant_name", "name", "display_name", "title"]);'
Write-JsLine '    const planCol = columnByNames(selected.columns, ["plan", "plan_name", "subscription_plan"]);'
Write-JsLine '    const statusCol = columnByNames(selected.columns, ["status", "state"]);'
Write-JsLine ''
Write-JsLine '    w("TENANT_ID_COLUMN: " + (idCol ? idCol.name + " | " + idCol.type : ""));'
Write-JsLine '    w("TENANT_NAME_COLUMN: " + (nameCol ? nameCol.name + " | " + nameCol.type : ""));'
Write-JsLine '    w("TENANT_PLAN_COLUMN: " + (planCol ? planCol.name + " | " + planCol.type : ""));'
Write-JsLine '    w("TENANT_STATUS_COLUMN: " + (statusCol ? statusCol.name + " | " + statusCol.type : ""));'
Write-JsLine ''
Write-JsLine '    if (!idCol || !isTextCompatible(idCol)) {'
Write-JsLine '      w("TENANT_VERIFY_ERROR: no text-compatible tenant id column found");'
Write-JsLine '      safeExit("TENANT_ID_COLUMN_NOT_SAFE", 1);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    if (!nameCol || !isTextCompatible(nameCol)) {'
Write-JsLine '      w("TENANT_VERIFY_ERROR: no text-compatible tenant name column found");'
Write-JsLine '      safeExit("TENANT_NAME_COLUMN_NOT_SAFE", 1);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const tableSql = quoteIdent("public") + "." + quoteIdent(selected.tableName);'
Write-JsLine '    const idSql = quoteIdent(idCol.name);'
Write-JsLine '    const query = await client.query("select * from " + tableSql + " where " + idSql + "=$1 limit 1", [targetTenantId]);'
Write-JsLine '    const exists = query.rows.length > 0;'
Write-JsLine '    w("TENANT_EXISTS: " + exists);'
Write-JsLine ''
Write-JsLine '    if (!exists) {'
Write-JsLine '      safeExit("TENANT_NOT_FOUND", 1);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const row = query.rows[0];'
Write-JsLine '    const actualId = row[idCol.name];'
Write-JsLine '    const actualName = row[nameCol.name];'
Write-JsLine '    const actualPlan = planCol ? row[planCol.name] : "";'
Write-JsLine '    const actualStatus = statusCol ? row[statusCol.name] : "";'
Write-JsLine ''
Write-JsLine '    w("TENANT_ID_VALUE: " + actualId);'
Write-JsLine '    w("TENANT_NAME_VALUE: " + actualName);'
Write-JsLine '    w("TENANT_PLAN_VALUE: " + actualPlan);'
Write-JsLine '    w("TENANT_STATUS_VALUE: " + actualStatus);'
Write-JsLine '    w("TENANT_ID_MATCH: " + (String(actualId) === String(targetTenantId)));'
Write-JsLine '    w("TENANT_NAME_MATCH: " + (String(actualName) === String(targetTenantName)));'
Write-JsLine '    if (planCol) w("TENANT_PLAN_MATCH: " + (String(actualPlan) === String(targetPlan)));'
Write-JsLine '    if (statusCol) w("TENANT_STATUS_MATCH: " + (String(actualStatus) === String(targetStatus)));'
Write-JsLine ''
Write-JsLine '    await client.end();'
Write-JsLine '    safeExit("TENANT_BOOTSTRAP_VERIFICATION_COMPLETED", 0);'
Write-JsLine '  } catch (err) {'
Write-JsLine '    w("TENANT_VERIFY_ERROR: " + err.message);'
Write-JsLine '    try { await client.end(); } catch (e) {}'
Write-JsLine '    safeExit("TENANT_BOOTSTRAP_VERIFICATION_FAILED", 1);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'main();'

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_TENANT_VERIFY_REPORT = $ReportPath
    $env:RAFTOP_TENANT_ID = $TenantId
    $env:RAFTOP_TENANT_NAME = $TenantName
    $env:RAFTOP_TENANT_PLAN = $Plan
    $env:RAFTOP_TENANT_STATUS = $Status

    $NodeOutput = node $JsPath 2>&1
    $NodeCode = $LASTEXITCODE

    Pop-Location

    Write-ReportLine ""
    Write-ReportLine "NODE_OUTPUT:"
    Write-ReportLine ($NodeOutput | Out-String)
    Write-ReportLine ""

    if ($NodeCode -eq 0) {
        Add-Result "Tenant verification node runner" "PASS" "Node runner completed."
    } else {
        Add-Result "Tenant verification node runner" "FAIL" ("Node runner failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($ReportContent -match "TENANT_TABLE_SELECTED: .+" -and $ReportContent -notmatch "TENANT_TABLE_SELECTED: none") {
    Add-Result "Tenant table mapping" "PASS" "Tenant table mapping selected."
} else {
    Add-Result "Tenant table mapping" "FAIL" "Tenant table mapping was not selected."
}

if ($ReportContent -match "TENANT_EXISTS: true") {
    Add-Result "Tenant exists" "PASS" "Target tenant exists."
} else {
    Add-Result "Tenant exists" "FAIL" "Target tenant was not found."
}

if ($ReportContent -match "TENANT_ID_MATCH: true") {
    Add-Result "Tenant id match" "PASS" "Tenant id matches target."
} else {
    Add-Result "Tenant id match" "FAIL" "Tenant id does not match target."
}

if ($ReportContent -match "TENANT_NAME_MATCH: true") {
    Add-Result "Tenant name match" "PASS" "Tenant name matches target."
} else {
    Add-Result "Tenant name match" "WARN" "Tenant name does not match target or was not verified."
}

if ($ReportContent -match "TENANT_PLAN_COLUMN:\s*$") {
    Add-Result "Tenant plan column" "WARN" "Tenant plan column was not mapped."
} elseif ($ReportContent -match "TENANT_PLAN_MATCH: true") {
    Add-Result "Tenant plan match" "PASS" "Tenant plan matches target."
} else {
    Add-Result "Tenant plan match" "WARN" "Tenant plan does not match target or was not verified."
}

if ($ReportContent -match "TENANT_STATUS_COLUMN:\s*$") {
    Add-Result "Tenant status column" "WARN" "Tenant status column was not mapped."
} elseif ($ReportContent -match "TENANT_STATUS_MATCH: true") {
    Add-Result "Tenant status match" "PASS" "Tenant status matches target."
} else {
    Add-Result "Tenant status match" "WARN" "Tenant status does not match target or was not verified."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "TENANT VERIFICATION INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "If tenant exists and tenant id/name match, tenant bootstrap is verified."
Write-ReportLine "Plan/status warnings are acceptable only if the selected tenant table does not expose plan/status columns."
Write-ReportLine ""
Write-ReportLine "Next phase:"
Write-ReportLine "Phase 41.8 - Controlled Admin User Bootstrap Script"
Write-ReportLine ""
Write-ReportLine "Admin user remains not created by this script."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_CONTROLLED_TENANT_BOOTSTRAP_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_CONTROLLED_TENANT_BOOTSTRAP_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_CONTROLLED_TENANT_BOOTSTRAP_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.7B Controlled Tenant Verification"
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