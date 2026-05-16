const fs = require('fs');
const path = require('path');
const {
  tableExists,
  getColumns
} = require('../utils/routeDbHelpers');

function resolveDb() {
  const candidates = [
    '../db',
    '../config/db',
    '../config/database',
    '../database',
    '../lib/db',
    '../../db',
    '../../config/db'
  ];

  for (const candidate of candidates) {
    try {
      const mod = require(candidate);

      if (mod && typeof mod.query === 'function') {
        return mod;
      }

      if (mod && mod.pool && typeof mod.pool.query === 'function') {
        return mod.pool;
      }

      if (typeof mod === 'function') {
        const maybeDb = mod();
        if (maybeDb && typeof maybeDb.query === 'function') {
          return maybeDb;
        }
      }
    } catch (_error) {
      // continue
    }
  }

  throw new Error('Could not resolve database client in tenantFailDrilldownService.');
}

const db = resolveDb();

function fileExists(relativePath) {
  try {
    return fs.existsSync(path.resolve(__dirname, relativePath));
  } catch (_error) {
    return false;
  }
}

async function inspectTable(tableName, requiredColumns = []) {
  const exists = await tableExists(db, tableName);

  if (!exists) {
    return {
      tableName,
      exists: false,
      columns: [],
      missingColumns: requiredColumns
    };
  }

  const columns = await getColumns(db, tableName);
  const missingColumns = requiredColumns.filter((col) => !columns.includes(col));

  return {
    tableName,
    exists: true,
    columns,
    missingColumns
  };
}

async function inspectFirstExistingTable(candidates, requiredColumns = []) {
  for (const tableName of candidates) {
    const result = await inspectTable(tableName, requiredColumns);
    if (result.exists) return result;
  }

  return {
    tableName: null,
    exists: false,
    columns: [],
    missingColumns: requiredColumns
  };
}

function depSatisfied(dep) {
  return dep.exists && (dep.missingColumns || []).length === 0;
}

function buildDependencyStatus(routeOk, requiredDeps) {
  const allRequiredOk = requiredDeps.every(depSatisfied);

  if (routeOk && allRequiredOk) return 'healthy';

  const someRequiredOk = requiredDeps.some((dep) => dep.exists);

  if (routeOk && someRequiredOk) return 'degraded';
  if (routeOk) return 'route_only';
  return 'missing';
}

function summarizeNextFix(status, requiredDeps, optionalDeps) {
  if (status === 'missing') {
    return 'Restore the missing route first.';
  }

  const missingRequired = requiredDeps.find((dep) => !depSatisfied(dep));
  if (missingRequired) {
    if (!missingRequired.exists) {
      return `Create or restore required table: ${missingRequired.tableName || 'one of expected tables'}.`;
    }

    return `Add missing required columns to ${missingRequired.tableName}: ${(missingRequired.missingColumns || []).join(', ')}.`;
  }

  const missingOptional = optionalDeps.filter((dep) => !depSatisfied(dep));

  if (missingOptional.length) {
    return `Optional enrichment gap: ${missingOptional
      .map((dep) => dep.tableName || 'expected table')
      .join(', ')}. Core flow is not blocked.`;
  }

  return 'No immediate dependency fix required.';
}

function formatDep(dep, required) {
  return {
    tableName: dep.tableName || 'not_found',
    exists: dep.exists,
    missingColumns: dep.missingColumns || [],
    required
  };
}

async function inspectAtlasActionCenter() {
  const routeOk = fileExists('../routes/tenant/atlasActionCenter.js');

  const tasks = await inspectFirstExistingTable(
    ['tasks', 'tenant_tasks', 'followup_tasks'],
    ['status']
  );

  const signals = await inspectTable('patient_signals', ['status']);
  const coaching = await inspectFirstExistingTable(
    ['patient_coaching_assignments', 'coaching_assignments'],
    ['status']
  );
  const imports = await inspectFirstExistingTable(
    ['patient_import_jobs', 'import_jobs'],
    ['status']
  );

  const requiredDeps = [tasks, signals];
  const optionalDeps = [coaching, imports];
  const status = buildDependencyStatus(routeOk, requiredDeps);

  return {
    key: 'atlas_action_center',
    title: 'ATLAS Action Center',
    routeOk,
    status,
    dependencies: [
      ...requiredDeps.map((dep) => formatDep(dep, true)),
      ...optionalDeps.map((dep) => formatDep(dep, false))
    ],
    expectedPath: '/tenant/atlas/action-center',
    nextFix: summarizeNextFix(status, requiredDeps, optionalDeps)
  };
}

