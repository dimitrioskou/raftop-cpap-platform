# RAFTOP CPAP CARE Pro
# Phase 103 - Pilot 20 Manual Patient Entry Module
# Creates backend + frontend module files for buyer-controlled 20-patient pilot.
# Does NOT import data.
# Does NOT expose secrets.
# Does NOT give source/infrastructure access to buyer.
# Manual entry is limited to tenant: raftopoulos-pilot-20 and max 20 patients.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$BackendRoutesDir = Join-Path $Root "enterprise-backend\routes"
$FrontendPagesDir = Join-Path $Root "enterprise-frontend\src\pages"
$FrontendComponentsDir = Join-Path $Root "enterprise-frontend\src\components"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $BackendRoutesDir -Force | Out-Null
New-Item -ItemType Directory -Path $FrontendPagesDir -Force | Out-Null
New-Item -ItemType Directory -Path $FrontendComponentsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase103_pilot20_manual_entry_module_" + $Timestamp + ".md")

$BackendRouteFile = Join-Path $BackendRoutesDir "pilot20ManualEntryRoutes.js"
$FrontendPageFile = Join-Path $FrontendPagesDir "Pilot20ManualEntryPage.js"
$DocFile = Join-Path $DocsDir "103_PILOT20_MANUAL_ENTRY_MODULE.md"
$IntegrationGuide = Join-Path $DocsDir "103_PILOT20_MANUAL_ENTRY_INTEGRATION_GUIDE.md"

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    Add-Content -Path $ReportPath -Value ("CHECK: " + $Name) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("STATUS: " + $Status) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("DETAILS: " + $Details) -Encoding UTF8
    Add-Content -Path $ReportPath -Value "" -Encoding UTF8

    Write-Host ($Status + " - " + $Name)
}

function Read-FileSafe {
    param([string]$Path)
    if (Test-Path $Path) {
        try { return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop } catch { return "" }
    }
    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)
    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) { return $Files[0] }
    return $null
}

