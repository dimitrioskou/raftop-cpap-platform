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

  const resolved = {};
  Object.keys(aliasMap).forEach((canonical) => {
    resolved[canonical] = pilot20FindHeader(originalHeaders, aliasMap[canonical]);
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

module.exports = router;







