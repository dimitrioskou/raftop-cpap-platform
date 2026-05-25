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

function readTenantId(req) {
  return (
    req?.user?.tenant_id ||
    req?.user?.tenantId ||
    req?.headers?.['x-tenant-id'] ||
    req?.headers?.['tenant-id'] ||
    req?.body?.tenantId ||
    req?.body?.tenant_id ||
    req?.query?.tenantId ||
    req?.query?.tenant_id ||
    null
  );
}

function readEmail(req) {
  return (
    req?.body?.email ||
    req?.body?.userEmail ||
    req?.body?.user_email ||
    req?.query?.email ||
    null
  );
}

function readRole(req) {
  return (
    req?.body?.role ||
    req?.headers?.['x-runtime-role'] ||
    req?.headers?.['x-user-role'] ||
    req?.headers?.role ||
    req?.query?.role ||
    null
  );
}

function readIp(req) {
  return (
    req?.headers?.['x-forwarded-for'] ||
    req?.headers?.['x-real-ip'] ||
    req?.ip ||
    req?.socket?.remoteAddress ||
    null
  );
}

function readUserAgent(req) {
  return req?.headers?.['user-agent'] || null;
}

async function writeFailedLoginAudit({
  tenantId = null,
  email = null,
  role = null,
  reason,
  statusCode = 401,
  ip = null,
  userAgent = null,
  source = 'auth',
  metadata = {}
}) {
  try {
    await db.query(
      `
      INSERT INTO failed_login_audit_log (
        tenant_id,
        email,
        role,
        reason,
        status_code,
        ip,
        user_agent,
        source,
        metadata
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )
      `,
      [
        tenantId || null,
        email || null,
        role || null,
        reason || 'LOGIN_FAILED',
        Number(statusCode || 401),
        ip || null,
        userAgent || null,
        source || 'auth',
        safeJson(metadata)
      ]
    );
  } catch (error) {
    console.error('[FAILED LOGIN AUDIT]', error.message);
  }
}

async function writeFailedLoginFromRequest(req, {
  reason = 'LOGIN_FAILED',
  statusCode = 401,
  metadata = {}
} = {}) {
  return writeFailedLoginAudit({
    tenantId: readTenantId(req),
    email: readEmail(req),
    role: readRole(req),
    reason,
    statusCode,
    ip: readIp(req),
    userAgent: readUserAgent(req),
    source: 'auth',
    metadata: {
      requestId: req?.requestId || req?.headers?.['x-request-id'] || null,
      path: String(req?.originalUrl || req?.url || '').split('?')[0],
      method: req?.method || null,
      ...metadata
    }
  });
}

module.exports = {
  writeFailedLoginAudit,
  writeFailedLoginFromRequest,
  readTenantId,
  readEmail,
  readRole,
  readIp,
  readUserAgent
};