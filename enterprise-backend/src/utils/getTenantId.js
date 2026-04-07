function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return '';
}

function getTenantId(req) {
  const headerTenantId =
    req.headers['x-tenant-id'] ||
    req.headers['x-tenant'] ||
    req.headers['tenant-id'];

  const queryTenantId =
    req.query?.tenantId ||
    req.query?.tenant_id;

  const bodyTenantId =
    req.body?.tenantId ||
    req.body?.tenant_id;

  const tenantId = pickFirst(
    headerTenantId,
    queryTenantId,
    bodyTenantId,
    process.env.DEFAULT_TENANT_ID,
    'demo-tenant'
  );

  return tenantId;
}

module.exports = getTenantId;