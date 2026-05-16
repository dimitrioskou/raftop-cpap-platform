const crypto = require('crypto');
const db = require('./db');

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function buildFingerprint({ tenantId, resourceType, method, path, limitName }) {
  const raw = [
    normalizeText(tenantId || 'unknown-tenant'),
    normalizeText(resourceType || 'unknown-resource'),
    normalizeText(method || 'POST'),
    normalizeText(path || '/'),
    normalizeText(limitName || 'unknown-limit')
  ].join('|');

  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function ensureTenantPlanLimitEventsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tenant_plan_limit_events (
      id TEXT PRIMARY KEY,
      fingerprint TEXT UNIQUE,
      tenant_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      limit_name TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      limit_value INTEGER NOT NULL DEFAULT 0,
      attempted_increment INTEGER NOT NULL DEFAULT 1,
      projected_usage INTEGER NOT NULL DEFAULT 0,
      reason TEXT,
      occurrence_count INTEGER NOT NULL DEFAULT 1,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_agent TEXT,
      ip_address TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS fingerprint TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS tenant_id TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS resource_type TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS method TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS path TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS limit_name TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS used INTEGER NOT NULL DEFAULT 0;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS limit_value INTEGER NOT NULL DEFAULT 0;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS attempted_increment INTEGER NOT NULL DEFAULT 1;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS projected_usage INTEGER NOT NULL DEFAULT 0;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS reason TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS occurrence_count INTEGER NOT NULL DEFAULT 1;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS last_blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS user_agent TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS ip_address TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    ALTER TABLE tenant_plan_limit_events
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await backfillMissingFingerprints();

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_plan_limit_events_fingerprint_unique
    ON tenant_plan_limit_events (fingerprint)
    WHERE fingerprint IS NOT NULL;
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_plan_limit_events_tenant_id
    ON tenant_plan_limit_events (tenant_id);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_plan_limit_events_last_seen
    ON tenant_plan_limit_events (last_seen_at DESC);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_plan_limit_events_resource
    ON tenant_plan_limit_events (resource_type);
  `);
}

async function backfillMissingFingerprints() {
  const result = await db.query(`
    SELECT
      id,
      tenant_id,
      resource_type,
      method,
      path,
      limit_name,
      fingerprint
    FROM tenant_plan_limit_events
    WHERE fingerprint IS NULL
  `);

  for (const row of result.rows) {
    const fingerprint = buildFingerprint({
      tenantId: row.tenant_id,
      resourceType: row.resource_type,
      method: row.method,
      path: row.path,
      limitName: row.limit_name
    });

    await db.query(
      `
      UPDATE tenant_plan_limit_events
      SET fingerprint = $1
      WHERE id = $2
      `,
      [fingerprint, row.id]
    );
  }
}

function getRequestIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor) {
    return String(forwardedFor).split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
}

function normalizePlanLimitEvent(row) {
  if (!row) return null;

  return {
    id: row.id,
    fingerprint: row.fingerprint,
    tenantId: row.tenant_id,
    resourceType: row.resource_type,
    method: row.method,
    path: row.path,
    limitName: row.limit_name,
    used: Number(row.used || 0),
    limitValue: Number(row.limit_value || 0),
    attemptedIncrement: Number(row.attempted_increment || 1),
    projectedUsage: Number(row.projected_usage || 0),
    reason: row.reason,
    occurrenceCount: Number(row.occurrence_count || 1),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    lastBlockedAt: row.last_blocked_at,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function recordPlanLimitBlock({ req, tenantId, resourceType, limitName, verdict }) {
  await ensureTenantPlanLimitEventsTable();

  const method = req.method || 'POST';
  const path = req.originalUrl || req.url || '/';
  const now = new Date().toISOString();

  const fingerprint = buildFingerprint({
    tenantId,
    resourceType,
    method,
    path,
    limitName
  });

  const metadata = {
    phase: '22.9-plan-limit-enforcement-backend',
    usageState: verdict.usageState || 'LIMIT_EXCEEDED',
    source: verdict.source || null
  };

  const result = await db.query(
    `
    INSERT INTO tenant_plan_limit_events
      (
        id,
        fingerprint,
        tenant_id,
        resource_type,
        method,
        path,
        limit_name,
        used,
        limit_value,
        attempted_increment,
        projected_usage,
        reason,
        occurrence_count,
        first_seen_at,
        last_seen_at,
        last_blocked_at,
        user_agent,
        ip_address,
        metadata,
        created_at,
        updated_at
      )
    VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        1,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18::jsonb,
        $19,
        $20
      )
    ON CONFLICT (fingerprint)
    DO UPDATE SET
      used = EXCLUDED.used,
      limit_value = EXCLUDED.limit_value,
      attempted_increment = EXCLUDED.attempted_increment,
      projected_usage = EXCLUDED.projected_usage,
      reason = EXCLUDED.reason,
      occurrence_count = tenant_plan_limit_events.occurrence_count + 1,
      last_seen_at = EXCLUDED.last_seen_at,
      last_blocked_at = EXCLUDED.last_blocked_at,
      user_agent = EXCLUDED.user_agent,
      ip_address = EXCLUDED.ip_address,
      metadata = EXCLUDED.metadata,
      updated_at = EXCLUDED.updated_at
    RETURNING *
    `,
    [
      `planlimit-${tenantId}-${resourceType}-${Date.now()}`,
      fingerprint,
      tenantId,
      resourceType,
      method,
      path,
      limitName,
      Number(verdict.used || 0),
      Number(verdict.limit || 0),
      Number(verdict.attemptedIncrement || 1),
      Number(verdict.projectedUsage || 0),
      verdict.reason || 'Plan limit exceeded.',
      now,
      now,
      now,
      req.headers['user-agent'] || null,
      getRequestIp(req),
      JSON.stringify(metadata),
      now,
      now
    ]
  );

  return normalizePlanLimitEvent(result.rows[0]);
}

async function getPlanLimitEvents(options = {}) {
  await ensureTenantPlanLimitEventsTable();

  const tenantId = options.tenantId || 'demo-tenant';
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 200);

  const result = await db.query(
    `
    SELECT *
    FROM tenant_plan_limit_events
    WHERE tenant_id = $1
    ORDER BY last_seen_at DESC, created_at DESC
    LIMIT $2
    `,
    [tenantId, limit]
  );

  return result.rows.map(normalizePlanLimitEvent);
}

async function getPlanLimitEventStats(options = {}) {
  await ensureTenantPlanLimitEventsTable();

  const tenantId = options.tenantId || 'demo-tenant';

  const result = await db.query(
    `
    SELECT
      COUNT(*)::int AS total_event_types,
      COALESCE(SUM(occurrence_count), 0)::int AS total_occurrences,
      COUNT(*) FILTER (WHERE resource_type = 'patients')::int AS patient_event_types,
      COUNT(*) FILTER (WHERE resource_type = 'users')::int AS user_event_types,
      MAX(last_seen_at) AS last_seen_at
    FROM tenant_plan_limit_events
    WHERE tenant_id = $1
    `,
    [tenantId]
  );

  return {
    totalEventTypes: Number(result.rows[0]?.total_event_types || 0),
    totalOccurrences: Number(result.rows[0]?.total_occurrences || 0),
    patientEventTypes: Number(result.rows[0]?.patient_event_types || 0),
    userEventTypes: Number(result.rows[0]?.user_event_types || 0),
    lastSeenAt: result.rows[0]?.last_seen_at || null
  };
}

async function getPlanLimitEventsPayload(options = {}) {
  const events = await getPlanLimitEvents(options);
  const stats = await getPlanLimitEventStats(options);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.9-plan-limit-enforcement-events',
    tenantId: options.tenantId || 'demo-tenant',
    stats,
    events
  };
}

module.exports = {
  ensureTenantPlanLimitEventsTable,
  recordPlanLimitBlock,
  getPlanLimitEvents,
  getPlanLimitEventStats,
  getPlanLimitEventsPayload
};