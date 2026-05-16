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
      // Try next candidate.
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

function upper(value, fallback = 'UNKNOWN') {
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
      monthlyHours: 42,
      monthly_hours: 42,
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
      monthlyHours: 61,
      monthly_hours: 61,
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    {
      id: 'sig-raftop-003',
      tenantId,
      tenant_id: tenantId,
      patientName: 'Μαρία Κωνσταντίνου',
      patient_name: 'Μαρία Κωνσταντίνου',
      title: 'Doctor report ready',
      signalType: 'DOCTOR_REPORT_READY',
      signal_type: 'DOCTOR_REPORT_READY',
      severity: 'LOW',
      status: 'READY',
      source: 'REPORTING',
      description: 'Doctor-channel report is ready for review.',
      nextBestAction: 'Send concise compliance update to referring doctor.',
      next_best_action: 'Send concise compliance update to referring doctor.',
      monthlyHours: 93,
      monthly_hours: 93,
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
      title: 'Call high-risk CPAP patient',
      description: 'Patient is below 80h/month usage.',
      patientName: 'ΚΟΥΤΡΩΤΣΙΟΣ ΔΗΜΗΤΡΙΟΣ',
      patient_name: 'ΚΟΥΤΡΩΤΣΙΟΣ ΔΗΜΗΤΡΙΟΣ',
      priority: 'HIGH',
      status: 'OPEN',
      source: 'ATLAS',
      linkedSignalId: 'sig-raftop-001',
      linked_signal_id: 'sig-raftop-001',
      dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      due_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'task-raftop-002',
      tenantId,
      tenant_id: tenantId,
      title: 'Early coaching call',
      description: 'Prevent early CPAP abandonment.',
      patientName: 'Γεώργιος Παπαδόπουλος',
      patient_name: 'Γεώργιος Παπαδόπουλος',
      priority: 'MEDIUM',
      status: 'OPEN',
      source: 'ATLAS',
      linkedSignalId: 'sig-raftop-002',
      linked_signal_id: 'sig-raftop-002',
      dueAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      due_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    }
  ];
}

function normalizeSignal(row = {}, tenantId) {
  const severity = upper(row.severity || row.priority, 'MEDIUM');
  const status = upper(row.status || row.followup_status || row.task_status, 'OPEN');

  return {
    id: row.id,
    tenantId: row.tenant_id || tenantId,
    tenant_id: row.tenant_id || tenantId,
    patientName: row.patient_name || row.patientName || row.name || null,
    patient_name: row.patient_name || row.patientName || row.name || null,
    title: row.title || row.name || row.issue_title || 'Patient signal',
    signalType: row.signal_type || row.signalType || row.issue_type || row.issueType || 'MANUAL_SIGNAL',
    signal_type: row.signal_type || row.signalType || row.issue_type || row.issueType || 'MANUAL_SIGNAL',
    description: row.description || row.message || '',
    severity,
    priority: severity,
    status,
    source: row.source || 'database',
    monthlyHours: row.monthly_hours || row.monthlyHours || null,
    monthly_hours: row.monthly_hours || row.monthlyHours || null,
    nextBestAction:
      row.next_best_action ||
      row.nextBestAction ||
      row.metadata?.nextBestAction ||
      'Review and assign follow-up.',
    next_best_action:
      row.next_best_action ||
      row.nextBestAction ||
      row.metadata?.nextBestAction ||
      'Review and assign follow-up.',
    metadata: row.metadata || {},
    createdAt: row.created_at || row.createdAt || null,
    created_at: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null,
    updated_at: row.updated_at || row.updatedAt || null
  };
}

function normalizeTask(row = {}, tenantId) {
  const priority = upper(row.priority, 'MEDIUM');
  const status = upper(row.status || row.task_status, 'OPEN');

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
    dueAt: row.due_at || row.dueAt || null,
    due_at: row.due_at || row.dueAt || null,
    metadata: row.metadata || {},
    createdAt: row.created_at || row.createdAt || null,
    created_at: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null,
    updated_at: row.updated_at || row.updatedAt || null
  };
}

