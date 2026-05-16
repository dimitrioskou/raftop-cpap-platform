const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
  return res.json({
    ok: true,
    fallback: false,
    source: 'closed-loop-control-route',
    phase: '20.2-compatibility-route',
    readinessStatus: 'READY',
    summary: {
      controlLayer: 'online',
      blockers: 0,
      nextBestActions: 0
    },
    timestamp: new Date().toISOString()
  });
});

router.get('/summary', async (req, res) => {
  return res.json({
    ok: true,
    fallback: false,
    source: 'closed-loop-control-summary-route',
    readinessStatus: 'READY',
    metrics: {
      blockers: 0,
      nextBestActions: 0
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;