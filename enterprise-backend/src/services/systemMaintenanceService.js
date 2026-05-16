const db = require('./db');
const { ensureMonitoringTables } = require('./systemMonitoringStore');
const { ensureAlertTable } = require('./systemAlertService');

async function tableExists(tableName) {
  const result = await db.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS exists
    `,
    [tableName]
  );

  return result.rows[0]?.exists === true;
}

function toSafeInteger(value, fallback, min, max) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(parsed), min), max);
}

async function getMonitoringSnapshotStats() {
  await ensureMonitoringTables();

  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'HEALTHY')::int AS healthy,
      COUNT(*) FILTER (WHERE status = 'DEGRADED')::int AS degraded,
      COUNT(*) FILTER (WHERE status = 'BLOCKED')::int AS blocked,
      MIN(stored_at) AS oldest_stored_at,
      MAX(stored_at) AS latest_stored_at
    FROM system_monitoring_snapshots
  `);

  return {
    total: Number(result.rows[0]?.total || 0),
    healthy: Number(result.rows[0]?.healthy || 0),
    degraded: Number(result.rows[0]?.degraded || 0),
    blocked: Number(result.rows[0]?.blocked || 0),
    oldestStoredAt: result.rows[0]?.oldest_stored_at || null,
    latestStoredAt: result.rows[0]?.latest_stored_at || null
  };
}

async function getAlertEventStats() {
  await ensureAlertTable();

  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE acknowledged = false)::int AS open,
      COUNT(*) FILTER (WHERE acknowledged = true)::int AS acknowledged,
      COUNT(*) FILTER (WHERE acknowledged = false AND severity = 'CRITICAL')::int AS critical_open,
      COUNT(*) FILTER (WHERE acknowledged = false AND severity = 'HIGH')::int AS high_open,
      COUNT(*) FILTER (WHERE acknowledged = false AND severity = 'MEDIUM')::int AS medium_open,
      MIN(created_at) AS oldest_created_at,
      MAX(created_at) AS latest_created_at,
      MAX(last_seen_at) AS latest_seen_at
    FROM system_alert_events
  `);

  return {
    total: Number(result.rows[0]?.total || 0),
    open: Number(result.rows[0]?.open || 0),
    acknowledged: Number(result.rows[0]?.acknowledged || 0),
    criticalOpen: Number(result.rows[0]?.critical_open || 0),
    highOpen: Number(result.rows[0]?.high_open || 0),
    mediumOpen: Number(result.rows[0]?.medium_open || 0),
    oldestCreatedAt: result.rows[0]?.oldest_created_at || null,
    latestCreatedAt: result.rows[0]?.latest_created_at || null,
    latestSeenAt: result.rows[0]?.latest_seen_at || null
  };
}

async function getMaintenanceStatus(options = {}) {
  const monitoringExists = await tableExists('system_monitoring_snapshots');
  const alertsExists = await tableExists('system_alert_events');

  const monitoring = monitoringExists
    ? await getMonitoringSnapshotStats()
    : {
        total: 0,
        healthy: 0,
        degraded: 0,
        blocked: 0,
        oldestStoredAt: null,
        latestStoredAt: null
      };

  const alerts = alertsExists
    ? await getAlertEventStats()
    : {
        total: 0,
        open: 0,
        acknowledged: 0,
        criticalOpen: 0,
        highOpen: 0,
        mediumOpen: 0,
        oldestCreatedAt: null,
        latestCreatedAt: null,
        latestSeenAt: null
      };

  const snapshotKeepLatest = toSafeInteger(
    options.snapshotKeepLatest,
    500,
    50,
    10000
  );

  const snapshotRetentionDays = toSafeInteger(
    options.snapshotRetentionDays,
    30,
    1,
    3650
  );

  const acknowledgedAlertRetentionDays = toSafeInteger(
    options.acknowledgedAlertRetentionDays,
    30,
    1,
    3650
  );

  return {
    ok: true,
    phase: '21.9-monitoring-retention-cleanup',
    source: 'database',
    generatedAt: new Date().toISOString(),
    policy: {
      snapshotKeepLatest,
      snapshotRetentionDays,
      acknowledgedAlertRetentionDays,
      openAlertsAreNeverDeleted: true
    },
    tables: {
      systemMonitoringSnapshots: monitoringExists,
      systemAlertEvents: alertsExists
    },
    monitoring,
    alerts
  };
}

async function cleanupOldMonitoringSnapshots(options = {}) {
  await ensureMonitoringTables();

  const snapshotKeepLatest = toSafeInteger(
    options.snapshotKeepLatest,
    500,
    50,
    10000
  );

  const snapshotRetentionDays = toSafeInteger(
    options.snapshotRetentionDays,
    30,
    1,
    3650
  );

  const byAge = await db.query(
    `
    DELETE FROM system_monitoring_snapshots
    WHERE stored_at < NOW() - ($1::text || ' days')::interval
    RETURNING id
    `,
    [snapshotRetentionDays]
  );

  const byLimit = await db.query(
    `
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY stored_at DESC) AS row_number
      FROM system_monitoring_snapshots
    )
    DELETE FROM system_monitoring_snapshots
    WHERE id IN (
      SELECT id
      FROM ranked
      WHERE row_number > $1
    )
    RETURNING id
    `,
    [snapshotKeepLatest]
  );

  return {
    deletedByAge: byAge.rows.length,
    deletedByLimit: byLimit.rows.length,
    deletedTotal: byAge.rows.length + byLimit.rows.length
  };
}

async function cleanupAcknowledgedAlerts(options = {}) {
  await ensureAlertTable();

  const acknowledgedAlertRetentionDays = toSafeInteger(
    options.acknowledgedAlertRetentionDays,
    30,
    1,
    3650
  );

  const result = await db.query(
    `
    DELETE FROM system_alert_events
    WHERE acknowledged = true
      AND COALESCE(acknowledged_at, last_seen_at, created_at) < NOW() - ($1::text || ' days')::interval
    RETURNING id
    `,
    [acknowledgedAlertRetentionDays]
  );

  return {
    deletedAcknowledgedAlerts: result.rows.length
  };
}

async function runSystemMaintenanceCleanup(options = {}) {
  const before = await getMaintenanceStatus(options);

  const monitoringCleanup = await cleanupOldMonitoringSnapshots(options);
  const alertCleanup = await cleanupAcknowledgedAlerts(options);

  const after = await getMaintenanceStatus(options);

  return {
    ok: true,
    phase: '21.9-monitoring-retention-cleanup',
    source: 'database',
    executedAt: new Date().toISOString(),
    before,
    cleanup: {
      monitoring: monitoringCleanup,
      alerts: alertCleanup,
      totalDeleted:
        monitoringCleanup.deletedTotal +
        alertCleanup.deletedAcknowledgedAlerts
    },
    after
  };
}

module.exports = {
  getMaintenanceStatus,
  runSystemMaintenanceCleanup,
  cleanupOldMonitoringSnapshots,
  cleanupAcknowledgedAlerts
};