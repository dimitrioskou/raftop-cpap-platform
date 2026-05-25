const db = require('./db');

function safeJson(value) {
  try {
    return JSON.stringify(value || {});
  } catch (_error) {
    return JSON.stringify({
      serializationError: true
    });
  }
}

async function writeUserActivityAudit({
  tenantId,
  userId = null,
  userEmail = null,
  role = null,
  method,
  path,
  action,
  source = 'backend',
  statusCode = null,
  success = true,
  ip = null,
  userAgent = null,
  metadata = {}
}) {
  try {
    await db.query(
      `
      INSERT INTO user_activity_audit_log (
        tenant_id,
        user_id,
        user_email,
        role,
        method,
        path,
        action,
        source,
        status_code,
        success,
        ip,
        user_agent,
        metadata
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
      `,
      [
        tenantId || 'unknown',
        userId || null,
        userEmail || null,
        role || null,
        method || 'UNKNOWN',
        path || '',
        action || 'UNKNOWN_ACTION',
        source || 'backend',
        statusCode || null,
        success !== false,
        ip || null,
        userAgent || null,
        safeJson(metadata)
      ]
    );
  } catch (error) {
    console.error('[USER ACTIVITY AUDIT]', error.message);
  }
}

function inferActionFromRequest(req) {
  const method = String(req.method || '').toUpperCase();
  const path = String(req.originalUrl || req.url || '').split('?')[0];

  if (method === 'GET') return `VIEW:${path}`;
  if (method === 'POST') return `CREATE:${path}`;
  if (method === 'PUT') return `UPDATE:${path}`;
  if (method === 'PATCH') return `PATCH:${path}`;
  if (method === 'DELETE') return `DELETE:${path}`;

  return `${method || 'UNKNOWN'}:${path}`;
}

function readTenantId(req) {
  return (
    req.user?.tenant_id ||
    req.user?.tenantId ||
    req.headers?.['x-tenant-id'] ||
    req.headers?.['tenant-id'] ||
    req.query?.tenantId ||
    req.query?.tenant_id ||
    'unknown'
  );
}

function readRole(req) {
  return (
    req.user?.role ||
    req.headers?.['x-runtime-role'] ||
    req.headers?.['x-user-role'] ||
    req.headers?.role ||
    req.query?.runtimeRole ||
    req.query?.role ||
    'unknown'
  );
}

function readUserId(req) {
  return (
    req.user?.id ||
    req.user?.user_id ||
    req.headers?.['x-user-id'] ||
    req.query?.userId ||
    req.query?.user_id ||
    null
  );
}

function readUserEmail(req) {
  return (
    req.user?.email ||
    req.headers?.['x-user-email'] ||
    req.query?.userEmail ||
    req.query?.user_email ||
    null
  );
}

async function writeUserActivityFromRequest(req, {
  action = null,
  statusCode = null,
  success = true,
  metadata = {}
} = {}) {
  return writeUserActivityAudit({
    tenantId: readTenantId(req),
    userId: readUserId(req),
    userEmail: readUserEmail(req),
    role: readRole(req),
    method: req.method,
    path: String(req.originalUrl || req.url || '').split('?')[0],
    action: action || inferActionFromRequest(req),
    source: 'backend',
    statusCode,
    success,
    ip: req.ip,
    userAgent: req.headers?.['user-agent'] || null,
    metadata
  });
}

module.exports = {
  writeUserActivityAudit,
  writeUserActivityFromRequest,
  inferActionFromRequest,
  readTenantId,
  readRole,
  readUserId,
  readUserEmail
};