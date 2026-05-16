const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const patientIngestionService = require('../../services/patientIngestionService');

const router = express.Router();

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

function requirePatient(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: 'Unauthorized'
    });
  }

  if (normalizeRole(req.user.role) !== 'patient') {
    return res.status(403).json({
      ok: false,
      message: 'Patient access only'
    });
  }

  return next();
}

router.use(requireAuth);
router.use(requirePatient);

router.get('/status', async (req, res) => {
  try {
    const data = await patientIngestionService.getPatientSyncStatus(req.user);

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load sync status'
    });
  }
});

router.post('/upload', async (req, res) => {
  try {
    const job = await patientIngestionService.createPatientImportJob(req.user, req.body || {});

    return res.status(201).json({
      ok: true,
      message: 'Import job created successfully',
      data: job
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to create import job'
    });
  }
});

module.exports = router;