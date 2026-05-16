const express = require('express');

const {
  runSecurityExposureAudit
} = require('../../services/securityExposureAuditService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await runSecurityExposureAudit(req);

    return res.status(200).json(payload);
  } catch (error) {
    console.error('[security exposure audit] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SECURITY_EXPOSURE_AUDIT_FAILED',
      message: error.message,
      phase: '23.5-security-exposure-audit'
    });
  }
});

module.exports = router;