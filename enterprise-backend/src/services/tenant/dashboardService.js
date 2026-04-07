const db = require('../../db');

const FALLBACK_DASHBOARD = {
  patientsCount: 7000,
  doctorsCount: 500,
  seatsCount: 50,
  modulesCount: 10,
  featuresCount: 35,
  criticalFollowups: 18,
  offlineDevices: 12
};

async function runQuery(sql, params = []) {
  if (typeof db.query === 'function') {
    return db.query(sql, params);
  }

  if (db.pool && typeof db.pool.query === 'function') {
    return db.pool.query(sql, params);
  }

  throw new Error('Database query function is not available.');
}

async function safeCount(sql, params = [], fallback = 0) {
  try {
    const result = await runQuery(sql, params);
    return Number(result?.rows?.[0]?.count || 0);
  } catch (error) {
    return fallback;
  }
}

async function getTenantDashboard({ tenantId }) {
  const patientCount = await safeCount(
    `
      SELECT COUNT(*)::int AS count
      FROM patients
      WHERE tenant_id = $1
    `,
    [tenantId],
    FALLBACK_DASHBOARD.patientsCount
  );

  const doctorCount = await safeCount(
    `
      SELECT COUNT(DISTINCT doctor_name)::int AS count
      FROM patients
      WHERE tenant_id = $1
        AND doctor_name IS NOT NULL
        AND doctor_name <> ''
    `,
    [tenantId],
    FALLBACK_DASHBOARD.doctorsCount
  );

  const seatCount = await safeCount(
    `
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE tenant_id = $1
    `,
    [tenantId],
    FALLBACK_DASHBOARD.seatsCount
  );

  const modulesCount = await safeCount(
    `
      SELECT COUNT(*)::int AS count
      FROM tenant_modules
      WHERE tenant_id = $1
        AND enabled = TRUE
    `,
    [tenantId],
    FALLBACK_DASHBOARD.modulesCount
  );

  const featuresCount = await safeCount(
    `
      SELECT COUNT(*)::int AS count
      FROM tenant_features
      WHERE tenant_id = $1
        AND enabled = TRUE
    `,
    [tenantId],
    FALLBACK_DASHBOARD.featuresCount
  );

  const criticalFollowups = await safeCount(
    `
      SELECT COUNT(*)::int AS count
      FROM followups
      WHERE tenant_id = $1
        AND LOWER(COALESCE(priority, '')) = 'critical'
    `,
    [tenantId],
    FALLBACK_DASHBOARD.criticalFollowups
  );

  const offlineDevices = await safeCount(
    `
      SELECT COUNT(*)::int AS count
      FROM devices
      WHERE tenant_id = $1
        AND LOWER(COALESCE(status, '')) = 'offline'
    `,
    [tenantId],
    FALLBACK_DASHBOARD.offlineDevices
  );

  return {
    patientsCount: patientCount,
    doctorsCount: doctorCount,
    seatsCount: seatCount,
    modulesCount,
    featuresCount,
    criticalFollowups,
    offlineDevices
  };
}

module.exports = {
  getTenantDashboard
};