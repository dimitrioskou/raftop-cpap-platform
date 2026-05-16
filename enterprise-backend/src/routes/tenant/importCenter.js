const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const patientIngestionService = require('../../services/patientIngestionService');

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res) => {
  try {
    const patientRef = req.body?.patientRef || req.body?.patientEmail || 'patient@raftop.local';
    const job = await patientIngestionService.createTenantImportJob(patientRef, req.body || {});

    return res.status(201).json({
      ok: true,
      message: 'Tenant import job created successfully',
      data: job
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to create tenant import job'
    });
  }
});

module.exports = router;