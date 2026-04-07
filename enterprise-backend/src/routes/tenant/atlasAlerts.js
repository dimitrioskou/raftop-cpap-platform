const express = require('express');
const path = require('path');

try {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../../.env')
  });
} catch (_error) {
  // ignore dotenv load failures
}

const router = express.Router();

function resolveDb() {
  const candidates = [
    '../../db',
    '../../config/db',
    '../../config/database',
    '../../database',
    '../../lib/db',
    '../../../db',
    '../../../config/db'
  ];

  for (const candidate of candidates) {
    try {
      const mod = require(candidate);

      if (mod && typeof mod.query === 'function') {
        return mod;
      }

      if (mod && mod.pool && typeof mod.pool.query === 'function') {
        return mod.pool;
      }

      if (typeof mod === 'function') {
        const maybeDb = mod();
        if (maybeDb && typeof maybeDb.query === 'function') {
          return maybeDb;
        }
      }
    } catch (_error) {
      // keep scanning
    }
  }

  throw new Error('Could not resolve database client in atlas alerts route.');
}

const db = resolveDb();

async function listTables() {
  const result = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  return new Set(result.rows.map((row) => row.table_name));
}

async function getColumns(tableName) {
  const result = await db.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

function firstExisting(columns, names) {
  const set = new Set(columns);
  for (const name of names) {
    if (set.has(name)) {
      return name;
    }
  }
  return null;
}

function extractActor(req) {
  const user = req.user || {};

  return {
    userId: user.id || user.userId || user.user_id || null,
    tenantId:
      user.tenantId ||
      user.tenant_id ||
      user.organizationId ||
      user.organization_id ||
      null,
    role: String(user.role || user.userRole || user.user_role || 'guest').toLowerCase()
  };
}

function normalizeAlert(row, columns) {
  const idKey = firstExisting(columns, ['id', 'alert_id']);
  const tenantKey = firstExisting(columns, ['tenant_id', 'organization_id']);
  const patientKey = firstExisting(columns, ['patient_id']);
  const deviceKey = firstExisting(columns, ['device_id']);
  const titleKey = firstExisting(columns, ['title', 'alert_title', 'name']);
  const messageKey = firstExisting(columns, ['message', 'description', 'details']);
  const severityKey = firstExisting(columns, ['severity', 'priority', 'level']);
  const statusKey = firstExisting(columns, ['status']);
  const categoryKey = firstExisting(columns, ['category', 'type', 'alert_type']);
  const createdAtKey = firstExisting(columns, ['created_at', 'detected_at']);
  const updatedAtKey = firstExisting(columns, ['updated_at']);

  const id = idKey ? row[idKey] : null;

  return {
    id,
    alertId: id,
    tenantId: tenantKey ? row[tenantKey] : null,
    patientId: patientKey ? row[patientKey] : null,
    deviceId: deviceKey ? row[deviceKey] : null,
    title: titleKey ? row[titleKey] : 'ATLAS Alert',
    message: messageKey ? row[messageKey] : 'Attention required.',
    severity: severityKey ? String(row[severityKey] || 'medium').toLowerCase() : 'medium',
    status: statusKey ? String(row[statusKey] || 'open').toLowerCase() : 'open',
    category: categoryKey ? String(row[categoryKey] || 'atlas').toLowerCase() : 'atlas',
    createdAt: createdAtKey ? row[createdAtKey] : null,
    updatedAt: updatedAtKey ? row[updatedAtKey] : null
  };
}

async function loadAtlasAlertsFromTable(actor) {
  const tableName = 'atlas_alerts';
  const columns = await getColumns(tableName);

  const tenantKey = firstExisting(columns, ['tenant_id', 'organization_id']);
  const updatedAtKey = firstExisting(columns, ['updated_at', 'created_at', 'detected_at']) || 'id';

  const params = [];
  let where = '';

  if (tenantKey && actor.tenantId) {
    params.push(actor.tenantId);
    where = `WHERE "${tenantKey}" = $1`;
  }

  const result = await db.query(
    `
      SELECT *
      FROM "${tableName}"
      ${where}
      ORDER BY "${updatedAtKey}" DESC NULLS LAST
      LIMIT 200
    `,
    params
  );

  return result.rows.map((row) => normalizeAlert(row, columns));
}

async function loadRows(tableName, actor, limit = 50) {
  const columns = await getColumns(tableName);
  const tenantKey = firstExisting(columns, ['tenant_id', 'organization_id']);
  const orderKey = firstExisting(columns, ['updated_at', 'created_at', 'id']) || columns[0];

  const params = [];
  let where = '';

  if (tenantKey && actor.tenantId) {
    params.push(actor.tenantId);
    where = `WHERE "${tenantKey}" = $1`;
  }

  const result = await db.query(
    `
      SELECT *
      FROM "${tableName}"
      ${where}
      ORDER BY "${orderKey}" DESC NULLS LAST
      LIMIT ${Number(limit)}
    `,
    params
  );

  return {
    rows: result.rows || [],
    columns
  };
}

function buildDerivedAlerts({ patientsRows, patientsColumns, devicesRows, devicesColumns, actor }) {
  const alerts = [];

  const patientIdKey = firstExisting(patientsColumns, ['id', 'patient_id']);
  const patientNameKey = firstExisting(patientsColumns, ['full_name', 'name']);
  const patientFirstNameKey = firstExisting(patientsColumns, ['first_name']);
  const patientLastNameKey = firstExisting(patientsColumns, ['last_name']);

  const deviceIdKey = firstExisting(devicesColumns, ['id', 'device_id']);
  const deviceSerialKey = firstExisting(devicesColumns, ['serial_number', 'device_serial']);
  const deviceModelKey = firstExisting(devicesColumns, ['model', 'device_model']);
  const deviceStatusKey = firstExisting(devicesColumns, ['status']);

  const nowIso = new Date().toISOString();

  patientsRows.slice(0, 3).forEach((row, index) => {
    const patientName =
      row[patientNameKey] ||
      [row[patientFirstNameKey], row[patientLastNameKey]].filter(Boolean).join(' ') ||
      `Patient ${index + 1}`;

    alerts.push({
      id: `derived-patient-alert-${index + 1}`,
      alertId: `derived-patient-alert-${index + 1}`,
      tenantId: actor.tenantId || null,
      patientId: patientIdKey ? row[patientIdKey] : null,
      deviceId: null,
      title: 'Follow-up needed',
      message: `${patientName} should be reviewed in ATLAS follow-up workflow.`,
      severity: index === 0 ? 'high' : 'medium',
      status: 'open',
      category: 'followup',
      createdAt: nowIso,
      updatedAt: nowIso
    });
  });

  devicesRows.slice(0, 3).forEach((row, index) => {
    const serial = deviceSerialKey ? row[deviceSerialKey] : `DEVICE-${index + 1}`;
    const model = deviceModelKey ? row[deviceModelKey] : 'CPAP Device';
    const status = deviceStatusKey ? String(row[deviceStatusKey] || 'unknown').toLowerCase() : 'unknown';

    alerts.push({
      id: `derived-device-alert-${index + 1}`,
      alertId: `derived-device-alert-${index + 1}`,
      tenantId: actor.tenantId || null,
      patientId: null,
      deviceId: deviceIdKey ? row[deviceIdKey] : null,
      title: 'Device monitoring check',
      message: `${model} (${serial}) is available for ATLAS device monitoring. Current status: ${status}.`,
      severity: index === 0 ? 'medium' : 'low',
      status: 'open',
      category: 'device_monitoring',
      createdAt: nowIso,
      updatedAt: nowIso
    });
  });

  return alerts;
}

router.get('/', async (req, res) => {
  try {
    const actor = extractActor(req);
    const tables = await listTables();

    let alerts = [];
    let source = 'derived';

    if (tables.has('atlas_alerts')) {
      alerts = await loadAtlasAlertsFromTable(actor);
      source = 'atlas_alerts';
    }

    if (!alerts.length) {
      const patientsData = tables.has('patients')
        ? await loadRows('patients', actor, 10)
        : { rows: [], columns: [] };

      const devicesData = tables.has('devices')
        ? await loadRows('devices', actor, 10)
        : { rows: [], columns: [] };

      alerts = buildDerivedAlerts({
        patientsRows: patientsData.rows,
        patientsColumns: patientsData.columns,
        devicesRows: devicesData.rows,
        devicesColumns: devicesData.columns,
        actor
      });

      source = alerts.length ? 'derived_from_patients_devices' : 'empty';
    }

    return res.status(200).json({
      ok: true,
      alerts,
      total: alerts.length,
      meta: {
        source,
        tenantId: actor.tenantId || null
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load ATLAS alerts.'
    });
  }
});

module.exports = router;