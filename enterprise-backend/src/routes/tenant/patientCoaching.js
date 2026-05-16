const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const patientCoachingEngineService = require('../../services/patientCoachingEngineService');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  try {
    const data = await patientCoachingEngineService.listTenantPatientCoachingOverview();

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load tenant patient coaching overview'
    });
  }
});

module.exports = router;