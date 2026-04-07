const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  return res.json({
    ok: true,
    brandName: 'RAFTOP CPAP CARE',
    theme: 'dark-premium',
    whiteLabelReady: true,
    branding: {
      primaryColor: '#1d4ed8',
      secondaryColor: '#7c3aed',
      accentColor: '#22c55e',
      mode: 'premium-enterprise'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;