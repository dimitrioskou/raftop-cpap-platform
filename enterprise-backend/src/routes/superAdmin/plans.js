const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  return res.json({
    ok: true,
    plans: [
      { id: 'starter', name: 'Starter', status: 'active' },
      { id: 'premium', name: 'Premium', status: 'active' },
      { id: 'enterprise', name: 'Enterprise', status: 'active' }
    ],
    total: 3,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;