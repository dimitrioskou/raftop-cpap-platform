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


function pilot20ParseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function pilot20Number(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function pilot20DaysInMonth(date) {
  const d = pilot20ParseDate(date) || new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function pilot20DayOfMonth(date) {
  const d = pilot20ParseDate(date) || new Date();
  return d.getDate();
}

function pilot20Round(value, digits = 1) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) || 0) * factor) / factor;
}

function pilot20BuildRescueRow(row) {
  const targetHours = 80;

  const currentHours = pilot20Number(row.month_usage_hours || row.usage_hours_30d || row.usage_hours);
  const monthStart = row.month_start || row.record_date || row.last_data_date || new Date().toISOString().slice(0, 10);
  const lastDataDate = row.record_date || row.last_data_date || new Date().toISOString().slice(0, 10);

  const totalDays = pilot20DaysInMonth(monthStart);
  const elapsedDays = Math.max(1, Math.min(totalDays, pilot20DayOfMonth(lastDataDate)));
  const daysLeft = Math.max(0, totalDays - elapsedDays);

  const expectedByToday = (targetHours / totalDays) * elapsedDays;
  const remainingHours = Math.max(0, targetHours - currentHours);
  const requiredDailyHours = daysLeft > 0 ? remainingHours / daysLeft : remainingHours;
  const projectedEndMonthHours = elapsedDays > 0 ? (currentHours / elapsedDays) * totalDays : 0;

  const ahi = pilot20Number(row.ahi_avg_30d);
  const leak = pilot20Number(row.leak_avg_30d);

  let risk_level = "SAFE";
  let action = "No action required";
  let score = 0;

  if (currentHours >= targetHours) {
    risk_level = "SAFE";
    action = "Already reached 80h";
    score = 0;
  } else if (projectedEndMonthHours >= targetHours && currentHours >= expectedByToday * 0.9) {
    risk_level = "ON_TRACK";
    action = "Monitor only";
    score = 20;
  } else if (requiredDailyHours <= 3) {
    risk_level = "WATCH";
    action = "Check within 48 hours";
    score = 40;
  } else if (requiredDailyHours <= 6) {
    risk_level = "RESCUE";
    action = "Call today";
    score = 70;
  } else {
    risk_level = "CRITICAL";
    action = "Urgent rescue call";
    score = 90;
  }

  if (ahi > 10) {
    score += 10;
    if (risk_level === "SAFE" || risk_level === "ON_TRACK") {
      action = "Therapy review: high AHI";
    }
  }

  if (leak > 24) {
    score += 10;
    if (risk_level === "SAFE" || risk_level === "ON_TRACK") {
      action = "Mask/leak review";
    }
  }

  const riskOrder = {
    CRITICAL: 5,
    RESCUE: 4,
    WATCH: 3,
    ON_TRACK: 2,
    SAFE: 1
  };

  return {
    tenant_id: PILOT_TENANT_ID,
    patient_external_id: row.patient_external_id,
    patient_code: row.patient_code,
    device_serial: row.device_serial,
    device_model: row.device_model,
    doctor_external_id: row.doctor_external_id,
    branch_code: row.branch_code,
    month_start: monthStart,
    last_data_date: lastDataDate,
    total_days_in_month: totalDays,
    elapsed_days: elapsedDays,
    days_left: daysLeft,
    current_hours: pilot20Round(currentHours),
    target_hours: targetHours,
    expected_by_today: pilot20Round(expectedByToday),
    remaining_hours: pilot20Round(remainingHours),
    required_daily_hours: pilot20Round(requiredDailyHours),
    projected_end_month_hours: pilot20Round(projectedEndMonthHours),
    ahi_avg_30d: pilot20Round(ahi),
    leak_avg_30d: pilot20Round(leak),
    days_used_30d: row.days_used_30d || 0,
    risk_level,
    risk_order: riskOrder[risk_level] || 0,
    atlas_action: action,
    atlas_score: Math.min(100, score),
    is_80h_compliant: currentHours >= targetHours
  };
}

router.get("/rescue-monitor", async (req, res) => {
  try {
    const db = getDb(req);

    const result = await query(
      db,
      `
      with latest_compliance as (
        select distinct on (tenant_slug, patient_external_id)
          tenant_slug,
          patient_external_id,
          device_serial,
          record_date,
          month_start,
          usage_hours,
          month_usage_hours,
          usage_hours_30d,
          days_used_30d,
          ahi_avg_30d,
          leak_avg_30d
        from public.compliance_nights
        where tenant_slug = $1
        order by tenant_slug, patient_external_id, record_date desc
      )
      select
        p.patient_external_id,
        p.patient_code,
        p.doctor_external_id,
        p.branch_code,
        p.setup_date,
        d.device_serial,
        d.device_model,
        d.last_data_date,
        c.record_date,
        c.month_start,
        c.usage_hours,
        c.month_usage_hours,
        c.usage_hours_30d,
        c.days_used_30d,
        c.ahi_avg_30d,
        c.leak_avg_30d
      from public.patients p
      left join public.devices d
        on d.tenant_slug = p.tenant_slug
       and d.patient_external_id = p.patient_external_id
      left join latest_compliance c
        on c.tenant_slug = p.tenant_slug
       and c.patient_external_id = p.patient_external_id
      where p.tenant_slug = $1
      order by p.patient_external_id asc
      `,
      [PILOT_TENANT_ID]
    );

    const rows = result.rows.map(pilot20BuildRescueRow).sort((a, b) => {
      if (b.risk_order !== a.risk_order) return b.risk_order - a.risk_order;
      return b.required_daily_hours - a.required_daily_hours;
    });

    const summary = {
      total_patients: rows.length,
      already_80h: rows.filter((r) => r.risk_level === "SAFE").length,
      on_track: rows.filter((r) => r.risk_level === "ON_TRACK").length,
      watch: rows.filter((r) => r.risk_level === "WATCH").length,
      rescue: rows.filter((r) => r.risk_level === "RESCUE").length,
      critical: rows.filter((r) => r.risk_level === "CRITICAL").length,
      below_80h: rows.filter((r) => !r.is_80h_compliant).length
    };

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      target_hours: 80,
      module: "pilot20_80h_compliance_pace_rescue_monitor",
      summary,
      rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_rescue_monitor_failed",
      message: error.message
    });
  }
});


