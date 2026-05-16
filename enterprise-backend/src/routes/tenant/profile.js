const express = require('express');

const {
  getTenantProfilePayload
} = require('../../services/tenantProfileService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await getTenantProfilePayload(req);
    return res.json(payload);
  } catch (error) {
    console.error('[tenant profile] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'TENANT_PROFILE_FAILED',
      message: error.message
    });
  }
});

module.exports = router;