const express = require('express');

const router = express.Router();

function getTenantId(req) {
  return (
    req.headers['x-tenant-id'] ||
    req.query.tenant_id ||
    req.query.tenantId ||
    req.user?.tenant_id ||
    req.user?.tenantId ||
    'raftopoulos-live'
  );
}

const tenantConfigs = {
  'raftopoulos-live': {
    tenantId: 'raftopoulos-live',

    platformName: 'Raftopoulos CPAP Care',
    shortName: 'RAFTOP',

    logoText: 'RAFTOP',
    logoIcon: 'RC',

    primaryColor: '#1d4ed8',
    secondaryColor: '#0f766e',
    accentColor: '#0f172a',

    supportEmail: 'support@raftop.local',
    supportPhone: '+30 210 0000000',

    landingTitle: 'Enterprise CPAP Care Intelligence',
    landingSubtitle:
      'Operational CPAP care platform for distributors, clinics, and sleep medicine teams.',

    executiveMode: true,
    whiteLabelReady: true,

    modules: {
      atlas: true,
      actionCenter: true,
      closedLoop: true,
      executiveMetrics: true,
      rolloutRoadmap: true
    }
  },

  'demo-clinic': {
    tenantId: 'demo-clinic',

    platformName: 'Sleep Clinic Pro',
    shortName: 'SCP',

    logoText: 'SCP',
    logoIcon: 'SC',

    primaryColor: '#7c3aed',
    secondaryColor: '#0891b2',
    accentColor: '#111827',

    supportEmail: 'clinic@example.com',
    supportPhone: '+30 210 1111111',

    landingTitle: 'Clinic Sleep Operations Platform',
    landingSubtitle:
      'Sleep clinic operational intelligence and patient follow-up orchestration.',

    executiveMode: true,
    whiteLabelReady: true,

    modules: {
      atlas: true,
      actionCenter: true,
      closedLoop: true,
      executiveMetrics: true,
      rolloutRoadmap: false
    }
  }
};

router.get('/', async (req, res) => {
  try {
    const tenantId = getTenantId(req);

    const config =
      tenantConfigs[tenantId] ||
      tenantConfigs['raftopoulos-live'];

    return res.json({
      ok: true,
      fallback: false,
      source: 'tenant-branding-config',

      tenantId,
      branding: config,

      generatedAt: new Date().toISOString()
    });
  }
  catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Tenant branding route failed.'
    });
  }
});

module.exports = router;