function pilot20CsvSplitLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function pilot20ParseCsv(csvText) {
  const cleanText = String(csvText || "").replace(/^\uFEFF/, "");
  const lines = cleanText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      ok: false,
      error: "csv_requires_header_and_at_least_one_data_row",
      rows: []
    };
  }

  const headers = pilot20CsvSplitLine(lines[0]).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = pilot20CsvSplitLine(lines[i]);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    row.__line = i + 1;
    rows.push(row);
  }

  return {
    ok: true,
    headers,
    rows
  };
}

function pilot20RequireUsageHeaders(headers) {
  const required = [
    "device_serial",
    "month_start",
    "last_data_date",
    "month_usage_hours",
    "usage_hours_30d",
    "days_used_30d",
    "ahi_avg_30d",
    "leak_avg_30d"
  ];

  return required.filter((header) => !headers.includes(header));
}

function pilot20CleanValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function pilot20ToNumberValue(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function pilot20ToIntegerValue(value, fallback = 0) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function pilot20ToDateText(value) {
  const text = pilot20CleanValue(value);
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return text.slice(0, 10);
}

function pilot20HasForbiddenCsvHeaders(headers) {
  const forbidden = [
    "first_name",
    "last_name",
    "full_name",
    "patient_name",
    "phone",
    "mobile",
    "email",
    "amka",
    "address",
    "date_of_birth",
    "birth_date"
  ];

  return forbidden.filter((header) => headers.map((h) => h.toLowerCase()).includes(header));
}

router.get("/usage-template", async (req, res) => {
  res.type("text/csv").send(
    [
      "device_serial,month_start,last_data_date,month_usage_hours,usage_hours_30d,days_used_30d,ahi_avg_30d,leak_avg_30d",
      "DEVICE-001,2026-06-01,2026-06-10,24,24,8,7.2,18"
    ].join("\n")
  );
});


function pilot20NormalizeHeaderName(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-\/().%]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function pilot20FirstOfMonth(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function pilot20FindHeader(headers, aliases) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: pilot20NormalizeHeaderName(header)
  }));

  const normalizedAliases = aliases.map(pilot20NormalizeHeaderName);

  const match = normalizedHeaders.find((item) => normalizedAliases.includes(item.normalized));
  return match ? match.original : "";
}


function pilot20LoadLockedAirViewAliases() {
  try {
    const fs = require("fs");
    const path = require("path");
    const configPath = path.join(__dirname, "..", "config", "pilot20AirViewHeaderMap.locked.json");

    if (!fs.existsSync(configPath)) {
      return {};
    }

    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);

    return parsed.locked_aliases || {};
  } catch (error) {
    return {};
  }
}

function pilot20MergeAirViewAliasMap(baseAliasMap, lockedAliases) {
  const merged = { ...baseAliasMap };

  Object.keys(lockedAliases || {}).forEach((canonical) => {
    const values = Array.isArray(lockedAliases[canonical])
      ? lockedAliases[canonical]
      : [lockedAliases[canonical]];

    merged[canonical] = Array.from(new Set([
      ...(merged[canonical] || []),
      ...values.filter(Boolean)
    ]));
  });

  return merged;
}

