# RAFTOP CPAP CARE Pro
# Phase 42.3 - Pilot Demo Data Seed
# Safe ASCII-only script
# Dry-run by default. Use -Apply to seed dedicated pilot_demo_* tables.
# Only writes to pilot_demo_* tables for the target tenant.
# Does not touch users, real patients, real devices, or existing atlas_tasks.

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

$ReportPath = Join-Path $ReportsDir ("phase42_pilot_demo_data_seed_" + $Mode.ToLower() + "_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase42_pilot_demo_data_seed_runner.js"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 42.3 Pilot Demo Data Seed" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ("Mode: " + $Mode)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This phase seeds isolated Raftopoulos pilot demo data into pilot_demo_* tables only."
Write-ReportLine "Dry run mode does not modify the database."
Write-ReportLine "Apply mode clears and reseeds pilot_demo_* rows for the target tenant only."
Write-ReportLine ""
Write-ReportLine "Target tenant:"
Write-ReportLine $TenantId
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 42.3 pilot demo data seed..."
Write-Host ("Mode: " + $Mode)
Write-Host ""

$LatestSchemaApplyReport = Get-LatestReport "phase42_dedicated_pilot_demo_schema_plan_apply_*.md"

if ($LatestSchemaApplyReport -eq $null) {
    Add-Result "Latest dedicated demo schema apply report" "FAIL" "No Phase 42.2 apply report found."
} else {
    $SchemaApplyContent = Get-Content -Path $LatestSchemaApplyReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($SchemaApplyContent -match "FINAL STATUS: PHASE42_DEDICATED_PILOT_DEMO_SCHEMA_APPLIED" -or $SchemaApplyContent -match "FINAL STATUS: PHASE42_DEDICATED_PILOT_DEMO_SCHEMA_APPLIED_WITH_WARNINGS") {
        Add-Result "Latest dedicated demo schema apply status" "PASS" "Dedicated pilot demo schema has acceptable final status."
    } else {
        Add-Result "Latest dedicated demo schema apply status" "FAIL" "Dedicated pilot demo schema apply final status is not acceptable."
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
    Add-Result "Seed execution mode" "WARN" "APPLY mode selected. This will replace demo rows for the target tenant in pilot_demo_* tables only."
} else {
    Add-Result "Seed execution mode" "PASS" "DRY_RUN mode selected. No database changes will be made."
}

$JsContent = @'
// RAFTOP Phase 42.3 pilot demo data seed runner
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const reportPath = process.env.RAFTOP_PHASE42_DEMO_SEED_REPORT;
const dbUrl = process.env.RAFTOP_PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
const applyMode = process.env.RAFTOP_PHASE42_APPLY === "true";
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
  console.error("Missing RAFTOP_PHASE42_DEMO_SEED_REPORT");
  process.exit(2);
}

if (!dbUrl) {
  w("DB_URL_PRESENT: false");
  safeExit("MISSING_DATABASE_URL", 2);
}

w("DB_URL_PRESENT: true");
w("DB_URL_VALUE: hidden");
w("APPLY_MODE: " + applyMode);
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

function uuid() {
  return crypto.randomUUID();
}

function dateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function hoursProfile(patientCode, dayOffset) {
  const profiles = {
    "PILOT-001": [7.2, 7.8, 8.1, 6.9, 7.4, 7.6, 8.0],
    "PILOT-002": [3.1, 2.8, 3.5, 4.0, 2.2, 3.0, 3.6],
    "PILOT-003": [0.0, 0.0, 1.2, 0.5, 0.0, 0.0, 0.0],
    "PILOT-004": [5.4, 5.8, 6.1, 6.3, 5.9, 6.0, 6.4],
    "PILOT-005": [7.9, 8.2, 8.4, 7.7, 8.1, 7.8, 8.3],
    "PILOT-006": [4.1, 4.5, 3.9, 4.3, 4.0, 4.2, 4.4],
    "PILOT-007": [2.0, 2.4, 2.7, 3.0, 2.1, 2.5, 2.8],
    "PILOT-008": [6.5, 6.7, 7.0, 6.8, 7.2, 6.9, 7.1]
  };

  const arr = profiles[patientCode] || [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0];
  return arr[dayOffset % arr.length];
}

const patients = [
  {
    demo_code: "PILOT-001",
    full_name: "Demo Patient 001 - Stable Compliant",
    age: 58,
    sex: "male",
    phone: "+30 6900000001",
    city: "Athens",
    risk_segment: "LOW_RISK_STABLE",
    cpap_status: "active",
    compliance_status: "compliant",
    clinical_summary: "Stable CPAP user with consistent nightly usage above the 80h/month threshold."
  },
  {
    demo_code: "PILOT-002",
    full_name: "Demo Patient 002 - Compliance Risk",
    age: 64,
    sex: "female",
    phone: "+30 6900000002",
    city: "Piraeus",
    risk_segment: "COMPLIANCE_RISK",
    cpap_status: "active",
    compliance_status: "at_risk",
    clinical_summary: "Usage below target. Needs proactive adherence coaching and follow-up."
  },
  {
    demo_code: "PILOT-003",
    full_name: "Demo Patient 003 - No Data",
    age: 71,
    sex: "male",
    phone: "+30 6900000003",
    city: "Patras",
    risk_segment: "NO_DATA",
    cpap_status: "active",
    compliance_status: "no_data",
    clinical_summary: "No reliable device signal. Requires device connectivity check."
  },
  {
    demo_code: "PILOT-004",
    full_name: "Demo Patient 004 - Leak Issue",
    age: 55,
    sex: "female",
    phone: "+30 6900000004",
    city: "Larissa",
    risk_segment: "THERAPY_ISSUE",
    cpap_status: "active",
    compliance_status: "partial",
    clinical_summary: "Acceptable usage but elevated leak pattern. Mask refit recommended."
  },
  {
    demo_code: "PILOT-005",
    full_name: "Demo Patient 005 - High Value Stable",
    age: 49,
    sex: "male",
    phone: "+30 6900000005",
    city: "Thessaloniki",
    risk_segment: "HIGH_VALUE_STABLE",
    cpap_status: "active",
    compliance_status: "compliant",
    clinical_summary: "High adherence and low residual AHI. Good candidate for automated monthly review."
  },
  {
    demo_code: "PILOT-006",
    full_name: "Demo Patient 006 - Borderline",
    age: 62,
    sex: "female",
    phone: "+30 6900000006",
    city: "Heraklion",
    risk_segment: "BORDERLINE",
    cpap_status: "active",
    compliance_status: "borderline",
    clinical_summary: "Borderline monthly usage. Needs light-touch follow-up before becoming high risk."
  },
  {
    demo_code: "PILOT-007",
    full_name: "Demo Patient 007 - New Setup",
    age: 53,
    sex: "male",
    phone: "+30 6900000007",
    city: "Volos",
    risk_segment: "NEW_SETUP",
    cpap_status: "new_setup",
    compliance_status: "early_risk",
    clinical_summary: "New setup patient with early low usage. Needs onboarding support."
  },
  {
    demo_code: "PILOT-008",
    full_name: "Demo Patient 008 - Doctor Review",
    age: 68,
    sex: "female",
    phone: "+30 6900000008",
    city: "Ioannina",
    risk_segment: "DOCTOR_REVIEW",
    cpap_status: "active",
    compliance_status: "compliant",
    clinical_summary: "Good usage but clinical review requested due to symptoms."
  }
];

const devices = [
  ["PILOT-001", "ResMed", "AirSense 11 AutoSet", "RFT-DEMO-0001", "Nasal mask", "active"],
  ["PILOT-002", "ResMed", "AirSense 10 AutoSet", "RFT-DEMO-0002", "Nasal pillows", "active"],
  ["PILOT-003", "Philips", "DreamStation 2", "RFT-DEMO-0003", "Full face mask", "connectivity_issue"],
  ["PILOT-004", "Lowenstein", "Prisma SMART", "RFT-DEMO-0004", "Full face mask", "mask_leak_issue"],
  ["PILOT-005", "ResMed", "AirSense 11 AutoSet", "RFT-DEMO-0005", "Nasal mask", "active"],
  ["PILOT-006", "Cefam", "S.Box", "RFT-DEMO-0006", "Nasal mask", "active"],
  ["PILOT-007", "ResMed", "AirSense 10 AutoSet", "RFT-DEMO-0007", "Nasal pillows", "new_setup"],
  ["PILOT-008", "Lowenstein", "Prisma20A", "RFT-DEMO-0008", "Nasal mask", "doctor_review"]
];

const tasks = [
  ["PILOT-002", "COMPLIANCE_RISK", "high", "Call patient for adherence coaching", "Patient is trending below the expected monthly usage threshold.", "open", 1],
  ["PILOT-003", "NO_DATA", "critical", "Check device connectivity", "No usable CPAP data received. Confirm modem/app connectivity and device status.", "open", 0],
  ["PILOT-004", "THERAPY_ISSUE", "high", "Schedule mask refit", "Leak pattern indicates likely mask fit problem.", "open", 2],
  ["PILOT-006", "COMPLIANCE_RISK", "medium", "Borderline usage follow-up", "Usage is close to acceptable but needs reinforcement.", "open", 3],
  ["PILOT-007", "NEW_SETUP", "high", "New setup onboarding call", "Early low usage after new CPAP setup. Provide onboarding support.", "open", 1],
  ["PILOT-008", "DOCTOR_REVIEW", "medium", "Prepare doctor review note", "Patient reports symptoms despite good usage. Prepare clinical summary.", "open", 4],
  ["PILOT-001", "HIGH_VALUE_STABLE", "low", "Monthly automated review", "Stable patient. Candidate for automated monthly monitoring.", "done", 7]
];

const notes = [
  ["PILOT-001", "clinical", "Stable patient. Monthly compliance is strong. No immediate action required.", "system"],
  ["PILOT-002", "followup", "Patient needs adherence support and practical coaching on nightly routine.", "atlas"],
  ["PILOT-003", "technical", "No data signal. Check device connectivity and confirm device serial.", "atlas"],
  ["PILOT-004", "clinical", "Leak issue suspected. Mask refit should be prioritized.", "atlas"],
  ["PILOT-007", "onboarding", "New setup patient. Needs early support before habits deteriorate.", "system"]
];

function complianceFlag(hours) {
  if (hours >= 6.0) return "compliant";
  if (hours >= 4.0) return "borderline";
  if (hours > 0) return "low_usage";
  return "no_data";
}

function ahiFor(patientCode, i) {
  if (patientCode === "PILOT-004") return 7.5 + i * 0.2;
  if (patientCode === "PILOT-008") return 6.8 + i * 0.1;
  if (patientCode === "PILOT-003") return i % 3 === 0 ? 0 : 11.0;
  return 2.1 + (i % 4) * 0.4;
}

function leakFor(patientCode, i) {
  if (patientCode === "PILOT-004") return 32.0 + i * 1.5;
  if (patientCode === "PILOT-003") return 0;
  return 8.0 + (i % 5) * 1.3;
}

async function tableExists(client, tableName) {
  const result = await client.query("select to_regclass($1) as reg", ["public." + tableName]);
  return !!(result.rows[0] && result.rows[0].reg);
}

async function countRows(client, tableName) {
  const result = await client.query(`select count(*)::int as count from ${tableName} where tenant_id=$1`, [tenantId]);
  return result.rows[0].count;
}

async function insertData(client) {
  await client.query("delete from pilot_demo_notes where tenant_id=$1", [tenantId]);
  await client.query("delete from pilot_demo_atlas_tasks where tenant_id=$1", [tenantId]);
  await client.query("delete from pilot_demo_compliance_nights where tenant_id=$1", [tenantId]);
  await client.query("delete from pilot_demo_devices where tenant_id=$1", [tenantId]);
  await client.query("delete from pilot_demo_patients where tenant_id=$1", [tenantId]);

  for (const p of patients) {
    await client.query(
      `insert into pilot_demo_patients
       (id, tenant_id, demo_code, full_name, age, sex, phone, city, risk_segment, cpap_status, compliance_status, clinical_summary)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        uuid(),
        tenantId,
        p.demo_code,
        p.full_name,
        p.age,
        p.sex,
        p.phone,
        p.city,
        p.risk_segment,
        p.cpap_status,
        p.compliance_status,
        p.clinical_summary
      ]
    );
  }

  for (const d of devices) {
    await client.query(
      `insert into pilot_demo_devices
       (id, tenant_id, patient_demo_code, device_brand, device_model, serial_number, mask_type, setup_date, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        uuid(),
        tenantId,
        d[0],
        d[1],
        d[2],
        d[3],
        d[4],
        dateDaysAgo(45),
        d[5]
      ]
    );
  }

  for (const p of patients) {
    for (let i = 0; i < 7; i++) {
      const hours = hoursProfile(p.demo_code, i);
      await client.query(
        `insert into pilot_demo_compliance_nights
         (id, tenant_id, patient_demo_code, therapy_date, usage_hours, ahi, leak_l_min, pressure_p95, compliance_flag)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          uuid(),
          tenantId,
          p.demo_code,
          dateDaysAgo(6 - i),
          hours,
          ahiFor(p.demo_code, i),
          leakFor(p.demo_code, i),
          9.0 + (i % 4) * 0.4,
          complianceFlag(hours)
        ]
      );
    }
  }

  for (const t of tasks) {
    const due = new Date();
    due.setUTCDate(due.getUTCDate() + t[6]);

    await client.query(
      `insert into pilot_demo_atlas_tasks
       (id, tenant_id, patient_demo_code, action_group, priority, title, description, status, due_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        uuid(),
        tenantId,
        t[0],
        t[1],
        t[2],
        t[3],
        t[4],
        t[5],
        due.toISOString()
      ]
    );
  }

  for (const n of notes) {
    await client.query(
      `insert into pilot_demo_notes
       (id, tenant_id, patient_demo_code, note_type, body, created_by)
       values ($1,$2,$3,$4,$5,$6)`,
      [
        uuid(),
        tenantId,
        n[0],
        n[1],
        n[2],
        n[3]
      ]
    );
  }
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
      w("COUNT_BEFORE_" + tableName.toUpperCase() + ": " + await countRows(client, tableName));
    }

    w("PLANNED_PATIENTS: " + patients.length);
    w("PLANNED_DEVICES: " + devices.length);
    w("PLANNED_COMPLIANCE_NIGHTS: " + (patients.length * 7));
    w("PLANNED_ATLAS_TASKS: " + tasks.length);
    w("PLANNED_NOTES: " + notes.length);

    if (!applyMode) {
      w("DRY_RUN_ACTION: would_clear_and_seed_pilot_demo_rows_for_target_tenant_only");
      w("DRY_RUN_PATIENT_CODES: " + patients.map(p => p.demo_code).join(", "));
      await client.end();
      safeExit("PILOT_DEMO_DATA_SEED_DRY_RUN_COMPLETED", 0);
    }

    await client.query("BEGIN");
    await insertData(client);
    await client.query("COMMIT");

    for (const tableName of requiredTables) {
      w("COUNT_AFTER_" + tableName.toUpperCase() + ": " + await countRows(client, tableName));
    }

    await client.end();
    safeExit("PILOT_DEMO_DATA_SEED_APPLIED", 0);
  } catch (err) {
    w("PILOT_DEMO_DATA_SEED_ERROR: " + err.message);
    try { await client.query("ROLLBACK"); } catch (e) {}
    try { await client.end(); } catch (e) {}
    safeExit("PILOT_DEMO_DATA_SEED_FAILED", 1);
  }
}

