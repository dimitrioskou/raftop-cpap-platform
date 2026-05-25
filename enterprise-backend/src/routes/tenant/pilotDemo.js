// enterprise-backend/src/routes/tenant/pilotDemo.js
// RAFTOP CPAP CARE Pro
// Phase 42.5 - Pilot Demo API Routes
// Mounted at: /api/tenant/pilot-demo
//
// Security:
// - Mounted under /api/tenant after productionAuthEnforcement in server.js.
// - Reads only pilot_demo_* tables.
// - Does not modify database.
// - Always filters by tenant_id.

const express = require('express');

const router = express.Router();

function getDbPool() {
  const candidates = [
    '../../db',
    '../../database',
    '../../config/db',
    '../../config/database',
    '../../services/db',
    '../../pool'
  ];

  for (const mod of candidates) {
    try {
      const loaded = require(mod);

      if (loaded && typeof loaded.query === 'function') {
        return loaded;
      }

      if (loaded && loaded.pool && typeof loaded.pool.query === 'function') {
        return loaded.pool;
      }

      if (loaded && loaded.default && typeof loaded.default.query === 'function') {
        return loaded.default;
      }
    } catch (err) {
      // Try next candidate.
    }
  }

  try {
    const { Pool } = require('pg');

    if (!process.env.DATABASE_URL) {
      return null;
    }

    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false
    });
  } catch (err) {
    return null;
  }
}

const pool = getDbPool();

function nowIso() {
  return new Date().toISOString();
}

function getTenantId(req) {
  return String(
    req.tenantId ||
      (req.auth && (req.auth.tenant_id || req.auth.tenantId)) ||
      (req.user && (req.user.tenant_id || req.user.tenantId)) ||
      req.headers['x-tenant-id'] ||
      req.query.tenantId ||
      req.query.tenant_id ||
      ''
  ).trim();
}

function sendMissingDb(res, req) {
  return res.status(500).json({
    ok: false,
    fallback: false,
    error: 'Database pool unavailable',
    code: 'PILOT_DEMO_DB_POOL_UNAVAILABLE',
    time: nowIso(),
    requestId: req.requestId || null
  });
}

function requireTenant(req, res) {
  const tenantId = getTenantId(req);

  if (!tenantId) {
    res.status(400).json({
      ok: false,
      fallback: false,
      error: 'Tenant context required',
      code: 'TENANT_CONTEXT_REQUIRED',
      time: nowIso(),
      requestId: req.requestId || null
    });
    return null;
  }

  return tenantId;
}

async function query(sql, params) {
  if (!pool || typeof pool.query !== 'function') {
    throw new Error('DB_POOL_UNAVAILABLE');
  }

  const result = await pool.query(sql, params);
  return result.rows || [];
}

async function scalar(sql, params) {
  const rows = await query(sql, params);
  if (!rows[0]) return null;
  return Object.values(rows[0])[0];
}