function pilot20NormalizeAirViewUsageCsv(parsed) {
  const originalHeaders = parsed.headers || [];

  const aliasMap = {
    device_serial: [
      "device_serial",
      "device serial",
      "serial number",
      "serial no",
      "serial",
      "device number",
      "device id",
      "s/n",
      "sn"
    ],
    month_start: [
      "month_start",
      "month start",
      "start date",
      "period start",
      "compliance start",
      "report start",
      "from date",
      "date from"
    ],
    last_data_date: [
      "last_data_date",
      "last data date",
      "last data",
      "end date",
      "period end",
      "compliance end",
      "report end",
      "to date",
      "date to",
      "therapy date",
      "data date"
    ],
    month_usage_hours: [
      "month_usage_hours",
      "month usage hours",
      "usage hours",
      "used hours",
      "total usage hours",
      "total hours",
      "hours used",
      "usage hrs",
      "therapy hours",
      "total therapy hours"
    ],
    usage_hours_30d: [
      "usage_hours_30d",
      "usage hours 30d",
      "30 day usage hours",
      "30d usage hours",
      "usage hours",
      "used hours",
      "total usage hours",
      "therapy hours"
    ],
    days_used_30d: [
      "days_used_30d",
      "days used 30d",
      "days used",
      "used days",
      "usage days",
      "days with usage"
    ],
    ahi_avg_30d: [
      "ahi_avg_30d",
      "ahi avg 30d",
      "ahi",
      "average ahi",
      "ahi average",
      "apnea hypopnea index"
    ],
    leak_avg_30d: [
      "leak_avg_30d",
      "leak avg 30d",
      "leak",
      "leak average",
      "95th percentile leak",
      "95 percentile leak",
      "95% leak",
      "mask leak",
      "leak 95"
    ]
  };

  const lockedAliases = pilot20LoadLockedAirViewAliases();
  const effectiveAliasMap = pilot20MergeAirViewAliasMap(aliasMap, lockedAliases);

  const resolved = {};
  Object.keys(effectiveAliasMap).forEach((canonical) => {
    resolved[canonical] = pilot20FindHeader(originalHeaders, effectiveAliasMap[canonical]);
  });

  const minimalMissing = [];
  if (!resolved.device_serial) minimalMissing.push("device_serial");
  if (!resolved.last_data_date) minimalMissing.push("last_data_date");
  if (!resolved.month_usage_hours) minimalMissing.push("month_usage_hours");

  const rows = parsed.rows.map((sourceRow) => {
    const get = (canonical) => {
      const header = resolved[canonical];
      if (!header) return "";
      return sourceRow[header] || "";
    };

    const lastDataDate = pilot20ToDateText(get("last_data_date"));
    const monthStart =
      pilot20ToDateText(get("month_start")) ||
      pilot20FirstOfMonth(lastDataDate);

    const monthUsageHours = get("month_usage_hours");
    const usageHours30d = get("usage_hours_30d") || monthUsageHours;

    return {
      __line: sourceRow.__line,
      device_serial: pilot20CleanValue(get("device_serial")),
      month_start: monthStart,
      last_data_date: lastDataDate,
      month_usage_hours: monthUsageHours,
      usage_hours_30d: usageHours30d,
      days_used_30d: get("days_used_30d") || "0",
      ahi_avg_30d: get("ahi_avg_30d") || "0",
      leak_avg_30d: get("leak_avg_30d") || "0"
    };
  });

  return {
    originalHeaders,
    resolvedHeaders: resolved,
    headers: [
      "device_serial",
      "month_start",
      "last_data_date",
      "month_usage_hours",
      "usage_hours_30d",
      "days_used_30d",
      "ahi_avg_30d",
      "leak_avg_30d"
    ],
    missingHeaders: minimalMissing,
    rows
  };
}


async function pilot20EnsureImportAuditTables(db) {
  await query(
    db,
    `
    create table if not exists public.pilot20_import_batches (
      id serial primary key,
      tenant_slug text not null,
      upload_source text not null default 'airview_csv',
      filename text,
      total_rows integer not null default 0,
      updated_count integer not null default 0,
      skipped_count integer not null default 0,
      error_count integer not null default 0,
      created_by_email text,
      created_by_role text,
      created_at timestamp with time zone not null default now()
    )
    `,
    []
  );

  await query(
    db,
    `
    create table if not exists public.pilot20_import_batch_rows (
      id serial primary key,
      batch_id integer not null references public.pilot20_import_batches(id) on delete cascade,
      line_number integer,
      status text not null,
      device_serial text,
      patient_external_id text,
      reason text,
      last_data_date text,
      month_usage_hours numeric,
      is_80h_compliant boolean,
      created_at timestamp with time zone not null default now()
    )
    `,
    []
  );
}

function pilot20GetActor(req) {
  const user = req.user || req.auth || req.account || {};
  return {
    email: user.email || user.user_email || user.username || "pilot20_user",
    role: user.role || user.user_role || "pilot20"
  };
}

