const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const patientIngestionService = require('../../services/patientIngestionService');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const items = await patientIngestionService.listTenantImportHistory(
      Number(req.query?.limit) || 100
    );

    return res.json({
      ok: true,
      data: {
        items
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load tenant import history'
    });
  }
});

module.exports = router;