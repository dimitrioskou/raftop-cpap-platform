const express = require('express');
const { getSubscriptionSnapshot } = require('../../services/subscriptionGuardService');

function resolveAuth() {
  const noop = (_req, _res, next) => next();

  try {
    const mod = require('../../middleware/auth');

    return {
      requireAuth:
        mod.requireAuth ||
        mod.authenticate ||
        mod.authRequired ||
        mod.protect ||
        noop
    };
  } catch (error) {
    return { requireAuth: noop };
  }
}

const { requireAuth } = resolveAuth();
const router = express.Router();

router.get('/status', requireAuth, async (req, res) => {
  try {
    const snapshot = await getSubscriptionSnapshot(req);

    return res.status(200).json({
      ok: true,
      ...snapshot
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Subscription status lookup failed.',
      error: error.message
    });
  }
});

module.exports = router;