async function pilot20WriteImportAudit(db, req, report) {
  try {
    await pilot20EnsureImportAuditTables(db);

    const actor = pilot20GetActor(req);

    const batchResult = await query(
      db,
      `
      insert into public.pilot20_import_batches
        (
          tenant_slug,
          upload_source,
          filename,
          total_rows,
          updated_count,
          skipped_count,
          error_count,
          created_by_email,
          created_by_role
        )
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning id
      `,
      [
        PILOT_TENANT_ID,
        req.body?.upload_source || "airview_csv",
        req.body?.filename || req.body?.file_name || "uploaded_usage_csv",
        report.total_rows || 0,
        report.updated || 0,
        report.skipped || 0,
        report.errors || 0,
        actor.email,
        actor.role
      ]
    );

    const batchId = batchResult.rows[0].id;

    for (const row of report.rows || []) {
      await query(
        db,
        `
        insert into public.pilot20_import_batch_rows
          (
            batch_id,
            line_number,
            status,
            device_serial,
            patient_external_id,
            reason,
            last_data_date,
            month_usage_hours,
            is_80h_compliant
          )
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          batchId,
          row.line || null,
          row.status || "unknown",
          row.device_serial || null,
          row.patient_external_id || null,
          row.reason || null,
          row.last_data_date || null,
          row.month_usage_hours ?? null,
          row.is_80h_compliant ?? null
        ]
      );
    }

    return batchId;
  } catch (error) {
    report.audit_warning = error.message;
    return null;
  }
}

router.post("/usage-upload", async (req, res) => {
  try {
    const db = getDb(req);
    const csvText = req.body?.csv_text || req.body?.csvText || "";

    const parsed = pilot20ParseCsv(csvText);

    if (!parsed.ok) {
      return res.status(400).json({
        ok: false,
        error: parsed.error
      });
    }

        const airViewMapping = pilot20NormalizeAirViewUsageCsv(parsed);
    parsed.headers = airViewMapping.headers;
    parsed.rows = airViewMapping.rows;

    const missingHeaders = airViewMapping.missingHeaders;

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "missing_required_headers",
        missing_headers: missingHeaders
      });
    }

    const forbiddenHeaders = pilot20HasForbiddenCsvHeaders(airViewMapping.originalHeaders || parsed.headers);

    if (forbiddenHeaders.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "direct_identifiers_not_allowed_in_usage_csv",
        forbidden_headers: forbiddenHeaders
      });
    }

    const report = {
      total_rows: parsed.rows.length,
      updated: 0,
      skipped: 0,
      errors: 0,
      rows: []
    };

    for (const row of parsed.rows) {
      const deviceSerial = pilot20CleanValue(row.device_serial);
      const monthStart = pilot20ToDateText(row.month_start);
      const lastDataDate = pilot20ToDateText(row.last_data_date);

      if (!deviceSerial || !lastDataDate) {
        report.skipped += 1;
        report.rows.push({
          line: row.__line,
          status: "skipped",
          reason: "device_serial_and_last_data_date_required",
          device_serial: deviceSerial
        });
        continue;
      }

      const deviceResult = await query(
        db,
        `
        select patient_external_id
        from public.devices
        where tenant_slug = $1
          and device_serial = $2
        limit 1
        `,
        [PILOT_TENANT_ID, deviceSerial]
      );

      if (!deviceResult.rows || deviceResult.rows.length === 0) {
        report.skipped += 1;
        report.rows.push({
          line: row.__line,
          status: "skipped",
          reason: "device_not_found_in_pilot20",
          device_serial: deviceSerial
        });
        continue;
      }

      const patientExternalId = deviceResult.rows[0].patient_external_id;
      const monthUsageHours = pilot20ToNumberValue(row.month_usage_hours);
      const usageHours30d = pilot20ToNumberValue(row.usage_hours_30d);
      const daysUsed30d = pilot20ToIntegerValue(row.days_used_30d);
      const ahiAvg30d = pilot20ToNumberValue(row.ahi_avg_30d);
      const leakAvg30d = pilot20ToNumberValue(row.leak_avg_30d);

      try {
        await query(
          db,
          `
          insert into public.compliance_nights
            (
              tenant_slug,
              patient_external_id,
              device_serial,
              record_date,
              month_start,
              usage_hours,
              month_usage_hours,
              usage_hours_30d,
              days_used_30d,
              ahi_avg_30d,
              leak_avg_30d,
              data_source,
              created_at,
              updated_at
            )
          values
            ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, 'pilot20_usage_csv', now(), now())
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
            patientExternalId,
            deviceSerial,
            lastDataDate,
            monthStart,
            monthUsageHours,
            usageHours30d,
            daysUsed30d,
            ahiAvg30d,
            leakAvg30d
          ]
        );

        await query(
          db,
          `
          update public.devices
          set last_data_date = $3,
              data_source = 'pilot20_usage_csv',
              updated_at = now()
          where tenant_slug = $1
            and device_serial = $2
          `,
          [PILOT_TENANT_ID, deviceSerial, lastDataDate]
        );

        report.updated += 1;
        report.rows.push({
          line: row.__line,
          status: "updated",
          patient_external_id: patientExternalId,
          device_serial: deviceSerial,
          last_data_date: lastDataDate,
          month_usage_hours: monthUsageHours,
          is_80h_compliant: monthUsageHours >= 80
        });
      } catch (error) {
        report.errors += 1;
        report.rows.push({
          line: row.__line,
          status: "error",
          reason: error.message,
          device_serial: deviceSerial
        });
      }
    }

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_automatic_cpap_usage_update_engine_airview_mapper",
      message: "Usage CSV processed. Rescue Monitor recalculates automatically from latest compliance records.",
      report
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_usage_upload_failed",
      message: error.message
    });
  }
});


router.get("/import-history", async (req, res) => {
  try {
    const db = getDb(req);
    await pilot20EnsureImportAuditTables(db);

    const result = await query(
      db,
      `
      select
        id,
        tenant_slug,
        upload_source,
        filename,
        total_rows,
        updated_count,
        skipped_count,
        error_count,
        created_by_email,
        created_by_role,
        created_at
      from public.pilot20_import_batches
      where tenant_slug = $1
      order by created_at desc, id desc
      limit 50
      `,
      [PILOT_TENANT_ID]
    );

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_import_history",
      rows: result.rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_import_history_failed",
      message: error.message
    });
  }
});

router.get("/import-history/:batchId", async (req, res) => {
  try {
    const db = getDb(req);
    await pilot20EnsureImportAuditTables(db);

    const batchId = Number(req.params.batchId);

    if (!Number.isFinite(batchId)) {
      return res.status(400).json({
        ok: false,
        error: "invalid_batch_id"
      });
    }

    const batchResult = await query(
      db,
      `
      select *
      from public.pilot20_import_batches
      where tenant_slug = $1
        and id = $2
      limit 1
      `,
      [PILOT_TENANT_ID, batchId]
    );

    if (!batchResult.rows || batchResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "import_batch_not_found"
      });
    }

    const rowsResult = await query(
      db,
      `
      select
        id,
        batch_id,
        line_number,
        status,
        device_serial,
        patient_external_id,
        reason,
        last_data_date,
        month_usage_hours,
        is_80h_compliant,
        created_at
      from public.pilot20_import_batch_rows
      where batch_id = $1
      order by line_number asc, id asc
      `,
      [batchId]
    );

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_import_history_details",
      batch: batchResult.rows[0],
      rows: rowsResult.rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_import_history_details_failed",
      message: error.message
    });
  }
});


