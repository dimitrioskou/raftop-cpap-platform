const express = require('express');

const {
  runDatabaseBackupSafetyAudit
} = require('../../services/databaseBackupSafetyAuditService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await runDatabaseBackupSafetyAudit();

    return res.status(200).json(payload);
  } catch (error) {
    console.error('[database backup safety audit] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'DATABASE_BACKUP_SAFETY_AUDIT_FAILED',
      message: error.message,
      phase: '23.4-database-backup-restore-safety-check'
    });
  }
});

module.exports = router;