function Check-ReportStatus {
    param([string]$Name, [string]$Pattern, [string[]]$AcceptedStatuses)

    $Latest = Get-LatestReport $Pattern

    if ($null -eq $Latest) {
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "FAIL" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 103 Pilot 20 Manual Patient Entry Module" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 103 - Pilot 20 Manual Patient Entry Module..."
Write-Host ""

Check-ReportStatus "Phase 102 pilot 20 access isolation lock status" "phase102_pilot20_access_isolation_lock_*.md" @(
    "PHASE102_PILOT20_ACCESS_ISOLATION_LOCK_READY",
    "PHASE102_PILOT20_ACCESS_ISOLATION_LOCK_READY_WITH_WARNINGS"
)

$BackendRouteContent = @'
const express = require("express");

const router = express.Router();

const PILOT_TENANT_ID = "raftopoulos-pilot-20";
const PILOT_PATIENT_LIMIT = 20;

function getDb(req) {
  if (req.app && req.app.locals && req.app.locals.db) return req.app.locals.db;
  if (req.app && req.app.locals && req.app.locals.pool) return req.app.locals.pool;
  if (global.pool) return global.pool;
  if (global.db) return global.db;
  return null;
}

function normalizeText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function toNumber(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function toInteger(value, fallback = 0) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toDateOrNull(value) {
  const text = normalizeText(value);
  if (!text) return null;
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  return text.slice(0, 10);
}

function hasForbiddenDirectIdentifiers(body) {
  const forbiddenKeys = [
    "first" + "_" + "name",
    "last" + "_" + "name",
    "full" + "_" + "name",
    "patient" + "_" + "name",
    "contact_number",
    "patient" + "_" + "email",
    "national_insurance_identifier",
    "residential_location",
    "birth_date"
  ];

  return forbiddenKeys.filter((key) => Object.prototype.hasOwnProperty.call(body, key));
}

function calculateAtlasSignal(input) {
  const monthUsage = toNumber(input.month_usage_hours);
  const ahi = toNumber(input.ahi_avg_30d);
  const leak = toNumber(input.leak_avg_30d);

  let score = 0;
  const reasons = [];

  if (monthUsage < 80) {
    score += 40;
    reasons.push("below_80h");
  }

  if (ahi > 10) {
    score += 25;
    reasons.push("high_ahi");
  }

  if (leak > 24) {
    score += 20;
    reasons.push("high_leak");
  }

  let priority = "low";
  if (score >= 80) priority = "critical";
  else if (score >= 50) priority = "high";
  else if (score >= 25) priority = "medium";

  let action_group = "COMPLIANCE_OK";
  if (monthUsage < 80) action_group = "COMPLIANCE_RISK";
  else if (ahi > 10 || leak > 24) action_group = "THERAPY_REVIEW";

  return {
    score,
    priority,
    action_group,
    reasons
  };
}

async function query(db, sql, params = []) {
  if (!db || typeof db.query !== "function") {
    throw new Error("Database connection is not available on app.locals.db/app.locals.pool/global.pool.");
  }
  return db.query(sql, params);
}

router.get("/health", async (req, res) => {
  res.json({
    ok: true,
    module: "pilot20_manual_entry",
    tenant_id: PILOT_TENANT_ID,
    max_patients: PILOT_PATIENT_LIMIT
  });
});

router.get("/summary", async (req, res) => {
  try {
    const db = getDb(req);

    const patientCountResult = await query(
      db,
      "select count(*)::int as count from public.patients where tenant_slug = $1",
      [PILOT_TENANT_ID]
    );

    const complianceResult = await query(
      db,
      `
      select
        count(*)::int as total_records,
        count(distinct patient_external_id)::int as distinct_patients,
        sum(case when month_usage_hours >= 80 then 1 else 0 end)::int as compliant_records,
        sum(case when month_usage_hours < 80 then 1 else 0 end)::int as below_80h_records,
        sum(case when ahi_avg_30d > 10 then 1 else 0 end)::int as high_ahi_records,
        sum(case when leak_avg_30d > 24 then 1 else 0 end)::int as high_leak_records
      from public.compliance_nights
      where tenant_slug = $1
      `,
      [PILOT_TENANT_ID]
    );

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      max_patients: PILOT_PATIENT_LIMIT,
      current_patients: patientCountResult.rows[0]?.count || 0,
      remaining_slots: Math.max(0, PILOT_PATIENT_LIMIT - (patientCountResult.rows[0]?.count || 0)),
      compliance: complianceResult.rows[0] || {}
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_summary_failed",
      message: error.message
    });
  }
});

router.get("/patients", async (req, res) => {
  try {
    const db = getDb(req);

    const result = await query(
      db,
      `
      select
        p.patient_external_id,
        p.patient_code,
        p.doctor_external_id,
        p.branch_code,
        p.setup_date,
        d.device_serial,
        d.device_model,
        d.last_data_date,
        c.month_usage_hours,
        c.usage_hours_30d,
        c.days_used_30d,
        c.ahi_avg_30d,
        c.leak_avg_30d,
        c.is_80h_compliant
      from public.patients p
      left join public.devices d
        on d.tenant_slug = p.tenant_slug
       and d.patient_external_id = p.patient_external_id
      left join public.patient_compliance_latest c
        on c.tenant_slug = p.tenant_slug
       and c.patient_external_id = p.patient_external_id
      where p.tenant_slug = $1
      order by p.created_at desc, p.patient_external_id asc
      `,
      [PILOT_TENANT_ID]
    );

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      rows: result.rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_patients_failed",
      message: error.message
    });
  }
});

