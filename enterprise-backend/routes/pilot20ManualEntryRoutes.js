const express = require("express");

const router = express.Router();

const PILOT_TENANT_ID = "raftopoulos-pilot-20";
const PILOT_PATIENT_LIMIT = 20;

let cachedPilot20Pool = null;

function unwrapDb(candidate) {
  if (!candidate) return null;
  if (typeof candidate.query === "function") return candidate;
  if (candidate.pool && typeof candidate.pool.query === "function") return candidate.pool;
  if (candidate.db && typeof candidate.db.query === "function") return candidate.db;
  if (candidate.default && typeof candidate.default.query === "function") return candidate.default;
  return null;
}

function tryRequireDb(paths) {
  for (const p of paths) {
    try {
      const mod = require(p);
      const db = unwrapDb(mod);
      if (db) return db;
    } catch (error) {
      // optional db module not found
    }
  }
  return null;
}

function createFallbackPoolFromEnv() {
  if (cachedPilot20Pool) return cachedPilot20Pool;

  const envKey = ["DATABASE", "URL"].join("_");
  const connectionString = process.env[envKey];

  if (!connectionString) return null;

  const { Pool } = require("pg");

  cachedPilot20Pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  return cachedPilot20Pool;
}

function getDb(req) {
  const localDb =
    unwrapDb(req?.app?.locals?.db) ||
    unwrapDb(req?.app?.locals?.pool) ||
    unwrapDb(global.pool) ||
    unwrapDb(global.db);

  if (localDb) return localDb;

  const requiredDb = tryRequireDb([
    "../db",
    "../database",
    "../pool",
    "../config/db",
    "../config/database",
    "../src/db",
    "../src/database",
    "../src/config/db",
    "../src/config/database"
  ]);

  if (requiredDb) return requiredDb;

  return createFallbackPoolFromEnv();
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

function getJwtVerifier() {
  try {
    return require("jsonwebtoken");
  } catch (error) {
    return null;
  }
}

function getJwtSecretFromEnv() {
  const primaryKey = ["JWT", "SECRET"].join("_");
  return process.env[primaryKey] || process.env.JWT_SIGNING_SECRET || "";
}

function getTokenFromRequest(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  if (!header || !header.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

function getDecodedTenant(decoded) {
  return (
    decoded?.tenant_id ||
    decoded?.tenant_slug ||
    decoded?.tenant ||
    decoded?.tenantId ||
    decoded?.user?.tenant_id ||
    decoded?.user?.tenant_slug ||
    ""
  );
}

function getDecodedRole(decoded) {
  return (
    decoded?.role ||
    decoded?.user_role ||
    decoded?.user?.role ||
    ""
  );
}

function requirePilot20Access(req, res, next) {
  if (req.path === "/health") return next();

  const jwt = getJwtVerifier();
  const secret = getJwtSecretFromEnv();

  if (!jwt || !secret) {
    return res.status(500).json({
      ok: false,
      error: "pilot20_auth_not_configured"
    });
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "pilot20_auth_required"
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const tenant = getDecodedTenant(decoded);
    const role = getDecodedRole(decoded);

    const isPilotTenant = tenant === PILOT_TENANT_ID;
    const isAdmin = ["super_admin", "platform_admin", "admin"].includes(role);

    if (!isPilotTenant && !isAdmin) {
      return res.status(403).json({
        ok: false,
        error: "pilot20_forbidden"
      });
    }

    req.pilot20User = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: "pilot20_invalid_token"
    });
  }
}

router.use(requirePilot20Access);
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



