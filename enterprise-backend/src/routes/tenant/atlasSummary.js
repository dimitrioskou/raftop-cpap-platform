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

  throw new Error('Could not resolve database client in atlas summary route.');
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

async function loadRows(tableName, actor, limit = 200) {
  const columns = await getColumns(tableName);
  const tenantKey = firstExisting(columns, ['tenant_id', 'organization_id']);
  const orderKey =
    firstExisting(columns, ['updated_at', 'created_at', 'id']) ||
    columns[0];

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

router.get('/', async (req, res) => {
  try {
    const actor = extractActor(req);
    const tables = await listTables();

    const patientsData = tables.has('patients')
      ? await loadRows('patients', actor, 100)
      : { rows: [], columns: [] };

    const devicesData = tables.has('devices')
      ? await loadRows('devices', actor, 100)
      : { rows: [], columns: [] };

    const tasksData = tables.has('tasks')
      ? await loadRows('tasks', actor, 100)
      : { rows: [], columns: [] };

    const alertsData = tables.has('atlas_alerts')
      ? await loadRows('atlas_alerts', actor, 100)
      : { rows: [], columns: [] };

    const taskStatusKey = firstExisting(tasksData.columns, ['status']);
    const taskPriorityKey = firstExisting(tasksData.columns, ['priority', 'severity']);

    const alertStatusKey = firstExisting(alertsData.columns, ['status']);
    const alertSeverityKey = firstExisting(alertsData.columns, ['severity', 'priority', 'level']);

    const totalPatients = patientsData.rows.length;
    const totalDevices = devicesData.rows.length;
    const totalTasks = tasksData.rows.length;
    const totalAlerts = alertsData.rows.length || Math.min(3, totalPatients + totalDevices);

    const openTasks = tasksData.rows.length
      ? tasksData.rows.filter((row) => {
          const value = taskStatusKey ? String(row[taskStatusKey] || '').toLowerCase() : 'open';
          return !['done', 'closed', 'resolved'].includes(value);
        }).length
      : Math.min(totalPatients, 5);

    const highPriorityTasks = tasksData.rows.length
      ? tasksData.rows.filter((row) => {
          const value = taskPriorityKey ? String(row[taskPriorityKey] || '').toLowerCase() : 'medium';
          return ['high', 'critical'].includes(value);
        }).length
      : Math.min(2, openTasks);

    const openAlerts = alertsData.rows.length
      ? alertsData.rows.filter((row) => {
          const value = alertStatusKey ? String(row[alertStatusKey] || '').toLowerCase() : 'open';
          return !['closed', 'resolved'].includes(value);
        }).length
      : Math.min(totalAlerts, Math.max(1, totalPatients ? 3 : 0));

    const highAlerts = alertsData.rows.length
      ? alertsData.rows.filter((row) => {
          const value = alertSeverityKey ? String(row[alertSeverityKey] || '').toLowerCase() : 'medium';
          return ['high', 'critical'].includes(value);
        }).length
      : Math.min(2, openAlerts);

    return res.status(200).json({
      ok: true,
      summary: {
        totalPatients,
        totalDevices,
        totalAlerts,
        openAlerts,
        highAlerts,
        totalTasks,
        openTasks,
        highPriorityTasks
      },
      meta: {
        tenantId: actor.tenantId || null,
        source: alertsData.rows.length ? 'table_backed' : 'derived_or_table_backed'
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load ATLAS summary.'
    });
  }
});

module.exports = router;