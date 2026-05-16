const express = require('express');

const {
  getAllTenantSubscriptions,
  getTenantSubscriptionByTenantId,
  createTenantSubscription,
  updateTenantSubscriptionByTenantId,
  forceTenantSubscriptionStatus
} = require('../../services/superAdminTenantSubscriptionsService');

const {
  safeRecordSuperAdminAuditLog
} = require('../../services/superAdminAuditLogService');

const router = express.Router();

function getSubscriptionSnapshot(payload) {
  return payload?.subscription || null;
}

async function getBeforeSnapshot(tenantId) {
  if (!tenantId) return null;

  try {
    const payload = await getTenantSubscriptionByTenantId(tenantId);

    if (!payload.ok) {
      return null;
    }

    return getSubscriptionSnapshot(payload);
  } catch (error) {
    return null;
  }
}

router.get('/', async (req, res) => {
  try {
    const payload = await getAllTenantSubscriptions();
    return res.json(payload);
  } catch (error) {
    console.error('[super-admin subscriptions list] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_SUBSCRIPTIONS_LIST_FAILED',
      message: error.message
    });
  }
});

router.post('/', async (req, res) => {
  const requestedTenantId = req.body?.tenantId || req.body?.tenant_id || null;

  try {
    const payload = await createTenantSubscription(req.body || {});

    if (!payload.ok) {
      const statusCode = payload.error === 'TENANT_ALREADY_EXISTS' ? 409 : 400;

      await safeRecordSuperAdminAuditLog({
        req,
        action: 'CREATE_TENANT_SUBSCRIPTION',
        outcome: 'FAILED',
        tenantId: requestedTenantId,
        statusCode,
        message: payload.message || payload.error || 'Tenant creation failed.',
        before: null,
        after: null,
        metadata: {
          error: payload.error || null
        }
      });

      return res.status(statusCode).json(payload);
    }

    await safeRecordSuperAdminAuditLog({
      req,
      action: 'CREATE_TENANT_SUBSCRIPTION',
      outcome: 'SUCCESS',
      tenantId: payload.tenantId,
      entityId: payload.subscription?.id || null,
      statusCode: 201,
      message: `Created tenant subscription ${payload.tenantId}.`,
      before: null,
      after: payload.subscription
    });

    return res.status(201).json(payload);
  } catch (error) {
    console.error('[super-admin subscription create] failed:', error);

    await safeRecordSuperAdminAuditLog({
      req,
      action: 'CREATE_TENANT_SUBSCRIPTION',
      outcome: 'FAILED',
      tenantId: requestedTenantId,
      statusCode: 500,
      message: error.message,
      before: null,
      after: null
    });

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_SUBSCRIPTION_CREATE_FAILED',
      message: error.message
    });
  }
});

router.get('/:tenantId', async (req, res) => {
  try {
    const payload = await getTenantSubscriptionByTenantId(req.params.tenantId);

    if (!payload.ok) {
      return res.status(404).json(payload);
    }

    return res.json(payload);
  } catch (error) {
    console.error('[super-admin subscription detail] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_SUBSCRIPTION_DETAIL_FAILED',
      message: error.message
    });
  }
});

router.patch('/:tenantId', async (req, res) => {
  const tenantId = req.params.tenantId;
  const before = await getBeforeSnapshot(tenantId);

  try {
    const payload = await updateTenantSubscriptionByTenantId(
      tenantId,
      req.body || {}
    );

    if (!payload.ok) {
      await safeRecordSuperAdminAuditLog({
        req,
        action: 'UPDATE_TENANT_SUBSCRIPTION',
        outcome: 'FAILED',
        tenantId,
        statusCode: 404,
        message: payload.message || payload.error || 'Tenant update failed.',
        before,
        after: null,
        metadata: {
          error: payload.error || null
        }
      });

      return res.status(404).json(payload);
    }

    await safeRecordSuperAdminAuditLog({
      req,
      action: 'UPDATE_TENANT_SUBSCRIPTION',
      outcome: 'SUCCESS',
      tenantId,
      entityId: payload.subscription?.id || null,
      statusCode: 200,
      message: `Updated tenant subscription ${tenantId}.`,
      before,
      after: payload.subscription
    });

    return res.json(payload);
  } catch (error) {
    console.error('[super-admin subscription update] failed:', error);

    await safeRecordSuperAdminAuditLog({
      req,
      action: 'UPDATE_TENANT_SUBSCRIPTION',
      outcome: 'FAILED',
      tenantId,
      statusCode: 500,
      message: error.message,
      before,
      after: null
    });

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_SUBSCRIPTION_UPDATE_FAILED',
      message: error.message
    });
  }
});

