const path = require('path');

try {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
  });
} catch (_error) {
  // ignore dotenv load failures
}

function resolveDb() {
  const candidates = [
    '../db',
    '../config/db',
    '../config/database',
    '../database',
    '../lib/db',
    '../../db',
    '../../config/db'
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

  throw new Error('Could not resolve database client in atlasDerivedService.');
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

async function loadRows(tableName, actor, limit = 100) {
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

function normalizePatient(row, columns, index = 0) {
  const idKey = firstExisting(columns, ['id', 'patient_id']);
  const nameKey = firstExisting(columns, ['full_name', 'name']);
  const firstNameKey = firstExisting(columns, ['first_name']);
  const lastNameKey = firstExisting(columns, ['last_name']);
  const emailKey = firstExisting(columns, ['email']);
  const statusKey = firstExisting(columns, ['status']);

  return {
    id: idKey ? row[idKey] : null,
    patientId: idKey ? row[idKey] : null,
    name:
      (nameKey ? row[nameKey] : null) ||
      [firstNameKey ? row[firstNameKey] : null, lastNameKey ? row[lastNameKey] : null]
        .filter(Boolean)
        .join(' ') ||
      `Patient ${index + 1}`,
    email: emailKey ? row[emailKey] : null,
    status: statusKey ? String(row[statusKey] || 'active').toLowerCase() : 'active'
  };
}

function normalizeDevice(row, columns, index = 0) {
  const idKey = firstExisting(columns, ['id', 'device_id']);
  const serialKey = firstExisting(columns, ['serial_number', 'device_serial']);
  const modelKey = firstExisting(columns, ['model', 'device_model']);
  const statusKey = firstExisting(columns, ['status']);

  return {
    id: idKey ? row[idKey] : null,
    deviceId: idKey ? row[idKey] : null,
    serial: serialKey ? row[serialKey] : `DEVICE-${index + 1}`,
    model: modelKey ? row[modelKey] : 'CPAP Device',
    status: statusKey ? String(row[statusKey] || 'active').toLowerCase() : 'active'
  };
}

function normalizeTask(row, columns, index = 0) {
  const idKey = firstExisting(columns, ['id', 'task_id']);
  const titleKey = firstExisting(columns, ['title', 'name']);
  const statusKey = firstExisting(columns, ['status']);
  const priorityKey = firstExisting(columns, ['priority', 'severity']);
  const patientKey = firstExisting(columns, ['patient_id']);
  const deviceKey = firstExisting(columns, ['device_id']);
  const dueDateKey = firstExisting(columns, ['due_date', 'due_at']);
  const createdAtKey = firstExisting(columns, ['created_at']);

  return {
    id: idKey ? row[idKey] : `task-${index + 1}`,
    taskId: idKey ? row[idKey] : `task-${index + 1}`,
    title: titleKey ? row[titleKey] : `Follow-up Task ${index + 1}`,
    status: statusKey ? String(row[statusKey] || 'open').toLowerCase() : 'open',
    priority: priorityKey ? String(row[priorityKey] || 'medium').toLowerCase() : 'medium',
    patientId: patientKey ? row[patientKey] : null,
    deviceId: deviceKey ? row[deviceKey] : null,
    dueDate: dueDateKey ? row[dueDateKey] : null,
    createdAt: createdAtKey ? row[createdAtKey] : null
  };
}

async function loadAtlasContext(actor) {
  const tables = await listTables();

  const patientsData = tables.has('patients')
    ? await loadRows('patients', actor, 50)
    : { rows: [], columns: [] };

  const devicesData = tables.has('devices')
    ? await loadRows('devices', actor, 50)
    : { rows: [], columns: [] };

  const tasksData = tables.has('tasks')
    ? await loadRows('tasks', actor, 50)
    : { rows: [], columns: [] };

  const atlasAlertsData = tables.has('atlas_alerts')
    ? await loadRows('atlas_alerts', actor, 50)
    : { rows: [], columns: [] };

  const patients = patientsData.rows.map((row, index) =>
    normalizePatient(row, patientsData.columns, index)
  );

  const devices = devicesData.rows.map((row, index) =>
    normalizeDevice(row, devicesData.columns, index)
  );

  const tasks = tasksData.rows.map((row, index) =>
    normalizeTask(row, tasksData.columns, index)
  );

  const alerts = atlasAlertsData.rows.length
    ? atlasAlertsData.rows.map((row, index) => {
        const columns = atlasAlertsData.columns;
        const idKey = firstExisting(columns, ['id', 'alert_id']);
        const titleKey = firstExisting(columns, ['title', 'alert_title', 'name']);
        const messageKey = firstExisting(columns, ['message', 'description', 'details']);
        const severityKey = firstExisting(columns, ['severity', 'priority', 'level']);
        const statusKey = firstExisting(columns, ['status']);
        const patientKey = firstExisting(columns, ['patient_id']);
        const deviceKey = firstExisting(columns, ['device_id']);
        const categoryKey = firstExisting(columns, ['category', 'type', 'alert_type']);
        const createdAtKey = firstExisting(columns, ['created_at', 'detected_at']);

        return {
          id: idKey ? row[idKey] : `atlas-alert-${index + 1}`,
          alertId: idKey ? row[idKey] : `atlas-alert-${index + 1}`,
          title: titleKey ? row[titleKey] : `ATLAS Alert ${index + 1}`,
          message: messageKey ? row[messageKey] : 'Attention required.',
          severity: severityKey ? String(row[severityKey] || 'medium').toLowerCase() : 'medium',
          status: statusKey ? String(row[statusKey] || 'open').toLowerCase() : 'open',
          patientId: patientKey ? row[patientKey] : null,
          deviceId: deviceKey ? row[deviceKey] : null,
          category: categoryKey ? String(row[categoryKey] || 'atlas').toLowerCase() : 'atlas',
          createdAt: createdAtKey ? row[createdAtKey] : null
        };
      })
    : buildDerivedAlerts({ patients, devices });

  return {
    actor,
    tables: Array.from(tables),
    patients,
    devices,
    tasks,
    alerts
  };
}

function buildDerivedAlerts({ patients, devices }) {
  const nowIso = new Date().toISOString();
  const derived = [];

  patients.slice(0, 3).forEach((patient, index) => {
    derived.push({
      id: `derived-patient-alert-${index + 1}`,
      alertId: `derived-patient-alert-${index + 1}`,
      title: 'Follow-up needed',
      message: `${patient.name} needs review in ATLAS workflow.`,
      severity: index === 0 ? 'high' : 'medium',
      status: 'open',
      patientId: patient.id,
      deviceId: null,
      category: 'followup',
      createdAt: nowIso
    });
  });

  devices.slice(0, 3).forEach((device, index) => {
    derived.push({
      id: `derived-device-alert-${index + 1}`,
      alertId: `derived-device-alert-${index + 1}`,
      title: 'Device monitoring check',
      message: `${device.model} (${device.serial}) should be reviewed in ATLAS.`,
      severity: index === 0 ? 'medium' : 'low',
      status: 'open',
      patientId: null,
      deviceId: device.id,
      category: 'device_monitoring',
      createdAt: nowIso
    });
  });

  return derived;
}

function buildAtlasSummary(context) {
  const openAlerts = context.alerts.filter((item) => item.status !== 'resolved' && item.status !== 'closed');
  const highAlerts = openAlerts.filter((item) => item.severity === 'high' || item.severity === 'critical');
  const openTasks = context.tasks.filter((item) => item.status !== 'done' && item.status !== 'closed' && item.status !== 'resolved');
  const highPriorityTasks = openTasks.filter((item) => item.priority === 'high' || item.priority === 'critical');

  return {
    totalPatients: context.patients.length,
    totalDevices: context.devices.length,
    totalAlerts: context.alerts.length,
    openAlerts: openAlerts.length,
    highAlerts: highAlerts.length,
    totalTasks: context.tasks.length,
    openTasks: openTasks.length,
    highPriorityTasks: highPriorityTasks.length
  };
}

function buildAtlasQueue(context) {
  const queue = [];

  context.alerts.forEach((alert, index) => {
    queue.push({
      id: `queue-alert-${alert.id || index + 1}`,
      type: 'alert',
      title: alert.title,
      subtitle: alert.message,
      severity: alert.severity || 'medium',
      status: alert.status || 'open',
      patientId: alert.patientId || null,
      deviceId: alert.deviceId || null,
      source: 'atlas_alerts'
    });
  });

  context.tasks.forEach((task, index) => {
    queue.push({
      id: `queue-task-${task.id || index + 1}`,
      type: 'task',
      title: task.title,
      subtitle: `Task status: ${task.status}`,
      severity: task.priority || 'medium',
      status: task.status || 'open',
      patientId: task.patientId || null,
      deviceId: task.deviceId || null,
      source: 'tasks'
    });
  });

  const severityRank = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  return queue
    .sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0))
    .slice(0, 100);
}

function buildAtlasDaily(context) {
  const queue = buildAtlasQueue(context);

  return {
    date: new Date().toISOString(),
    urgent: queue.filter((item) => item.severity === 'critical' || item.severity === 'high').slice(0, 10),
    routine: queue.filter((item) => item.severity === 'medium' || item.severity === 'low').slice(0, 10),
    totals: {
      urgent: queue.filter((item) => item.severity === 'critical' || item.severity === 'high').length,
      routine: queue.filter((item) => item.severity === 'medium' || item.severity === 'low').length
    }
  };
}

function buildAtlasTasks(context) {
  if (context.tasks.length) {
    return context.tasks.slice(0, 100);
  }

  return context.alerts.slice(0, 20).map((alert, index) => ({
    id: `derived-task-${index + 1}`,
    taskId: `derived-task-${index + 1}`,
    title: `Resolve: ${alert.title}`,
    status: 'open',
    priority: alert.severity || 'medium',
    patientId: alert.patientId || null,
    deviceId: alert.deviceId || null,
    dueDate: null,
    createdAt: alert.createdAt || new Date().toISOString()
  }));
}

function buildAtlasAutoActions(context) {
  const actions = [];

  context.alerts.slice(0, 10).forEach((alert, index) => {
    actions.push({
      id: `auto-action-alert-${index + 1}`,
      type: 'alert_followup',
      title: `Escalate ${alert.title}`,
      recommendation:
        alert.severity === 'high' || alert.severity === 'critical'
          ? 'Assign immediate follow-up and mark as priority.'
          : 'Queue for standard review.',
      patientId: alert.patientId || null,
      deviceId: alert.deviceId || null,
      severity: alert.severity || 'medium'
    });
  });

  if (!actions.length) {
    actions.push({
      id: 'auto-action-default-1',
      type: 'monitoring',
      title: 'Run daily ATLAS review',
      recommendation: 'Review patients, devices, and pending tasks for new actions.',
      patientId: null,
      deviceId: null,
      severity: 'low'
    });
  }

  return actions;
}

module.exports = {
  buildAtlasAutoActions,
  buildAtlasDaily,
  buildAtlasQueue,
  buildAtlasSummary,
  buildAtlasTasks,
  extractActor,
  loadAtlasContext
};