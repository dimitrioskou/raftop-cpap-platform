const express = require('express');

const {
  runTenantCleanupAudit
} = require('../../services/tenantCleanupAuditService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await runTenantCleanupAudit();

    return res.status(200).json(payload);
  } catch (error) {
    console.error('[tenant cleanup audit] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'TENANT_CLEANUP_AUDIT_FAILED',
      message: error.message,
      phase: '23.6-demo-tenant-raftopoulos-cleanup-audit'
    });
  }
});

module.exports = router;