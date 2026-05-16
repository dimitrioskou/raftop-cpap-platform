const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const tenantFailDrilldownService = require('../../services/tenantFailDrilldownService');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  try {
    const data = await tenantFailDrilldownService.getFailDrilldown();

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load fail drilldown'
    });
  }
});

module.exports = router;