async function getSummary(tenantId) {
  const [
    patientsCount,
    devicesCount,
    complianceNightsCount,
    atlasTasksCount,
    notesCount,
    openTasksCount,
    criticalTasksCount,
    highTasksCount,
    compliantPatientsCount,
    riskPatientsCount,
    avgUsageHours,
    noDataNights,
    lowUsageNights
  ] = await Promise.all([
    scalar('select count(*)::int as count from pilot_demo_patients where tenant_id=$1', [tenantId]),
    scalar('select count(*)::int as count from pilot_demo_devices where tenant_id=$1', [tenantId]),
    scalar('select count(*)::int as count from pilot_demo_compliance_nights where tenant_id=$1', [tenantId]),
    scalar('select count(*)::int as count from pilot_demo_atlas_tasks where tenant_id=$1', [tenantId]),
    scalar('select count(*)::int as count from pilot_demo_notes where tenant_id=$1', [tenantId]),
    scalar("select count(*)::int as count from pilot_demo_atlas_tasks where tenant_id=$1 and status='open'", [tenantId]),
    scalar("select count(*)::int as count from pilot_demo_atlas_tasks where tenant_id=$1 and priority='critical'", [tenantId]),
    scalar("select count(*)::int as count from pilot_demo_atlas_tasks where tenant_id=$1 and priority='high'", [tenantId]),
    scalar("select count(*)::int as count from pilot_demo_patients where tenant_id=$1 and compliance_status='compliant'", [tenantId]),
    scalar(
      "select count(*)::int as count from pilot_demo_patients where tenant_id=$1 and compliance_status in ('at_risk','early_risk','no_data','borderline','partial')",
      [tenantId]
    ),
    scalar('select round(avg(usage_hours)::numeric, 2)::text as avg_usage from pilot_demo_compliance_nights where tenant_id=$1', [tenantId]),
    scalar("select count(*)::int as count from pilot_demo_compliance_nights where tenant_id=$1 and compliance_flag='no_data'", [tenantId]),
    scalar("select count(*)::int as count from pilot_demo_compliance_nights where tenant_id=$1 and compliance_flag='low_usage'", [tenantId])
  ]);

  return {
    tenant_id: tenantId,
    patients_count: patientsCount || 0,
    devices_count: devicesCount || 0,
    compliance_nights_count: complianceNightsCount || 0,
    atlas_tasks_count: atlasTasksCount || 0,
    notes_count: notesCount || 0,
    open_tasks_count: openTasksCount || 0,
    critical_tasks_count: criticalTasksCount || 0,
    high_tasks_count: highTasksCount || 0,
    compliant_patients_count: compliantPatientsCount || 0,
    risk_patients_count: riskPatientsCount || 0,
    average_usage_hours: avgUsageHours || '0.00',
    no_data_nights: noDataNights || 0,
    low_usage_nights: lowUsageNights || 0
  };
}

async function getPatients(tenantId) {
  return query(
    `
    select
      demo_code,
      full_name,
      age,
      sex,
      phone,
      city,
      risk_segment,
      cpap_status,
      compliance_status,
      clinical_summary,
      created_at,
      updated_at
    from pilot_demo_patients
    where tenant_id=$1
    order by demo_code
    `,
    [tenantId]
  );
}

async function getDevices(tenantId) {
  return query(
    `
    select
      patient_demo_code,
      device_brand,
      device_model,
      serial_number,
      mask_type,
      setup_date,
      status,
      created_at,
      updated_at
    from pilot_demo_devices
    where tenant_id=$1
    order by patient_demo_code
    `,
    [tenantId]
  );
}

async function getCompliance(tenantId) {
  return query(
    `
    select
      patient_demo_code,
      therapy_date,
      usage_hours,
      ahi,
      leak_l_min,
      pressure_p95,
      compliance_flag,
      created_at
    from pilot_demo_compliance_nights
    where tenant_id=$1
    order by patient_demo_code, therapy_date
    `,
    [tenantId]
  );
}

async function getAtlasTasks(tenantId) {
  return query(
    `
    select
      patient_demo_code,
      action_group,
      priority,
      title,
      description,
      status,
      due_at,
      created_at,
      updated_at
    from pilot_demo_atlas_tasks
    where tenant_id=$1
    order by
      case priority
        when 'critical' then 1
        when 'high' then 2
        when 'medium' then 3
        when 'low' then 4
        else 5
      end,
      due_at asc nulls last,
      created_at desc
    `,
    [tenantId]
  );
}

async function getNotes(tenantId) {
  return query(
    `
    select
      patient_demo_code,
      note_type,
      body,
      created_by,
      created_at
    from pilot_demo_notes
    where tenant_id=$1
    order by created_at desc
    `,
    [tenantId]
  );
}

