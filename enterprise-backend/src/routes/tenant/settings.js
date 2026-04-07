const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  return res.json({
    ok: true,
    settings: [
      { key: 'tenant_mode', label: 'Tenant Mode', value: 'premium' },
      { key: 'notifications_enabled', label: 'Notifications Enabled', value: true },
      { key: 'audit_mode', label: 'Audit Mode', value: true },
      { key: 'theme', label: 'Theme', value: 'dark-premium' }
    ],
    tenantMode: 'premium',
    notificationsEnabled: true,
    auditMode: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;