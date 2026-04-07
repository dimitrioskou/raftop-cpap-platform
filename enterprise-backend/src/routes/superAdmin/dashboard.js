const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  return res.json({
    ok: true,
    summary: {
      organizations: 1,
      activeLicenses: 1,
      plans: 3,
      modules: 12,
      status: 'ready'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;