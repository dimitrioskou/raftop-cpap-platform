const { runSystemMaintenanceCleanup, getMaintenanceStatus } = require('./systemMaintenanceService');

let maintenanceTimer = null;
let isRunning = false;

let latestMaintenanceRun = {
  ok: false,
  phase: '21.11-automatic-maintenance-scheduler',
  status: 'UNKNOWN',
  message: 'Automatic maintenance has not run yet.',
  enabled: null,
  intervalMs: null,
  lastRunAt: null,
  lastResult: null,
  lastError: null
};

function getMaintenanceOptionsFromEnv() {
  return {
    snapshotKeepLatest: process.env.MONITORING_SNAPSHOT_KEEP_LATEST || 500,
    snapshotRetentionDays: process.env.MONITORING_SNAPSHOT_RETENTION_DAYS || 30,
    acknowledgedAlertRetentionDays: process.env.ACKNOWLEDGED_ALERT_RETENTION_DAYS || 30
  };
}

function getMaintenanceIntervalMs() {
  const raw = Number(process.env.SYSTEM_MAINTENANCE_INTERVAL_MS || 86400000);

  if (!Number.isFinite(raw)) {
    return 86400000;
  }

  return Math.min(Math.max(raw, 60000), 604800000);
}

function isMaintenanceEnabled() {
  return String(process.env.SYSTEM_MAINTENANCE_ENABLED || 'true').toLowerCase() !== 'false';
}

async function runMaintenanceOnce(source = 'manual') {
  if (isRunning) {
    return {
      ok: true,
      skipped: true,
      reason: 'MAINTENANCE_ALREADY_RUNNING',
      phase: '21.11-automatic-maintenance-scheduler',
      source,
      generatedAt: new Date().toISOString(),
      latestMaintenanceRun
    };
  }

  isRunning = true;

  try {
    const options = getMaintenanceOptionsFromEnv();
    const result = await runSystemMaintenanceCleanup(options);

    latestMaintenanceRun = {
      ok: true,
      phase: '21.11-automatic-maintenance-scheduler',
      status: 'HEALTHY',
      message: 'Maintenance cleanup completed successfully.',
      source,
      enabled: isMaintenanceEnabled(),
      intervalMs: getMaintenanceIntervalMs(),
      lastRunAt: new Date().toISOString(),
      lastResult: result,
      lastError: null
    };

    return latestMaintenanceRun;
  } catch (error) {
    latestMaintenanceRun = {
      ok: false,
      phase: '21.11-automatic-maintenance-scheduler',
      status: 'FAILED',
      message: error.message || 'Maintenance cleanup failed.',
      source,
      enabled: isMaintenanceEnabled(),
      intervalMs: getMaintenanceIntervalMs(),
      lastRunAt: new Date().toISOString(),
      lastResult: null,
      lastError: error.message || 'Maintenance cleanup failed.'
    };

    return latestMaintenanceRun;
  } finally {
    isRunning = false;
  }
}

async function getMaintenanceRunnerStatus() {
  let currentDatabaseStatus = null;

  try {
    currentDatabaseStatus = await getMaintenanceStatus(getMaintenanceOptionsFromEnv());
  } catch (error) {
    currentDatabaseStatus = {
      ok: false,
      error: 'MAINTENANCE_STATUS_READ_FAILED',
      message: error.message
    };
  }

  return {
    ok: true,
    phase: '21.11-automatic-maintenance-scheduler',
    enabled: isMaintenanceEnabled(),
    intervalMs: getMaintenanceIntervalMs(),
    isRunning,
    latestMaintenanceRun,
    currentDatabaseStatus,
    generatedAt: new Date().toISOString()
  };
}

function startSystemMaintenanceLoop() {
  const enabled = isMaintenanceEnabled();
  const intervalMs = getMaintenanceIntervalMs();

  latestMaintenanceRun = {
    ...latestMaintenanceRun,
    enabled,
    intervalMs
  };

  if (!enabled) {
    console.log('[System Maintenance] Automatic loop disabled by SYSTEM_MAINTENANCE_ENABLED=false');
    return;
  }

  if (maintenanceTimer) {
    clearInterval(maintenanceTimer);
    maintenanceTimer = null;
  }

  setTimeout(() => {
    runMaintenanceOnce('startup').catch((error) => {
      console.error('[System Maintenance] Startup cleanup failed:', error);
    });
  }, 10000);

  maintenanceTimer = setInterval(() => {
    runMaintenanceOnce('scheduled').catch((error) => {
      console.error('[System Maintenance] Scheduled cleanup failed:', error);
    });
  }, intervalMs);

  console.log(`[System Maintenance] Automatic loop started. Interval: ${intervalMs}ms`);
}

function stopSystemMaintenanceLoop() {
  if (maintenanceTimer) {
    clearInterval(maintenanceTimer);
    maintenanceTimer = null;
  }

  console.log('[System Maintenance] Automatic loop stopped.');
}

module.exports = {
  runMaintenanceOnce,
  startSystemMaintenanceLoop,
  stopSystemMaintenanceLoop,
  getMaintenanceRunnerStatus
};