router.get("/unmatched-devices", async (req, res) => {
  try {
    const db = getDb(req);
    await pilot20EnsureImportAuditTables(db);

    const result = await query(
      db,
      `
      select
        r.device_serial,
        count(*)::integer as occurrence_count,
        max(r.created_at) as last_seen_at,
        max(b.id)::integer as latest_batch_id,
        max(b.filename) as latest_filename,
        max(r.reason) as latest_reason,
        max(r.line_number)::integer as latest_line_number
      from public.pilot20_import_batch_rows r
      join public.pilot20_import_batches b
        on b.id = r.batch_id
      where b.tenant_slug = $1
        and r.status = 'skipped'
        and coalesce(r.device_serial, '') <> ''
        and (
          r.reason = 'device_not_found_in_pilot20'
          or r.reason ilike '%device_not_found%'
          or r.reason ilike '%not_found%'
        )
      group by r.device_serial
      order by max(r.created_at) desc, count(*) desc
      limit 200
      `,
      [PILOT_TENANT_ID]
    );

    const rows = result.rows.map((row) => ({
      ...row,
      resolution_action:
        "Check that this AirView serial number exactly matches the Device Serial entered in Patient Entry. If it is a real pilot device, correct the Patient Entry device serial or re-upload usage data after matching.",
      severity: Number(row.occurrence_count || 0) >= 2 ? "REPEATED" : "NEW"
    }));

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_unmatched_devices_resolution_center",
      total_unmatched_devices: rows.length,
      rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_unmatched_devices_failed",
      message: error.message
    });
  }
});


router.get("/monthly-value-report", async (req, res) => {
  try {
    const db = getDb(req);

    const patientsResult = await query(
      db,
      `
      with latest_compliance as (
        select distinct on (tenant_slug, patient_external_id)
          tenant_slug,
          patient_external_id,
          device_serial,
          record_date,
          month_start,
          usage_hours,
          month_usage_hours,
          usage_hours_30d,
          days_used_30d,
          ahi_avg_30d,
          leak_avg_30d
        from public.compliance_nights
        where tenant_slug = $1
        order by tenant_slug, patient_external_id, record_date desc
      )
      select
        p.patient_external_id,
        p.patient_code,
        p.doctor_external_id,
        p.branch_code,
        p.setup_date,
        d.device_serial,
        d.device_model,
        d.last_data_date,
        c.record_date,
        c.month_start,
        c.usage_hours,
        c.month_usage_hours,
        c.usage_hours_30d,
        c.days_used_30d,
        c.ahi_avg_30d,
        c.leak_avg_30d
      from public.patients p
      left join public.devices d
        on d.tenant_slug = p.tenant_slug
       and d.patient_external_id = p.patient_external_id
      left join latest_compliance c
        on c.tenant_slug = p.tenant_slug
       and c.patient_external_id = p.patient_external_id
      where p.tenant_slug = $1
      order by p.patient_external_id asc
      `,
      [PILOT_TENANT_ID]
    );

    const rows = patientsResult.rows.map(pilot20BuildRescueRow);

    let importSummary = {
      upload_batches: 0,
      total_import_rows: 0,
      total_updated: 0,
      total_skipped: 0,
      total_errors: 0,
      last_upload_at: null
    };

    try {
      await pilot20EnsureImportAuditTables(db);

      const importResult = await query(
        db,
        `
        select
          count(*)::integer as upload_batches,
          coalesce(sum(total_rows), 0)::integer as total_import_rows,
          coalesce(sum(updated_count), 0)::integer as total_updated,
          coalesce(sum(skipped_count), 0)::integer as total_skipped,
          coalesce(sum(error_count), 0)::integer as total_errors,
          max(created_at) as last_upload_at
        from public.pilot20_import_batches
        where tenant_slug = $1
        `,
        [PILOT_TENANT_ID]
      );

      if (importResult.rows && importResult.rows.length > 0) {
        importSummary = importResult.rows[0];
      }
    } catch (error) {
      importSummary.audit_warning = error.message;
    }

    const totalPatients = rows.length;
    const already80h = rows.filter((r) => r.is_80h_compliant).length;
    const below80h = rows.filter((r) => !r.is_80h_compliant).length;
    const safe = rows.filter((r) => r.risk_level === "SAFE").length;
    const onTrack = rows.filter((r) => r.risk_level === "ON_TRACK").length;
    const watch = rows.filter((r) => r.risk_level === "WATCH").length;
    const rescue = rows.filter((r) => r.risk_level === "RESCUE").length;
    const critical = rows.filter((r) => r.risk_level === "CRITICAL").length;

    const highAhi = rows.filter((r) => Number(r.ahi_avg_30d || 0) > 10).length;
    const highLeak = rows.filter((r) => Number(r.leak_avg_30d || 0) > 24).length;
    const actionable = watch + rescue + critical;
    const urgent = rescue + critical;

    const complianceRate = totalPatients > 0 ? Math.round((already80h / totalPatients) * 1000) / 10 : 0;
    const riskRate = totalPatients > 0 ? Math.round((urgent / totalPatients) * 1000) / 10 : 0;

    const topRiskRows = rows
      .slice()
      .sort((a, b) => {
        if ((b.risk_order || 0) !== (a.risk_order || 0)) return (b.risk_order || 0) - (a.risk_order || 0);
        return (b.required_daily_hours || 0) - (a.required_daily_hours || 0);
      })
      .slice(0, 10);

    let commercialConclusion = "Pilot data not sufficient yet. Enter patients and upload AirView usage data.";
    if (totalPatients > 0 && importSummary.upload_batches > 0) {
      if (urgent > 0) {
        commercialConclusion =
          "The platform identified urgent CPAP compliance risk before month end. These patients should be contacted first.";
      } else if (watch > 0) {
        commercialConclusion =
          "The platform identified patients needing monitoring before month end.";
      } else {
        commercialConclusion =
          "The pilot population is currently under control. Continue periodic AirView uploads.";
      }
    }

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_monthly_80h_commercial_value_report",
      summary: {
        total_patients: totalPatients,
        already_80h: already80h,
        below_80h: below80h,
        safe,
        on_track: onTrack,
        watch,
        rescue,
        critical,
        urgent,
        actionable,
        high_ahi: highAhi,
        high_leak: highLeak,
        compliance_rate: complianceRate,
        urgent_risk_rate: riskRate
      },
      import_summary: importSummary,
      commercial_conclusion: commercialConclusion,
      top_risk_rows: topRiskRows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_monthly_value_report_failed",
      message: error.message
    });
  }
});


