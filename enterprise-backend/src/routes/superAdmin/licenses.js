const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  return res.json({
    ok: true,
    licenses: [
      {
        id: 'lic-1',
        organization_id: 'org-1',
        key: 'RAFTOP-PREMIUM-001',
        plan: 'premium',
        seats: 10,
        status: 'active'
      }
    ],
    total: 1,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;