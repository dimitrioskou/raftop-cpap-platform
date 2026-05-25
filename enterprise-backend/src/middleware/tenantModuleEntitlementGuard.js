const {
  getTenantSubscriptionStatus
} = require('../services/tenantSubscriptionService');

function isModuleGuardEnabled() {
  return String(process.env.MODULE_ENTITLEMENT_GUARD_ENABLED || 'true').toLowerCase() === 'true';
}

function isBypassEnabled(req) {
  const bypassKey = process.env.MODULE_ENTITLEMENT_GUARD_BYPASS_KEY;

  if (bypassKey && req.headers['x-module-entitlement-bypass-key'] === bypassKey) {
    return true;
  }

  if (String(req.headers['x-module-entitlement-bypass'] || '').toLowerCase() === 'true') {
    return true;
  }

  return false;
}

function getPath(req) {
  return String(req.originalUrl || req.url || '').split('?')[0];
}

function getTenantId(req) {
  return (
    req.user?.tenant_id ||
    req.user?.tenantId ||
    req.headers['x-tenant-id'] ||
    req.query.tenant_id ||
    req.query.tenantId ||
    'unknown'
  );
}

const MODULE_RULES = [
  {
    startsWith: '/api/tenant/atlas/action-center',
    moduleKey: 'actionCenter',
    entitlementKey: 'canUseActionCenter',
    label: 'Action Center'
  },
  {
    startsWith: '/api/tenant/atlas',
    moduleKey: 'atlas',
    entitlementKey: 'canUseAtlas',
    label: 'ATLAS'
  },
  {
    startsWith: '/api/tenant/closed-loop',
    moduleKey: 'closedLoop',
    entitlementKey: 'canUseClosedLoop',
    label: 'Closed Loop'
  },
  {
    startsWith: '/api/tenant/closed-loop-control',
    moduleKey: 'closedLoop',
    entitlementKey: 'canUseClosedLoop',
    label: 'Closed Loop'
  },
  {
    startsWith: '/api/tenant/closed-loop-verification',
    moduleKey: 'closedLoop',
    entitlementKey: 'canUseClosedLoop',
    label: 'Closed Loop'
  },
  {
    startsWith: '/api/tenant/closed-loop-remediation',
    moduleKey: 'closedLoop',
    entitlementKey: 'canUseClosedLoop',
    label: 'Closed Loop'
  },
  {
    startsWith: '/api/tenant/closed-loop-resolution',
    moduleKey: 'closedLoop',
    entitlementKey: 'canUseClosedLoop',
    label: 'Closed Loop'
  },
  {
    startsWith: '/api/tenant/security',
    moduleKey: 'securityCenter',
    entitlementKey: 'canUseSecurityCenter',
    label: 'Security Center'
  }
];

function resolveModuleRule(path) {
  return MODULE_RULES.find((rule) => path.startsWith(rule.startsWith)) || null;
}

function isTruthy(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function resolveModulesAndEntitlements(req, payload) {
  const subscription = payload?.subscription || req.subscription || {};
  const modules =
    req.subscriptionModules ||
    req.saas?.modules ||
    payload?.modules ||
    subscription.modules ||
    {};

  const entitlements =
    req.subscriptionEntitlements ||
    req.saas?.entitlements ||
    payload?.entitlements ||
    subscription.entitlements ||
    {};

  return {
    subscription,
    modules,
    entitlements
  };
}

async function tenantModuleEntitlementGuard(req, res, next) {
  try {
    if (!isModuleGuardEnabled()) {
      return next();
    }

    if (isBypassEnabled(req)) {
      return next();
    }

    const path = getPath(req);
    const rule = resolveModuleRule(path);

    if (!rule) {
      return next();
    }

    let payload = null;

    if (!req.subscription || !req.subscriptionModules || !req.subscriptionEntitlements) {
      payload = await getTenantSubscriptionStatus(req);
    }

    const {
      subscription,
      modules,
      entitlements
    } = resolveModulesAndEntitlements(req, payload);

    const moduleAllowed = isTruthy(modules[rule.moduleKey]);
    const entitlementAllowed = isTruthy(entitlements[rule.entitlementKey]);

    if (moduleAllowed && entitlementAllowed) {
      req.moduleEntitlement = {
        allowed: true,
        rule,
        moduleAllowed,
        entitlementAllowed
      };

      return next();
    }

    return res.status(402).json({
      ok: false,
      fallback: false,
      error: 'MODULE_UPGRADE_REQUIRED',
      message: `${rule.label} is not enabled for this tenant subscription.`,
      phase: '35B.6-module-entitlement-guard',
      tenantId: getTenantId(req),
      path,
      module: rule.moduleKey,
      entitlement: rule.entitlementKey,
      moduleAllowed,
      entitlementAllowed,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        access: subscription.access || null,
        limits: subscription.limits || null
      },
      modules,
      entitlements
    });
  } catch (error) {
    console.error('[tenantModuleEntitlementGuard] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'MODULE_ENTITLEMENT_GUARD_FAILED',
      message: error.message,
      phase: '35B.6-module-entitlement-guard'
    });
  }
}

module.exports = tenantModuleEntitlementGuard;