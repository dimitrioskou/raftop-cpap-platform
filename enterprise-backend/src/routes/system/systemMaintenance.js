const express = require('express');

const {
  getMaintenanceStatus,
  runSystemMaintenanceCleanup
} = require('../../services/systemMaintenanceService');

const {
  runMaintenanceOnce,
  getMaintenanceRunnerStatus
} = require('../../services/systemMaintenanceRunner');

const router = express.Router();

function readOptions(req) {
  return {
    snapshotKeepLatest:
      req.body?.snapshotKeepLatest ||
      req.query.snapshotKeepLatest ||
      process.env.MONITORING_SNAPSHOT_KEEP_LATEST ||
      500,

    snapshotRetentionDays:
      req.body?.snapshotRetentionDays ||
      req.query.snapshotRetentionDays ||
      process.env.MONITORING_SNAPSHOT_RETENTION_DAYS ||
      30,

    acknowledgedAlertRetentionDays:
      req.body?.acknowledgedAlertRetentionDays ||
      req.query.acknowledgedAlertRetentionDays ||
      process.env.ACKNOWLEDGED_ALERT_RETENTION_DAYS ||
      30
  };
}

router.get('/status', async (req, res) => {
  try {
    const payload = await getMaintenanceStatus(readOptions(req));

    return res.json(payload);
  } catch (error) {
    console.error('[system-maintenance status] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SYSTEM_MAINTENANCE_STATUS_FAILED',
      message: error.message
    });
  }
});

router.get('/runner-status', async (req, res) => {
  try {
    const payload = await getMaintenanceRunnerStatus();

    return res.json(payload);
  } catch (error) {
    console.error('[system-maintenance runner-status] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SYSTEM_MAINTENANCE_RUNNER_STATUS_FAILED',
      message: error.message
    });
  }
});

router.get('/cleanup', async (req, res) => {
  try {
    const payload = await runSystemMaintenanceCleanup(readOptions(req));

    return res.json(payload);
  } catch (error) {
    console.error('[system-maintenance cleanup] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SYSTEM_MAINTENANCE_CLEANUP_FAILED',
      message: error.message
    });
  }
});

router.post('/cleanup', async (req, res) => {
  try {
    const payload = await runSystemMaintenanceCleanup(readOptions(req));

    return res.json(payload);
  } catch (error) {
    console.error('[system-maintenance cleanup] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SYSTEM_MAINTENANCE_CLEANUP_FAILED',
      message: error.message
    });
  }
});

router.get('/run-scheduled-now', async (req, res) => {
  try {
    const payload = await runMaintenanceOnce('manual-scheduled-endpoint');

    return res.json(payload);
  } catch (error) {
    console.error('[system-maintenance run-scheduled-now] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SYSTEM_MAINTENANCE_RUN_NOW_FAILED',
      message: error.message
    });
  }
});

router.post('/run-scheduled-now', async (req, res) => {
  try {
    const payload = await runMaintenanceOnce('manual-scheduled-endpoint');

    return res.json(payload);
  } catch (error) {
    console.error('[system-maintenance run-scheduled-now] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SYSTEM_MAINTENANCE_RUN_NOW_FAILED',
      message: error.message
    });
  }
});

module.exports = router;