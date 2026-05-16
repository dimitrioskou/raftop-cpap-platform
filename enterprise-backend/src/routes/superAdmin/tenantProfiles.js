const express = require('express');

const {
  listTenantProfiles,
  getTenantProfileByTenantId,
  upsertTenantProfile
} = require('../../services/tenantProfileService');

const {
  safeRecordSuperAdminAuditLog
} = require('../../services/superAdminAuditLogService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await listTenantProfiles();
    return res.json(payload);
  } catch (error) {
    console.error('[super-admin tenant profiles list] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_TENANT_PROFILES_LIST_FAILED',
      message: error.message
    });
  }
});

router.post('/', async (req, res) => {
  const tenantId = req.body?.tenantId || req.body?.tenant_id || null;

  try {
    const before = tenantId ? await getTenantProfileByTenantId(tenantId) : null;
    const payload = await upsertTenantProfile(tenantId, req.body || {});

    if (!payload.ok) {
      await safeRecordSuperAdminAuditLog({
        req,
        action: 'UPSERT_TENANT_PROFILE',
        outcome: 'FAILED',
        tenantId,
        statusCode: 400,
        message: payload.message || payload.error || 'Tenant profile upsert failed.',
        before,
        after: null,
        metadata: {
          error: payload.error || null
        }
      });

      return res.status(400).json(payload);
    }

    await safeRecordSuperAdminAuditLog({
      req,
      action: before ? 'UPDATE_TENANT_PROFILE' : 'CREATE_TENANT_PROFILE',
      outcome: 'SUCCESS',
      tenantId: payload.tenantId,
      entityId: payload.profile?.id || null,
      statusCode: before ? 200 : 201,
      message: before
        ? `Updated tenant profile ${payload.tenantId}.`
        : `Created tenant profile ${payload.tenantId}.`,
      before,
      after: payload.profile
    });

    return res.status(before ? 200 : 201).json(payload);
  } catch (error) {
    console.error('[super-admin tenant profile create/upsert] failed:', error);

    await safeRecordSuperAdminAuditLog({
      req,
      action: 'UPSERT_TENANT_PROFILE',
      outcome: 'FAILED',
      tenantId,
      statusCode: 500,
      message: error.message,
      before: null,
      after: null
    });

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_TENANT_PROFILE_UPSERT_FAILED',
      message: error.message
    });
  }
});

router.get('/:tenantId', async (req, res) => {
  try {
    const profile = await getTenantProfileByTenantId(req.params.tenantId);

    if (!profile) {
      return res.status(404).json({
        ok: false,
        fallback: false,
        error: 'TENANT_PROFILE_NOT_FOUND',
        message: 'Tenant profile was not found.',
        tenantId: req.params.tenantId
      });
    }

    return res.json({
      ok: true,
      fallback: false,
      source: 'database',
      phase: '22.17-tenant-profile-organization-metadata',
      tenantId: req.params.tenantId,
      profile
    });
  } catch (error) {
    console.error('[super-admin tenant profile detail] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_TENANT_PROFILE_DETAIL_FAILED',
      message: error.message
    });
  }
});

router.patch('/:tenantId', async (req, res) => {
  const tenantId = req.params.tenantId;

  try {
    const before = await getTenantProfileByTenantId(tenantId);
    const payload = await upsertTenantProfile(tenantId, req.body || {});

    if (!payload.ok) {
      await safeRecordSuperAdminAuditLog({
        req,
        action: 'UPDATE_TENANT_PROFILE',
        outcome: 'FAILED',
        tenantId,
        statusCode: 400,
        message: payload.message || payload.error || 'Tenant profile update failed.',
        before,
        after: null,
        metadata: {
          error: payload.error || null
        }
      });

      return res.status(400).json(payload);
    }

    await safeRecordSuperAdminAuditLog({
      req,
      action: before ? 'UPDATE_TENANT_PROFILE' : 'CREATE_TENANT_PROFILE',
      outcome: 'SUCCESS',
      tenantId: payload.tenantId,
      entityId: payload.profile?.id || null,
      statusCode: 200,
      message: before
        ? `Updated tenant profile ${payload.tenantId}.`
        : `Created tenant profile ${payload.tenantId}.`,
      before,
      after: payload.profile
    });

    return res.json(payload);
  } catch (error) {
    console.error('[super-admin tenant profile update] failed:', error);

    await safeRecordSuperAdminAuditLog({
      req,
      action: 'UPDATE_TENANT_PROFILE',
      outcome: 'FAILED',
      tenantId,
      statusCode: 500,
      message: error.message,
      before: null,
      after: null
    });

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_TENANT_PROFILE_UPDATE_FAILED',
      message: error.message
    });
  }
});

module.exports = router;