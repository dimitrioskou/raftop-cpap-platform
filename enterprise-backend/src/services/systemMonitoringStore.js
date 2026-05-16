const db = require('./db');

let latestSnapshot = {
  ok: false,
  phase: '21-system-monitoring',
  status: 'UNKNOWN',
  message: 'No monitoring snapshot has been generated yet.',
  generatedAt: null,
  summary: null,
  alerts: [],
  source: 'memory-store'
};

async function ensureMonitoringTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS system_monitoring_snapshots (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'UNKNOWN',
      ok BOOLEAN NOT NULL DEFAULT false,
      phase TEXT,
      mode TEXT,
      message TEXT,
      summary JSONB NOT NULL DEFAULT '{}'::jsonb,
      alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
      audit JSONB NOT NULL DEFAULT '{}'::jsonb,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      stored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_system_monitoring_snapshots_stored_at
    ON system_monitoring_snapshots (stored_at DESC);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_system_monitoring_snapshots_status
    ON system_monitoring_snapshots (status);
  `);
}

function normalizeSnapshot(snapshot) {
  const generatedAt = snapshot.generatedAt || new Date().toISOString();

  return {
    ...snapshot,
    ok: snapshot.ok === true,
    phase: snapshot.phase || '21-system-monitoring',
    status: String(snapshot.status || 'UNKNOWN').toUpperCase(),
    message: snapshot.message || 'No monitoring message.',
    generatedAt,
    storedAt: new Date().toISOString(),
    summary: snapshot.summary || {},
    alerts: Array.isArray(snapshot.alerts) ? snapshot.alerts : [],
    audit: snapshot.audit || null,
    source: 'persistent-db-store'
  };
}

async function persistSnapshot(snapshot) {
  await ensureMonitoringTables();

  const normalized = normalizeSnapshot(snapshot);
  const id = `mon-${Date.now()}`;

  await db.query(
    `
    INSERT INTO system_monitoring_snapshots
      (id, status, ok, phase, mode, message, summary, alerts, audit, generated_at, stored_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11)
    `,
    [
      id,
      normalized.status,
      normalized.ok,
      normalized.phase,
      normalized.mode || 'unknown',
      normalized.message,
      JSON.stringify(normalized.summary || {}),
      JSON.stringify(normalized.alerts || []),
      JSON.stringify(normalized.audit || {}),
      normalized.generatedAt,
      normalized.storedAt
    ]
  );

  return {
    id,
    ...normalized
  };
}

async function setLatestSnapshot(snapshot) {
  latestSnapshot = normalizeSnapshot(snapshot);

  try {
    latestSnapshot = await persistSnapshot(latestSnapshot);
  } catch (error) {
    console.error('[System Monitoring Store] Failed to persist snapshot:', error.message);

    latestSnapshot = {
      ...latestSnapshot,
      source: 'memory-store-persistence-failed',
      persistenceError: error.message
    };
  }

  return latestSnapshot;
}

function getLatestSnapshot() {
  return latestSnapshot;
}

async function loadLatestSnapshotFromDb() {
  await ensureMonitoringTables();

  const result = await db.query(`
    SELECT *
    FROM system_monitoring_snapshots
    ORDER BY stored_at DESC
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return latestSnapshot;
  }

  const row = result.rows[0];

  latestSnapshot = {
    id: row.id,
    ok: row.ok === true,
    phase: row.phase,
    status: row.status,
    mode: row.mode,
    message: row.message,
    summary: row.summary || {},
    alerts: row.alerts || [],
    audit: row.audit || null,
    generatedAt: row.generated_at,
    storedAt: row.stored_at,
    source: 'persistent-db-store'
  };

  return latestSnapshot;
}

async function getMonitoringHistory(limit = 25) {
  await ensureMonitoringTables();

  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);

  const result = await db.query(
    `
    SELECT
      id,
      status,
      ok,
      phase,
      mode,
      message,
      summary,
      alerts,
      generated_at,
      stored_at
    FROM system_monitoring_snapshots
    ORDER BY stored_at DESC
    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    ok: row.ok === true,
    phase: row.phase,
    status: row.status,
    mode: row.mode,
    message: row.message,
    summary: row.summary || {},
    alerts: row.alerts || [],
    generatedAt: row.generated_at,
    storedAt: row.stored_at
  }));
}

async function getMonitoringStats() {
  await ensureMonitoringTables();

  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'HEALTHY')::int AS healthy,
      COUNT(*) FILTER (WHERE status = 'DEGRADED')::int AS degraded,
      COUNT(*) FILTER (WHERE status = 'BLOCKED')::int AS blocked,
      MAX(stored_at) AS last_stored_at
    FROM system_monitoring_snapshots
  `);

  return {
    total: Number(result.rows[0]?.total || 0),
    healthy: Number(result.rows[0]?.healthy || 0),
    degraded: Number(result.rows[0]?.degraded || 0),
    blocked: Number(result.rows[0]?.blocked || 0),
    lastStoredAt: result.rows[0]?.last_stored_at || null
  };
}

module.exports = {
  setLatestSnapshot,
  getLatestSnapshot,
  loadLatestSnapshotFromDb,
  getMonitoringHistory,
  getMonitoringStats,
  ensureMonitoringTables
};