const crypto = require('crypto');
const db = require('./db');

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function buildFingerprint(alert) {
  const source = normalizeText(alert.source || 'system');
  const severity = normalizeText(alert.severity || 'INFO');
  const title = normalizeText(alert.title || 'System alert');

  const raw = `${source}|${severity}|${title}`;

  return crypto.createHash('sha256').update(raw).digest('hex');
}

function severityRank(severity) {
  const normalized = String(severity || '').toUpperCase();

  if (normalized === 'CRITICAL') return 4;
  if (normalized === 'HIGH') return 3;
  if (normalized === 'MEDIUM') return 2;
  if (normalized === 'LOW') return 1;

  return 0;
}

function pickHighestSeverity(rows) {
  let best = 'INFO';

  for (const row of rows) {
    if (severityRank(row.severity) > severityRank(best)) {
      best = row.severity;
    }
  }

  return String(best || 'INFO').toUpperCase();
}

function minDate(values) {
  const dates = values
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (dates.length === 0) {
    return new Date().toISOString();
  }

  return new Date(Math.min(...dates.map((date) => date.getTime()))).toISOString();
}

function maxDate(values) {
  const dates = values
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (dates.length === 0) {
    return new Date().toISOString();
  }

  return new Date(Math.max(...dates.map((date) => date.getTime()))).toISOString();
}

