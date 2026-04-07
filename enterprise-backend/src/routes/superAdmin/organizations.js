const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  return res.json({
    ok: true,
    organizations: [
      {
        id: 'org-1',
        name: 'RAFTOP CPAP CARE',
        plan: 'premium',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ],
    total: 1,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;