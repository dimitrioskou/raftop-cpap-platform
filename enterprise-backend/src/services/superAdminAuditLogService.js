const db = require('./db');

function safeJson(value) {
  if (value === undefined) return null;
  if (value === null) return null;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return {
      serializationError: error.message,
      fallback: String(value)
    };
  }
}

function getRequestIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor) {
    return String(forwardedFor).split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
}

function getActor(req) {
  return (
    req.headers['x-super-admin-actor'] ||
    req.headers['x-admin-email'] ||
    req.headers['x-user-email'] ||
    req.superAdmin?.actor ||
    'local-super-admin'
  );
}

function normalizeAction(value) {
  return String(value || 'UNKNOWN_ACTION')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function normalizeOutcome(value) {
  const normalized = String(value || 'SUCCESS').toUpperCase();

  if (['SUCCESS', 'FAILED', 'DENIED', 'WARNING'].includes(normalized)) {
    return normalized;
  }

  return 'SUCCESS';
}

function buildChanges(beforeValue, afterValue) {
  const before = safeJson(beforeValue);
  const after = safeJson(afterValue);

  if (!before && after) {
    return {
      type: 'CREATE',
      changedFields: Object.keys(after || {}),
      fields: Object.keys(after || {}).reduce((acc, key) => {
        acc[key] = {
          before: null,
          after: after[key]
        };
        return acc;
      }, {})
    };
  }

  if (before && !after) {
    return {
      type: 'DELETE_OR_CLEAR',
      changedFields: Object.keys(before || {}),
      fields: Object.keys(before || {}).reduce((acc, key) => {
        acc[key] = {
          before: before[key],
          after: null
        };
        return acc;
      }, {})
    };
  }

  if (!before && !after) {
    return {
      type: 'NO_SNAPSHOT',
      changedFields: [],
      fields: {}
    };
  }

  const keys = Array.from(
    new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {})
    ])
  );

  const fields = {};
  const changedFields = [];

  for (const key of keys) {
    const beforeJson = JSON.stringify(before?.[key] ?? null);
    const afterJson = JSON.stringify(after?.[key] ?? null);

    if (beforeJson !== afterJson) {
      changedFields.push(key);
      fields[key] = {
        before: before?.[key] ?? null,
        after: after?.[key] ?? null
      };
    }
  }

  return {
    type: changedFields.length > 0 ? 'UPDATE' : 'NO_CHANGE',
    changedFields,
    fields
  };
}

async function ensureSuperAdminAuditLogTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS super_admin_audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      outcome TEXT NOT NULL DEFAULT 'SUCCESS',
      entity_type TEXT NOT NULL DEFAULT 'tenant_subscription',
      entity_id TEXT,
      tenant_id TEXT,
      actor TEXT,
      method TEXT,
      path TEXT,
      status_code INTEGER,
      message TEXT,
      before_json JSONB,
      after_json JSONB,
      changes_json JSONB,
      request_body JSONB,
      ip_address TEXT,
      user_agent TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS action TEXT;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS outcome TEXT NOT NULL DEFAULT 'SUCCESS';
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'tenant_subscription';
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS entity_id TEXT;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS tenant_id TEXT;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS actor TEXT;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS method TEXT;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS path TEXT;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS status_code INTEGER;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS message TEXT;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS before_json JSONB;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS after_json JSONB;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS changes_json JSONB;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS request_body JSONB;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS ip_address TEXT;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS user_agent TEXT;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await db.query(`
    ALTER TABLE super_admin_audit_logs
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_super_admin_audit_logs_created_at
    ON super_admin_audit_logs (created_at DESC);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_super_admin_audit_logs_tenant_id
    ON super_admin_audit_logs (tenant_id);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_super_admin_audit_logs_action
    ON super_admin_audit_logs (action);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_super_admin_audit_logs_outcome
    ON super_admin_audit_logs (outcome);
  `);
}

function normalizeAuditLog(row) {
  if (!row) return null;

  return {
    id: row.id,
    action: row.action,
    outcome: row.outcome,
    entityType: row.entity_type,
    entityId: row.entity_id,
    tenantId: row.tenant_id,
    actor: row.actor,
    method: row.method,
    path: row.path,
    statusCode: row.status_code,
    message: row.message,
    before: row.before_json || null,
    after: row.after_json || null,
    changes: row.changes_json || null,
    requestBody: row.request_body || null,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: row.metadata || {},
    createdAt: row.created_at
  };
}

