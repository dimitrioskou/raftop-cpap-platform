const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const tenantLiveVerificationService = require('../../services/tenantLiveVerificationService');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  try {
    const data = await tenantLiveVerificationService.getLiveVerification();

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to run live verification'
    });
  }
});

module.exports = router;