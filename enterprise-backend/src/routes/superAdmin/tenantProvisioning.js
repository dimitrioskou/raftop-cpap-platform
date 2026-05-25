// enterprise-backend/src/routes/superAdmin/tenantProvisioning.js
// RAFTOP CPAP CARE Pro
// Safe Super Admin Tenant Provisioning Route
// Purpose: keep super-admin tenant provisioning route available without exposing unsafe production writes.
// Mounted at: /api/super-admin/tenant-provisioning
//
// Security:
// - This route is mounted behind /api/super-admin guard in server.js.
// - Production backend auth enforcement also blocks protected API access without valid auth.
// - This file does not create tenants directly in production DB.

const express = require('express');

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

function normalizeTenantId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildProvisioningPreview(input) {
  const requestedTenantId =
    normalizeTenantId(input.tenant_id) ||
    normalizeTenantId(input.tenantId) ||
    normalizeTenantId(input.slug) ||
    'new-tenant';

  const requestedName =
    String(input.tenant_name || input.tenantName || input.name || '').trim() ||
    requestedTenantId.toUpperCase();

  const plan =
    String(input.plan || input.subscription_plan || input.subscriptionPlan || 'enterprise')
      .trim()
      .toLowerCase() || 'enterprise';

  const status =
    String(input.status || 'active')
      .trim()
      .toLowerCase() || 'active';

  return {
    tenant_id: requestedTenantId,
    tenant_name: requestedName,
    plan,
    status,
    recommended_steps: [
      'Validate tenant identity and commercial agreement.',
      'Create tenant record through controlled bootstrap or approved provisioning workflow.',
      'Create admin user only after tenant verification.',
      'Verify tenant isolation, subscription status and backend authorization.',
      'Record evidence report before production handover.'
    ]
  };
}

router.get('/', (req, res) => {
  res.json({
    ok: true,
    fallback: false,
    service: 'RAFTOP Super Admin Tenant Provisioning',
    mode: 'safe_route_available',
    write_enabled: false,
    time: nowIso(),
    requestId: req.requestId || null
  });
});

router.get('/status', (req, res) => {
  res.json({
    ok: true,
    fallback: false,
    status: 'available',
    write_enabled: false,
    message:
      'Tenant provisioning route is available. Direct production writes are disabled in this safe route.',
    time: nowIso(),
    requestId: req.requestId || null
  });
});

router.post('/preview', (req, res) => {
  const preview = buildProvisioningPreview(req.body || {});

  res.json({
    ok: true,
    fallback: false,
    action: 'preview',
    write_performed: false,
    preview,
    time: nowIso(),
    requestId: req.requestId || null
  });
});

router.post('/provision', (req, res) => {
  const preview = buildProvisioningPreview(req.body || {});

  res.status(202).json({
    ok: true,
    fallback: false,
    action: 'provision_requested',
    write_performed: false,
    production_write_policy: 'disabled_in_safe_route',
    message:
      'Provisioning request accepted for review. Use controlled bootstrap scripts for production tenant creation.',
    preview,
    next_required_phase:
      'Use controlled tenant/admin bootstrap workflow and evidence verification before enabling a new production tenant.',
    time: nowIso(),
    requestId: req.requestId || null
  });
});

module.exports = router;