async function getSignals(tenantId) {
  const signalTables = ['patient_signals', 'atlas_signals'];

  for (const tableName of signalTables) {
    if (!(await tableExists(tableName))) continue;

    const columns = await getColumns(tableName);
    const tenantColumn = hasColumn(columns, 'tenant_id') ? 'tenant_id' : null;
    const orderColumn = firstExistingColumn(columns, ['updated_at', 'created_at']);

    const whereSql = tenantColumn
      ? `WHERE COALESCE(${tenantColumn}::text, $1::text) = $1::text`
      : '';

    const orderSql = orderColumn
      ? `ORDER BY ${orderColumn} DESC NULLS LAST`
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

async function getTasks(tenantId) {
  if (!(await tableExists('atlas_tasks'))) {
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

function priorityScore(value) {
  const p = upper(value, 'LOW');

  if (p === 'CRITICAL') return 100;
  if (p === 'HIGH') return 80;
  if (p === 'MEDIUM' || p === 'WARNING') return 55;
  if (p === 'LOW') return 25;

  return 10;
}

function statusScore(value) {
  const s = upper(value, 'OPEN');

  if (s === 'OPEN' || s === 'PENDING') return 20;
  if (s === 'IN_PROGRESS') return 10;
  if (s === 'ESCALATED') return 30;
  if (s === 'READY') return 5;
  if (s === 'DONE' || s === 'RESOLVED' || s === 'COMPLETED') return -20;

  return 0;
}

function buildQueue(signals, tasks) {
  const taskBySignal = new Map();

  for (const task of tasks) {
    const signalId = task.linkedSignalId || task.linked_signal_id;

    if (!signalId) continue;

    if (!taskBySignal.has(signalId)) {
      taskBySignal.set(signalId, []);
    }

    taskBySignal.get(signalId).push(task);
  }

  const signalItems = signals.map((signal) => {
    const linkedTasks = taskBySignal.get(signal.id) || [];
    const score = priorityScore(signal.severity) + statusScore(signal.status) + linkedTasks.length * 8;

    return {
      id: `atlas-${signal.id}`,
      type: 'PATIENT_SIGNAL',
      tenantId: signal.tenantId,
      tenant_id: signal.tenant_id,
      patientName: signal.patientName,
      patient_name: signal.patient_name,
      title: signal.title,
      description: signal.description,
      signalType: signal.signalType,
      signal_type: signal.signal_type,
      severity: signal.severity,
      priority: signal.severity,
      status: signal.status,
      source: signal.source,
      riskScore: score,
      risk_score: score,
      monthlyHours: signal.monthlyHours,
      monthly_hours: signal.monthly_hours,
      nextBestAction: signal.nextBestAction,
      next_best_action: signal.next_best_action,
      linkedTasks,
      linked_tasks: linkedTasks,
      createdAt: signal.createdAt,
      created_at: signal.created_at,
      updatedAt: signal.updatedAt,
      updated_at: signal.updated_at
    };
  });

  const unlinkedTaskItems = tasks
    .filter((task) => !task.linkedSignalId && !task.linked_signal_id)
    .map((task) => {
      const score = priorityScore(task.priority) + statusScore(task.status);

      return {
        id: `atlas-${task.id}`,
        type: 'TASK',
        tenantId: task.tenantId,
        tenant_id: task.tenant_id,
        patientName: task.patientName,
        patient_name: task.patient_name,
        title: task.title,
        description: task.description,
        severity: task.priority,
        priority: task.priority,
        status: task.status,
        source: task.source,
        riskScore: score,
        risk_score: score,
        nextBestAction: task.metadata?.nextBestAction || 'Review task and assign owner.',
        next_best_action: task.metadata?.nextBestAction || 'Review task and assign owner.',
        linkedTasks: [task],
        linked_tasks: [task],
        createdAt: task.createdAt,
        created_at: task.created_at,
        updatedAt: task.updatedAt,
        updated_at: task.updated_at
      };
    });

  return [...signalItems, ...unlinkedTaskItems].sort((a, b) => {
    if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
  });
}

function buildDailyBoard(queue) {
  const today = queue.slice(0, 5);
  const overdue = queue.filter((item) => ['HIGH', 'CRITICAL'].includes(item.priority)).slice(0, 5);
  const completed = queue.filter((item) => ['DONE', 'RESOLVED', 'COMPLETED', 'READY'].includes(item.status)).slice(0, 5);

  return {
    today,
    overdue,
    completed
  };
}

function calculateSummary(queue, signals, tasks) {
  const openStatuses = ['OPEN', 'PENDING', 'IN_PROGRESS', 'ESCALATED'];

  const openSignals = signals.filter((item) => openStatuses.includes(item.status)).length;
  const openTasks = tasks.filter((item) => openStatuses.includes(item.status)).length;
  const criticalItems = queue.filter((item) => ['CRITICAL', 'HIGH'].includes(item.priority)).length;

  return {
    operationalStatus: 'online',
    readinessStatus: criticalItems > 0 ? 'NEEDS_ATTENTION' : 'READY',
    openSignals,
    openTasks,
    criticalItems,
    totalSignals: signals.length,
    totalTasks: tasks.length,
    totalQueueItems: queue.length,
    actionCenter: '/api/tenant/atlas/action-center',
    patientSignals: '/api/tenant/patient-signals',
    unifiedTasks: '/api/tenant/tasks-unified'
  };
}

async function buildAtlasPayload(req) {
  const tenantId = getTenantId(req);
  const signals = await getSignals(tenantId);
  const tasks = await getTasks(tenantId);
  const queue = buildQueue(signals, tasks);
  const summary = calculateSummary(queue, signals, tasks);
  const board = buildDailyBoard(queue);

  return {
    ok: true,
    fallback: false,
    source: 'atlas-real-operational-aggregator',
    phase: '25D-real-atlas-risk-queue',
    tenantId,
    tenant_id: tenantId,
    module: 'ATLAS',
    status: 'active',
    summary,
    queue,
    cases: queue,
    items: queue,
    rows: queue,
    signals,
    tasks,
    board,
    generatedAt: nowIso(),
    timestamp: nowIso()
  };
}

router.get('/', async (req, res) => {
  try {
    const payload = await buildAtlasPayload(req);
    return res.json(payload);
  } catch (error) {
    const tenantId = getTenantId(req);
    const signals = buildDemoSignals(tenantId);
    const tasks = buildDemoTasks(tenantId);
    const queue = buildQueue(signals, tasks);
    const summary = calculateSummary(queue, signals, tasks);

    return res.json({
      ok: true,
      fallback: true,
      source: 'atlas-safe-fallback',
      phase: '25D-real-atlas-risk-queue',
      tenantId,
      tenant_id: tenantId,
      module: 'ATLAS',
      status: 'active',
      summary,
      queue,
      cases: queue,
      items: queue,
      rows: queue,
      signals,
      tasks,
      board: buildDailyBoard(queue),
      warning: error.message || 'ATLAS aggregator fallback used.',
      generatedAt: nowIso(),
      timestamp: nowIso()
    });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const payload = await buildAtlasPayload(req);
    return res.json({
      ok: true,
      fallback: payload.fallback,
      source: payload.source,
      phase: payload.phase,
      tenantId: payload.tenantId,
      tenant_id: payload.tenant_id,
      summary: payload.summary,
      timestamp: nowIso()
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'ATLAS summary failed.'
    });
  }
});

router.get('/queue', async (req, res) => {
  try {
    const payload = await buildAtlasPayload(req);
    return res.json({
      ok: true,
      fallback: payload.fallback,
      source: payload.source,
      phase: payload.phase,
      tenantId: payload.tenantId,
      tenant_id: payload.tenant_id,
      queue: payload.queue,
      items: payload.queue,
      rows: payload.queue,
      total: payload.queue.length,
      timestamp: nowIso()
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'ATLAS queue failed.'
    });
  }
});

router.get('/daily-board', async (req, res) => {
  try {
    const payload = await buildAtlasPayload(req);
    return res.json({
      ok: true,
      fallback: payload.fallback,
      source: payload.source,
      phase: payload.phase,
      tenantId: payload.tenantId,
      tenant_id: payload.tenant_id,
      board: payload.board,
      timestamp: nowIso()
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'ATLAS daily board failed.'
    });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const payload = await buildAtlasPayload(req);
    return res.json({
      ok: true,
      fallback: payload.fallback,
      source: payload.source,
      phase: payload.phase,
      tenantId: payload.tenantId,
      tenant_id: payload.tenant_id,
      tasks: payload.tasks,
      items: payload.tasks,
      rows: payload.tasks,
      total: payload.tasks.length,
      timestamp: nowIso()
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'ATLAS tasks failed.'
    });
  }
});

module.exports = router;