async function inspectPatientOrchestrator() {
  const routeOk = fileExists('../routes/tenant/patientOrchestrator.js');

  const patients = await inspectTable('patients', []);
  const tasks = await inspectFirstExistingTable(
    ['tasks', 'tenant_tasks', 'followup_tasks'],
    ['status']
  );
  const signals = await inspectTable('patient_signals', ['status']);
  const coaching = await inspectFirstExistingTable(
    ['patient_coaching_assignments', 'coaching_assignments'],
    ['status']
  );
  const imports = await inspectFirstExistingTable(
    ['patient_import_jobs', 'import_jobs'],
    ['status']
  );

  const requiredDeps = [patients, tasks];
  const optionalDeps = [signals, coaching, imports];
  const status = buildDependencyStatus(routeOk, requiredDeps);

  return {
    key: 'patient_orchestrator',
    title: 'Patient Orchestrator',
    routeOk,
    status,
    dependencies: [
      ...requiredDeps.map((dep) => formatDep(dep, true)),
      ...optionalDeps.map((dep) => formatDep(dep, false))
    ],
    expectedPath: '/tenant/patient-orchestrator/patient@raftop.local',
    nextFix: summarizeNextFix(status, requiredDeps, optionalDeps)
  };
}

async function inspectPatientTaskBoard() {
  const routeOk = fileExists('../routes/tenant/patientTasks.js');

  const tasks = await inspectFirstExistingTable(
    ['tasks', 'tenant_tasks', 'followup_tasks'],
    ['status']
  );

  const requiredDeps = [tasks];
  const optionalDeps = [];
  const status = buildDependencyStatus(routeOk, requiredDeps);

  return {
    key: 'patient_task_board',
    title: 'Patient Task Board',
    routeOk,
    status,
    dependencies: [...requiredDeps.map((dep) => formatDep(dep, true))],
    expectedPath: '/tenant/patient-tasks/patient@raftop.local',
    nextFix: summarizeNextFix(status, requiredDeps, optionalDeps)
  };
}

async function inspectProductionAudit() {
  const routeOk = fileExists('../routes/tenant/productionAudit.js');

  return {
    key: 'production_audit',
    title: 'Production Audit',
    routeOk,
    status: routeOk ? 'healthy' : 'missing',
    dependencies: [],
    expectedPath: '/tenant/production-audit',
    nextFix: routeOk
      ? 'No immediate dependency fix required.'
      : 'Restore productionAudit route.'
  };
}

async function inspectLiveVerification() {
  const routeOk = fileExists('../routes/tenant/liveVerification.js');

  return {
    key: 'live_verification',
    title: 'Live Verification',
    routeOk,
    status: routeOk ? 'healthy' : 'missing',
    dependencies: [],
    expectedPath: '/tenant/live-verification',
    nextFix: routeOk
      ? 'No immediate dependency fix required.'
      : 'Restore liveVerification route.'
  };
}

async function getFailDrilldown() {
  const modules = await Promise.all([
    inspectAtlasActionCenter(),
    inspectPatientOrchestrator(),
    inspectPatientTaskBoard(),
    inspectProductionAudit(),
    inspectLiveVerification()
  ]);

  const summary = {
    total: modules.length,
    healthy: modules.filter((m) => m.status === 'healthy').length,
    degraded: modules.filter((m) => m.status === 'degraded').length,
    routeOnly: modules.filter((m) => m.status === 'route_only').length,
    missing: modules.filter((m) => m.status === 'missing').length
  };

  return {
    summary,
    modules,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  getFailDrilldown
};