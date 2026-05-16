const express = require('express');

const {
  runSaasStabilityAudit
} = require('../../services/saasStabilityAuditService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await runSaasStabilityAudit(req);

    return res.status(payload.ok ? 200 : 200).json(payload);
  } catch (error) {
    console.error('[saas stability audit] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SAAS_STABILITY_AUDIT_FAILED',
      message: error.message,
      phase: '22.19-final-saas-stability-audit'
    });
  }
});

module.exports = router;