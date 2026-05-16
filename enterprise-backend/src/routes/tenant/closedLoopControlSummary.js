'use strict';

const express = require('express');

const router = express.Router();

let cachedDb = null;

function loadDb() {
  if (cachedDb) return cachedDb;

  const candidates = [
    '../../services/db',
    '../../db',
    '../../config/db',
    '../../database',
    '../../database/db',
    '../../lib/db'
  ];

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(candidate);

      if (mod && typeof mod.query === 'function') {
        cachedDb = mod;
        return cachedDb;
      }

      if (mod && mod.pool && typeof mod.pool.query === 'function') {
        cachedDb = mod.pool;
        return cachedDb;
      }

      if (mod && mod.default && typeof mod.default.query === 'function') {
        cachedDb = mod.default;
        return cachedDb;
      }

      if (mod && mod.default && mod.default.pool && typeof mod.default.pool.query === 'function') {
        cachedDb = mod.default.pool;
        return cachedDb;
      }
    } catch (_error) {
      // Try next DB module path.
    }
  }

  return null;
}

async function dbQuery(text, params = []) {
  const db = loadDb();

  if (!db || typeof db.query !== 'function') {
    throw new Error('No database query executor available.');
  }

  return db.query(text, params);
}

function getTenantId(req) {
  return (
    req.user?.tenant_id ||
    req.user?.tenantId ||
    req.headers['x-tenant-id'] ||
    req.query.tenant_id ||
    req.query.tenantId ||
    'raftopoulos-live'
  );
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeUpper(value, fallback = 'UNKNOWN') {
  return String(value || fallback).trim().toUpperCase();
}

async function tableExists(tableName) {
  try {
    const result = await dbQuery(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = $1
        ) AS exists
      `,
      [tableName]
    );

    return result.rows?.[0]?.exists === true;
  } catch (_error) {
    return false;
  }
}

async function getColumns(tableName) {
  try {
    const result = await dbQuery(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
      `,
      [tableName]
    );

    return (result.rows || []).map((row) => row.column_name);
  } catch (_error) {
    return [];
  }
}

function hasColumn(columns, name) {
  return columns.includes(name);
}

function firstExistingColumn(columns, names) {
  return names.find((name) => hasColumn(columns, name)) || null;
}

