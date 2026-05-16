const express = require('express');

const {
  getRecentAlerts,
  getAlertStats,
  acknowledgeAlert,
  acknowledgeAllOpenAlerts
} = require('../../services/systemAlertService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const alerts = await getRecentAlerts(req.query.limit || 50);
    const stats = await getAlertStats();

    return res.json({
      ok: true,
      fallback: false,
      source: 'database',
      phase: '21.7-alert-deduplication',
      stats,
      alerts
    });
  } catch (error) {
    console.error('[system-alerts] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'ALERT_FETCH_FAILED',
      message: error.message
    });
  }
});

router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const payload = await acknowledgeAlert(req.params.id);

    if (!payload.ok) {
      return res.status(404).json(payload);
    }

    return res.json(payload);
  } catch (error) {
    console.error('[system-alerts acknowledge] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'ALERT_ACKNOWLEDGE_FAILED',
      message: error.message
    });
  }
});

router.post('/acknowledge-all', async (req, res) => {
  try {
    const payload = await acknowledgeAllOpenAlerts();
    return res.json(payload);
  } catch (error) {
    console.error('[system-alerts acknowledge-all] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'ALERT_ACKNOWLEDGE_ALL_FAILED',
      message: error.message
    });
  }
});

module.exports = router;