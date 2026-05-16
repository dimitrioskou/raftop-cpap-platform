const atlasActionCenterService = require('./atlasActionCenterService');
const tenantPatientOrchestratorService = require('./tenantPatientOrchestratorService');
const tenantPatientTasksBoardService = require('./tenantPatientTasksBoardService');
const tenantProductionAuditService = require('./tenantProductionAuditService');

function safeCount(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return 0;
}

async function runCheck(label, fn) {
  const startedAt = Date.now();

  try {
    const data = await fn();

    return {
      key: label,
      ok: true,
      durationMs: Date.now() - startedAt,
      message: 'ok',
      details: data || {}
    };
  } catch (error) {
    return {
      key: label,
      ok: false,
      durationMs: Date.now() - startedAt,
      message: error?.message || 'unknown error',
      details: {}
    };
  }
}

async function getLiveVerification() {
  const demoPatientRef = 'patient@raftop.local';

  const checks = await Promise.all([
    runCheck('atlas_action_center', async () => {
      const data = await atlasActionCenterService.getActionCenterData();

      return {
        summaryTotal: data?.summary?.total ?? 0,
        itemsCount: safeCount(data?.items),
        debug: data?.debug || {}
      };
    }),

    runCheck('patient_orchestrator', async () => {
      const data =
        await tenantPatientOrchestratorService.getTenantPatientOrchestrator(
          demoPatientRef
        );

      return {
        patientEmail: data?.patient?.email || null,
        tasksCount: safeCount(data?.tasks),
        signalsCount: safeCount(data?.signals),
        coachingCount: safeCount(data?.coaching),
        timelineCount: safeCount(data?.timeline)
      };
    }),

    runCheck('patient_task_board', async () => {
      const data =
        await tenantPatientTasksBoardService.getPatientTaskBoard(demoPatientRef);

      return {
        patientEmail: data?.patient?.email || null,
        total: data?.summary?.total ?? 0,
        pending: data?.summary?.pending ?? 0,
        inProgress: data?.summary?.inProgress ?? 0,
        escalated: data?.summary?.escalated ?? 0,
        done: data?.summary?.done ?? 0
      };
    }),

    runCheck('production_audit', async () => {
      const data = await tenantProductionAuditService.getProductionAudit();

      return {
        totalModules: data?.summary?.totalModules ?? 0,
        live: data?.summary?.live ?? 0,
        partial: data?.summary?.partial ?? 0,
        missing: data?.summary?.missing ?? 0
      };
    })
  ]);

  const summary = {
    totalChecks: checks.length,
    passed: checks.filter((item) => item.ok).length,
    failed: checks.filter((item) => !item.ok).length
  };

  return {
    summary,
    checks,
    generatedAt: new Date().toISOString(),
    demoPatientRef
  };
}

module.exports = {
  getLiveVerification
};