const express = require('express');

const {
  getLatestSnapshot,
  setLatestSnapshot,
  loadLatestSnapshotFromDb,
  getMonitoringHistory,
  getMonitoringStats
} = require('../../services/systemMonitoringStore');

const {
  runMonitoringOnce
} = require('../../services/systemMonitoringRunner');

const router = express.Router();

function buildAlertsFromAudit(auditPayload) {
  const summary = auditPayload?.summary || {};
  const results = Array.isArray(auditPayload?.results) ? auditPayload.results : [];
  const alerts = [];

  if (summary.readinessStatus === 'BLOCKED') {
    alerts.push({
      id: `alert-blocked-${Date.now()}`,
      severity: 'CRITICAL',
      title: 'System is BLOCKED',
      message: 'Route stability audit reports blocking backend issues.',
      source: 'manual-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  if (Number(summary.failed || 0) > 0) {
    alerts.push({
      id: `alert-failed-routes-${Date.now()}`,
      severity: 'HIGH',
      title: 'Failed routes detected',
      message: `${summary.failed} route(s) failed in the latest audit.`,
      source: 'manual-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  if (Number(summary.serverErrors || 0) > 0) {
    alerts.push({
      id: `alert-server-errors-${Date.now()}`,
      severity: 'HIGH',
      title: 'Backend 500 errors detected',
      message: `${summary.serverErrors} route(s) returned server errors.`,
      source: 'manual-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  if (Number(summary.routeNotFound || 0) > 0) {
    alerts.push({
      id: `alert-route-not-found-${Date.now()}`,
      severity: 'HIGH',
      title: 'Missing route registrations detected',
      message: `${summary.routeNotFound} route(s) returned 404.`,
      source: 'manual-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  if (Number(summary.fallbackDetected || 0) > 0) {
    alerts.push({
      id: `alert-fallback-${Date.now()}`,
      severity: 'MEDIUM',
      title: 'Fallback responses detected',
      message: `${summary.fallbackDetected} route(s) returned fallback/mock content.`,
      source: 'manual-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  const slowRoutes = results.filter((item) => Number(item.durationMs || 0) > 2500);

  if (slowRoutes.length > 0) {
    alerts.push({
      id: `alert-slow-routes-${Date.now()}`,
      severity: 'MEDIUM',
      title: 'Slow routes detected',
      message: `${slowRoutes.length} route(s) took more than 2500ms.`,
      source: 'manual-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  return alerts;
}

function buildMonitoringSnapshot(auditPayload) {
  const summary = auditPayload?.summary || {};
  const readinessStatus = summary.readinessStatus || 'UNKNOWN';
  const alerts = buildAlertsFromAudit(auditPayload);

  let status = 'UNKNOWN';
  let message = 'System status could not be determined.';

  if (readinessStatus === 'READY') {
    status = 'HEALTHY';
    message = 'System is healthy. No blocking route issue detected.';
  } else if (readinessStatus === 'NEEDS_ATTENTION') {
    status = 'DEGRADED';
    message = 'System is degraded. Warnings exist and should be reviewed.';
  } else if (readinessStatus === 'BLOCKED') {
    status = 'BLOCKED';
    message = 'System is blocked. Critical backend issues must be fixed.';
  }

  return {
    ok: status === 'HEALTHY',
    phase: '21.4-persistent-monitoring-history',
    status,
    message,
    generatedAt: new Date().toISOString(),
    summary,
    alerts,
    audit: auditPayload,
    mode: 'manual'
  };
}

async function runInternalAudit(req) {
  const baseUrl = `${req.protocol || 'http'}://${req.get('host')}`;

  const response = await fetch(`${baseUrl}/api/system/route-stability-audit`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': req.headers['x-tenant-id'] || 'demo-tenant',
      ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
    }
  });

  const text = await response.text();

  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Route audit returned non-JSON response. HTTP ${response.status}`);
  }

  if (!json || !json.summary) {
    throw new Error(json?.message || json?.error || `Route audit failed with HTTP ${response.status}`);
  }

  return json;
}

router.get('/status', async (req, res) => {
  try {
    const latest = await loadLatestSnapshotFromDb();
    return res.json(latest);
  } catch (error) {
    return res.json(getLatestSnapshot());
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = req.query.limit || 25;
    const history = await getMonitoringHistory(limit);
    const stats = await getMonitoringStats();

    return res.json({
      ok: true,
      fallback: false,
      phase: '21.4-persistent-monitoring-history',
      source: 'database',
      stats,
      history
    });
  } catch (error) {
    console.error('[system-monitoring history] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'MONITORING_HISTORY_FAILED',
      message: error.message
    });
  }
});

router.get('/run-now', async (req, res) => {
  try {
    const auditPayload = await runInternalAudit(req);
    const snapshot = buildMonitoringSnapshot(auditPayload);
    const stored = await setLatestSnapshot(snapshot);

    return res.json(stored);
  } catch (error) {
    const failedSnapshot = await setLatestSnapshot({
      ok: false,
      phase: '21.4-persistent-monitoring-history',
      status: 'BLOCKED',
      message: error.message || 'System monitoring run failed.',
      generatedAt: new Date().toISOString(),
      summary: null,
      alerts: [
        {
          id: `alert-monitoring-failed-${Date.now()}`,
          severity: 'CRITICAL',
          title: 'Monitoring run failed',
          message: error.message || 'System monitoring run failed.',
          source: 'manual-monitoring',
          createdAt: new Date().toISOString()
        }
      ],
      audit: null,
      mode: 'manual'
    });

    return res.status(500).json(failedSnapshot);
  }
});

router.post('/run-now', async (req, res) => {
  try {
    const snapshot = await runMonitoringOnce();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      status: 'BLOCKED',
      error: 'AUTO_MONITORING_RUN_FAILED',
      message: error.message || 'Automatic monitoring run failed.'
    });
  }
});

router.post('/auto-run-once', async (req, res) => {
  try {
    const snapshot = await runMonitoringOnce();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      status: 'BLOCKED',
      error: 'AUTO_MONITORING_RUN_FAILED',
      message: error.message || 'Automatic monitoring run failed.'
    });
  }
});

module.exports = router;