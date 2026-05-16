'use strict';

const express = require('express');

const router = express.Router();

let cachedDb = null;

function loadDb() {
  if (cachedDb) return cachedDb;

  const candidates = [
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

function readTenantId(req) {
  return (
    req.headers['x-tenant-id'] ||
    req.query.tenantId ||
    req.query.tenant_id ||
    req.body?.tenantId ||
    req.body?.tenant_id ||
    'raftopoulos-live'
  );
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeStatus(value) {
  const clean = String(value || 'open').trim().toLowerCase();

  if (['open', 'pending', 'in_progress', 'escalated', 'done', 'resolved', 'completed'].includes(clean)) {
    return clean;
  }

  return 'open';
}

function normalizePriority(value) {
  const clean = String(value || 'medium').trim().toLowerCase();

  if (['critical', 'high', 'medium', 'low', 'warning'].includes(clean)) {
    return clean;
  }

  return 'medium';
}

function normalizeTask(row = {}) {
  const status = normalizeStatus(row.status);
  const priority = normalizePriority(row.priority);

  return {
    id: row.id,
    taskId: row.id,
    task_id: row.id,

    tenantId: row.tenant_id,
    tenant_id: row.tenant_id,

    title: row.title || 'Untitled task',
    description: row.description || row.title || 'Task',

    patientName: row.patient_name,
    patient_name: row.patient_name,
    patientEmail: row.patient_email,
    patient_email: row.patient_email,

    owner: row.owner || 'Operations Admin',

    priority,
    status,
    taskStatus: status,
    task_status: status,

    source: row.source || 'ATLAS',
    sourceType: row.source_type || row.source || 'ATLAS',
    source_type: row.source_type || row.source || 'ATLAS',

    signalId: row.signal_id,
    signal_id: row.signal_id,
    linkedSignalId: row.linked_signal_id || row.signal_id,
    linked_signal_id: row.linked_signal_id || row.signal_id,

    actionGroupName: row.action_group_name || 'ATLAS Follow-up',
    action_group_name: row.action_group_name || 'ATLAS Follow-up',

    dueAt: row.due_at,
    due_at: row.due_at,

    metadata: row.metadata || {},

    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
}

function calculateSummary(tasks = []) {
  return {
    total: tasks.length,
    open: tasks.filter((task) => ['open', 'pending'].includes(task.status)).length,
    pending: tasks.filter((task) => ['open', 'pending'].includes(task.status)).length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    escalated: tasks.filter((task) => task.status === 'escalated').length,
    done: tasks.filter((task) => ['done', 'resolved', 'completed'].includes(task.status)).length,
    critical: tasks.filter((task) => task.priority === 'critical').length,
    high: tasks.filter((task) => task.priority === 'high').length,
    medium: tasks.filter((task) => task.priority === 'medium').length,
    low: tasks.filter((task) => task.priority === 'low').length,
    warnings: 0,
    failed: 0,
    criticalFailed: 0
  };
}

async function ensureTasksTable() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS atlas_tasks (
      id text PRIMARY KEY,
      tenant_id text NOT NULL DEFAULT 'raftopoulos-live',
      title text NOT NULL,
      description text,
      patient_name text,
      patient_email text,
      owner text DEFAULT 'Operations Admin',
      priority text DEFAULT 'medium',
      status text DEFAULT 'open',
      source text DEFAULT 'ATLAS',
      source_type text DEFAULT 'ATLAS',
      signal_id text,
      linked_signal_id text,
      action_group_name text DEFAULT 'ATLAS Follow-up',
      due_at timestamp with time zone,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    )
  `);

  await dbQuery(`
    ALTER TABLE atlas_tasks
      ADD COLUMN IF NOT EXISTS tenant_id text DEFAULT 'raftopoulos-live',
      ADD COLUMN IF NOT EXISTS title text,
      ADD COLUMN IF NOT EXISTS description text,
      ADD COLUMN IF NOT EXISTS patient_name text,
      ADD COLUMN IF NOT EXISTS patient_email text,
      ADD COLUMN IF NOT EXISTS owner text DEFAULT 'Operations Admin',
      ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS status text DEFAULT 'open',
      ADD COLUMN IF NOT EXISTS source text DEFAULT 'ATLAS',
      ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'ATLAS',
      ADD COLUMN IF NOT EXISTS signal_id text,
      ADD COLUMN IF NOT EXISTS linked_signal_id text,
      ADD COLUMN IF NOT EXISTS action_group_name text DEFAULT 'ATLAS Follow-up',
      ADD COLUMN IF NOT EXISTS due_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()
  `);
}

function buildSeedTasks(tenantId) {
  return [
    {
      id: 'task-raftop-001',
      tenant_id: tenantId,
      title: 'Call high-risk CPAP patient',
      description: 'Patient is below 80h/month usage. Verify mask comfort, leak, usage barriers and coaching needs.',
      patient_name: 'ΚΟΥΤΡΩΤΣΙΟΣ ΔΗΜΗΤΡΙΟΣ',
      patient_email: 'masked@patient.gr',
      owner: 'CPAP Operations',
      priority: 'high',
      status: 'open',
      source: 'ATLAS',
      source_type: 'patient_signal',
      signal_id: 'sig-raftop-001',
      linked_signal_id: 'sig-raftop-001',
      action_group_name: 'Low usage intervention',
      due_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      metadata: {
        nextBestAction: 'Call patient within 48h',
        complianceReference: '80h/month',
        commercialDemoSafe: true
      }
    },
    {
      id: 'task-raftop-002',
      tenant_id: tenantId,
      title: 'Early coaching call for new CPAP start',
      description: 'New patient in first 14 days. Prevent early abandonment with coaching and setup review.',
      patient_name: 'Γεώργιος Παπαδόπουλος',
      patient_email: 'masked@patient.gr',
      owner: 'Patient Success',
      priority: 'medium',
      status: 'open',
      source: 'ATLAS',
      source_type: 'early_adherence',
      signal_id: 'sig-raftop-002',
      linked_signal_id: 'sig-raftop-002',
      action_group_name: 'Early adherence protection',
      due_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      metadata: {
        nextBestAction: 'Schedule coaching call',
        commercialDemoSafe: true
      }
    },
    {
      id: 'task-raftop-003',
      tenant_id: tenantId,
      title: 'Prepare doctor-facing compliance summary',
      description: 'Prepare short compliance progress update for referring physician.',
      patient_name: 'Μαρία Κωνσταντίνου',
      patient_email: 'masked@patient.gr',
      owner: 'Doctor Channel',
      priority: 'medium',
      status: 'in_progress',
      source: 'REPORTING',
      source_type: 'doctor_report',
      signal_id: 'sig-raftop-003',
      linked_signal_id: 'sig-raftop-003',
      action_group_name: 'Doctor channel reporting',
      due_at: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
      metadata: {
        nextBestAction: 'Send concise doctor report',
        commercialDemoSafe: true
      }
    },
    {
      id: 'task-raftop-004',
      tenant_id: tenantId,
      title: 'Review closed-loop pilot readiness',
      description: 'Confirm blockers, cohort readiness, task ownership and weekly review rhythm.',
      patient_name: null,
      patient_email: null,
      owner: 'Project Owner',
      priority: 'low',
      status: 'open',
      source: 'CLOSED_LOOP',
      source_type: 'pilot_readiness',
      signal_id: null,
      linked_signal_id: null,
      action_group_name: 'Pilot readiness',
      due_at: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
      metadata: {
        nextBestAction: 'Confirm pilot kickoff readiness',
        commercialDemoSafe: true
      }
    }
  ];
}

async function seedTasksIfEmpty(tenantId) {
  const existing = await dbQuery(
    `
      SELECT COUNT(*)::int AS count
      FROM atlas_tasks
      WHERE tenant_id = $1::text
    `,
    [tenantId]
  );

  const count = Number(existing.rows?.[0]?.count || 0);

  if (count > 0) return;

  const seeds = buildSeedTasks(tenantId);

  for (const task of seeds) {
    await dbQuery(
      `
        INSERT INTO atlas_tasks (
          id,
          tenant_id,
          title,
          description,
          patient_name,
          patient_email,
          owner,
          priority,
          status,
          source,
          source_type,
          signal_id,
          linked_signal_id,
          action_group_name,
          due_at,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1::text,
          $2::text,
          $3::text,
          $4::text,
          $5::text,
          $6::text,
          $7::text,
          $8::text,
          $9::text,
          $10::text,
          $11::text,
          $12::text,
          $13::text,
          $14::text,
          $15::timestamptz,
          $16::jsonb,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        task.id,
        task.tenant_id,
        task.title,
        task.description,
        task.patient_name,
        task.patient_email,
        task.owner,
        task.priority,
        task.status,
        task.source,
        task.source_type,
        task.signal_id,
        task.linked_signal_id,
        task.action_group_name,
        task.due_at,
        JSON.stringify(task.metadata || {})
      ]
    );
  }
}

async function listTasks(tenantId) {
  await ensureTasksTable();
  await seedTasksIfEmpty(tenantId);

  const result = await dbQuery(
    `
      SELECT *
      FROM atlas_tasks
      WHERE tenant_id = $1::text
        AND COALESCE(status, '') <> 'duplicate_archived'
      ORDER BY
        CASE
          WHEN priority = 'critical' THEN 0
          WHEN priority = 'high' THEN 1
          WHEN priority = 'medium' THEN 2
          WHEN priority = 'low' THEN 3
          ELSE 4
        END ASC,
        created_at DESC NULLS LAST
      LIMIT 200
    `,
    [tenantId]
  );

  return (result.rows || []).map(normalizeTask);
}

async function updateTaskStatus(taskId, tenantId, status) {
  await ensureTasksTable();

  const cleanStatus = normalizeStatus(status);

  const result = await dbQuery(
    `
      UPDATE atlas_tasks
      SET
        status = $3::text,
        updated_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb
      WHERE id = $1::text
        AND tenant_id = $2::text
      RETURNING *
    `,
    [
      taskId,
      tenantId,
      cleanStatus,
      JSON.stringify({
        lastStatusChangeAt: nowIso(),
        lastStatus: cleanStatus,
        source: 'tasks-unified'
      })
    ]
  );

  return result.rows?.[0] ? normalizeTask(result.rows[0]) : null;
}

function fallbackTasks(tenantId) {
  return buildSeedTasks(tenantId).map((task) =>
    normalizeTask({
      ...task,
      created_at: nowIso(),
      updated_at: nowIso()
    })
  );
}

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    route: 'tenant/unifiedTasks',
    phase: '25B-real-unified-tasks',
    dbBacked: true,
    transitions: ['start', 'escalate', 'resolve', 'reopen'],
    timestamp: nowIso()
  });
});

