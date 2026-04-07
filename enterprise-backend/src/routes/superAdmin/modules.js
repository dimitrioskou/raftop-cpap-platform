const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  return res.json({
    ok: true,
    modules: [
      { key: 'dashboard', label: 'Dashboard', enabled: true },
      { key: 'patients', label: 'Patients', enabled: true },
      { key: 'devices', label: 'Devices', enabled: true },
      { key: 'compliance', label: 'Compliance', enabled: true },
      { key: 'followup', label: 'Follow-up', enabled: true },
      { key: 'tasks', label: 'Tasks', enabled: true },
      { key: 'notes', label: 'Notes', enabled: true },
      { key: 'referrals', label: 'Referrals', enabled: true },
      { key: 'notifications', label: 'Notifications', enabled: true },
      { key: 'atlas', label: 'ATLAS', enabled: true },
      { key: 'billing', label: 'Billing', enabled: true },
      { key: 'payments', label: 'Payments', enabled: true }
    ],
    total: 12,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;