async function recordSuperAdminAuditLog({
  req,
  action,
  outcome = 'SUCCESS',
  entityType = 'tenant_subscription',
  entityId = null,
  tenantId = null,
  statusCode = 200,
  message = '',
  before = null,
  after = null,
  metadata = {}
}) {
  await ensureSuperAdminAuditLogTable();

  const now = Date.now();
  const normalizedAction = normalizeAction(action);
  const normalizedOutcome = normalizeOutcome(outcome);

  const beforeJson = safeJson(before);
  const afterJson = safeJson(after);
  const changesJson = buildChanges(beforeJson, afterJson);

  const result = await db.query(
    `
    INSERT INTO super_admin_audit_logs
      (
        id,
        action,
        outcome,
        entity_type,
        entity_id,
        tenant_id,
        actor,
        method,
        path,
        status_code,
        message,
        before_json,
        after_json,
        changes_json,
        request_body,
        ip_address,
        user_agent,
        metadata,
        created_at
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
        $12::jsonb,
        $13::jsonb,
        $14::jsonb,
        $15::jsonb,
        $16,
        $17,
        $18::jsonb,
        NOW()
      )
    RETURNING *
    `,
    [
      `audit-${normalizedAction.toLowerCase()}-${now}`,
      normalizedAction,
      normalizedOutcome,
      entityType,
      entityId,
      tenantId,
      getActor(req),
      req.method || null,
      req.originalUrl || req.url || null,
      Number(statusCode || 200),
      message || '',
      beforeJson ? JSON.stringify(beforeJson) : null,
      afterJson ? JSON.stringify(afterJson) : null,
      JSON.stringify(changesJson),
      req.body ? JSON.stringify(safeJson(req.body)) : null,
      getRequestIp(req),
      req.headers['user-agent'] || null,
      JSON.stringify({
        phase: '22.15-super-admin-action-audit-log',
        guard: req.superAdmin || null,
        ...metadata
      })
    ]
  );

  return normalizeAuditLog(result.rows[0]);
}

async function safeRecordSuperAdminAuditLog(args) {
  try {
    return await recordSuperAdminAuditLog(args);
  } catch (error) {
    console.error('[superAdminAuditLog] failed to record audit log:', error);
    return null;
  }
}

async function getSuperAdminAuditLogs(options = {}) {
  await ensureSuperAdminAuditLogTable();

  const where = [];
  const params = [];

  if (options.tenantId) {
    params.push(String(options.tenantId));
    where.push(`tenant_id = $${params.length}`);
  }

  if (options.action) {
    params.push(normalizeAction(options.action));
    where.push(`action = $${params.length}`);
  }

  if (options.outcome) {
    params.push(normalizeOutcome(options.outcome));
    where.push(`outcome = $${params.length}`);
  }

  if (options.actor) {
    params.push(String(options.actor));
    where.push(`actor = $${params.length}`);
  }

  const limit = Math.min(Math.max(Number(options.limit) || 100, 1), 500);
  params.push(limit);

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const result = await db.query(
    `
    SELECT *
    FROM super_admin_audit_logs
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(normalizeAuditLog);
}

async function getSuperAdminAuditStats(options = {}) {
  await ensureSuperAdminAuditLogTable();

  const where = [];
  const params = [];

  if (options.tenantId) {
    params.push(String(options.tenantId));
    where.push(`tenant_id = $${params.length}`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const result = await db.query(
    `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE outcome = 'SUCCESS')::int AS success,
      COUNT(*) FILTER (WHERE outcome = 'FAILED')::int AS failed,
      COUNT(*) FILTER (WHERE action = 'CREATE_TENANT_SUBSCRIPTION')::int AS created,
      COUNT(*) FILTER (WHERE action = 'UPDATE_TENANT_SUBSCRIPTION')::int AS updated,
      COUNT(*) FILTER (WHERE action = 'FORCE_TENANT_ACTIVE')::int AS forced_active,
      COUNT(*) FILTER (WHERE action = 'FORCE_TENANT_EXPIRED')::int AS forced_expired,
      COUNT(*) FILTER (WHERE action = 'FORCE_TENANT_SUSPENDED')::int AS forced_suspended,
      MAX(created_at) AS last_event_at
    FROM super_admin_audit_logs
    ${whereSql}
    `,
    params
  );

  return {
    total: Number(result.rows[0]?.total || 0),
    success: Number(result.rows[0]?.success || 0),
    failed: Number(result.rows[0]?.failed || 0),
    created: Number(result.rows[0]?.created || 0),
    updated: Number(result.rows[0]?.updated || 0),
    forcedActive: Number(result.rows[0]?.forced_active || 0),
    forcedExpired: Number(result.rows[0]?.forced_expired || 0),
    forcedSuspended: Number(result.rows[0]?.forced_suspended || 0),
    lastEventAt: result.rows[0]?.last_event_at || null
  };
}

async function getSuperAdminAuditLogsPayload(options = {}) {
  const logs = await getSuperAdminAuditLogs(options);
  const stats = await getSuperAdminAuditStats(options);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.15-super-admin-action-audit-log',
    filters: {
      tenantId: options.tenantId || null,
      action: options.action || null,
      outcome: options.outcome || null,
      actor: options.actor || null,
      limit: Number(options.limit || 100)
    },
    stats,
    logs,
    generatedAt: new Date().toISOString()
  };
}

async function getSuperAdminAuditLogById(id) {
  await ensureSuperAdminAuditLogTable();

  const result = await db.query(
    `
    SELECT *
    FROM super_admin_audit_logs
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return {
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_AUDIT_LOG_NOT_FOUND',
      message: 'Super admin audit log was not found.',
      id
    };
  }

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.15-super-admin-action-audit-log',
    log: normalizeAuditLog(result.rows[0])
  };
}

module.exports = {
  ensureSuperAdminAuditLogTable,
  recordSuperAdminAuditLog,
  safeRecordSuperAdminAuditLog,
  getSuperAdminAuditLogsPayload,
  getSuperAdminAuditLogById,
  buildChanges
};