async function ensureBaseAlertTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS system_alert_events (
      id TEXT PRIMARY KEY,
      severity TEXT NOT NULL DEFAULT 'INFO',
      title TEXT NOT NULL,
      message TEXT,
      source TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE system_alert_events
    ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN NOT NULL DEFAULT false;
  `);

  await db.query(`
    ALTER TABLE system_alert_events
    ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
  `);

  await db.query(`
    ALTER TABLE system_alert_events
    ADD COLUMN IF NOT EXISTS fingerprint TEXT;
  `);

  await db.query(`
    ALTER TABLE system_alert_events
    ADD COLUMN IF NOT EXISTS occurrence_count INTEGER NOT NULL DEFAULT 1;
  `);

  await db.query(`
    ALTER TABLE system_alert_events
    ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ;
  `);

  await db.query(`
    ALTER TABLE system_alert_events
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
  `);

  await db.query(`
    UPDATE system_alert_events
    SET first_seen_at = COALESCE(first_seen_at, created_at, NOW()),
        last_seen_at = COALESCE(last_seen_at, created_at, NOW()),
        occurrence_count = COALESCE(occurrence_count, 1),
        acknowledged = COALESCE(acknowledged, false)
    WHERE first_seen_at IS NULL
       OR last_seen_at IS NULL
       OR occurrence_count IS NULL;
  `);
}

async function backfillFingerprints() {
  const result = await db.query(`
    SELECT
      id,
      severity,
      title,
      source,
      fingerprint
    FROM system_alert_events
  `);

  for (const row of result.rows) {
    const fingerprint =
      row.fingerprint ||
      buildFingerprint({
        severity: row.severity,
        title: row.title,
        source: row.source
      });

    await db.query(
      `
      UPDATE system_alert_events
      SET fingerprint = $1
      WHERE id = $2
      `,
      [fingerprint, row.id]
    );
  }
}

async function mergeDuplicateFingerprints() {
  const result = await db.query(`
    SELECT
      id,
      fingerprint,
      severity,
      title,
      message,
      source,
      acknowledged,
      acknowledged_at,
      occurrence_count,
      first_seen_at,
      last_seen_at,
      created_at
    FROM system_alert_events
    WHERE fingerprint IS NOT NULL
    ORDER BY created_at ASC
  `);

  const groups = new Map();

  for (const row of result.rows) {
    if (!groups.has(row.fingerprint)) {
      groups.set(row.fingerprint, []);
    }

    groups.get(row.fingerprint).push(row);
  }

  for (const [fingerprint, rows] of groups.entries()) {
    if (rows.length <= 1) {
      continue;
    }

    const openRows = rows.filter((row) => row.acknowledged !== true);

    const sortedRows = [...rows].sort((a, b) => {
      const aDate = new Date(a.last_seen_at || a.created_at || 0).getTime();
      const bDate = new Date(b.last_seen_at || b.created_at || 0).getTime();

      return bDate - aDate;
    });

    const keeper = openRows.length > 0 ? openRows[0] : sortedRows[0];

    const duplicateIds = rows
      .filter((row) => row.id !== keeper.id)
      .map((row) => row.id);

    const occurrenceCount = rows.reduce(
      (sum, row) => sum + Number(row.occurrence_count || 1),
      0
    );

    const allAcknowledged = rows.every((row) => row.acknowledged === true);
    const acknowledgedAt = allAcknowledged
      ? maxDate(rows.map((row) => row.acknowledged_at))
      : null;

    const latestRow = sortedRows[0];

    await db.query(
      `
      UPDATE system_alert_events
      SET
        fingerprint = $1,
        severity = $2,
        title = $3,
        message = $4,
        source = $5,
        acknowledged = $6,
        acknowledged_at = $7,
        occurrence_count = $8,
        first_seen_at = $9,
        last_seen_at = $10,
        created_at = $11
      WHERE id = $12
      `,
      [
        fingerprint,
        pickHighestSeverity(rows),
        latestRow.title || keeper.title || 'System alert',
        latestRow.message || keeper.message || '',
        latestRow.source || keeper.source || 'system',
        allAcknowledged,
        acknowledgedAt,
        occurrenceCount,
        minDate(rows.map((row) => row.first_seen_at || row.created_at)),
        maxDate(rows.map((row) => row.last_seen_at || row.created_at)),
        minDate(rows.map((row) => row.created_at)),
        keeper.id
      ]
    );

    if (duplicateIds.length > 0) {
      await db.query(
        `
        DELETE FROM system_alert_events
        WHERE id = ANY($1::text[])
        `,
        [duplicateIds]
      );
    }
  }
}

async function ensureAlertTable() {
  await ensureBaseAlertTable();
  await backfillFingerprints();
  await mergeDuplicateFingerprints();

  await db.query(`
    DROP INDEX IF EXISTS idx_system_alert_events_fingerprint_unique;
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_system_alert_events_fingerprint_unique
    ON system_alert_events (fingerprint)
    WHERE fingerprint IS NOT NULL;
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_system_alert_events_created_at
    ON system_alert_events (created_at DESC);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_system_alert_events_acknowledged
    ON system_alert_events (acknowledged);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_system_alert_events_last_seen_at
    ON system_alert_events (last_seen_at DESC);
  `);
}

async function storeAlerts(alerts = []) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return {
      ok: true,
      inserted: 0,
      updated: 0
    };
  }

  await ensureAlertTable();

  let inserted = 0;
  let updated = 0;

  for (const alert of alerts) {
    const now = new Date().toISOString();
    const id =
      alert.id ||
      `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const fingerprint = alert.fingerprint || buildFingerprint(alert);

    const result = await db.query(
      `
      INSERT INTO system_alert_events
        (
          id,
          fingerprint,
          severity,
          title,
          message,
          source,
          acknowledged,
          acknowledged_at,
          occurrence_count,
          first_seen_at,
          last_seen_at,
          created_at
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, false, null, 1, $7, $8, $9)
      ON CONFLICT (fingerprint)
      DO UPDATE SET
        severity = EXCLUDED.severity,
        title = EXCLUDED.title,
        message = EXCLUDED.message,
        source = EXCLUDED.source,
        acknowledged = false,
        acknowledged_at = null,
        occurrence_count = system_alert_events.occurrence_count + 1,
        last_seen_at = EXCLUDED.last_seen_at
      RETURNING
        (xmax = 0) AS inserted
      `,
      [
        id,
        fingerprint,
        String(alert.severity || 'INFO').toUpperCase(),
        alert.title || 'System alert',
        alert.message || '',
        alert.source || 'system',
        alert.createdAt || now,
        now,
        alert.createdAt || now
      ]
    );

    if (result.rows[0]?.inserted === true) {
      inserted += 1;
    } else {
      updated += 1;
    }
  }

  return {
    ok: true,
    inserted,
    updated
  };
}

