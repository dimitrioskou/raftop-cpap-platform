function boolEnv(name) {
  return String(process.env[name] || '').toLowerCase() === 'true';
}

function normalizeTenantId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getExplicitTenantId(req) {
  return (
    req.headers['x-tenant-id'] ||
    req.headers['x-tenant'] ||
    req.query.tenantId ||
    req.query.tenant_id ||
    req.body?.tenantId ||
    req.body?.tenant_id ||
    ''
  );
}

function isSystemOrPublicTenantPath(req) {
  const path = String(req.originalUrl || req.url || '').toLowerCase();

  return (
    path.startsWith('/api/tenant/subscription') ||
    path.startsWith('/api/tenant/profile/public')
  );
}

function requireTenantContext(req, res, next) {
  if (isSystemOrPublicTenantPath(req)) {
    return next();
  }

  const nodeEnv = String(process.env.NODE_ENV || 'development').toLowerCase();
  const allowLocalFallback =
    nodeEnv !== 'production' && boolEnv('ENABLE_LOCAL_TENANT_FALLBACK');

  const explicitTenantId = normalizeTenantId(getExplicitTenantId(req));

  if (!explicitTenantId && allowLocalFallback) {
    req.tenantId = 'demo-tenant';
    req.tenant_id = 'demo-tenant';
    req.tenantContextSource = 'local_fallback_enabled';

    res.setHeader('X-Tenant-Context-Source', 'local_fallback_enabled');

    return next();
  }

  if (!explicitTenantId) {
    return res.status(400).json({
      ok: false,
      fallback: false,
      error: 'TENANT_CONTEXT_REQUIRED',
      message:
        'Tenant context is required. Send x-tenant-id header or explicit tenantId.',
      details: {
        requiredHeader: 'x-tenant-id',
        allowLocalFallback,
        nodeEnv
      }
    });
  }

  req.tenantId = explicitTenantId;
  req.tenant_id = explicitTenantId;
  req.tenantContextSource = 'explicit';

  res.setHeader('X-Tenant-Id', explicitTenantId);
  res.setHeader('X-Tenant-Context-Source', 'explicit');

  return next();
}

module.exports = requireTenantContext;