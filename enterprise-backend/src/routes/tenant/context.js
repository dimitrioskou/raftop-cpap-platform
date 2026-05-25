const express = require('express');
const db = require('../../services/db');

const router = express.Router();

function readTenantId(req) {
  return (
    req.headers['x-tenant-id'] ||
    req.query.tenant_id ||
    req.query.tenantId ||
    req.user?.tenant_id ||
    req.user?.tenantId ||
    'raftopoulos-live'
  );
}

function boolValue(value, fallback = true) {
  if (value === null || value === undefined) return fallback;
  return value === true || value === 'true';
}

function buildFallbackContext(tenantId) {
  return {
    tenantId,
    tenant_id: tenantId,
    source: 'fallback-context',

    identity: {
      tenantId,
      companyName: tenantId === 'raftopoulos-live' ? 'Raftopoulos' : tenantId,
      platformName:
        tenantId === 'raftopoulos-live'
          ? 'Raftopoulos CPAP Care'
          : 'CPAP Care Platform'
    },

    plan: {
      code: 'professional',
      status: 'active',
      accessState: 'active'
    },

    branding: {
      tenantId,
      platformName:
        tenantId === 'raftopoulos-live'
          ? 'Raftopoulos CPAP Care'
          : 'CPAP Care Platform',
      shortName: tenantId === 'raftopoulos-live' ? 'RAFTOP' : 'CPAP',
      logoText: tenantId === 'raftopoulos-live' ? 'RAFTOP' : 'CPAP',
      logoIcon: tenantId === 'raftopoulos-live' ? 'RC' : 'CP',
      primaryColor: '#1d4ed8',
      secondaryColor: '#0f766e',
      accentColor: '#0f172a',
      supportEmail: 'support@raftop.local',
      supportPhone: '+30 210 0000000',
      landingTitle: 'Enterprise CPAP Care Intelligence',
      landingSubtitle:
        'Operational CPAP care platform for distributors, clinics, and sleep medicine teams.',
      whiteLabelReady: true,
      executiveMode: true
    },

    modules: {
      atlas: true,
      actionCenter: true,
      closedLoop: true,
      executiveMetrics: true,
      rolloutRoadmap: true
    },

    limits: {
      patients: 500,
      users: 15,
      devices: 1000
    },

    entitlements: {
      canUseAtlas: true,
      canUseActionCenter: true,
      canUseClosedLoop: true,
      canUseExecutiveMetrics: true,
      canUseRolloutRoadmap: true,
      canProvisionPatients: true,
      canInviteUsers: true
    },

    access: {
      allowed: true,
      state: 'active',
      reason: null
    }
  };
}

function mapContextRow(row, tenantId) {
  if (!row) return buildFallbackContext(tenantId);

  const status = row.status || 'active';

  const modules = {
    atlas: boolValue(row.atlas, true),
    actionCenter: boolValue(row.action_center, true),
    closedLoop: boolValue(row.closed_loop, true),
    executiveMetrics: boolValue(row.executive_metrics, true),
    rolloutRoadmap: boolValue(row.rollout_roadmap, true)
  };

  const limits = {
    patients: Number(row.patient_limit || 500),
    users: Number(row.user_limit || 15),
    devices: Number(row.device_limit || 1000)
  };

  const accessAllowed = status === 'active';

  return {
    tenantId: row.tenant_id,
    tenant_id: row.tenant_id,
    source: 'tenant-context-postgres',

    identity: {
      tenantId: row.tenant_id,
      companyName: row.company_name,
      company_name: row.company_name,
      platformName: row.platform_name,
      platform_name: row.platform_name,
      adminEmail: row.admin_email,
      admin_email: row.admin_email
    },

    plan: {
      code: row.plan || 'professional',
      status,
      accessState: accessAllowed ? 'active' : 'blocked'
    },

    branding: {
      tenantId: row.tenant_id,
      platformName: row.platform_name || 'CPAP Care Platform',
      shortName: row.logo_text || 'CPAP',
      logoText: row.logo_text || row.platform_name || 'CPAP',
      logoIcon: row.logo_icon || String(row.logo_text || 'CP').slice(0, 2),
      primaryColor: row.primary_color || '#1d4ed8',
      secondaryColor: row.secondary_color || '#0f766e',
      accentColor: row.accent_color || '#0f172a',
      supportEmail: row.support_email || row.admin_email || '',
      supportPhone: row.support_phone || '',
      landingTitle: row.landing_title || `${row.platform_name || 'CPAP Care'} Intelligence`,
      landingSubtitle:
        row.landing_subtitle ||
        'Operational CPAP care platform for clinics, distributors and sleep medicine teams.',
      whiteLabelReady: boolValue(row.white_label_ready, true),
      executiveMode: boolValue(row.executive_mode, true)
    },

    modules,

    limits,

    entitlements: {
      canUseAtlas: accessAllowed && modules.atlas,
      canUseActionCenter: accessAllowed && modules.actionCenter,
      canUseClosedLoop: accessAllowed && modules.closedLoop,
      canUseExecutiveMetrics: accessAllowed && modules.executiveMetrics,
      canUseRolloutRoadmap: accessAllowed && modules.rolloutRoadmap,
      canProvisionPatients: accessAllowed && limits.patients > 0,
      canInviteUsers: accessAllowed && limits.users > 0
    },

    access: {
      allowed: accessAllowed,
      state: accessAllowed ? 'active' : 'blocked',
      reason: accessAllowed ? null : `Tenant status is ${status}`
    },

    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
}

async function resolveTenantContext(tenantId) {
  const result = await db.query(
    `
    SELECT
      r.tenant_id,
      r.company_name,
      r.platform_name,
      r.admin_email,
      r.plan,
      r.status,
      r.created_at,
      r.updated_at,

      b.logo_text,
      b.logo_icon,
      b.primary_color,
      b.secondary_color,
      b.accent_color,
      b.support_email,
      b.support_phone,
      b.landing_title,
      b.landing_subtitle,
      b.white_label_ready,
      b.executive_mode,

      m.atlas,
      m.action_center,
      m.closed_loop,
      m.executive_metrics,
      m.rollout_roadmap,

      l.patient_limit,
      l.user_limit,
      l.device_limit
    FROM tenant_registry r
    LEFT JOIN tenant_branding b ON b.tenant_id = r.tenant_id
    LEFT JOIN tenant_modules m ON m.tenant_id = r.tenant_id
    LEFT JOIN tenant_limits l ON l.tenant_id = r.tenant_id
    WHERE r.tenant_id = $1
    LIMIT 1
    `,
    [tenantId]
  );

  return mapContextRow(result.rows[0], tenantId);
}

router.get('/', async (req, res) => {
  try {
    const tenantId = readTenantId(req);
    const context = await resolveTenantContext(tenantId);

    return res.json({
      ok: true,
      fallback: context.source === 'fallback-context',
      source: context.source,
      tenantId,
      tenant_id: tenantId,
      context,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    const tenantId = readTenantId(req);
    const context = buildFallbackContext(tenantId);

    return res.json({
      ok: true,
      fallback: true,
      source: 'tenant-context-fallback-after-error',
      tenantId,
      tenant_id: tenantId,
      context,
      warning: error.message,
      generatedAt: new Date().toISOString()
    });
  }
});

module.exports = router;