const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const tenantProductionAuditService = require('../../services/tenantProductionAuditService');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  try {
    const data = await tenantProductionAuditService.getProductionAudit();

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load production audit'
    });
  }
});

module.exports = router;