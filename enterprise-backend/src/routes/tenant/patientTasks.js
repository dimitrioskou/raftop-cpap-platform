const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const tenantPatientTasksBoardService = require('../../services/tenantPatientTasksBoardService');

const router = express.Router();

router.use(requireAuth);

router.get('/:patientRef', async (req, res) => {
  try {
    const data = await tenantPatientTasksBoardService.getPatientTaskBoard(
      req.params.patientRef
    );

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load patient task board'
    });
  }
});

router.post('/task/:taskId/status', async (req, res) => {
  try {
    const updated = await tenantPatientTasksBoardService.updateTaskStatus(
      req.params.taskId,
      req.body?.status
    );

    return res.json({
      ok: true,
      message: 'Task status updated successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to update task status'
    });
  }
});

module.exports = router;