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

  throw new Error('Could not resolve database client in tenantProductionAuditService.');
}

const db = resolveDb();

function tenantRouteFileExists(fileName) {
  try {
    const fullPath = path.resolve(__dirname, `../routes/tenant/${fileName}`);
    return fs.existsSync(fullPath);
  } catch (_error) {
    return false;
  }
}

function patientRouteFileExists(fileName) {
  try {
    const fullPath = path.resolve(__dirname, `../routes/patient/${fileName}`);
    return fs.existsSync(fullPath);
  } catch (_error) {
    return false;
  }
}

async function describeTable(tableName) {
  const exists = await tableExists(db, tableName);

  if (!exists) {
    return {
      exists: false,
      tableName,
      columnCount: 0,
      columns: []
    };
  }

  const columns = await getColumns(db, tableName);

  return {
    exists: true,
    tableName,
    columnCount: columns.length,
    columns
  };
}

async function describeFirstExistingTable(candidates) {
  for (const tableName of candidates) {
    const result = await describeTable(tableName);

    if (result.exists) {
      return result;
    }
  }

  return {
    exists: false,
    tableName: null,
    columnCount: 0,
    columns: []
  };
}

function tableHasColumns(tableInfo, requiredColumns = []) {
  if (!tableInfo?.exists) return false;
  return requiredColumns.every((col) => (tableInfo.columns || []).includes(col));
}

function buildModuleStatus({
  routeOk,
  secondaryRouteOk = true,
  requiredTables = []
}) {
  const reqSatisfied = requiredTables.every(
    (item) => item.exists && tableHasColumns(item, item.requiredColumns || [])
  );

  if (routeOk && secondaryRouteOk && reqSatisfied) return 'live';

  const reqSome = requiredTables.some((item) => item.exists);

  if ((routeOk || secondaryRouteOk) && (reqSome || requiredTables.length === 0)) {
    return 'partial';
  }

  if (routeOk || secondaryRouteOk) return 'partial';

  return 'missing';
}

function statusLabel(status) {
  if (status === 'live') return 'LIVE';
  if (status === 'partial') return 'PARTIAL';
  return 'MISSING';
}

function formatTableForUi(item, required) {
  return {
    name: item.tableName || 'not_found',
    exists: item.exists,
    columnCount: item.columnCount,
    required,
    requiredColumns: item.requiredColumns || []
  };
}

function buildNotes(requiredTables, optionalTables, extraNotes = []) {
  const notes = [...extraNotes];

  const missingRequired = requiredTables.filter(
    (item) => !item.exists || !tableHasColumns(item, item.requiredColumns || [])
  );

  const missingOptional = optionalTables.filter(
    (item) => !item.exists || !tableHasColumns(item, item.requiredColumns || [])
  );

  if (missingRequired.length) {
    notes.push(
      `Core dependency gap: ${missingRequired
        .map((item) => item.tableName || 'expected table')
        .join(', ')}.`
    );
  }

  if (missingOptional.length) {
    notes.push(
      `Optional enrichment missing: ${missingOptional
        .map((item) => item.tableName || 'expected table')
        .join(', ')}. Core flow may still be live.`
    );
  }

  return notes;
}

function buildModule({
  key,
  title,
  href,
  routeOk,
  secondaryRouteOk = true,
  requiredTables = [],
  optionalTables = [],
  notes = []
}) {
  const status = buildModuleStatus({
    routeOk,
    secondaryRouteOk,
    requiredTables
  });

  return {
    key,
    title,
    href,
    status,
    statusLabel: statusLabel(status),
    routeOk,
    secondaryRouteOk,
    tables: [
      ...requiredTables.map((item) => formatTableForUi(item, true)),
      ...optionalTables.map((item) => formatTableForUi(item, false))
    ],
    notes: buildNotes(requiredTables, optionalTables, notes)
  };
}