main();
'@

Set-Content -Path $JsPath -Value $JsContent -Encoding UTF8

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_PHASE42_DEMO_SEED_REPORT = $ReportPath
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
        Add-Result "Pilot demo data seed node runner" "PASS" "Node runner completed."
    } else {
        Add-Result "Pilot demo data seed node runner" "FAIL" ("Node runner failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($Apply) {
    if ($ReportContent -match "COUNT_AFTER_PILOT_DEMO_PATIENTS: 8") {
        Add-Result "Seeded demo patients" "PASS" "8 demo patients seeded."
    } else {
        Add-Result "Seeded demo patients" "FAIL" "Expected 8 demo patients after apply."
    }

    if ($ReportContent -match "COUNT_AFTER_PILOT_DEMO_DEVICES: 8") {
        Add-Result "Seeded demo devices" "PASS" "8 demo devices seeded."
    } else {
        Add-Result "Seeded demo devices" "FAIL" "Expected 8 demo devices after apply."
    }

    if ($ReportContent -match "COUNT_AFTER_PILOT_DEMO_COMPLIANCE_NIGHTS: 56") {
        Add-Result "Seeded compliance nights" "PASS" "56 compliance nights seeded."
    } else {
        Add-Result "Seeded compliance nights" "FAIL" "Expected 56 compliance nights after apply."
    }

    if ($ReportContent -match "COUNT_AFTER_PILOT_DEMO_ATLAS_TASKS: 7") {
        Add-Result "Seeded ATLAS tasks" "PASS" "7 ATLAS tasks seeded."
    } else {
        Add-Result "Seeded ATLAS tasks" "FAIL" "Expected 7 ATLAS tasks after apply."
    }

    if ($ReportContent -match "COUNT_AFTER_PILOT_DEMO_NOTES: 5") {
        Add-Result "Seeded demo notes" "PASS" "5 demo notes seeded."
    } else {
        Add-Result "Seeded demo notes" "FAIL" "Expected 5 demo notes after apply."
    }
} else {
    if ($ReportContent -match "PILOT_DEMO_DATA_SEED_DRY_RUN_COMPLETED") {
        Add-Result "Pilot demo data seed dry run" "PASS" "Dry run completed. No database changes made."
    } else {
        Add-Result "Pilot demo data seed dry run" "FAIL" "Dry run completion not confirmed."
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "PILOT DEMO DATA INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "Seed data is isolated in pilot_demo_* tables."
Write-ReportLine "This creates demo patients, devices, compliance nights, ATLAS tasks and notes for Raftopoulos pilot presentation."
Write-ReportLine ""
Write-ReportLine "Next phase after apply:"
Write-ReportLine "Phase 42.4 - Pilot Demo Data Verification"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE42_PILOT_DEMO_DATA_SEED_FAILED"
    $ExitCode = 1
} elseif ($Apply) {
    if ($script:WarnCount -gt 0) {
        $FinalStatus = "PHASE42_PILOT_DEMO_DATA_SEED_APPLIED_WITH_WARNINGS"
    } else {
        $FinalStatus = "PHASE42_PILOT_DEMO_DATA_SEED_APPLIED"
    }
    $ExitCode = 0
} else {
    if ($script:WarnCount -gt 0) {
        $FinalStatus = "PHASE42_PILOT_DEMO_DATA_SEED_DRY_RUN_READY_WITH_WARNINGS"
    } else {
        $FinalStatus = "PHASE42_PILOT_DEMO_DATA_SEED_DRY_RUN_READY"
    }
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 42.3 Pilot Demo Data Seed"
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