function buildDemoSignals(tenantId) {
  return [
    {
      id: 'sig-raftop-001',
      tenantId,
      tenant_id: tenantId,
      patientName: 'ΚΟΥΤΡΩΤΣΙΟΣ ΔΗΜΗΤΡΙΟΣ',
      patient_name: 'ΚΟΥΤΡΩΤΣΙΟΣ ΔΗΜΗΤΡΙΟΣ',
      title: 'Low CPAP usage',
      signalType: 'LOW_USAGE',
      signal_type: 'LOW_USAGE',
      severity: 'HIGH',
      status: 'OPEN',
      source: 'ATLAS',
      description: 'CPAP usage below 80h/month compliance reference point.',
      nextBestAction: 'Call patient within 48h and verify usage barriers.',
      next_best_action: 'Call patient within 48h and verify usage barriers.',
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: 'sig-raftop-002',
      tenantId,
      tenant_id: tenantId,
      patientName: 'Γεώργιος Παπαδόπουλος',
      patient_name: 'Γεώργιος Παπαδόπουλος',
      title: 'Early adherence risk',
      signalType: 'EARLY_ADHERENCE_RISK',
      signal_type: 'EARLY_ADHERENCE_RISK',
      severity: 'MEDIUM',
      status: 'OPEN',
      source: 'ATLAS',
      description: 'New CPAP start with first-14-days adherence risk.',
      nextBestAction: 'Schedule early coaching call.',
      next_best_action: 'Schedule early coaching call.',
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
  ];
}

function buildDemoTasks(tenantId) {
  return [
    {
      id: 'task-raftop-001',
      tenantId,
      tenant_id: tenantId,
      patientName: 'ΚΟΥΤΡΩΤΣΙΟΣ ΔΗΜΗΤΡΙΟΣ',
      patient_name: 'ΚΟΥΤΡΩΤΣΙΟΣ ΔΗΜΗΤΡΙΟΣ',
      title: 'Call high-risk CPAP patient',
      description: 'Patient is below 80h/month usage.',
      priority: 'HIGH',
      status: 'OPEN',
      source: 'ATLAS',
      linkedSignalId: 'sig-raftop-001',
      linked_signal_id: 'sig-raftop-001',
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: 'task-raftop-002',
      tenantId,
      tenant_id: tenantId,
      patientName: 'Γεώργιος Παπαδόπουλος',
      patient_name: 'Γεώργιος Παπαδόπουλος',
      title: 'Early coaching call',
      description: 'Prevent early CPAP abandonment.',
      priority: 'MEDIUM',
      status: 'OPEN',
      source: 'ATLAS',
      linkedSignalId: 'sig-raftop-002',
      linked_signal_id: 'sig-raftop-002',
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: 'task-raftop-003',
      tenantId,
      tenant_id: tenantId,
      patientName: 'Μαρία Κωνσταντίνου',
      patient_name: 'Μαρία Κωνσταντίνου',
      title: 'Prepare doctor-facing compliance summary',
      description: 'Send concise update to referring doctor.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      source: 'REPORTING',
      linkedSignalId: 'sig-raftop-003',
      linked_signal_id: 'sig-raftop-003',
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
  ];
}

function normalizeSignal(row = {}, tenantId) {
  const severity = normalizeUpper(row.severity || row.priority, 'MEDIUM');
  const status = normalizeUpper(row.status || row.followup_status || row.task_status, 'OPEN');

  return {
    id: row.id,
    tenantId: row.tenant_id || tenantId,
    tenant_id: row.tenant_id || tenantId,
    patientId: row.patient_id || row.patientId || null,
    patient_id: row.patient_id || row.patientId || null,
    patientName: row.patient_name || row.patientName || row.name || null,
    patient_name: row.patient_name || row.patientName || row.name || null,
    signalType: row.signal_type || row.signalType || row.issue_type || row.issueType || 'MANUAL_SIGNAL',
    signal_type: row.signal_type || row.signalType || row.issue_type || row.issueType || 'MANUAL_SIGNAL',
    title: row.title || row.name || row.issue_title || 'Patient signal',
    description: row.description || row.message || '',
    severity,
    priority: severity,
    status,
    source: row.source || 'database',
    metadata: row.metadata || {},
    createdAt: row.created_at || row.createdAt || null,
    created_at: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null,
    updated_at: row.updated_at || row.updatedAt || null
  };
}

function normalizeTask(row = {}, tenantId) {
  const priority = normalizeUpper(row.priority, 'MEDIUM');
  const status = normalizeUpper(row.status || row.task_status, 'OPEN');

  return {
    id: row.id,
    taskId: row.id,
    task_id: row.id,
    tenantId: row.tenant_id || tenantId,
    tenant_id: row.tenant_id || tenantId,
    title: row.title || 'Task',
    description: row.description || row.title || 'Task',
    patientName: row.patient_name || row.patientName || null,
    patient_name: row.patient_name || row.patientName || null,
    priority,
    status,
    source: row.source || row.source_type || 'ATLAS',
    linkedSignalId: row.linked_signal_id || row.signal_id || null,
    linked_signal_id: row.linked_signal_id || row.signal_id || null,
    createdAt: row.created_at || row.createdAt || null,
    created_at: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null,
    updated_at: row.updated_at || row.updatedAt || null
  };
}

async function getPatientSignals(tenantId) {
  const signalTables = ['patient_signals', 'atlas_signals'];

  for (const tableName of signalTables) {
    const exists = await tableExists(tableName);

    if (!exists) continue;

    const columns = await getColumns(tableName);
    const tenantColumn = hasColumn(columns, 'tenant_id') ? 'tenant_id' : null;
    const updatedColumn = firstExistingColumn(columns, ['updated_at', 'created_at']);

    const whereSql = tenantColumn
      ? `WHERE COALESCE(${tenantColumn}::text, $1::text) = $1::text`
      : '';

    const orderSql = updatedColumn
      ? `ORDER BY ${updatedColumn} DESC NULLS LAST`
      : '';

    try {
      const result = await dbQuery(
        `
          SELECT *
          FROM ${tableName}
          ${whereSql}
          ${orderSql}
          LIMIT 200
        `,
        tenantColumn ? [tenantId] : []
      );

      const rows = (result.rows || []).map((row) => normalizeSignal(row, tenantId));

      if (rows.length > 0) return rows;
    } catch (_error) {
      // Try next table.
    }
  }

  return buildDemoSignals(tenantId);
}

async function getUnifiedTasks(tenantId) {
  const exists = await tableExists('atlas_tasks');

  if (!exists) {
    return buildDemoTasks(tenantId);
  }

  const columns = await getColumns('atlas_tasks');
  const tenantFilter = hasColumn(columns, 'tenant_id')
    ? `WHERE COALESCE(tenant_id::text, $1::text) = $1::text`
    : '';

  const orderColumn = firstExistingColumn(columns, ['updated_at', 'created_at']);

  const orderSql = orderColumn
    ? `ORDER BY ${orderColumn} DESC NULLS LAST`
    : '';

  try {
    const result = await dbQuery(
      `
        SELECT *
        FROM atlas_tasks
        ${tenantFilter}
        ${orderSql}
        LIMIT 200
      `,
      tenantFilter ? [tenantId] : []
    );

    const rows = (result.rows || []).map((row) => normalizeTask(row, tenantId));

    if (rows.length > 0) return rows;
  } catch (_error) {
    return buildDemoTasks(tenantId);
  }

  return buildDemoTasks(tenantId);
}

async function getVerificationMetrics(tenantId) {
  const exists = await tableExists('closed_loop_verifications');

  if (!exists) {
    return {
      totalVerifications: 0,
      passedVerifications: 0,
      failedVerifications: 0
    };
  }

  const columns = await getColumns('closed_loop_verifications');
  const outcomeColumn = firstExistingColumn(columns, [
    'status',
    'verdict',
    'result',
    'verification_status',
    'check_status',
    'outcome'
  ]);

  const tenantFilter = hasColumn(columns, 'tenant_id')
    ? `WHERE COALESCE(tenant_id::text, $1::text) = $1::text`
    : '';

  if (!outcomeColumn) {
    return {
      totalVerifications: 0,
      passedVerifications: 0,
      failedVerifications: 0
    };
  }

  try {
    const result = await dbQuery(
      `
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE LOWER(COALESCE(${outcomeColumn}::text, '')) IN ('pass', 'passed', 'ok', 'success', 'resolved', 'done')
          )::int AS passed,
          COUNT(*) FILTER (
            WHERE LOWER(COALESCE(${outcomeColumn}::text, '')) IN ('fail', 'failed', 'error', 'critical', 'blocked')
          )::int AS failed
        FROM closed_loop_verifications
        ${tenantFilter}
      `,
      tenantFilter ? [tenantId] : []
    );

    return {
      totalVerifications: Number(result.rows?.[0]?.total || 0),
      passedVerifications: Number(result.rows?.[0]?.passed || 0),
      failedVerifications: Number(result.rows?.[0]?.failed || 0)
    };
  } catch (_error) {
    return {
      totalVerifications: 0,
      passedVerifications: 0,
      failedVerifications: 0
    };
  }
}

function calculateSignalMetrics(signals = []) {
  return {
    totalSignals: signals.length,
    openSignals: signals.filter((item) =>
      ['OPEN', 'PENDING', 'LOGGED', 'IN_PROGRESS', 'SYNCED'].includes(item.status)
    ).length,
    criticalSignals: signals.filter((item) =>
      ['CRITICAL', 'HIGH'].includes(item.severity)
    ).length
  };
}

function calculateTaskMetrics(tasks = []) {
  return {
    totalTasks: tasks.length,
    openTasks: tasks.filter((item) =>
      ['OPEN', 'PENDING'].includes(item.status)
    ).length,
    inProgressTasks: tasks.filter((item) =>
      ['IN_PROGRESS'].includes(item.status)
    ).length,
    escalatedTasks: tasks.filter((item) =>
      ['ESCALATED'].includes(item.status)
    ).length,
    completedTasks: tasks.filter((item) =>
      ['DONE', 'RESOLVED', 'COMPLETED'].includes(item.status)
    ).length,
    highPriorityTasks: tasks.filter((item) =>
      ['CRITICAL', 'HIGH'].includes(item.priority)
    ).length
  };
}

function buildBlockers({ signals, tasks, metrics }) {
  const blockers = [];

  const criticalSignals = signals.filter((item) =>
    ['CRITICAL', 'HIGH'].includes(item.severity)
  );

  if (criticalSignals.length > 0) {
    blockers.push({
      id: 'blocker-critical-signals',
      title: 'Critical or high priority patient signals exist',
      description: `${criticalSignals.length} critical/high patient signal(s) require operational review.`,
      priority: 'HIGH',
      source: 'patient_signals'
    });
  }

  const highTasks = tasks.filter((item) =>
    ['CRITICAL', 'HIGH'].includes(item.priority) &&
    !['DONE', 'RESOLVED', 'COMPLETED'].includes(item.status)
  );

  if (highTasks.length > 0) {
    blockers.push({
      id: 'blocker-high-priority-tasks',
      title: 'High priority tasks remain open',
      description: `${highTasks.length} high priority task(s) must be handled before pilot readiness.`,
      priority: 'HIGH',
      source: 'atlas_tasks'
    });
  }

  if (metrics.failedVerifications > 0) {
    blockers.push({
      id: 'blocker-failed-verifications',
      title: 'Failed closed-loop verifications exist',
      description: `${metrics.failedVerifications} failed verification(s) must be remediated.`,
      priority: 'HIGH',
      source: 'closed_loop_verifications'
    });
  }

  return blockers;
}

function buildNextBestActions({ blockers, signals, tasks, metrics }) {
  const actions = [];

  if (signals.some((item) => ['CRITICAL', 'HIGH'].includes(item.severity))) {
    actions.push({
      id: 'nba-review-critical-signals',
      title: 'Review high-risk patient signals',
      description: 'Prioritize high-risk CPAP patients before expanding rollout.',
      priority: 'HIGH',
      type: 'PATIENT_SIGNAL_REVIEW'
    });
  }

  if (tasks.some((item) => ['CRITICAL', 'HIGH'].includes(item.priority) && ['OPEN', 'PENDING'].includes(item.status))) {
    actions.push({
      id: 'nba-handle-high-priority-tasks',
      title: 'Handle high-priority operational tasks',
      description: 'Assign owner and move the highest-risk tasks to in-progress or resolved.',
      priority: 'HIGH',
      type: 'TASK_EXECUTION'
    });
  }

  if (metrics.failedVerifications > 0) {
    actions.push({
      id: 'nba-create-remediation-tasks',
      title: 'Create remediation tasks for failed verifications',
      description: 'Every failed closed-loop verification should create or link to a task.',
      priority: 'HIGH',
      type: 'REMEDIATION_TASK_CREATION'
    });
  }

  if (blockers.length === 0) {
    actions.push({
      id: 'nba-ready-for-pilot',
      title: 'Proceed to controlled pilot kickoff',
      description: 'No blocking control-loop issue detected. Continue with selected cohort and weekly review rhythm.',
      priority: 'LOW',
      type: 'PILOT_READY'
    });
  }

  return actions;
}

function calculateReadiness(blockers, metrics) {
  const highBlockers = blockers.filter((item) =>
    ['HIGH', 'CRITICAL'].includes(String(item.priority || '').toUpperCase())
  );

  if (highBlockers.length > 0 || metrics.failedVerifications > 0) {
    return 'NEEDS_ATTENTION';
  }

  if (blockers.length > 0 || metrics.openSignals > 0 || metrics.openTasks > 0) {
    return 'NEEDS_ATTENTION';
  }

  return 'READY';
}

router.get('/control-summary', async (req, res) => {
  const tenantId = getTenantId(req);

  try {
    const signals = await getPatientSignals(tenantId);
    const tasks = await getUnifiedTasks(tenantId);
    const verificationMetrics = await getVerificationMetrics(tenantId);

    const signalMetrics = calculateSignalMetrics(signals);
    const taskMetrics = calculateTaskMetrics(tasks);

    const metrics = {
      ...signalMetrics,
      ...taskMetrics,
      ...verificationMetrics,
      openRemediations: 0,
      resolvedRemediations: 0
    };

    const blockers = buildBlockers({
      signals,
      tasks,
      metrics
    });

    const nextBestActions = buildNextBestActions({
      blockers,
      signals,
      tasks,
      metrics
    });

    const readinessStatus = calculateReadiness(blockers, metrics);

    return res.json({
      ok: true,
      fallback: false,
      source: 'database-schema-safe',
      phase: '25C-real-control-summary',
      tenantId,
      tenant_id: tenantId,
      readinessStatus,
      readiness_status: readinessStatus,
      metrics,
      blockers,
      nextBestActions,
      next_best_actions: nextBestActions,
      signals: signals.slice(0, 20),
      tasks: tasks.slice(0, 20),
      items: nextBestActions,
      rows: nextBestActions,
      generatedAt: nowIso()
    });
  } catch (error) {
    const signals = buildDemoSignals(tenantId);
    const tasks = buildDemoTasks(tenantId);

    const metrics = {
      ...calculateSignalMetrics(signals),
      ...calculateTaskMetrics(tasks),
      totalVerifications: 0,
      passedVerifications: 0,
      failedVerifications: 0,
      openRemediations: 0,
      resolvedRemediations: 0
    };

    const blockers = buildBlockers({
      signals,
      tasks,
      metrics
    });

    const nextBestActions = buildNextBestActions({
      blockers,
      signals,
      tasks,
      metrics
    });

    const readinessStatus = calculateReadiness(blockers, metrics);

    return res.json({
      ok: true,
      fallback: true,
      source: 'fallback-control-summary',
      phase: '25C-real-control-summary',
      tenantId,
      tenant_id: tenantId,
      readinessStatus,
      readiness_status: readinessStatus,
      metrics,
      blockers,
      nextBestActions,
      next_best_actions: nextBestActions,
      signals,
      tasks,
      items: nextBestActions,
      rows: nextBestActions,
      warning: error.message || 'Control summary DB unavailable. Returned safe operational summary.',
      generatedAt: nowIso()
    });
  }
});

module.exports = router;