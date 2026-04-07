const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const modules = [
    { key: 'dashboard', label: 'Dashboard', category: 'core', enabled: true },
    { key: 'patients', label: 'Patients', category: 'core', enabled: true },
    { key: 'devices', label: 'Devices', category: 'core', enabled: true },
    { key: 'compliance', label: 'Compliance', category: 'core', enabled: true },
    { key: 'followup', label: 'Follow-up', category: 'core', enabled: true },
    { key: 'tasks', label: 'Tasks', category: 'core', enabled: true },
    { key: 'notes', label: 'Notes', category: 'operations', enabled: true },
    { key: 'referrals', label: 'Referrals', category: 'operations', enabled: true },
    { key: 'notifications', label: 'Notifications', category: 'operations', enabled: true },
    { key: 'atlas', label: 'ATLAS', category: 'analytics', enabled: true },
    { key: 'billing', label: 'Billing', category: 'business', enabled: true },
    { key: 'payments', label: 'Payments', category: 'business', enabled: true }
  ];

  return res.json({
    ok: true,
    modules,
    totalModules: modules.length,
    enabledModules: modules.filter((module) => module.enabled).map((module) => module.label),
    plan: 'premium',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;