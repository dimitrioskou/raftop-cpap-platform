const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const patientReportService = require('../../services/patientReportService');

const router = express.Router();

router.use(requireAuth);

router.get('/patient/:patientRef', async (req, res) => {
  try {
    const data = await patientReportService.getTenantPatientReport(req.params.patientRef);

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load tenant patient report'
    });
  }
});

router.post('/patient/:patientRef/generate', async (req, res) => {
  try {
    const report = await patientReportService.generateTenantPatientReport(req.params.patientRef);

    return res.status(201).json({
      ok: true,
      message: 'Clinician report generated successfully',
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to generate clinician report'
    });
  }
});

module.exports = router;