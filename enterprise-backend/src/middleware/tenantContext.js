function tenantContext(req, res, next) {
  const headerTenantId = req.headers['x-tenant-id'];
  const queryTenantId = req.query?.tenantId;
  const userTenantId = req.user?.tenantId || req.user?.tenant_id;

  const resolvedTenantId =
    headerTenantId ||
    queryTenantId ||
    userTenantId ||
    (process.env.NODE_ENV !== 'production'
      ? process.env.DEV_TENANT_ID || 'demo-tenant'
      : null);

  if (resolvedTenantId) {
    req.tenantId = resolvedTenantId;

    req.user = {
      ...(req.user || {}),
      tenantId: resolvedTenantId
    };
  }

  next();
}

module.exports = tenantContext;