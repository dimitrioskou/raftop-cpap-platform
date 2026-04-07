const {
  evaluateAccess,
  getSubscriptionSnapshot
} = require('../services/subscriptionGuardService');

function blockedResponse(res, result) {
  const isTenantBlock = result.code === 'tenant_inactive';

  return res.status(result.httpStatus || 402).json({
    ok: false,
    code: result.code,
    message: isTenantBlock
      ? 'Tenant subscription is inactive. Payment or reactivation is required.'
      : 'Doctor subscription is inactive. Payment or reactivation is required.',
    reason: isTenantBlock
      ? result.snapshot?.tenant?.reason || 'tenant_inactive'
      : result.snapshot?.doctor?.reason || 'doctor_subscription_inactive',
    subscription: result.snapshot
  });
}

function requireTenantActive(options = {}) {
  return async (req, res, next) => {
    try {
      const result = await evaluateAccess(req, {
        requireDoctorActive: false,
        allowAdminBypass: options.allowAdminBypass !== false
      });

      req.subscriptionAccess = result.snapshot;

      if (!result.allowed) {
        return blockedResponse(res, result);
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        ok: false,
        code: 'subscription_guard_error',
        message: error.message
      });
    }
  };
}

function requireDoctorSubscription(options = {}) {
  return async (req, res, next) => {
    try {
      const result = await evaluateAccess(req, {
        requireDoctorActive: true,
        allowAdminBypass: options.allowAdminBypass !== false
      });

      req.subscriptionAccess = result.snapshot;

      if (!result.allowed) {
        return blockedResponse(res, result);
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        ok: false,
        code: 'subscription_guard_error',
        message: error.message
      });
    }
  };
}

async function attachSubscriptionSnapshot(req, _res, next) {
  try {
    req.subscriptionAccess = await getSubscriptionSnapshot(req);
  } catch (error) {
    req.subscriptionAccess = {
      actor: {
        userId: null,
        role: 'guest',
        tenantId: null,
        email: null,
        tokenPresent: false,
        decodedTokenPresent: false
      },
      tenant: {
        active: false,
        reason: error.message,
        table: null,
        status: null
      },
      doctor: {
        active: false,
        reason: error.message,
        table: null,
        status: null,
        endsAt: null
      },
      access: {
        tenantAllowed: false,
        doctorAllowed: false
      }
    };
  }

  return next();
}

module.exports = {
  attachSubscriptionSnapshot,
  requireDoctorSubscription,
  requireTenantActive
};