const express = require('express');
const router = express.Router();
const db = require('../../db');
const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../../utils/routeDbHelpers');

async function countTable(tableName) {
  const exists = await tableExists(db, tableName);
  if (!exists) return 0;

  const result = await querySafe(db, `SELECT COUNT(*)::int AS total FROM ${q(tableName)}`);
  if (result.error) return 0;

  return Number(result.rows?.[0]?.total || 0);
}

async function patientComplianceSummary() {
  const exists = await tableExists(db, 'patients');
  if (!exists) {
    return {
      patientsCount: 0,
      criticalFollowups: 0,
      warningFollowups: 0
    };
  }

  const columns = await getColumns(db, 'patients');
  const statusColumn = firstExisting(columns, ['compliance_status', 'status', 'risk_level']);
  const hoursColumn = firstExisting(columns, ['cpap_hours', 'usage_hours', 'compliance_hours', 'monthly_usage_hours']);

  let sql = `SELECT COUNT(*)::int AS patients_count, 0::int AS critical_count, 0::int AS warning_count FROM patients`;

  if (statusColumn) {
    sql = `
      SELECT
        COUNT(*)::int AS patients_count,
        COUNT(*) FILTER (
          WHERE LOWER(COALESCE(${q(statusColumn)}::text, '')) LIKE '%critical%'
        )::int AS critical_count,
        COUNT(*) FILTER (
          WHERE LOWER(COALESCE(${q(statusColumn)}::text, '')) LIKE '%warning%'
             OR LOWER(COALESCE(${q(statusColumn)}::text, '')) LIKE '%medium%'
             OR LOWER(COALESCE(${q(statusColumn)}::text, '')) LIKE '%low%'
        )::int AS warning_count
      FROM patients
    `;
  } else if (hoursColumn) {
    sql = `
      SELECT
        COUNT(*)::int AS patients_count,
        COUNT(*) FILTER (
          WHERE COALESCE(NULLIF(${q(hoursColumn)}::text, ''), '0')::numeric < 50
        )::int AS critical_count,
        COUNT(*) FILTER (
          WHERE COALESCE(NULLIF(${q(hoursColumn)}::text, ''), '0')::numeric >= 50
            AND COALESCE(NULLIF(${q(hoursColumn)}::text, ''), '0')::numeric < 80
        )::int AS warning_count
      FROM patients
    `;
  }

  const result = await querySafe(db, sql);

  if (result.error) {
    return {
      patientsCount: 0,
      criticalFollowups: 0,
      warningFollowups: 0
    };
  }

  return {
    patientsCount: Number(result.rows?.[0]?.patients_count || 0),
    criticalFollowups: Number(result.rows?.[0]?.critical_count || 0),
    warningFollowups: Number(result.rows?.[0]?.warning_count || 0)
  };
}

async function deviceSummary() {
  const exists = await tableExists(db, 'devices');
  if (!exists) {
    return {
      devicesCount: 0,
      offlineDevices: 0
    };
  }

  const columns = await getColumns(db, 'devices');
  const statusColumn = firstExisting(columns, ['connectivity_status', 'connection_status', 'status']);

  let sql = `SELECT COUNT(*)::int AS total, 0::int AS offline_count FROM devices`;

  if (statusColumn) {
    sql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE LOWER(COALESCE(${q(statusColumn)}::text, '')) LIKE '%offline%'
             OR LOWER(COALESCE(${q(statusColumn)}::text, '')) LIKE '%disconnect%'
        )::int AS offline_count
      FROM devices
    `;
  }

  const result = await querySafe(db, sql);

  if (result.error) {
    return {
      devicesCount: 0,
      offlineDevices: 0
    };
  }

  return {
    devicesCount: Number(result.rows?.[0]?.total || 0),
    offlineDevices: Number(result.rows?.[0]?.offline_count || 0)
  };
}

async function taskSummary() {
  const exists = await tableExists(db, 'tasks');
  if (!exists) return { pendingTasks: 0 };

  const columns = await getColumns(db, 'tasks');
  const statusColumn = firstExisting(columns, ['status']);

  let sql = `SELECT COUNT(*)::int AS pending_count FROM tasks`;

  if (statusColumn) {
    sql = `
      SELECT
        COUNT(*) FILTER (
          WHERE LOWER(COALESCE(${q(statusColumn)}::text, '')) NOT IN ('completed', 'resolved', 'closed')
        )::int AS pending_count
      FROM tasks
    `;
  }

  const result = await querySafe(db, sql);

  if (result.error) return { pendingTasks: 0 };

  return {
    pendingTasks: Number(result.rows?.[0]?.pending_count || 0)
  };
}

router.get('/', async (req, res) => {
  const [patients, doctorsCount, devices, tasks, usersCount, notificationsCount] = await Promise.all([
    patientComplianceSummary(),
    countTable('doctors'),
    deviceSummary(),
    taskSummary(),
    countTable('users'),
    countTable('notifications')
  ]);

  const seatsCount = Math.max(doctorsCount || 0, 4);
  const modulesCount = 12;
  const featuresCount = 29;

  return res.json({
    ok: true,
    patientsCount: patients.patientsCount,
    patients_count: patients.patientsCount,
    doctorsCount,
    doctors_count: doctorsCount,
    devicesCount: devices.devicesCount,
    devices_count: devices.devicesCount,
    usersCount,
    users_count: usersCount,
    notificationsCount,
    notifications_count: notificationsCount,
    seatsCount,
    seats_count: seatsCount,
    modulesCount,
    modules_count: modulesCount,
    featuresCount,
    features_count: featuresCount,
    criticalFollowups: patients.criticalFollowups,
    critical_followups: patients.criticalFollowups,
    warningFollowups: patients.warningFollowups,
    warning_followups: patients.warningFollowups,
    pendingTasks: tasks.pendingTasks,
    pending_tasks: tasks.pendingTasks,
    offlineDevices: devices.offlineDevices,
    offline_devices: devices.offlineDevices,
    updated_at: new Date().toISOString()
  });
});

module.exports = router;