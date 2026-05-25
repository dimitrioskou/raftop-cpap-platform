const {
  getTenantSubscriptionStatus
} = require('../services/tenantSubscriptionService');

const {
  recordSubscriptionGuardBlock
} = require('../services/tenantSubscriptionGuardEventService');

function isGuardEnabled() {
  return String(process.env.SUBSCRIPTION_GUARD_ENABLED || 'true').toLowerCase() === 'true';
}

function isBypassEnabled(req) {
  const bypassKey = process.env.SUBSCRIPTION_GUARD_BYPASS_KEY;

  if (bypassKey && req.headers['x-subscription-bypass-key'] === bypassKey) {
    return true;
  }

  if (String(req.headers['x-subscription-bypass'] || '').toLowerCase() === 'true') {
    return true;
  }

  return false;
}

function getPath(req) {
  return String(req.originalUrl || req.url || '').split('?')[0];
}

function isPublicTenantSubscriptionPath(req) {
  const path = getPath(req);

  return path.startsWith('/api/tenant/subscription');
}

function isTenantContextPath(req) {
  const path = getPath(req);

  return path === '/api/tenant/context';
}

function isSubscriptionAllowed(access) {
  if (!access) return false;

  if (access.allowed === false) return false;
  if (access.isAllowed === false) return false;

  if (access.allowed === true) return true;
  if (access.isAllowed === true) return true;

  return false;
}

function getAccessState(access) {
  return (
    access?.accessState ||
    access?.state ||
    'UNKNOWN'
  );
}

function getTenantIdFromPayload(payload, req) {
  return (
    payload?.tenantId ||
    payload?.tenant_id ||
    req.headers['x-tenant-id'] ||
    req.query.tenantId ||
    req.query.tenant_id ||
    'unknown'
  );
}

async function tenantSubscriptionGuard(req, res, next) {
  try {
    if (!isGuardEnabled()) {
      return next();
    }

    if (isPublicTenantSubscriptionPath(req)) {
      return next();
    }

    if (isTenantContextPath(req)) {
      return next();
    }

    if (isBypassEnabled(req)) {
      return next();
    }

    const payload = await getTenantSubscriptionStatus(req);
    const subscription = payload.subscription || {};
    const access = subscription.access || payload.access || {};
    const limits = subscription.limits || payload.limits || {};
    const modules = subscription.modules || payload.modules || {};
    const entitlements = subscription.entitlements || payload.entitlements || {};

    const allowed = isSubscriptionAllowed(access);

    if (!allowed) {
      let guardEvent = null;

      try {
        guardEvent = await recordSubscriptionGuardBlock({
          req,
          payload,
          access
        });
      } catch (eventError) {
        console.error('[tenantSubscriptionGuard] failed to record guard event:', eventError);
      }

      return res.status(402).json({
        ok: false,
        fallback: false,
        error: 'SUBSCRIPTION_REQUIRED',
        message: access?.reason || 'Tenant subscription does not allow access.',
        phase: '35B.4-saas-subscription-guard-hardening',
        tenantId: getTenantIdFromPayload(payload, req),
        accessState: getAccessState(access),
        subscription,
        limits,
        modules,
        entitlements,
        guardEvent
      });
    }

    req.subscription = subscription;
    req.subscriptionAccess = access;
    req.subscriptionLimits = limits;
    req.subscriptionModules = modules;
    req.subscriptionEntitlements = entitlements;
    req.saas = {
      tenantId: getTenantIdFromPayload(payload, req),
      subscription,
      access,
      limits,
      modules,
      entitlements
    };

    return next();
  } catch (error) {
    console.error('[tenantSubscriptionGuard] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUBSCRIPTION_GUARD_FAILED',
      message: error.message,
      phase: '35B.4-saas-subscription-guard-hardening'
    });
  }
}

module.exports = tenantSubscriptionGuard;