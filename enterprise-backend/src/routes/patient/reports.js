const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const patientReportService = require('../../services/patientReportService');

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

router.get('/', async (req, res) => {
  try {
    const data = await patientReportService.getPatientReportDashboard(req.user);

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load patient reports dashboard'
    });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const report = await patientReportService.generatePatientReport(req.user);

    return res.status(201).json({
      ok: true,
      message: 'Patient report generated successfully',
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to generate patient report'
    });
  }
});

module.exports = router;