function pilot20DateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function pilot20AddDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function pilot20DiffDaysInclusive(start, end) {
  if (!start || !end) return 0;
  const ms = 24 * 60 * 60 * 1000;
  const diff = Math.floor((end.getTime() - start.getTime()) / ms) + 1;
  return Math.max(1, diff);
}

function pilot20Round1(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

function pilot20BuildRolling80hEarlyWarningRow(row) {
  const targetHours = 80;
  const windowDays = 30;

  const setupDate = pilot20DateOnly(row.setup_date);
  const airViewPeriodStart = pilot20DateOnly(row.month_start);
  const lastDataDate = pilot20DateOnly(row.last_data_date || row.record_date);
  const today = pilot20DateOnly(new Date());

  const periodStart = airViewPeriodStart || setupDate || lastDataDate || today;
  const effectiveDate = lastDataDate || today;
  const periodEnd = pilot20AddDays(periodStart, windowDays - 1);

  const daysElapsed = Math.min(windowDays, pilot20DiffDaysInclusive(periodStart, effectiveDate));
  const daysRemainingRaw = Math.floor((periodEnd.getTime() - effectiveDate.getTime()) / (24 * 60 * 60 * 1000));
  const daysRemaining = Math.max(0, daysRemainingRaw);

  const currentHours = pilot20Round1(
    row.month_usage_hours ??
    row.usage_hours_30d ??
    row.usage_hours ??
    0
  );

  const expectedHoursToday = pilot20Round1(Math.min(targetHours, (targetHours / windowDays) * daysElapsed));
  const remainingHours = pilot20Round1(Math.max(0, targetHours - currentHours));

  const requiredDailyHours = currentHours >= targetHours
    ? 0
    : daysRemaining > 0
      ? pilot20Round1(remainingHours / daysRemaining)
      : 99;

  const averageDailyHours = daysElapsed > 0
    ? pilot20Round1(currentHours / daysElapsed)
    : 0;

  const projectedEndWindowHours = pilot20Round1(averageDailyHours * windowDays);
  const paceGapHours = pilot20Round1(currentHours - expectedHoursToday);

  const ahi = pilot20Round1(row.ahi_avg_30d || 0);
  const leak = pilot20Round1(row.leak_avg_30d || 0);

  let riskLevel = "WATCH";
  let riskOrder = 3;
  let atlasAction = "Monitor patient.";

  if (currentHours >= targetHours) {
    riskLevel = "SAFE";
    riskOrder = 1;
    atlasAction = "No immediate compliance action required.";
  } else if (daysRemaining <= 0) {
    riskLevel = "CRITICAL";
    riskOrder = 5;
    atlasAction = "Compliance window ended or ends today. Immediate review required.";
  } else if (projectedEndWindowHours >= targetHours && requiredDailyHours <= 4) {
    riskLevel = "ON_TRACK";
    riskOrder = 2;
    atlasAction = "Continue monitoring. Patient is on pace.";
  } else if (requiredDailyHours <= 3.5 && projectedEndWindowHours >= 65) {
    riskLevel = "WATCH";
    riskOrder = 3;
    atlasAction = "Soft reminder / monitor closely.";
  } else if (requiredDailyHours <= 6) {
    riskLevel = "RESCUE";
    riskOrder = 4;
    atlasAction = "Call patient soon. Compliance can still be rescued.";
  } else {
    riskLevel = "CRITICAL";
    riskOrder = 5;
    atlasAction = "Call patient urgently. High risk of missing 80h.";
  }

  const highAhi = ahi > 10;
  const highLeak = leak > 24;

  if (riskLevel !== "SAFE" && highLeak) {
    atlasAction = atlasAction + " Check mask leak.";
  }

  if (riskLevel !== "SAFE" && highAhi) {
    atlasAction = atlasAction + " Review high AHI.";
  }

  return {
    patient_external_id: row.patient_external_id,
    patient_code: row.patient_code,
    doctor_external_id: row.doctor_external_id,
    branch_code: row.branch_code,
    device_serial: row.device_serial,
    device_model: row.device_model,
    setup_date: row.setup_date,
    period_start: periodStart ? periodStart.toISOString().slice(0, 10) : null,
    period_end: periodEnd ? periodEnd.toISOString().slice(0, 10) : null,
    last_data_date: effectiveDate ? effectiveDate.toISOString().slice(0, 10) : null,
    days_elapsed: daysElapsed,
    days_remaining: daysRemaining,
    current_hours: currentHours,
    expected_hours_today: expectedHoursToday,
    pace_gap_hours: paceGapHours,
    remaining_hours: remainingHours,
    required_daily_hours: requiredDailyHours,
    average_daily_hours: averageDailyHours,
    projected_end_window_hours: projectedEndWindowHours,
    is_80h_compliant: currentHours >= targetHours,
    risk_level: riskLevel,
    risk_order: riskOrder,
    atlas_action: atlasAction,
    ahi_avg_30d: ahi,
    leak_avg_30d: leak,
    high_ahi: highAhi,
    high_leak: highLeak
  };
}


router.get("/rolling-80h-early-warning", async (req, res) => {
  try {
    const db = getDb(req);

    const patientsResult = await query(
      db,
      `
      with latest_compliance as (
        select distinct on (tenant_slug, patient_external_id)
          tenant_slug,
          patient_external_id,
          device_serial,
          record_date,
          month_start,
          usage_hours,
          month_usage_hours,
          usage_hours_30d,
          days_used_30d,
          ahi_avg_30d,
          leak_avg_30d
        from public.compliance_nights
        where tenant_slug = $1
        order by tenant_slug, patient_external_id, record_date desc
      )
      select
        p.patient_external_id,
        p.patient_code,
        p.doctor_external_id,
        p.branch_code,
        p.setup_date,
        d.device_serial,
        d.device_model,
        d.last_data_date,
        c.record_date,
        c.month_start,
        c.usage_hours,
        c.month_usage_hours,
        c.usage_hours_30d,
        c.days_used_30d,
        c.ahi_avg_30d,
        c.leak_avg_30d
      from public.patients p
      left join public.devices d
        on d.tenant_slug = p.tenant_slug
       and d.patient_external_id = p.patient_external_id
      left join latest_compliance c
        on c.tenant_slug = p.tenant_slug
       and c.patient_external_id = p.patient_external_id
      where p.tenant_slug = $1
      order by p.patient_external_id asc
      `,
      [PILOT_TENANT_ID]
    );

    const rows = patientsResult.rows.map(pilot20BuildRolling80hEarlyWarningRow);

    const totalPatients = rows.length;
    const safe = rows.filter((r) => r.risk_level === "SAFE").length;
    const onTrack = rows.filter((r) => r.risk_level === "ON_TRACK").length;
    const watch = rows.filter((r) => r.risk_level === "WATCH").length;
    const rescue = rows.filter((r) => r.risk_level === "RESCUE").length;
    const critical = rows.filter((r) => r.risk_level === "CRITICAL").length;
    const urgent = rescue + critical;
    const actionable = watch + rescue + critical;
    const already80h = rows.filter((r) => r.is_80h_compliant).length;
    const below80h = totalPatients - already80h;
    const highAhi = rows.filter((r) => r.high_ahi).length;
    const highLeak = rows.filter((r) => r.high_leak).length;

    const topRiskRows = rows
      .slice()
      .sort((a, b) => {
        if ((b.risk_order || 0) !== (a.risk_order || 0)) return (b.risk_order || 0) - (a.risk_order || 0);
        if ((b.required_daily_hours || 0) !== (a.required_daily_hours || 0)) return (b.required_daily_hours || 0) - (a.required_daily_hours || 0);
        return (a.days_remaining || 0) - (b.days_remaining || 0);
      });

    const urgentRiskRate = totalPatients > 0 ? Math.round((urgent / totalPatients) * 1000) / 10 : 0;
    const complianceRate = totalPatients > 0 ? Math.round((already80h / totalPatients) * 1000) / 10 : 0;

    let conclusion = "Enter patients and upload AirView data to activate rolling 80h early warning.";
    if (totalPatients > 0) {
      if (urgent > 0) {
        conclusion = "Immediate action required: some patients are at RESCUE or CRITICAL risk inside their own 30-day 80h window.";
      } else if (watch > 0) {
        conclusion = "Some patients need monitoring before their individual 80h window closes.";
      } else {
        conclusion = "Current pilot patients are under control based on available AirView data.";
      }
    }

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_live_rolling_80h_early_warning_patient_rescue_report",
      logic: "individual_rolling_30_day_80h_window",
      summary: {
        total_patients: totalPatients,
        already_80h: already80h,
        below_80h: below80h,
        safe,
        on_track: onTrack,
        watch,
        rescue,
        critical,
        urgent,
        actionable,
        high_ahi: highAhi,
        high_leak: highLeak,
        urgent_risk_rate: urgentRiskRate,
        compliance_rate: complianceRate
      },
      conclusion,
      rows: topRiskRows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_rolling_80h_early_warning_failed",
      message: error.message
    });
  }
});


