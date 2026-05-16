const express = require('express');

const {
  getSuperAdminAuditLogsPayload,
  getSuperAdminAuditLogById
} = require('../../services/superAdminAuditLogService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await getSuperAdminAuditLogsPayload({
      tenantId: req.query.tenantId || null,
      action: req.query.action || null,
      outcome: req.query.outcome || null,
      actor: req.query.actor || null,
      limit: req.query.limit || 100
    });

    return res.json(payload);
  } catch (error) {
    console.error('[super-admin audit logs] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_AUDIT_LOGS_FAILED',
      message: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const payload = await getSuperAdminAuditLogById(req.params.id);

    if (!payload.ok) {
      return res.status(404).json(payload);
    }

    return res.json(payload);
  } catch (error) {
    console.error('[super-admin audit log detail] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_AUDIT_LOG_DETAIL_FAILED',
      message: error.message
    });
  }
});

module.exports = router;