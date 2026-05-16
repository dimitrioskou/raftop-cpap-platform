const {
  getTenantId
} = require('../services/tenantSubscriptionService');

const {
  getTenantSubscriptionUsage
} = require('../services/tenantSubscriptionUsageService');

const {
  recordPlanLimitBlock
} = require('../services/tenantPlanLimitEventService');

function isPlanLimitGuardEnabled() {
  return String(process.env.PLAN_LIMIT_GUARD_ENABLED || 'true').toLowerCase() === 'true';
}

function isBypassEnabled(req) {
  const bypassKey = process.env.PLAN_LIMIT_GUARD_BYPASS_KEY;

  if (bypassKey && req.headers['x-plan-limit-bypass-key'] === bypassKey) {
    return true;
  }

  if (String(req.headers['x-plan-limit-bypass'] || '').toLowerCase() === 'true') {
    return true;
  }

  return false;
}

function getPath(req) {
  return String(req.originalUrl || req.url || '').split('?')[0];
}

function resolveCreateResource(req) {
  const method = String(req.method || '').toUpperCase();
  const path = getPath(req);

  if (method !== 'POST') {
    return null;
  }

  if (path === '/api/tenant/patients' || path.startsWith('/api/tenant/patients/')) {
    return {
      resourceType: 'patients',
      limitName: 'patientLimit',
      usageKey: 'patients',
      limitKey: 'patientLimit',
      attemptedIncrement: 1
    };
  }

  if (path === '/api/tenant/users' || path.startsWith('/api/tenant/users/')) {
    return {
      resourceType: 'users',
      limitName: 'seatLimit',
      usageKey: 'users',
      limitKey: 'seatLimit',
      attemptedIncrement: 1
    };
  }

  return null;
}

function buildVerdict({ resource, usagePayload }) {
  const limitPayload = usagePayload?.limits?.[resource.limitKey] || {};
  const used = Number(limitPayload.used || 0);
  const limit = Number(limitPayload.limit || 0);
  const attemptedIncrement = Number(resource.attemptedIncrement || 1);
  const projectedUsage = used + attemptedIncrement;

  if (!Number.isFinite(limit)) {
    return {
      shouldBlock: false,
      usageState: 'NO_LIMIT_CONFIGURED',
      used,
      limit: 0,
      attemptedIncrement,
      projectedUsage,
      source: limitPayload.source || 'unknown',
      reason: 'No valid plan limit is configured.'
    };
  }

  if (limit < 0) {
    return {
      shouldBlock: false,
      usageState: 'NO_LIMIT_CONFIGURED',
      used,
      limit,
      attemptedIncrement,
      projectedUsage,
      source: limitPayload.source || 'unknown',
      reason: 'No plan limit is configured for this resource.'
    };
  }

  if (projectedUsage > limit) {
    return {
      shouldBlock: true,
      usageState: 'LIMIT_EXCEEDED',
      used,
      limit,
      attemptedIncrement,
      projectedUsage,
      source: limitPayload.source || 'unknown',
      reason: `${resource.resourceType} limit exceeded. Used ${used}/${limit}; attempted projected usage ${projectedUsage}/${limit}.`
    };
  }

  return {
    shouldBlock: false,
    usageState: 'OK',
    used,
    limit,
    attemptedIncrement,
    projectedUsage,
    source: limitPayload.source || 'unknown',
    reason: 'Usage is within plan limit.'
  };
}

async function tenantPlanLimitGuard(req, res, next) {
  try {
    if (!isPlanLimitGuardEnabled()) {
      return next();
    }

    if (isBypassEnabled(req)) {
      return next();
    }

    const resource = resolveCreateResource(req);

    if (!resource) {
      return next();
    }

    const tenantId = getTenantId(req);
    const usagePayload = await getTenantSubscriptionUsage(req);
    const verdict = buildVerdict({ resource, usagePayload });

    if (!verdict.shouldBlock) {
      req.planLimit = {
        resource,
        verdict
      };

      return next();
    }

    let limitEvent = null;

    try {
      limitEvent = await recordPlanLimitBlock({
        req,
        tenantId,
        resourceType: resource.resourceType,
        limitName: resource.limitName,
        verdict
      });
    } catch (eventError) {
      console.error('[tenantPlanLimitGuard] failed to record plan limit event:', eventError);
    }

    return res.status(402).json({
      ok: false,
      fallback: false,
      error: 'PLAN_LIMIT_EXCEEDED',
      message: verdict.reason,
      phase: '22.9-plan-limit-enforcement-backend',
      tenantId,
      resource: resource.resourceType,
      limitName: resource.limitName,
      verdict,
      subscription: usagePayload.subscription,
      limitEvent
    });
  } catch (error) {
    console.error('[tenantPlanLimitGuard] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'PLAN_LIMIT_GUARD_FAILED',
      message: error.message
    });
  }
}

module.exports = tenantPlanLimitGuard;