router.get('/', async (req, res) => {
  const tenantId = readTenantId(req);

  try {
    const tasks = await listTasks(tenantId);

    return res.json({
      ok: true,
      fallback: false,
      phase: '25B-real-unified-tasks',
      tenantId,
      tenant_id: tenantId,
      summary: calculateSummary(tasks),
      tasks,
      items: tasks,
      rows: tasks,
      total: tasks.length,
      generatedAt: nowIso(),
      data: {
        ok: true,
        fallback: false,
        phase: '25B-real-unified-tasks',
        tenantId,
        tenant_id: tenantId,
        summary: calculateSummary(tasks),
        tasks,
        items: tasks,
        rows: tasks,
        total: tasks.length
      }
    });
  } catch (error) {
    const tasks = fallbackTasks(tenantId);

    return res.json({
      ok: true,
      fallback: true,
      phase: '25B-real-unified-tasks',
      tenantId,
      tenant_id: tenantId,
      summary: calculateSummary(tasks),
      tasks,
      items: tasks,
      rows: tasks,
      total: tasks.length,
      generatedAt: nowIso(),
      warning: error.message || 'DB unavailable. Returned operational fallback tasks.',
      data: {
        ok: true,
        fallback: true,
        phase: '25B-real-unified-tasks',
        tenantId,
        tenant_id: tenantId,
        summary: calculateSummary(tasks),
        tasks,
        items: tasks,
        rows: tasks,
        total: tasks.length
      }
    });
  }
});

