const crypto = require('crypto');
const db = require('./db');

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function buildFingerprint({ tenantId, method, path, reason }) {
  const raw = [
    normalizeText(tenantId || 'unknown-tenant'),
    normalizeText(method || 'GET'),
    normalizeText(path || '/'),
    normalizeText(reason || 'SUBSCRIPTION_REQUIRED')
  ].join('|');

  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function ensureSubscriptionGuardEventsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tenant_subscription_guard_events (
      id TEXT PRIMARY KEY,
      fingerprint TEXT UNIQUE,
      tenant_id TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status_code INTEGER NOT NULL DEFAULT 402,
      reason TEXT,
      access_state TEXT,
      subscription_status TEXT,
      subscription_plan TEXT,
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
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS fingerprint TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS tenant_id TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS method TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS path TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS status_code INTEGER NOT NULL DEFAULT 402;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS reason TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS access_state TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS subscription_status TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS occurrence_count INTEGER NOT NULL DEFAULT 1;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS last_blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS user_agent TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS ip_address TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    ALTER TABLE tenant_subscription_guard_events
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await backfillMissingFingerprints();

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_subscription_guard_events_fingerprint_unique
    ON tenant_subscription_guard_events (fingerprint)
    WHERE fingerprint IS NOT NULL;
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_subscription_guard_events_tenant_id
    ON tenant_subscription_guard_events (tenant_id);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_subscription_guard_events_last_seen
    ON tenant_subscription_guard_events (last_seen_at DESC);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_subscription_guard_events_status
    ON tenant_subscription_guard_events (subscription_status);
  `);
}

async function backfillMissingFingerprints() {
  const result = await db.query(`
    SELECT
      id,
      tenant_id,
      method,
      path,
      reason,
      fingerprint
    FROM tenant_subscription_guard_events
    WHERE fingerprint IS NULL
  `);

  for (const row of result.rows) {
    const fingerprint = buildFingerprint({
      tenantId: row.tenant_id,
      method: row.method,
      path: row.path,
      reason: row.reason
    });

    await db.query(
      `
      UPDATE tenant_subscription_guard_events
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

async function recordSubscriptionGuardBlock({ req, payload, access }) {
  await ensureSubscriptionGuardEventsTable();

  const tenantId = payload?.tenantId || 'unknown-tenant';
  const subscription = payload?.subscription || {};
  const method = req.method || 'GET';
  const path = req.originalUrl || req.url || '/';
  const reason = access?.reason || 'Tenant subscription does not allow access.';
  const now = new Date().toISOString();

  const fingerprint = buildFingerprint({
    tenantId,
    method,
    path,
    reason
  });

  const metadata = {
    phase: '22.5-subscription-guard-event-logging',
    subscriptionId: subscription.id || null,
    lockedReason: subscription.lockedReason || null,
    currentPeriodEndsAt: subscription.currentPeriodEndsAt || null,
    trialEndsAt: subscription.trialEndsAt || null
  };

  const result = await db.query(
    `
    INSERT INTO tenant_subscription_guard_events
      (
        id,
        fingerprint,
        tenant_id,
        method,
        path,
        status_code,
        reason,
        access_state,
        subscription_status,
        subscription_plan,
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
        402,
        $6,
        $7,
        $8,
        $9,
        1,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15::jsonb,
        $16,
        $17
      )
    ON CONFLICT (fingerprint)
    DO UPDATE SET
      occurrence_count = tenant_subscription_guard_events.occurrence_count + 1,
      last_seen_at = EXCLUDED.last_seen_at,
      last_blocked_at = EXCLUDED.last_blocked_at,
      status_code = EXCLUDED.status_code,
      reason = EXCLUDED.reason,
      access_state = EXCLUDED.access_state,
      subscription_status = EXCLUDED.subscription_status,
      subscription_plan = EXCLUDED.subscription_plan,
      user_agent = EXCLUDED.user_agent,
      ip_address = EXCLUDED.ip_address,
      metadata = EXCLUDED.metadata,
      updated_at = EXCLUDED.updated_at
    RETURNING *
    `,
    [
      `subguard-${tenantId}-${Date.now()}`,
      fingerprint,
      tenantId,
      method,
      path,
      reason,
      access?.accessState || 'LOCKED',
      subscription.status || 'UNKNOWN',
      subscription.plan || 'UNKNOWN',
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

  return normalizeGuardEvent(result.rows[0]);
}

function normalizeGuardEvent(row) {
  if (!row) return null;

  return {
    id: row.id,
    fingerprint: row.fingerprint,
    tenantId: row.tenant_id,
    method: row.method,
    path: row.path,
    statusCode: Number(row.status_code || 402),
    reason: row.reason,
    accessState: row.access_state,
    subscriptionStatus: row.subscription_status,
    subscriptionPlan: row.subscription_plan,
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

async function getSubscriptionGuardEvents(options = {}) {
  await ensureSubscriptionGuardEventsTable();

  const tenantId = options.tenantId || 'demo-tenant';
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 200);

  const result = await db.query(
    `
    SELECT *
    FROM tenant_subscription_guard_events
    WHERE tenant_id = $1
    ORDER BY last_seen_at DESC, created_at DESC
    LIMIT $2
    `,
    [tenantId, limit]
  );

  return result.rows.map(normalizeGuardEvent);
}

async function getSubscriptionGuardEventStats(options = {}) {
  await ensureSubscriptionGuardEventsTable();

  const tenantId = options.tenantId || 'demo-tenant';

  const result = await db.query(
    `
    SELECT
      COUNT(*)::int AS total_event_types,
      COALESCE(SUM(occurrence_count), 0)::int AS total_occurrences,
      COUNT(*) FILTER (WHERE subscription_status = 'EXPIRED')::int AS expired_event_types,
      COUNT(*) FILTER (WHERE subscription_status = 'SUSPENDED')::int AS suspended_event_types,
      COUNT(*) FILTER (WHERE subscription_status = 'CANCELLED')::int AS cancelled_event_types,
      MAX(last_seen_at) AS last_seen_at
    FROM tenant_subscription_guard_events
    WHERE tenant_id = $1
    `,
    [tenantId]
  );

  return {
    totalEventTypes: Number(result.rows[0]?.total_event_types || 0),
    totalOccurrences: Number(result.rows[0]?.total_occurrences || 0),
    expiredEventTypes: Number(result.rows[0]?.expired_event_types || 0),
    suspendedEventTypes: Number(result.rows[0]?.suspended_event_types || 0),
    cancelledEventTypes: Number(result.rows[0]?.cancelled_event_types || 0),
    lastSeenAt: result.rows[0]?.last_seen_at || null
  };
}

async function getSubscriptionGuardEventsPayload(options = {}) {
  const events = await getSubscriptionGuardEvents(options);
  const stats = await getSubscriptionGuardEventStats(options);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.5-subscription-guard-event-logging',
    tenantId: options.tenantId || 'demo-tenant',
    stats,
    events
  };
}

module.exports = {
  ensureSubscriptionGuardEventsTable,
  recordSubscriptionGuardBlock,
  getSubscriptionGuardEvents,
  getSubscriptionGuardEventStats,
  getSubscriptionGuardEventsPayload
};