function pilot20RolloutSplitCsvLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function pilot20RolloutDetectDelimiter(headerLine) {
  const commaCount = (String(headerLine || "").match(/,/g) || []).length;
  const semicolonCount = (String(headerLine || "").match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function pilot20ParseRolloutCsv(csvText) {
  const cleanText = String(csvText || "").replace(/^\uFEFF/, "");
  const lines = cleanText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      ok: false,
      error: "csv_requires_header_and_at_least_one_data_row",
      headers: [],
      rows: []
    };
  }

  const delimiter = pilot20RolloutDetectDelimiter(lines[0]);
  const headers = pilot20RolloutSplitCsvLine(lines[0], delimiter).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = pilot20RolloutSplitCsvLine(lines[i], delimiter);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    row.__line = i + 1;
    rows.push(row);
  }

  return {
    ok: true,
    delimiter,
    headers,
    rows
  };
}

function pilot20NormalizeRolloutHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-\/().%]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function pilot20RolloutGet(row, header) {
  return String(row[header] || "").trim();
}

function pilot20ValidateRolloutCsv(parsed) {
  const requiredHeaders = [
    "patient_external_id",
    "patient_code",
    "device_serial",
    "device_model",
    "setup_date",
    "doctor_external_id",
    "branch_code"
  ];

  const forbiddenHeaders = [
    "first_name",
    "last_name",
    "full_name",
    "patient_name",
    "name",
    "surname",
    "phone",
    "mobile",
    "email",
    "amka",
    "address",
    "date_of_birth",
    "birth_date",
    "dob"
  ];

  const headers = parsed.headers || [];
  const normalizedHeaders = headers.map(pilot20NormalizeRolloutHeader);

  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  const forbiddenDetected = [];

  headers.forEach((header) => {
    const normalized = pilot20NormalizeRolloutHeader(header);
    forbiddenHeaders.forEach((forbidden) => {
      if (normalized === pilot20NormalizeRolloutHeader(forbidden)) {
        forbiddenDetected.push(header);
      }
    });
  });

  const seenPatientExternalIds = new Map();
  const seenPatientCodes = new Map();
  const seenDeviceSerials = new Map();

  const rowResults = [];
  let validRows = 0;
  let warningRows = 0;
  let errorRows = 0;

  parsed.rows.forEach((row) => {
    const issues = [];
    const warnings = [];

    const patientExternalId = pilot20RolloutGet(row, "patient_external_id");
    const patientCode = pilot20RolloutGet(row, "patient_code");
    const deviceSerial = pilot20RolloutGet(row, "device_serial");
    const deviceModel = pilot20RolloutGet(row, "device_model");
    const setupDate = pilot20RolloutGet(row, "setup_date");
    const doctorExternalId = pilot20RolloutGet(row, "doctor_external_id");
    const branchCode = pilot20RolloutGet(row, "branch_code");

    if (!patientExternalId) issues.push("patient_external_id_required");
    if (!patientCode) issues.push("patient_code_required");
    if (!deviceSerial) issues.push("device_serial_required");
    if (!setupDate) issues.push("setup_date_required");

    if (patientExternalId) {
      if (seenPatientExternalIds.has(patientExternalId)) {
        issues.push("duplicate_patient_external_id");
      } else {
        seenPatientExternalIds.set(patientExternalId, row.__line);
      }
    }

    if (patientCode) {
      if (seenPatientCodes.has(patientCode)) {
        issues.push("duplicate_patient_code");
      } else {
        seenPatientCodes.set(patientCode, row.__line);
      }
    }

    if (deviceSerial) {
      if (seenDeviceSerials.has(deviceSerial)) {
        issues.push("duplicate_device_serial");
      } else {
        seenDeviceSerials.set(deviceSerial, row.__line);
      }
    }

    if (setupDate) {
      const date = new Date(setupDate);
      if (Number.isNaN(date.getTime())) {
        issues.push("invalid_setup_date");
      }
    }

    if (!doctorExternalId) warnings.push("doctor_external_id_missing");
    if (!branchCode) warnings.push("branch_code_missing");
    if (!deviceModel) warnings.push("device_model_missing");

    let status = "valid";
    if (issues.length > 0) {
      status = "error";
      errorRows += 1;
    } else if (warnings.length > 0) {
      status = "warning";
      warningRows += 1;
      validRows += 1;
    } else {
      validRows += 1;
    }

    rowResults.push({
      line: row.__line,
      status,
      patient_external_id: patientExternalId,
      patient_code: patientCode,
      device_serial: deviceSerial,
      setup_date: setupDate,
      doctor_external_id: doctorExternalId,
      branch_code: branchCode,
      issues,
      warnings
    });
  });

  const hardBlockers = [];

  if (missingHeaders.length > 0) {
    hardBlockers.push("missing_required_headers");
  }

  if (forbiddenDetected.length > 0) {
    hardBlockers.push("direct_identifier_headers_detected");
  }

  if (errorRows > 0) {
    hardBlockers.push("row_errors_detected");
  }

  const readyForRollout = hardBlockers.length === 0;

  return {
    delimiter: parsed.delimiter,
    total_rows: parsed.rows.length,
    valid_rows: validRows,
    warning_rows: warningRows,
    error_rows: errorRows,
    missing_headers: missingHeaders,
    forbidden_headers: Array.from(new Set(forbiddenDetected)),
    duplicate_patient_external_ids: Array.from(seenPatientExternalIds.keys()).length,
    duplicate_patient_codes: Array.from(seenPatientCodes.keys()).length,
    duplicate_device_serials: Array.from(seenDeviceSerials.keys()).length,
    hard_blockers: hardBlockers,
    ready_for_rollout: readyForRollout,
    rows: rowResults.slice(0, 500)
  };
}


router.get("/production-rollout/template", async (req, res) => {
  res.type("text/csv").send(
    [
      "patient_external_id,patient_code,device_serial,device_model,setup_date,doctor_external_id,branch_code",
      "P-000001,CPAP-000001,RS-DEVICE-000001,AirSense 10,2026-06-01,DR-001,ATHENS"
    ].join("\n")
  );
});

router.post("/production-rollout/validate", async (req, res) => {
  try {
    const csvText = req.body?.csv_text || req.body?.csvText || "";

    const parsed = pilot20ParseRolloutCsv(csvText);

    if (!parsed.ok) {
      return res.status(400).json({
        ok: false,
        error: parsed.error
      });
    }

    const validation = pilot20ValidateRolloutCsv(parsed);

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_7000_patient_rollout_import_validation",
      message: validation.ready_for_rollout
        ? "Rollout file is structurally ready for controlled production import."
        : "Rollout file has blockers. Fix errors before production import.",
      validation
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_production_rollout_validation_failed",
      message: error.message
    });
  }
});

module.exports = router;