router.get('/:taskId', async (req, res) => {
  const tenantId = readTenantId(req);

  try {
    const tasks = await listTasks(tenantId);
    const task = tasks.find((item) => item.id === req.params.taskId) || null;

    if (!task) {
      return res.status(404).json({
        ok: false,
        fallback: false,
        message: `Task not found: ${req.params.taskId}`
      });
    }

    return res.json({
      ok: true,
      fallback: false,
      task,
      data: task
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      message: error.message || 'Unified task detail endpoint failed.'
    });
  }
});

router.patch('/:taskId/status', async (req, res) => {
  const tenantId = readTenantId(req);
  const requestedStatus = req.body?.status || req.body?.nextStatus || req.body?.next_status || 'open';

  try {
    const task = await updateTaskStatus(req.params.taskId, tenantId, requestedStatus);

    if (!task) {
      return res.status(404).json({
        ok: false,
        fallback: false,
        message: `Task not found: ${req.params.taskId}`
      });
    }

    return res.json({
      ok: true,
      fallback: false,
      phase: '25B-real-unified-tasks',
      task,
      updatedTask: task,
      data: {
        task,
        updatedTask: task
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      message: error.message || 'Task status update failed.'
    });
  }
});

router.post('/:taskId/start', async (req, res) => {
  req.body = {
    ...(req.body || {}),
    status: 'in_progress'
  };

  return router.handle(req, res);
});

router.post('/:taskId/escalate', async (req, res) => {
  const tenantId = readTenantId(req);

  try {
    const task = await updateTaskStatus(req.params.taskId, tenantId, 'escalated');

    if (!task) {
      return res.status(404).json({
        ok: false,
        fallback: false,
        message: `Task not found: ${req.params.taskId}`
      });
    }

    return res.json({
      ok: true,
      fallback: false,
      action: 'escalate',
      task,
      updatedTask: task,
      data: { task, updatedTask: task }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      message: error.message || 'Escalate task failed.'
    });
  }
});

router.post('/:taskId/resolve', async (req, res) => {
  const tenantId = readTenantId(req);

  try {
    const task = await updateTaskStatus(req.params.taskId, tenantId, 'done');

    if (!task) {
      return res.status(404).json({
        ok: false,
        fallback: false,
        message: `Task not found: ${req.params.taskId}`
      });
    }

    return res.json({
      ok: true,
      fallback: false,
      action: 'resolve',
      task,
      updatedTask: task,
      data: { task, updatedTask: task }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      message: error.message || 'Resolve task failed.'
    });
  }
});

router.post('/:taskId/reopen', async (req, res) => {
  const tenantId = readTenantId(req);

  try {
    const task = await updateTaskStatus(req.params.taskId, tenantId, 'open');

    if (!task) {
      return res.status(404).json({
        ok: false,
        fallback: false,
        message: `Task not found: ${req.params.taskId}`
      });
    }

    return res.json({
      ok: true,
      fallback: false,
      action: 'reopen',
      task,
      updatedTask: task,
      data: { task, updatedTask: task }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      message: error.message || 'Reopen task failed.'
    });
  }
});

module.exports = router;