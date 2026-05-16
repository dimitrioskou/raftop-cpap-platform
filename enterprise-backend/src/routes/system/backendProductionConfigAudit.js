const express = require('express');

const {
  runBackendProductionConfigAudit
} = require('../../services/backendProductionConfigAuditService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await runBackendProductionConfigAudit();

    return res.status(200).json(payload);
  } catch (error) {
    console.error('[backend production config audit] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'BACKEND_PRODUCTION_CONFIG_AUDIT_FAILED',
      message: error.message,
      phase: '23.2-backend-production-config-hardening'
    });
  }
});

module.exports = router;