router.post('/:tenantId/force-active', async (req, res) => {
  const tenantId = req.params.tenantId;
  const before = await getBeforeSnapshot(tenantId);

  try {
    const payload = await forceTenantSubscriptionStatus(tenantId, 'ACTIVE');

    if (!payload.ok) {
      await safeRecordSuperAdminAuditLog({
        req,
        action: 'FORCE_TENANT_ACTIVE',
        outcome: 'FAILED',
        tenantId,
        statusCode: 404,
        message: payload.message || payload.error || 'Force active failed.',
        before,
        after: null,
        metadata: {
          error: payload.error || null
        }
      });

      return res.status(404).json(payload);
    }

    await safeRecordSuperAdminAuditLog({
      req,
      action: 'FORCE_TENANT_ACTIVE',
      outcome: 'SUCCESS',
      tenantId,
      entityId: payload.subscription?.id || null,
      statusCode: 200,
      message: `Forced tenant ${tenantId} to ACTIVE.`,
      before,
      after: payload.subscription
    });

    return res.json(payload);
  } catch (error) {
    await safeRecordSuperAdminAuditLog({
      req,
      action: 'FORCE_TENANT_ACTIVE',
      outcome: 'FAILED',
      tenantId,
      statusCode: 500,
      message: error.message,
      before,
      after: null
    });

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_FORCE_ACTIVE_FAILED',
      message: error.message
    });
  }
});

router.post('/:tenantId/force-expired', async (req, res) => {
  const tenantId = req.params.tenantId;
  const before = await getBeforeSnapshot(tenantId);

  try {
    const payload = await forceTenantSubscriptionStatus(tenantId, 'EXPIRED');

    if (!payload.ok) {
      await safeRecordSuperAdminAuditLog({
        req,
        action: 'FORCE_TENANT_EXPIRED',
        outcome: 'FAILED',
        tenantId,
        statusCode: 404,
        message: payload.message || payload.error || 'Force expired failed.',
        before,
        after: null,
        metadata: {
          error: payload.error || null
        }
      });

      return res.status(404).json(payload);
    }

    await safeRecordSuperAdminAuditLog({
      req,
      action: 'FORCE_TENANT_EXPIRED',
      outcome: 'SUCCESS',
      tenantId,
      entityId: payload.subscription?.id || null,
      statusCode: 200,
      message: `Forced tenant ${tenantId} to EXPIRED.`,
      before,
      after: payload.subscription
    });

    return res.json(payload);
  } catch (error) {
    await safeRecordSuperAdminAuditLog({
      req,
      action: 'FORCE_TENANT_EXPIRED',
      outcome: 'FAILED',
      tenantId,
      statusCode: 500,
      message: error.message,
      before,
      after: null
    });

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_FORCE_EXPIRED_FAILED',
      message: error.message
    });
  }
});

router.post('/:tenantId/force-suspended', async (req, res) => {
  const tenantId = req.params.tenantId;
  const before = await getBeforeSnapshot(tenantId);

  try {
    const payload = await forceTenantSubscriptionStatus(tenantId, 'SUSPENDED');

    if (!payload.ok) {
      await safeRecordSuperAdminAuditLog({
        req,
        action: 'FORCE_TENANT_SUSPENDED',
        outcome: 'FAILED',
        tenantId,
        statusCode: 404,
        message: payload.message || payload.error || 'Force suspended failed.',
        before,
        after: null,
        metadata: {
          error: payload.error || null
        }
      });

      return res.status(404).json(payload);
    }

    await safeRecordSuperAdminAuditLog({
      req,
      action: 'FORCE_TENANT_SUSPENDED',
      outcome: 'SUCCESS',
      tenantId,
      entityId: payload.subscription?.id || null,
      statusCode: 200,
      message: `Forced tenant ${tenantId} to SUSPENDED.`,
      before,
      after: payload.subscription
    });

    return res.json(payload);
  } catch (error) {
    await safeRecordSuperAdminAuditLog({
      req,
      action: 'FORCE_TENANT_SUSPENDED',
      outcome: 'FAILED',
      tenantId,
      statusCode: 500,
      message: error.message,
      before,
      after: null
    });

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_FORCE_SUSPENDED_FAILED',
      message: error.message
    });
  }
});

module.exports = router;