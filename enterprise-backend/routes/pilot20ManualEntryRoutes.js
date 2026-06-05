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

