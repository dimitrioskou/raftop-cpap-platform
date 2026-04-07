const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const integrations = [
    {
      key: 'resmed_csv',
      name: 'ResMed CSV Import',
      status: 'ready',
      mode: 'manual',
      last_sync_at: null
    },
    {
      key: 'manual_import',
      name: 'Manual Upload Import',
      status: 'ready',
      mode: 'manual',
      last_sync_at: null
    },
    {
      key: 'tenant_reporting',
      name: 'Tenant Reporting Feed',
      status: 'ready',
      mode: 'internal',
      last_sync_at: null
    }
  ];

  return res.json({
    ok: true,
    integrations,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;