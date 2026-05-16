const { setLatestSnapshot } = require('./systemMonitoringStore');
const { storeAlerts } = require('./systemAlertService');

let monitoringTimer = null;
let isRunning = false;

function buildBaseUrl() {
  const port = process.env.PORT || 5001;
  return process.env.INTERNAL_API_BASE_URL || `http://localhost:${port}`;
}

function buildAlertsFromAudit(auditPayload) {
  const summary = auditPayload?.summary || {};
  const results = Array.isArray(auditPayload?.results) ? auditPayload.results : [];

  const alerts = [];

  if (summary.readinessStatus === 'BLOCKED') {
    alerts.push({
      id: `auto-alert-blocked-${Date.now()}`,
      severity: 'CRITICAL',
      title: 'System is BLOCKED',
      message: 'Automatic monitoring detected blocking backend route issues.',
      source: 'auto-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  if (Number(summary.failed || 0) > 0) {
    alerts.push({
      id: `auto-alert-failed-routes-${Date.now()}`,
      severity: 'HIGH',
      title: 'Failed routes detected',
      message: `${summary.failed} route(s) failed in automatic monitoring.`,
      source: 'auto-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  if (Number(summary.serverErrors || 0) > 0) {
    alerts.push({
      id: `auto-alert-server-errors-${Date.now()}`,
      severity: 'HIGH',
      title: 'Backend server errors detected',
      message: `${summary.serverErrors} route(s) returned 500-level errors.`,
      source: 'auto-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  if (Number(summary.routeNotFound || 0) > 0) {
    alerts.push({
      id: `auto-alert-route-not-found-${Date.now()}`,
      severity: 'HIGH',
      title: 'Missing routes detected',
      message: `${summary.routeNotFound} route(s) returned 404.`,
      source: 'auto-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  if (Number(summary.fallbackDetected || 0) > 0) {
    alerts.push({
      id: `auto-alert-fallback-${Date.now()}`,
      severity: 'MEDIUM',
      title: 'Fallback responses detected',
      message: `${summary.fallbackDetected} route(s) returned fallback/mock content.`,
      source: 'auto-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  const slowRoutes = results.filter((item) => Number(item.durationMs || 0) > 2500);

  if (slowRoutes.length > 0) {
    alerts.push({
      id: `auto-alert-slow-routes-${Date.now()}`,
      severity: 'MEDIUM',
      title: 'Slow routes detected',
      message: `${slowRoutes.length} route(s) took more than 2500ms.`,
      source: 'auto-monitoring',
      createdAt: new Date().toISOString()
    });
  }

  return alerts;
}

function buildSnapshotFromAudit(auditPayload) {
  const summary = auditPayload?.summary || {};
  const readinessStatus = summary.readinessStatus || 'UNKNOWN';
  const alerts = buildAlertsFromAudit(auditPayload);

  let status = 'UNKNOWN';
  let message = 'Automatic monitoring could not determine system status.';

  if (readinessStatus === 'READY') {
    status = 'HEALTHY';
    message = 'Automatic monitoring reports the system is healthy.';
  } else if (readinessStatus === 'NEEDS_ATTENTION') {
    status = 'DEGRADED';
    message = 'Automatic monitoring reports warnings that need review.';
  } else if (readinessStatus === 'BLOCKED') {
    status = 'BLOCKED';
    message = 'Automatic monitoring reports critical backend issues.';
  }

  return {
    ok: status === 'HEALTHY',
    phase: '21.5-monitoring-alert-engine',
    status,
    message,
    generatedAt: new Date().toISOString(),
    summary,
    alerts,
    audit: auditPayload,
    mode: 'automatic'
  };
}

async function fetchAuditPayload() {
  const baseUrl = buildBaseUrl();

  const response = await fetch(`${baseUrl}/api/system/route-stability-audit`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': 'demo-tenant'
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

async function runMonitoringOnce() {
  if (isRunning) {
    return {
      skipped: true,
      reason: 'MONITORING_ALREADY_RUNNING',
      generatedAt: new Date().toISOString()
    };
  }

  isRunning = true;

  try {
    const auditPayload = await fetchAuditPayload();
    const snapshot = buildSnapshotFromAudit(auditPayload);

    await storeAlerts(snapshot.alerts || []);

    return await setLatestSnapshot(snapshot);
  } catch (error) {
    const failedSnapshot = {
      ok: false,
      phase: '21.5-monitoring-alert-engine',
      status: 'BLOCKED',
      message: error.message || 'Automatic monitoring failed.',
      generatedAt: new Date().toISOString(),
      summary: null,
      alerts: [
        {
          id: `auto-alert-runner-failed-${Date.now()}`,
          severity: 'CRITICAL',
          title: 'Automatic monitoring failed',
          message: error.message || 'Automatic monitoring failed.',
          source: 'auto-monitoring',
          createdAt: new Date().toISOString()
        }
      ],
      audit: null,
      mode: 'automatic'
    };

    await storeAlerts(failedSnapshot.alerts || []);

    return await setLatestSnapshot(failedSnapshot);
  } finally {
    isRunning = false;
  }
}

function startSystemMonitoringLoop() {
  const enabled =
    String(process.env.SYSTEM_MONITORING_ENABLED || 'true').toLowerCase() !== 'false';

  if (!enabled) {
    console.log('[System Monitoring] Automatic loop disabled by SYSTEM_MONITORING_ENABLED=false');
    return;
  }

  const intervalMs = Number(process.env.SYSTEM_MONITORING_INTERVAL_MS || 300000);

  if (monitoringTimer) {
    clearInterval(monitoringTimer);
  }

  setTimeout(() => {
    runMonitoringOnce().catch((error) => {
      console.error('[System Monitoring] Initial run failed:', error);
    });
  }, 2500);

  monitoringTimer = setInterval(() => {
    runMonitoringOnce().catch((error) => {
      console.error('[System Monitoring] Scheduled run failed:', error);
    });
  }, intervalMs);

  console.log(`[System Monitoring] Automatic loop started. Interval: ${intervalMs}ms`);
}

function stopSystemMonitoringLoop() {
  if (monitoringTimer) {
    clearInterval(monitoringTimer);
    monitoringTimer = null;
  }

  console.log('[System Monitoring] Automatic loop stopped.');
}

module.exports = {
  runMonitoringOnce,
  startSystemMonitoringLoop,
  stopSystemMonitoringLoop,
  buildSnapshotFromAudit,
  buildAlertsFromAudit
};