async function getProductionAudit() {
  const patientsTable = await describeFirstExistingTable(['patients']);
  const patientSignalsTable = await describeFirstExistingTable(['patient_signals']);
  const tasksTable = await describeFirstExistingTable(['tasks', 'tenant_tasks', 'followup_tasks']);
  const coachingTable = await describeFirstExistingTable([
    'patient_coaching_assignments',
    'coaching_assignments'
  ]);
  const importTable = await describeFirstExistingTable([
    'patient_import_jobs',
    'import_jobs'
  ]);

  patientsTable.requiredColumns = [];
  patientSignalsTable.requiredColumns = ['status'];
  tasksTable.requiredColumns = ['status'];
  coachingTable.requiredColumns = ['status'];
  importTable.requiredColumns = ['status'];

  const modules = [
    buildModule({
      key: 'atlas_action_center',
      title: 'ATLAS Action Center',
      href: '/tenant/atlas/action-center',
      routeOk: tenantRouteFileExists('atlasActionCenter.js'),
      requiredTables: [tasksTable, patientSignalsTable],
      optionalTables: [coachingTable, importTable],
      notes: [
        'Core ATLAS runtime depends primarily on signal + task flow.'
      ]
    }),

    buildModule({
      key: 'patient_orchestrator',
      title: 'Patient Orchestrator',
      href: '/tenant/patient-orchestrator/patient@raftop.local',
      routeOk: tenantRouteFileExists('patientOrchestrator.js'),
      requiredTables: [patientsTable, tasksTable],
      optionalTables: [patientSignalsTable, coachingTable, importTable],
      notes: [
        'Best quality with sync/report/coaching enrichment, but core patient workspace can still run without all of them.'
      ]
    }),

    buildModule({
      key: 'patient_tasks',
      title: 'Patient Task Board',
      href: '/tenant/patient-tasks/patient@raftop.local',
      routeOk: tenantRouteFileExists('patientTasks.js'),
      requiredTables: [tasksTable],
      optionalTables: [],
      notes: [
        'Primary requirement is a recognized tasks table.'
      ]
    }),

    buildModule({
      key: 'patient_signals',
      title: 'Patient Signals',
      href: '/tenant/patient-signals',
      routeOk: tenantRouteFileExists('patientSignals.js'),
      requiredTables: [patientSignalsTable],
      optionalTables: [],
      notes: [
        'Signal screen depends directly on patient_signals.'
      ]
    }),

    buildModule({
      key: 'patient_coaching',
      title: 'Patient Coaching',
      href: '/tenant/patient-coaching',
      routeOk: tenantRouteFileExists('patientCoaching.js'),
      requiredTables: [coachingTable],
      optionalTables: [],
      notes: [
        'Coaching becomes fully live only when assignment table exists.'
      ]
    }),

    buildModule({
      key: 'imports',
      title: 'Import Center / History',
      href: '/tenant/import-history',
      routeOk: tenantRouteFileExists('importHistory.js'),
      secondaryRouteOk: tenantRouteFileExists('importCenter.js'),
      requiredTables: [importTable],
      optionalTables: [],
      notes: [
        'Import module depends on tracked import job records.'
      ]
    }),

    buildModule({
      key: 'reports',
      title: 'Reports',
      href: '/tenant/reports/patient/patient@raftop.local',
      routeOk: tenantRouteFileExists('reports.js'),
      secondaryRouteOk: patientRouteFileExists('reports.js'),
      requiredTables: [],
      optionalTables: [patientsTable],
      notes: [
        'Report generation can remain partial depending on service/data availability.'
      ]
    }),

    buildModule({
      key: 'sync',
      title: 'Patient Sync',
      href: '/patient/data-sync',
      routeOk: patientRouteFileExists('sync.js'),
      requiredTables: [],
      optionalTables: [importTable],
      notes: [
        'Sync runtime may work without a full jobs table, but visibility improves with it.'
      ]
    })
  ];

  const summary = {
    totalModules: modules.length,
    live: modules.filter((item) => item.status === 'live').length,
    partial: modules.filter((item) => item.status === 'partial').length,
    missing: modules.filter((item) => item.status === 'missing').length
  };

  const discoveredTables = [
    patientsTable,
    patientSignalsTable,
    tasksTable,
    coachingTable,
    importTable
  ].map((item) => ({
    name: item.tableName || 'not_found',
    exists: item.exists,
    columnCount: item.columnCount
  }));

  return {
    summary,
    modules,
    discoveredTables,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  getProductionAudit
};