async function getRecentAlerts(limit = 50) {
  await ensureAlertTable();

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

  const result = await db.query(
    `
    SELECT
      id,
      fingerprint,
      severity,
      title,
      message,
      source,
      acknowledged,
      acknowledged_at,
      occurrence_count,
      first_seen_at,
      last_seen_at,
      created_at
    FROM system_alert_events
    ORDER BY
      acknowledged ASC,
      last_seen_at DESC,
      created_at DESC
    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    fingerprint: row.fingerprint,
    severity: row.severity,
    title: row.title,
    message: row.message,
    source: row.source,
    acknowledged: row.acknowledged === true,
    acknowledgedAt: row.acknowledged_at,
    occurrenceCount: Number(row.occurrence_count || 1),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at
  }));
}

async function getAlertStats() {
  await ensureAlertTable();

  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE acknowledged = false)::int AS open,
      COUNT(*) FILTER (WHERE acknowledged = true)::int AS acknowledged,
      COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND acknowledged = false)::int AS critical_open,
      COUNT(*) FILTER (WHERE severity = 'HIGH' AND acknowledged = false)::int AS high_open,
      COUNT(*) FILTER (WHERE severity = 'MEDIUM' AND acknowledged = false)::int AS medium_open,
      COUNT(*) FILTER (WHERE severity = 'LOW' AND acknowledged = false)::int AS low_open,
      COALESCE(SUM(occurrence_count), 0)::int AS total_occurrences,
      MAX(last_seen_at) AS last_seen_at
    FROM system_alert_events
  `);

  return {
    total: Number(result.rows[0]?.total || 0),
    open: Number(result.rows[0]?.open || 0),
    acknowledged: Number(result.rows[0]?.acknowledged || 0),
    criticalOpen: Number(result.rows[0]?.critical_open || 0),
    highOpen: Number(result.rows[0]?.high_open || 0),
    mediumOpen: Number(result.rows[0]?.medium_open || 0),
    lowOpen: Number(result.rows[0]?.low_open || 0),
    totalOccurrences: Number(result.rows[0]?.total_occurrences || 0),
    lastSeenAt: result.rows[0]?.last_seen_at || null
  };
}

async function acknowledgeAlert(id) {
  await ensureAlertTable();

  const result = await db.query(
    `
    UPDATE system_alert_events
    SET acknowledged = true,
        acknowledged_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      fingerprint,
      severity,
      title,
      message,
      source,
      acknowledged,
      acknowledged_at,
      occurrence_count,
      first_seen_at,
      last_seen_at,
      created_at
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return {
      ok: false,
      error: 'ALERT_NOT_FOUND',
      message: 'Alert was not found.'
    };
  }

  const row = result.rows[0];

  return {
    ok: true,
    alert: {
      id: row.id,
      fingerprint: row.fingerprint,
      severity: row.severity,
      title: row.title,
      message: row.message,
      source: row.source,
      acknowledged: row.acknowledged === true,
      acknowledgedAt: row.acknowledged_at,
      occurrenceCount: Number(row.occurrence_count || 1),
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
      createdAt: row.created_at
    }
  };
}

async function acknowledgeAllOpenAlerts() {
  await ensureAlertTable();

  const result = await db.query(`
    UPDATE system_alert_events
    SET acknowledged = true,
        acknowledged_at = NOW()
    WHERE acknowledged = false
    RETURNING id
  `);

  return {
    ok: true,
    acknowledged: result.rows.length
  };
}

module.exports = {
  ensureAlertTable,
  storeAlerts,
  getRecentAlerts,
  getAlertStats,
  acknowledgeAlert,
  acknowledgeAllOpenAlerts
};