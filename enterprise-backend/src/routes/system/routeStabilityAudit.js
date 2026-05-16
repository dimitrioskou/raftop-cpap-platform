const express = require('express');

const {
  runRouteStabilityAudit
} = require('../../services/routeStabilityAuditService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await runRouteStabilityAudit(req);

    return res.status(200).json(payload);
  } catch (error) {
    console.error('[route stability audit] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'ROUTE_STABILITY_AUDIT_FAILED',
      message: error.message,
      phase: '23.9A-route-stability-tenant-context-safe'
    });
  }
});

module.exports = router;