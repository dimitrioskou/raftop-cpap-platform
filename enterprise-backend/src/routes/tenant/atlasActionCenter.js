const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const atlasActionCenterService = require('../../services/atlasActionCenterService');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  try {
    const data = await atlasActionCenterService.getActionCenterData();

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load ATLAS action center'
    });
  }
});

router.post('/:actionId/create-task', async (req, res) => {
  try {
    const result = await atlasActionCenterService.createTaskForAction(req.params.actionId);

    return res.status(201).json({
      ok: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to create ATLAS task'
    });
  }
});

module.exports = router;