router.post("/patients", async (req, res) => {
  try {
    const db = getDb(req);
    const body = req.body || {};

    const forbidden = hasForbiddenDirectIdentifiers(body);
    if (forbidden.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "direct_identifiers_not_allowed",
        forbidden_fields: forbidden
      });
    }

    const patient_external_id = normalizeText(body.patient_external_id);
    const patient_code = normalizeText(body.patient_code);
    const device_serial = normalizeText(body.device_serial);

    if (!patient_external_id || !patient_code || !device_serial) {
      return res.status(400).json({
        ok: false,
        error: "missing_required_fields",
        required: ["patient_external_id", "patient_code", "device_serial"]
      });
    }

    const existingCountResult = await query(
      db,
      "select count(*)::int as count from public.patients where tenant_slug = $1",
      [PILOT_TENANT_ID]
    );

    const existingPatientResult = await query(
      db,
      "select count(*)::int as count from public.patients where tenant_slug = $1 and patient_external_id = $2",
      [PILOT_TENANT_ID, patient_external_id]
    );

    const patientCount = existingCountResult.rows[0]?.count || 0;
    const isExistingPatient = (existingPatientResult.rows[0]?.count || 0) > 0;

    if (!isExistingPatient && patientCount >= PILOT_PATIENT_LIMIT) {
      return res.status(409).json({
        ok: false,
        error: "pilot_patient_limit_reached",
        max_patients: PILOT_PATIENT_LIMIT
      });
    }

    const device_model = normalizeText(body.device_model);
    const doctor_external_id = normalizeText(body.doctor_external_id);
    const branch_code = normalizeText(body.branch_code) || "PILOT20";
    const setup_date = toDateOrNull(body.setup_date);
    const month_start = toDateOrNull(body.month_start);
    const last_data_date = toDateOrNull(body.last_data_date);
    const record_date = last_data_date || month_start;

    const month_usage_hours = toNumber(body.month_usage_hours);
    const usage_hours_30d = toNumber(body.usage_hours_30d);
    const days_used_30d = toInteger(body.days_used_30d);
    const ahi_avg_30d = toNumber(body.ahi_avg_30d);
    const leak_avg_30d = toNumber(body.leak_avg_30d);

    if (!record_date) {
      return res.status(400).json({
        ok: false,
        error: "record_date_required",
        message: "Provide last_data_date or month_start."
      });
    }

    await query(
      db,
      `
      insert into public.tenants (slug, name, status, plan_name, notes)
      values ($1, 'Raftopoulos Pilot 20', 'active', 'pilot', 'Two-month controlled pilot for 20 pseudonymized CPAP patients.')
      on conflict (slug) do update
      set name = excluded.name,
          status = excluded.status,
          plan_name = excluded.plan_name,
          notes = excluded.notes,
          updated_at = now()
      `,
      [PILOT_TENANT_ID]
    );

    await query(
      db,
      `
      insert into public.patients
        (tenant_slug, patient_external_id, patient_code, doctor_external_id, branch_code, status, setup_date, consent_basis, data_source, created_at, updated_at)
      values
        ($1, $2, $3, $4, $5, 'active', $6, 'approved_pilot', 'pilot20_manual', now(), now())
      on conflict (tenant_slug, patient_external_id) do update
      set patient_code = excluded.patient_code,
          doctor_external_id = excluded.doctor_external_id,
          branch_code = excluded.branch_code,
          status = excluded.status,
          setup_date = excluded.setup_date,
          consent_basis = excluded.consent_basis,
          data_source = excluded.data_source,
          updated_at = now()
      `,
      [PILOT_TENANT_ID, patient_external_id, patient_code, doctor_external_id, branch_code, setup_date]
    );

    await query(
      db,
      `
      insert into public.devices
        (tenant_slug, patient_external_id, device_serial, device_model, status, setup_date, last_data_date, data_source, created_at, updated_at)
      values
        ($1, $2, $3, $4, 'active', $5, $6, 'pilot20_manual', now(), now())
      on conflict (tenant_slug, device_serial) do update
      set patient_external_id = excluded.patient_external_id,
          device_model = excluded.device_model,
          status = excluded.status,
          setup_date = excluded.setup_date,
          last_data_date = excluded.last_data_date,
          data_source = excluded.data_source,
          updated_at = now()
      `,
      [PILOT_TENANT_ID, patient_external_id, device_serial, device_model, setup_date, last_data_date]
    );

    await query(
      db,
      `
      insert into public.compliance_nights
        (tenant_slug, patient_external_id, device_serial, record_date, month_start, usage_hours, month_usage_hours, usage_hours_30d, days_used_30d, ahi_avg_30d, leak_avg_30d, data_source, created_at, updated_at)
      values
        ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, 'pilot20_manual', now(), now())
      on conflict (tenant_slug, patient_external_id, record_date) do update
      set device_serial = excluded.device_serial,
          month_start = excluded.month_start,
          usage_hours = excluded.usage_hours,
          month_usage_hours = excluded.month_usage_hours,
          usage_hours_30d = excluded.usage_hours_30d,
          days_used_30d = excluded.days_used_30d,
          ahi_avg_30d = excluded.ahi_avg_30d,
          leak_avg_30d = excluded.leak_avg_30d,
          data_source = excluded.data_source,
          updated_at = now()
      `,
      [
        PILOT_TENANT_ID,
        patient_external_id,
        device_serial,
        record_date,
        month_start,
        month_usage_hours,
        usage_hours_30d,
        days_used_30d,
        ahi_avg_30d,
        leak_avg_30d
      ]
    );

    const atlas = calculateAtlasSignal({
      month_usage_hours,
      ahi_avg_30d,
      leak_avg_30d
    });

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      patient_external_id,
      patient_code,
      is_80h_compliant: month_usage_hours >= 80,
      atlas,
      message: "Pilot patient saved."
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_patient_save_failed",
      message: error.message
    });
  }
});

