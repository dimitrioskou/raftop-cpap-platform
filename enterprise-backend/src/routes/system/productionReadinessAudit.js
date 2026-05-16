const express = require('express');

const {
  runProductionReadinessAudit
} = require('../../services/productionReadinessAuditService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await runProductionReadinessAudit(req);

    return res.status(200).json(payload);
  } catch (error) {
    console.error('[production readiness audit] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'PRODUCTION_READINESS_AUDIT_FAILED',
      message: error.message,
      phase: '23.1-production-readiness-dashboard'
    });
  }
});

module.exports = router;