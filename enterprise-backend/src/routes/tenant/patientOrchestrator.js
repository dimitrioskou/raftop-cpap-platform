const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const tenantPatientOrchestratorService = require('../../services/tenantPatientOrchestratorService');

const router = express.Router();

router.use(requireAuth);

router.get('/:patientRef', async (req, res) => {
  try {
    const data = await tenantPatientOrchestratorService.getTenantPatientOrchestrator(
      req.params.patientRef
    );

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load tenant patient orchestrator'
    });
  }
});

router.post('/:patientRef/create-task', async (req, res) => {
  try {
    const task = await tenantPatientOrchestratorService.createManualTaskForPatient(
      req.params.patientRef,
      req.body || {}
    );

    return res.status(201).json({
      ok: true,
      message: 'Manual patient task created successfully.',
      data: task
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to create manual patient task'
    });
  }
});

module.exports = router;