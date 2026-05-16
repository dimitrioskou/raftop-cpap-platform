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
      // Try next DB candidate.
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

function lower(value, fallback = '') {
  return String(value || fallback).trim().toLowerCase();
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

function normalizeSignal(row = {}, tenantId) {
  return {
    id: row.id,
    tenantId: row.tenant_id || tenantId,
    patientName: row.patient_name || row.patientName || row.name || null,
    signalType: row.signal_type || row.signalType || row.issue_type || 'MANUAL_SIGNAL',
    title: row.title || row.name || row.issue_title || 'Patient signal',
    severity: upper(row.severity || row.priority, 'MEDIUM'),
    status: upper(row.status || row.followup_status || row.task_status, 'OPEN'),
    source: row.source || 'database',
    monthlyHours: Number(row.monthly_hours || row.monthlyHours || 0),
    createdAt: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null
  };
}

function normalizeTask(row = {}, tenantId) {
  return {
    id: row.id,
    tenantId: row.tenant_id || tenantId,
    title: row.title || 'Task',
    patientName: row.patient_name || row.patientName || null,
    priority: upper(row.priority, 'MEDIUM'),
    status: upper(row.status || row.task_status, 'OPEN'),
    source: row.source || row.source_type || 'ATLAS',
    linkedSignalId: row.linked_signal_id || row.signal_id || null,
    createdAt: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null
  };
}

function demoSignals(tenantId) {
  return [
    {
      id: 'sig-raftop-001',
      tenantId,
      patientName: 'ΚΟΥΤΡΩΤΣΙΟΣ ΔΗΜΗΤΡΙΟΣ',
      signalType: 'LOW_USAGE',
      title: 'Low CPAP usage',
      severity: 'HIGH',
      status: 'OPEN',
      source: 'ATLAS',
      monthlyHours: 42
    },
    {
      id: 'sig-raftop-002',
      tenantId,
      patientName: 'Γεώργιος Παπαδόπουλος',
      signalType: 'EARLY_ADHERENCE_RISK',
      title: 'Early adherence risk',
      severity: 'MEDIUM',
      status: 'OPEN',
      source: 'ATLAS',
      monthlyHours: 61
    },
    {
      id: 'sig-raftop-003',
      tenantId,
      patientName: 'Μαρία Κωνσταντίνου',
      signalType: 'FOLLOWUP_DUE',
      title: 'Follow-up due',
      severity: 'MEDIUM',
      status: 'OPEN',
      source: 'FOLLOWUP_ENGINE',
      monthlyHours: 74
    },
    {
      id: 'sig-raftop-004',
      tenantId,
      patientName: 'Νίκος Δημητρίου',
      signalType: 'DOCTOR_REPORT_READY',
      title: 'Doctor report ready',
      severity: 'LOW',
      status: 'READY',
      source: 'REPORTING',
      monthlyHours: 93
    }
  ];
}

function demoTasks(tenantId) {
  return [
    {
      id: 'task-raftop-001',
      tenantId,
      title: 'Call high-risk CPAP patient',
      priority: 'HIGH',
      status: 'OPEN',
      source: 'ATLAS',
      linkedSignalId: 'sig-raftop-001'
    },
    {
      id: 'task-raftop-002',
      tenantId,
      title: 'Early coaching call',
      priority: 'MEDIUM',
      status: 'OPEN',
      source: 'ATLAS',
      linkedSignalId: 'sig-raftop-002'
    },
    {
      id: 'task-raftop-003',
      tenantId,
      title: 'Prepare doctor-facing compliance summary',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      source: 'REPORTING',
      linkedSignalId: 'sig-raftop-003'
    },
    {
      id: 'task-raftop-004',
      tenantId,
      title: 'Review closed-loop pilot readiness',
      priority: 'LOW',
      status: 'OPEN',
      source: 'CLOSED_LOOP',
      linkedSignalId: null
    }
  ];
}

async function readSignals(tenantId) {
  const tables = ['patient_signals', 'atlas_signals'];

  for (const tableName of tables) {
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
          LIMIT 500
        `,
        tenantColumn ? [tenantId] : []
      );

      const rows = (result.rows || []).map((row) => normalizeSignal(row, tenantId));

      if (rows.length > 0) return rows;
    } catch (_error) {
      // Try next table.
    }
  }

  return demoSignals(tenantId);
}

async function readTasks(tenantId) {
  if (!(await tableExists('atlas_tasks'))) {
    return demoTasks(tenantId);
  }

  const columns = await getColumns('atlas_tasks');
  const tenantFilter = hasColumn(columns, 'tenant_id')
    ? `WHERE COALESCE(tenant_id::text, $1::text) = $1::text`
    : '';

  const orderColumn = firstExistingColumn(columns, ['updated_at', 'created_at']);
  const orderSql = orderColumn ? `ORDER BY ${orderColumn} DESC NULLS LAST` : '';

  try {
    const result = await dbQuery(
      `
        SELECT *
        FROM atlas_tasks
        ${tenantFilter}
        ${orderSql}
        LIMIT 500
      `,
      tenantFilter ? [tenantId] : []
    );

    const rows = (result.rows || []).map((row) => normalizeTask(row, tenantId));

    if (rows.length > 0) return rows;
  } catch (_error) {
    return demoTasks(tenantId);
  }

  return demoTasks(tenantId);
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(Number(value || 0))));
}

function calculateExecutiveMetrics({ signals, tasks }) {
  const openStatuses = ['OPEN', 'PENDING', 'IN_PROGRESS', 'ESCALATED'];
  const doneStatuses = ['DONE', 'RESOLVED', 'COMPLETED', 'READY'];

  const totalSignals = signals.length;
  const openSignals = signals.filter((item) => openStatuses.includes(item.status)).length;
  const highRiskPatients = signals.filter((item) =>
    ['CRITICAL', 'HIGH'].includes(item.severity)
  ).length;

  const complianceRescueOpportunities = signals.filter((item) =>
    item.signalType === 'LOW_USAGE' ||
    item.signalType === 'EARLY_ADHERENCE_RISK' ||
    Number(item.monthlyHours || 0) > 0 && Number(item.monthlyHours || 0) < 80
  ).length;

  const totalTasks = tasks.length;
  const openTasks = tasks.filter((item) => ['OPEN', 'PENDING'].includes(item.status)).length;
  const inProgressTasks = tasks.filter((item) => item.status === 'IN_PROGRESS').length;
  const escalatedTasks = tasks.filter((item) => item.status === 'ESCALATED').length;
  const completedTasks = tasks.filter((item) => doneStatuses.includes(item.status)).length;
  const highPriorityTasks = tasks.filter((item) =>
    ['CRITICAL', 'HIGH'].includes(item.priority) &&
    !doneStatuses.includes(item.status)
  ).length;

  const activeInterventions = openTasks + inProgressTasks + escalatedTasks;
  const unresolvedRiskLoad = openSignals + highPriorityTasks + escalatedTasks;

  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const burdenRatio = totalTasks > 0 ? activeInterventions / totalTasks : 0;
  const riskRatio = totalSignals > 0 ? highRiskPatients / totalSignals : 0;

  const operationalEfficiency = clamp(100 - burdenRatio * 45 + completionRate * 25 - riskRatio * 30);
  const taskPressureIndex = clamp(openTasks * 14 + inProgressTasks * 8 + escalatedTasks * 25 + highPriorityTasks * 18, 0, 100);
  const operationalBurdenIndex = clamp(unresolvedRiskLoad * 12 + activeInterventions * 8, 0, 100);
  const readinessScore = clamp(100 - unresolvedRiskLoad * 10 - escalatedTasks * 15 - highPriorityTasks * 10 + completionRate * 20);

  const readinessStatus =
    readinessScore >= 80
      ? 'READY'
      : readinessScore >= 55
        ? 'NEEDS_ATTENTION'
        : 'BLOCKED';

  return {
    operationalEfficiency,
    unresolvedRiskLoad,
    activeInterventionLoad: activeInterventions,
    complianceRescueOpportunities,
    highRiskPatients,
    taskPressureIndex,
    readinessScore,
    readinessStatus,
    operationalBurdenIndex,

    raw: {
      totalSignals,
      openSignals,
      totalTasks,
      openTasks,
      inProgressTasks,
      escalatedTasks,
      completedTasks,
      highPriorityTasks
    }
  };
}

function buildKpis(metrics) {
  return [
    {
      id: 'operational-efficiency',
      label: 'Operational Efficiency',
      value: `${metrics.operationalEfficiency}%`,
      numericValue: metrics.operationalEfficiency,
      tone: metrics.operationalEfficiency >= 75 ? 'success' : 'warning',
      description: 'Estimated operational execution quality from task/risk load.'
    },
    {
      id: 'readiness-score',
      label: 'Readiness Score',
      value: `${metrics.readinessScore}%`,
      numericValue: metrics.readinessScore,
      tone: metrics.readinessScore >= 80 ? 'success' : metrics.readinessScore >= 55 ? 'warning' : 'danger',
      description: 'Pilot readiness based on unresolved operational risk.'
    },
    {
      id: 'risk-load',
      label: 'Unresolved Risk Load',
      value: metrics.unresolvedRiskLoad,
      numericValue: metrics.unresolvedRiskLoad,
      tone: metrics.unresolvedRiskLoad <= 2 ? 'success' : 'warning',
      description: 'Open patient and operational risks requiring action.'
    },
    {
      id: 'interventions',
      label: 'Active Interventions',
      value: metrics.activeInterventionLoad,
      numericValue: metrics.activeInterventionLoad,
      tone: metrics.activeInterventionLoad <= 6 ? 'success' : 'warning',
      description: 'Open or in-progress CPAP operational interventions.'
    },
    {
      id: 'rescue-opportunities',
      label: 'Compliance Rescue',
      value: metrics.complianceRescueOpportunities,
      numericValue: metrics.complianceRescueOpportunities,
      tone: metrics.complianceRescueOpportunities > 0 ? 'warning' : 'success',
      description: 'Patients likely recoverable before compliance failure.'
    },
    {
      id: 'burden-index',
      label: 'Burden Index',
      value: `${metrics.operationalBurdenIndex}%`,
      numericValue: metrics.operationalBurdenIndex,
      tone: metrics.operationalBurdenIndex <= 45 ? 'success' : 'warning',
      description: 'Estimated load on operations team.'
    }
  ];
}

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    route: 'tenant/executiveMetrics',
    phase: '27A-live-executive-metrics',
    timestamp: nowIso()
  });
});

router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);

  try {
    const [signals, tasks] = await Promise.all([
      readSignals(tenantId),
      readTasks(tenantId)
    ]);

    const metrics = calculateExecutiveMetrics({ signals, tasks });
    const kpis = buildKpis(metrics);

    return res.json({
      ok: true,
      fallback: false,
      phase: '27A-live-executive-metrics',
      source: 'executive-metrics-live-aggregator',
      tenantId,
      tenant_id: tenantId,
      readinessStatus: metrics.readinessStatus,
      readiness_status: metrics.readinessStatus,
      metrics,
      summary: {
        readinessStatus: metrics.readinessStatus,
        readinessScore: metrics.readinessScore,
        operationalEfficiency: metrics.operationalEfficiency,
        unresolvedRiskLoad: metrics.unresolvedRiskLoad,
        activeInterventionLoad: metrics.activeInterventionLoad,
        complianceRescueOpportunities: metrics.complianceRescueOpportunities,
        highRiskPatients: metrics.highRiskPatients,
        taskPressureIndex: metrics.taskPressureIndex,
        operationalBurdenIndex: metrics.operationalBurdenIndex
      },
      kpis,
      items: kpis,
      rows: kpis,
      generatedAt: nowIso()
    });
  } catch (error) {
    const signals = demoSignals(tenantId);
    const tasks = demoTasks(tenantId);
    const metrics = calculateExecutiveMetrics({ signals, tasks });
    const kpis = buildKpis(metrics);

    return res.json({
      ok: true,
      fallback: true,
      phase: '27A-live-executive-metrics',
      source: 'executive-metrics-safe-fallback',
      tenantId,
      tenant_id: tenantId,
      readinessStatus: metrics.readinessStatus,
      readiness_status: metrics.readinessStatus,
      metrics,
      summary: {
        readinessStatus: metrics.readinessStatus,
        readinessScore: metrics.readinessScore,
        operationalEfficiency: metrics.operationalEfficiency,
        unresolvedRiskLoad: metrics.unresolvedRiskLoad,
        activeInterventionLoad: metrics.activeInterventionLoad,
        complianceRescueOpportunities: metrics.complianceRescueOpportunities,
        highRiskPatients: metrics.highRiskPatients,
        taskPressureIndex: metrics.taskPressureIndex,
        operationalBurdenIndex: metrics.operationalBurdenIndex
      },
      kpis,
      items: kpis,
      rows: kpis,
      warning: error.message || 'Executive metrics fallback used.',
      generatedAt: nowIso()
    });
  }
});

module.exports = router;