function groupByPatient(rows) {
  const grouped = {};

  rows.forEach((row) => {
    const key = row.patient_demo_code || row.demo_code || 'unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });

  return grouped;
}

async function handleRead(req, res, loader) {
  const tenantId = requireTenant(req, res);
  if (!tenantId) return;

  if (!pool) {
    return sendMissingDb(res, req);
  }

  try {
    const data = await loader(tenantId);

    return res.json({
      ok: true,
      fallback: false,
      tenant_id: tenantId,
      data,
      time: nowIso(),
      requestId: req.requestId || null
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'Pilot demo route failed',
      code: 'PILOT_DEMO_ROUTE_FAILED',
      details: err.message,
      time: nowIso(),
      requestId: req.requestId || null
    });
  }
}

router.get('/summary', async (req, res) => {
  return handleRead(req, res, getSummary);
});

router.get('/patients', async (req, res) => {
  return handleRead(req, res, getPatients);
});

router.get('/devices', async (req, res) => {
  return handleRead(req, res, getDevices);
});

router.get('/compliance', async (req, res) => {
  return handleRead(req, res, getCompliance);
});

router.get('/atlas/tasks', async (req, res) => {
  return handleRead(req, res, getAtlasTasks);
});

router.get('/notes', async (req, res) => {
  return handleRead(req, res, getNotes);
});

router.get('/dashboard', async (req, res) => {
  const tenantId = requireTenant(req, res);
  if (!tenantId) return;

  if (!pool) {
    return sendMissingDb(res, req);
  }

  try {
    const [summary, patients, devices, compliance, atlasTasks, notes] = await Promise.all([
      getSummary(tenantId),
      getPatients(tenantId),
      getDevices(tenantId),
      getCompliance(tenantId),
      getAtlasTasks(tenantId),
      getNotes(tenantId)
    ]);

    return res.json({
      ok: true,
      fallback: false,
      tenant_id: tenantId,
      summary,
      patients,
      devices,
      compliance,
      atlas_tasks: atlasTasks,
      notes,
      grouped: {
        devices_by_patient: groupByPatient(devices),
        compliance_by_patient: groupByPatient(compliance),
        tasks_by_patient: groupByPatient(atlasTasks),
        notes_by_patient: groupByPatient(notes)
      },
      time: nowIso(),
      requestId: req.requestId || null
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'Pilot demo dashboard failed',
      code: 'PILOT_DEMO_DASHBOARD_FAILED',
      details: err.message,
      time: nowIso(),
      requestId: req.requestId || null
    });
  }
});

router.get('/patient/:demoCode/overview', async (req, res) => {
  const tenantId = requireTenant(req, res);
  if (!tenantId) return;

  if (!pool) {
    return sendMissingDb(res, req);
  }

  const demoCode = String(req.params.demoCode || '').trim();

  if (!demoCode) {
    return res.status(400).json({
      ok: false,
      fallback: false,
      error: 'demoCode is required',
      code: 'DEMO_CODE_REQUIRED',
      time: nowIso(),
      requestId: req.requestId || null
    });
  }

  try {
    const [patientRows, deviceRows, complianceRows, taskRows, noteRows] = await Promise.all([
      query('select * from pilot_demo_patients where tenant_id=$1 and demo_code=$2 limit 1', [tenantId, demoCode]),
      query('select * from pilot_demo_devices where tenant_id=$1 and patient_demo_code=$2 order by created_at desc', [tenantId, demoCode]),
      query('select * from pilot_demo_compliance_nights where tenant_id=$1 and patient_demo_code=$2 order by therapy_date', [tenantId, demoCode]),
      query('select * from pilot_demo_atlas_tasks where tenant_id=$1 and patient_demo_code=$2 order by created_at desc', [tenantId, demoCode]),
      query('select * from pilot_demo_notes where tenant_id=$1 and patient_demo_code=$2 order by created_at desc', [tenantId, demoCode])
    ]);

    if (patientRows.length === 0) {
      return res.status(404).json({
        ok: false,
        fallback: false,
        error: 'Pilot demo patient not found',
        code: 'PILOT_DEMO_PATIENT_NOT_FOUND',
        tenant_id: tenantId,
        demo_code: demoCode,
        time: nowIso(),
        requestId: req.requestId || null
      });
    }

    return res.json({
      ok: true,
      fallback: false,
      tenant_id: tenantId,
      demo_code: demoCode,
      patient: patientRows[0],
      devices: deviceRows,
      compliance: complianceRows,
      atlas_tasks: taskRows,
      notes: noteRows,
      time: nowIso(),
      requestId: req.requestId || null
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'Pilot demo patient overview failed',
      code: 'PILOT_DEMO_PATIENT_OVERVIEW_FAILED',
      details: err.message,
      time: nowIso(),
      requestId: req.requestId || null
    });
  }
});

router.get('/', async (req, res) => {
  return handleRead(req, res, getSummary);
});

module.exports = router;