const {
  canAccessApi,
  normalizeRole
} = require('../security/runtimeAclPolicy');

const { writeAclAudit } = require('../services/aclAuditService');

function readRuntimeRole(req) {
  return normalizeRole(
    req.headers['x-runtime-role'] ||
      req.headers['x-user-role'] ||
      req.headers.role ||
      req.query.runtimeRole ||
      req.query.role ||
      req.user?.role ||
      'tenant_admin'
  );
}

function readTenantId(req) {
  return (
    req.headers['x-tenant-id'] ||
    req.headers['tenant-id'] ||
    req.query.tenantId ||
    req.query.tenant_id ||
    req.user?.tenantId ||
    req.user?.tenant_id ||
    'unknown'
  );
}

function runtimeAclMiddleware(req, res, next) {
  const role = readRuntimeRole(req);
  const pathname = req.originalUrl || req.baseUrl || req.path || req.url || '';

  const access = canAccessApi({
    role,
    pathname
  });

  req.runtimeRole = role;
  req.runtimeAcl = access;

  if (!access.allowed) {
    writeAclAudit({
      tenantId: readTenantId(req),
      role: access.role,
      path: pathname,
      permission: access.permission,
      reason: access.reason,
      source: 'backend',
      allowed: false,
      metadata: {
        ip: req.ip,
        method: req.method,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(403).json({
      ok: false,
      error: 'RUNTIME_ACL_FORBIDDEN',
      message: access.reason,
      role: access.role,
      permission: access.permission,
      path: pathname,
      phase: '34I-acl-audit'
    });
  }

  return next();
}

module.exports = {
  runtimeAclMiddleware,
  readRuntimeRole
};