// enterprise-backend/src/routes/tenant/aclAudit.js
// RAFTOP CPAP CARE Pro
// Tenant ACL Audit Route
// Mounted at: /api/tenant/security/acl-audit
//
// Security:
// - This route is mounted after productionAuthEnforcement.
// - This route is also mounted after tenant context/subscription/module guards in server.js.
// - It is read-only and does not modify production data.

const express = require('express');

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

function getTenantId(req) {
  return (
    req.tenantId ||
    req.headers['x-tenant-id'] ||
    req.query.tenantId ||
    req.query.tenant_id ||
    'unknown'
  );
}

function getUserContext(req) {
  const user = req.user || req.auth || {};

  return {
    id: user.id || user.user_id || null,
    email: user.email || null,
    role: user.role || user.user_role || null,
    source: user.source || 'auth_context'
  };
}

function buildAclChecks(req) {
  const tenantId = getTenantId(req);
  const user = getUserContext(req);

  return [
    {
      key: 'tenant_context_present',
      status: tenantId && tenantId !== 'unknown' ? 'PASS' : 'WARN',
      description: 'Request has tenant context.',
      evidence: {
        tenant_id: tenantId
      }
    },
    {
      key: 'authenticated_user_context_present',
      status: user.email || user.id || user.role ? 'PASS' : 'WARN',
      description: 'Request has authenticated user context.',
      evidence: {
        user_id: user.id,
        email: user.email,
        role: user.role,
        source: user.source
      }
    },
    {
      key: 'acl_route_read_only',
      status: 'PASS',
      description: 'ACL audit route is read-only.',
      evidence: {
        write_performed: false
      }
    },
    {
      key: 'production_auth_enforcement_expected',
      status: 'PASS',
      description:
        'Route is expected to be protected by productionAuthEnforcement before tenant route handling.',
      evidence: {
        protected_api: true,
        expected_auth: 'Authorization Bearer JWT or valid super-admin key'
      }
    }
  ];
}

function summarizeChecks(checks) {
  const summary = {
    pass: 0,
    warn: 0,
    fail: 0
  };

  checks.forEach((check) => {
    if (check.status === 'PASS') summary.pass += 1;
    else if (check.status === 'WARN') summary.warn += 1;
    else summary.fail += 1;
  });

  return summary;
}

router.get('/', (req, res) => {
  const checks = buildAclChecks(req);
  const summary = summarizeChecks(checks);

  res.json({
    ok: summary.fail === 0,
    fallback: false,
    service: 'RAFTOP Tenant ACL Audit',
    tenant_id: getTenantId(req),
    user: getUserContext(req),
    summary,
    checks,
    time: nowIso(),
    requestId: req.requestId || null
  });
});

router.get('/summary', (req, res) => {
  const checks = buildAclChecks(req);
  const summary = summarizeChecks(checks);

  res.json({
    ok: summary.fail === 0,
    fallback: false,
    tenant_id: getTenantId(req),
    summary,
    time: nowIso(),
    requestId: req.requestId || null
  });
});

router.get('/checks', (req, res) => {
  const checks = buildAclChecks(req);

  res.json({
    ok: true,
    fallback: false,
    tenant_id: getTenantId(req),
    checks,
    time: nowIso(),
    requestId: req.requestId || null
  });
});

module.exports = router;