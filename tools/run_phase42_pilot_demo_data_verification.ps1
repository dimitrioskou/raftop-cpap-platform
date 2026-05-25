# RAFTOP CPAP CARE Pro
# Phase 42.4 - Pilot Demo Data Verification
# Safe ASCII-only script
# Reads pilot_demo_* tables only. Does not insert, update, or delete data.

param(
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
$ReportPath = Join-Path $ReportsDir ("phase42_pilot_demo_data_verification_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase42_pilot_demo_data_verification_runner.js"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 42.4 Pilot Demo Data Verification" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This phase verifies seeded Raftopoulos pilot demo data."
Write-ReportLine "It reads pilot_demo_* tables only."
Write-ReportLine "It does not modify the database."
Write-ReportLine ""
Write-ReportLine "Target tenant:"
Write-ReportLine $TenantId
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 42.4 pilot demo data verification..."
Write-Host ""

$LatestSeedApplyReport = Get-LatestReport "phase42_pilot_demo_data_seed_apply_*.md"

if ($LatestSeedApplyReport -eq $null) {
    Add-Result "Latest pilot demo seed apply report" "FAIL" "No Phase 42.3 apply report found."
} else {
    $SeedApplyContent = Get-Content -Path $LatestSeedApplyReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($SeedApplyContent -match "FINAL STATUS: PHASE42_PILOT_DEMO_DATA_SEED_APPLIED" -or $SeedApplyContent -match "FINAL STATUS: PHASE42_PILOT_DEMO_DATA_SEED_APPLIED_WITH_WARNINGS") {
        Add-Result "Latest pilot demo seed apply status" "PASS" "Pilot demo data seed has acceptable final status."
    } else {
        Add-Result "Latest pilot demo seed apply status" "FAIL" "Pilot demo data seed final status is not acceptable."
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

$JsContent = @'
// RAFTOP Phase 42.4 pilot demo data verification runner
const fs = require("fs");
const path = require("path");

const reportPath = process.env.RAFTOP_PHASE42_DEMO_VERIFY_REPORT;
const dbUrl = process.env.RAFTOP_PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
const tenantId = process.env.RAFTOP_PHASE42_TENANT_ID || "raftopoulos-live";

function w(line) {
  fs.appendFileSync(reportPath, String(line) + "\n", "utf8");
}

function safeExit(status, code) {
  w("");
  w("NODE_RUNNER_STATUS: " + status);
  console.log("NODE_RUNNER_STATUS: " + status);
  process.exit(code);
}

if (!reportPath) {
  console.error("Missing RAFTOP_PHASE42_DEMO_VERIFY_REPORT");
  process.exit(2);
}

if (!dbUrl) {
  w("DB_URL_PRESENT: false");
  safeExit("MISSING_DATABASE_URL", 2);
}

w("DB_URL_PRESENT: true");
w("DB_URL_VALUE: hidden");
w("TENANT_ID: " + tenantId);

let Client;
try {
  Client = require(path.join(process.cwd(), "node_modules", "pg")).Client;
} catch (e1) {
  try {
    Client = require("pg").Client;
  } catch (e2) {
    w("PG_REQUIRE_ERROR: pg module not available");
    safeExit("PG_MODULE_MISSING", 2);
  }
}

async function tableExists(client, tableName) {
  const result = await client.query("select to_regclass($1) as reg", ["public." + tableName]);
  return !!(result.rows[0] && result.rows[0].reg);
}

async function countRows(client, tableName) {
  const result = await client.query(`select count(*)::int as count from ${tableName} where tenant_id=$1`, [tenantId]);
  return result.rows[0].count;
}

async function scalar(client, sql, params) {
  const result = await client.query(sql, params);
  if (!result.rows[0]) return null;
  return Object.values(result.rows[0])[0];
}

async function main() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    w("DB_CONNECTION: OK");

    const requiredTables = [
      "pilot_demo_patients",
      "pilot_demo_devices",
      "pilot_demo_compliance_nights",
      "pilot_demo_atlas_tasks",
      "pilot_demo_notes"
    ];

    for (const tableName of requiredTables) {
      const exists = await tableExists(client, tableName);
      w("TABLE_EXISTS_" + tableName.toUpperCase() + ": " + exists);
      if (!exists) {
        safeExit("REQUIRED_DEMO_TABLE_MISSING", 1);
      }
    }

    for (const tableName of requiredTables) {
      w("COUNT_" + tableName.toUpperCase() + ": " + await countRows(client, tableName));
    }

    const openTasks = await scalar(
      client,
      "select count(*)::int as count from pilot_demo_atlas_tasks where tenant_id=$1 and status='open'",
      [tenantId]
    );

    const doneTasks = await scalar(
      client,
      "select count(*)::int as count from pilot_demo_atlas_tasks where tenant_id=$1 and status='done'",
      [tenantId]
    );

    const criticalTasks = await scalar(
      client,
      "select count(*)::int as count from pilot_demo_atlas_tasks where tenant_id=$1 and priority='critical'",
      [tenantId]
    );

    const highTasks = await scalar(
      client,
      "select count(*)::int as count from pilot_demo_atlas_tasks where tenant_id=$1 and priority='high'",
      [tenantId]
    );

    const compliantPatients = await scalar(
      client,
      "select count(*)::int as count from pilot_demo_patients where tenant_id=$1 and compliance_status='compliant'",
      [tenantId]
    );

    const riskPatients = await scalar(
      client,
      "select count(*)::int as count from pilot_demo_patients where tenant_id=$1 and compliance_status in ('at_risk','early_risk','no_data','borderline','partial')",
      [tenantId]
    );

    const avgUsage = await scalar(
      client,
      "select round(avg(usage_hours)::numeric, 2)::text as avg_usage from pilot_demo_compliance_nights where tenant_id=$1",
      [tenantId]
    );

    const noDataNights = await scalar(
      client,
      "select count(*)::int as count from pilot_demo_compliance_nights where tenant_id=$1 and compliance_flag='no_data'",
      [tenantId]
    );

    const lowUsageNights = await scalar(
      client,
      "select count(*)::int as count from pilot_demo_compliance_nights where tenant_id=$1 and compliance_flag='low_usage'",
      [tenantId]
    );

    w("ATLAS_OPEN_TASKS: " + openTasks);
    w("ATLAS_DONE_TASKS: " + doneTasks);
    w("ATLAS_CRITICAL_TASKS: " + criticalTasks);
    w("ATLAS_HIGH_TASKS: " + highTasks);
    w("COMPLIANT_PATIENTS: " + compliantPatients);
    w("RISK_PATIENTS: " + riskPatients);
    w("AVERAGE_USAGE_HOURS: " + avgUsage);
    w("NO_DATA_NIGHTS: " + noDataNights);
    w("LOW_USAGE_NIGHTS: " + lowUsageNights);

    const samplePatients = await client.query(
      "select demo_code, full_name, risk_segment, compliance_status from pilot_demo_patients where tenant_id=$1 order by demo_code",
      [tenantId]
    );

    for (const row of samplePatients.rows) {
      w("SAMPLE_PATIENT: " + row.demo_code + " | " + row.full_name + " | " + row.risk_segment + " | " + row.compliance_status);
    }

    await client.end();
    safeExit("PILOT_DEMO_DATA_VERIFICATION_COMPLETED", 0);
  } catch (err) {
    w("PILOT_DEMO_DATA_VERIFICATION_ERROR: " + err.message);
    try { await client.end(); } catch (e) {}
    safeExit("PILOT_DEMO_DATA_VERIFICATION_FAILED", 1);
  }
}

main();
'@

Set-Content -Path $JsPath -Value $JsContent -Encoding UTF8

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_PHASE42_DEMO_VERIFY_REPORT = $ReportPath
    $env:RAFTOP_PHASE42_TENANT_ID = $TenantId

    $NodeOutput = node $JsPath 2>&1
    $NodeCode = $LASTEXITCODE

    Pop-Location

    Write-ReportLine ""
    Write-ReportLine "NODE_OUTPUT:"
    Write-ReportLine ($NodeOutput | Out-String)
    Write-ReportLine ""

    if ($NodeCode -eq 0) {
        Add-Result "Pilot demo data verification node runner" "PASS" "Node runner completed."
    } else {
        Add-Result "Pilot demo data verification node runner" "FAIL" ("Node runner failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($ReportContent -match "COUNT_PILOT_DEMO_PATIENTS: 8") {
    Add-Result "Demo patients count" "PASS" "8 demo patients verified."
} else {
    Add-Result "Demo patients count" "FAIL" "Expected 8 demo patients."
}

if ($ReportContent -match "COUNT_PILOT_DEMO_DEVICES: 8") {
    Add-Result "Demo devices count" "PASS" "8 demo devices verified."
} else {
    Add-Result "Demo devices count" "FAIL" "Expected 8 demo devices."
}

if ($ReportContent -match "COUNT_PILOT_DEMO_COMPLIANCE_NIGHTS: 56") {
    Add-Result "Demo compliance nights count" "PASS" "56 compliance nights verified."
} else {
    Add-Result "Demo compliance nights count" "FAIL" "Expected 56 compliance nights."
}

if ($ReportContent -match "COUNT_PILOT_DEMO_ATLAS_TASKS: 7") {
    Add-Result "Demo ATLAS tasks count" "PASS" "7 ATLAS tasks verified."
} else {
    Add-Result "Demo ATLAS tasks count" "FAIL" "Expected 7 ATLAS tasks."
}

if ($ReportContent -match "COUNT_PILOT_DEMO_NOTES: 5") {
    Add-Result "Demo notes count" "PASS" "5 demo notes verified."
} else {
    Add-Result "Demo notes count" "FAIL" "Expected 5 demo notes."
}

if ($ReportContent -match "ATLAS_OPEN_TASKS: 6") {
    Add-Result "Open ATLAS tasks" "PASS" "6 open ATLAS tasks verified."
} else {
    Add-Result "Open ATLAS tasks" "WARN" "Open ATLAS task count differs from expected 6."
}

if ($ReportContent -match "ATLAS_CRITICAL_TASKS: 1") {
    Add-Result "Critical ATLAS tasks" "PASS" "1 critical ATLAS task verified."
} else {
    Add-Result "Critical ATLAS tasks" "WARN" "Critical ATLAS task count differs from expected 1."
}

if ($ReportContent -match "COMPLIANT_PATIENTS: 3") {
    Add-Result "Compliant patient segment" "PASS" "3 compliant patients verified."
} else {
    Add-Result "Compliant patient segment" "WARN" "Compliant patient count differs from expected 3."
}

if ($ReportContent -match "RISK_PATIENTS: 5") {
    Add-Result "Risk patient segment" "PASS" "5 risk/attention patients verified."
} else {
    Add-Result "Risk patient segment" "WARN" "Risk patient count differs from expected 5."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "PILOT DEMO DATA VERIFICATION INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "The Raftopoulos pilot dataset is isolated in pilot_demo_* tables."
Write-ReportLine "It contains demo patients, demo devices, compliance nights, ATLAS tasks and notes."
Write-ReportLine ""
Write-ReportLine "Next phase:"
Write-ReportLine "Phase 42.5 - Pilot Demo API Routes"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE42_PILOT_DEMO_DATA_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE42_PILOT_DEMO_DATA_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE42_PILOT_DEMO_DATA_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 42.4 Pilot Demo Data Verification"
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