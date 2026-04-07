const express = require('express');
const { buildLiveVerificationReport } = require('../../services/liveVerificationService');

function resolveAuth() {
  const noop = (_req, _res, next) => next();

  try {
    const mod = require('../../middleware/auth');

    const requireAuth =
      mod.requireAuth ||
      mod.authenticate ||
      mod.authRequired ||
      mod.protect ||
      noop;

    const allowRolesFactory =
      mod.allowRoles ||
      mod.authorizeRoles ||
      mod.requireRoles;

    const allowRoles = (...roles) => {
      if (typeof allowRolesFactory === 'function') {
        return allowRolesFactory(...roles);
      }
      return noop;
    };

    return { requireAuth, allowRoles };
  } catch (error) {
    return { requireAuth: noop, allowRoles: () => noop };
  }
}

const { requireAuth, allowRoles } = resolveAuth();
const router = express.Router();

router.get(
  '/live-verification',
  requireAuth,
  allowRoles('super_admin', 'admin'),
  async (_req, res) => {
    try {
      const report = await buildLiveVerificationReport();
      const httpStatus = report.ok ? 200 : 503;
      return res.status(httpStatus).json(report);
    } catch (error) {
      return res.status(500).json({
        ok: false,
        message: 'Live verification failed.',
        error: error.message
      });
    }
  }
);

module.exports = router;