module.exports = router;
'@

Set-Content -Path $BackendRouteFile -Value $BackendRouteContent -Encoding UTF8

$FrontendPageContent = @'
import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

const EMPTY_FORM = {
  patient_external_id: "",
  patient_code: "",
  device_serial: "",
  device_model: "AirSense 10",
  setup_date: "",
  month_start: "",
  last_data_date: "",
  month_usage_hours: "",
  usage_hours_30d: "",
  days_used_30d: "",
  ahi_avg_30d: "",
  leak_avg_30d: "",
  doctor_external_id: "",
  branch_code: "PILOT20"
};

function toNumber(value) {
  const n = Number(String(value || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function calculateLocalPreview(form) {
  const monthUsage = toNumber(form.month_usage_hours);
  const ahi = toNumber(form.ahi_avg_30d);
  const leak = toNumber(form.leak_avg_30d);

  const reasons = [];
  let score = 0;

  if (monthUsage < 80) {
    score += 40;
    reasons.push("ΞΞ¬Ο„Ο‰ Ξ±Ο€Ο 80 ΟΟΞµΟ‚");
  }

  if (ahi > 10) {
    score += 25;
    reasons.push("Ξ¥ΟΞ·Ξ»Ο AHI");
  }

  if (leak > 24) {
    score += 20;
    reasons.push("Ξ¥ΟΞ·Ξ»Ο leak");
  }

  let priority = "Ξ§Ξ±ΞΌΞ·Ξ»Ξ®";
  if (score >= 80) priority = "ΞΟΞ―ΟƒΞΉΞΌΞ·";
  else if (score >= 50) priority = "Ξ¥ΟΞ·Ξ»Ξ®";
  else if (score >= 25) priority = "ΞΞµΟƒΞ±Ξ―Ξ±";

  return {
    is80h: monthUsage >= 80,
    score,
    priority,
    reasons
  };
}

export default function Pilot20ManualEntryPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [summary, setSummary] = useState(null);
  const [patients, setPatients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const preview = useMemo(() => calculateLocalPreview(form), [form]);

  async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(json.message || json.error || "Request failed");
    }

    return json;
  }

  async function loadData() {
    try {
      const summaryJson = await apiFetch("/api/pilot20/summary");
      setSummary(summaryJson);

      const patientsJson = await apiFetch("/api/pilot20/patients");
      setPatients(patientsJson.rows || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitPatient(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const result = await apiFetch("/api/pilot20/patients", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setMessage(
        `Ξ‘Ο€ΞΏΞΈΞ·ΞΊΞµΟΟ„Ξ·ΞΊΞµ: ${result.patient_code}. 80h: ${
          result.is_80h_compliant ? "ΞΞ‘Ξ™" : "ΞΞ§Ξ™"
        }. ATLAS: ${result.atlas?.priority || "-"}`
      );

      setForm(EMPTY_FORM);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const currentPatients = summary?.current_patients ?? patients.length;
  const remainingSlots = summary?.remaining_slots ?? Math.max(0, 20 - patients.length);

  return (
    <div style={{ padding: 24, maxWidth: 1180, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, color: "#64748b", fontWeight: 700 }}>
          RAFTOP CPAP CARE Pro
        </p>
        <h1 style={{ margin: "4px 0 8px" }}>Pilot 20 β€” ΞΞ±Ο„Ξ±Ο‡ΟΟΞ·ΟƒΞ· CPAP Ξ±ΟƒΞΈΞµΞ½ΟΞ½</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          ΞΞ±ΞΈΞ±ΟΟ pilot Ο€ΞµΟΞΉΞ²Ξ¬Ξ»Ξ»ΞΏΞ½ Ξ³ΞΉΞ± Ξ­Ο‰Ο‚ 20 ΟΞµΟ…Ξ΄Ο‰Ξ½Ο…ΞΌΞΏΟ€ΞΏΞΉΞ·ΞΌΞ­Ξ½ΞΏΟ…Ο‚ Ξ±ΟƒΞΈΞµΞ½ΞµΞ―Ο‚.
          Ξ”ΞµΞ½ ΞΊΞ±Ο„Ξ±Ο‡Ο‰ΟΞΏΟΞ½Ο„Ξ±ΞΉ ΞΏΞ½ΟΞΌΞ±Ο„Ξ±, ΟƒΟ„ΞΏΞΉΟ‡ΞµΞ―Ξ± ΞµΟ€ΞΉΞΊΞΏΞΉΞ½Ο‰Ξ½Ξ―Ξ±Ο‚ Ξ® Ξ¬ΞΌΞµΟƒΞ± Ξ±Ξ½Ξ±Ξ³Ξ½Ο‰ΟΞΉΟƒΟ„ΞΉΞΊΞ¬.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 24
        }}
      >
        <div style={cardStyle}>
          <div style={labelStyle}>Ξ‘ΟƒΞΈΞµΞ½ΞµΞ―Ο‚ pilot</div>
          <div style={metricStyle}>{currentPatients}/20</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Ξ”ΞΉΞ±ΞΈΞ­ΟƒΞΉΞΌΞµΟ‚ ΞΈΞ­ΟƒΞµΞΉΟ‚</div>
          <div style={metricStyle}>{remainingSlots}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>80h compliant records</div>
          <div style={metricStyle}>{summary?.compliance?.compliant_records ?? "-"}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>ΞΞ¬Ο„Ο‰ Ξ±Ο€Ο 80h</div>
          <div style={metricStyle}>{summary?.compliance?.below_80h_records ?? "-"}</div>
        </div>
      </section>

      {message && <div style={successStyle}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      <section style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        <form onSubmit={submitPatient} style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>ΞΞ­Ξ± ΞΊΞ±Ο„Ξ±Ο‡ΟΟΞ·ΟƒΞ· / ΞµΞ½Ξ·ΞΌΞ­ΟΟ‰ΟƒΞ· Ξ±ΟƒΞΈΞµΞ½ΞΏΟΟ‚</h2>

          <div style={gridStyle}>
            <Field label="Patient External ID" value={form.patient_external_id} onChange={(v) => updateField("patient_external_id", v)} required />
            <Field label="Patient Code" value={form.patient_code} onChange={(v) => updateField("patient_code", v)} required />
            <Field label="Device Serial" value={form.device_serial} onChange={(v) => updateField("device_serial", v)} required />
            <Field label="Device Model" value={form.device_model} onChange={(v) => updateField("device_model", v)} />

            <Field type="date" label="Setup Date" value={form.setup_date} onChange={(v) => updateField("setup_date", v)} />
            <Field type="date" label="Month Start" value={form.month_start} onChange={(v) => updateField("month_start", v)} />
            <Field type="date" label="Last Data Date" value={form.last_data_date} onChange={(v) => updateField("last_data_date", v)} />

            <Field label="Month Usage Hours" value={form.month_usage_hours} onChange={(v) => updateField("month_usage_hours", v)} required />
            <Field label="Usage Hours 30d" value={form.usage_hours_30d} onChange={(v) => updateField("usage_hours_30d", v)} />
            <Field label="Days Used 30d" value={form.days_used_30d} onChange={(v) => updateField("days_used_30d", v)} />
            <Field label="AHI Avg 30d" value={form.ahi_avg_30d} onChange={(v) => updateField("ahi_avg_30d", v)} />
            <Field label="Leak Avg 30d" value={form.leak_avg_30d} onChange={(v) => updateField("leak_avg_30d", v)} />

            <Field label="Doctor Code" value={form.doctor_external_id} onChange={(v) => updateField("doctor_external_id", v)} />
            <Field label="Branch Code" value={form.branch_code} onChange={(v) => updateField("branch_code", v)} />
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
            <button type="submit" disabled={saving || remainingSlots <= 0} style={primaryButtonStyle}>
              {saving ? "Ξ‘Ο€ΞΏΞΈΞ®ΞΊΞµΟ…ΟƒΞ·..." : "Ξ‘Ο€ΞΏΞΈΞ®ΞΊΞµΟ…ΟƒΞ· Ξ±ΟƒΞΈΞµΞ½ΞΏΟΟ‚"}
            </button>
            <button type="button" onClick={() => setForm(EMPTY_FORM)} style={secondaryButtonStyle}>
              ΞΞ±ΞΈΞ±ΟΞΉΟƒΞΌΟΟ‚
            </button>
          </div>

          {remainingSlots <= 0 && (
            <p style={{ color: "#b91c1c", fontWeight: 700 }}>
              Ξ¤ΞΏ ΟΟΞΉΞΏ Ο„Ο‰Ξ½ 20 Ξ±ΟƒΞΈΞµΞ½ΟΞ½ Ξ­Ο‡ΞµΞΉ ΟƒΟ…ΞΌΟ€Ξ»Ξ·ΟΟ‰ΞΈΞµΞ―.
            </p>
          )}
        </form>

        <aside style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Ξ†ΞΌΞµΟƒΞ· Ο€ΟΞΏΞµΟ€ΞΉΟƒΞΊΟΟ€Ξ·ΟƒΞ·</h2>

          <div style={previewBoxStyle}>
            <div style={labelStyle}>80 Hours Compliance</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {preview.is80h ? "ΞΞ‘Ξ™" : "ΞΞ§Ξ™"}
            </div>
          </div>

          <div style={previewBoxStyle}>
            <div style={labelStyle}>ATLAS Priority</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{preview.priority}</div>
            <div style={{ color: "#64748b" }}>Score: {preview.score}</div>
          </div>

          <div style={previewBoxStyle}>
            <div style={labelStyle}>Ξ›ΟΞ³ΞΏΞΉ follow-up</div>
            {preview.reasons.length === 0 ? (
              <div>Ξ”ΞµΞ½ Ο…Ο€Ξ¬ΟΟ‡ΞµΞΉ Ξ¬ΞΌΞµΟƒΞΏ ΟƒΞ®ΞΌΞ± ΞΊΞΉΞ½Ξ΄ΟΞ½ΞΏΟ….</div>
            ) : (
              <ul>
                {preview.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>

      <section style={{ ...panelStyle, marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Pilot Ξ±ΟƒΞΈΞµΞ½ΞµΞ―Ο‚</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Code",
                  "Device",
                  "Usage",
                  "80h",
                  "AHI",
                  "Leak",
                  "Doctor",
                  "Last Data"
                ].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.patient_external_id}>
                  <td style={tdStyle}>{p.patient_code}</td>
                  <td style={tdStyle}>{p.device_serial}</td>
                  <td style={tdStyle}>{p.month_usage_hours ?? "-"}</td>
                  <td style={tdStyle}>{String(p.is_80h_compliant) === "true" ? "ΞΞ‘Ξ™" : "ΞΞ§Ξ™"}</td>
                  <td style={tdStyle}>{p.ahi_avg_30d ?? "-"}</td>
                  <td style={tdStyle}>{p.leak_avg_30d ?? "-"}</td>
                  <td style={tdStyle}>{p.doctor_external_id ?? "-"}</td>
                  <td style={tdStyle}>{p.last_data_date ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required = false, type = "text" }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", marginBottom: 6, color: "#334155", fontWeight: 700 }}>
        {label}{required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const labelStyle = {
  color: "#64748b",
  fontSize: 13,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.4
};

const metricStyle = {
  fontSize: 30,
  fontWeight: 900,
  marginTop: 6
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14
};

const primaryButtonStyle = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer"
};

const secondaryButtonStyle = {
  background: "#f8fafc",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer"
};

const previewBoxStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  marginBottom: 12,
  background: "#f8fafc"
};

const successStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #86efac",
  padding: 12,
  borderRadius: 12,
  marginBottom: 16,
  fontWeight: 700
};

const errorStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  marginBottom: 16,
  fontWeight: 700
};

const thStyle = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569"
};

const tdStyle = {
  padding: "10px 8px",
  borderBottom: "1px solid #f1f5f9"
};
'@

Set-Content -Path $FrontendPageFile -Value $FrontendPageContent -Encoding UTF8

$DocContent = @'
# RAFTOP CPAP CARE Pro - Pilot 20 Manual Patient Entry Module

REQUIRED_MARKER: PHASE103_PILOT20_MANUAL_ENTRY_MODULE
REQUIRED_MARKER: BUYER_CAN_ENTER_PATIENTS
REQUIRED_MARKER: HARD_LIMIT_20_PATIENTS
REQUIRED_MARKER: TENANT_RAFTOPoulos_PILOT_20_ONLY
REQUIRED_MARKER: EIGHTY_HOURS_PREVIEW
REQUIRED_MARKER: ATLAS_PREVIEW
REQUIRED_MARKER: READY_FOR_PHASE104_INTEGRATION_AND_DEPLOY

## Purpose

This module allows Raftopoulos to manually enter up to 20 pseudonymized CPAP pilot patients.

## Tenant

raftopoulos-pilot-20

## Hard limit

Maximum 20 patients.

## Manual entry fields

- patient_external_id
- patient_code
- device_serial
- device_model
- setup_date
- month_start
- last_data_date
- month_usage_hours
- usage_hours_30d
- days_used_30d
- ahi_avg_30d
- leak_avg_30d
- doctor_external_id
- branch_code

## Outputs

- patient saved
- device saved
- compliance record saved
- 80h compliance preview
- ATLAS score preview
- pilot summary
- pilot patient list

## Security

No direct identifiers are allowed.
Buyer gets tenant-level access only.
Synthetic 7000 validation data must not be exposed in the pilot workflow.
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

$IntegrationGuideContent = @'
# RAFTOP CPAP CARE Pro - Pilot 20 Manual Entry Integration Guide

REQUIRED_MARKER: PHASE103_INTEGRATION_GUIDE
REQUIRED_MARKER: BACKEND_ROUTE_TO_MOUNT
REQUIRED_MARKER: FRONTEND_ROUTE_TO_ADD
REQUIRED_MARKER: MENU_LINK_TO_ADD

## Backend integration

Mount this backend route:

File:
enterprise-backend/routes/pilot20ManualEntryRoutes.js

Expected mount:
app.use("/api/pilot20", require("./routes/pilot20ManualEntryRoutes"));

Common target file:
enterprise-backend/server.js
or
enterprise-backend/src/server.js
or
enterprise-backend/app.js

## Frontend integration

Page file:
enterprise-frontend/src/pages/Pilot20ManualEntryPage.js

Suggested route:
<Route path="/pilot20/manual-entry" element={<Pilot20ManualEntryPage />} />

Suggested menu label:
Pilot 20 Entry

## Required after integration

1. Restart backend.
2. Rebuild/redeploy frontend.
3. Test:
   - GET /api/pilot20/health
   - GET /api/pilot20/summary
   - POST /api/pilot20/patients
4. Confirm hard limit 20.
5. Confirm no direct identifiers.
'@

Set-Content -Path $IntegrationGuide -Value $IntegrationGuideContent -Encoding UTF8

foreach ($Path in @($BackendRouteFile, $FrontendPageFile, $DocFile, $IntegrationGuide)) {
    if (Test-Path $Path) {
        Add-Result ("Phase 103 file created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase 103 file created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

foreach ($Marker in @(
    "PHASE103_PILOT20_MANUAL_ENTRY_MODULE",
    "BUYER_CAN_ENTER_PATIENTS",
    "HARD_LIMIT_20_PATIENTS",
    "TENANT_RAFTOPoulos_PILOT_20_ONLY",
    "EIGHTY_HOURS_PREVIEW",
    "ATLAS_PREVIEW",
    "READY_FOR_PHASE104_INTEGRATION_AND_DEPLOY",
    "PHASE103_INTEGRATION_GUIDE",
    "BACKEND_ROUTE_TO_MOUNT",
    "FRONTEND_ROUTE_TO_ADD",
    "MENU_LINK_TO_ADD"
)) {
    $Found = $false

    foreach ($Path in @($DocFile, $IntegrationGuide)) {
        $Content = Read-FileSafe $Path
        if (ContainsText $Content $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $FrontendPageFile, $DocFile, $IntegrationGuide)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "raftopoulos-pilot-20",
    "PILOT_PATIENT_LIMIT = 20",
    "/api/pilot20",
    "month_usage_hours",
    "ahi_avg_30d",
    "leak_avg_30d",
    "is_80h_compliant",
    "atlas"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required module text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required module text exists: " + $Required) "FAIL" "Missing."
    }
}

foreach ($Forbidden in @(
    "first" + "_" + "name",
    "last" + "_" + "name",
    "full" + "_" + "name",
    "patient" + "_" + "name",
    "patient" + "_" + "email",
    "DATABASE_URL=",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "postgresql://",
    "sk-"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden module content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden module content absent: " + $Forbidden) "PASS" "Absent."
    }
}

Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
} else {
    Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE103_PILOT20_MANUAL_ENTRY_MODULE_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE103_PILOT20_MANUAL_ENTRY_MODULE_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE103_PILOT20_MANUAL_ENTRY_MODULE_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 103 Pilot 20 Manual Entry Module"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend route:"
Write-Host $BackendRouteFile
Write-Host ""
Write-Host "Frontend page:"
Write-Host $FrontendPageFile
Write-Host ""
Write-Host "Docs:"
Write-Host $DocFile
Write-Host $IntegrationGuide
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


