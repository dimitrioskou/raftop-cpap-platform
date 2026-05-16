'use strict';

const crypto = require('crypto');
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

function nowIso() {
  return new Date().toISOString();
}

function getTenantId(req, row = {}) {
  return (
    req.user?.tenant_id ||
    req.user?.tenantId ||
    req.headers['x-tenant-id'] ||
    req.query.tenant_id ||
    req.query.tenantId ||
    req.body?.tenant_id ||
    req.body?.tenantId ||
    row.tenant_id ||
    row.tenantId ||
    'raftopoulos-live'
  );
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function upper(value, fallback = 'UNKNOWN') {
  return String(value || fallback).trim().toUpperCase();
}

function lower(value, fallback = '') {
  return String(value || fallback).trim().toLowerCase();
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return null;
}

function safeJson(value, fallback = {}) {
  if (!value) return fallback;

  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
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

async function ensureAtlasTasksTable() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS atlas_tasks (
      id text PRIMARY KEY,
      tenant_id text NOT NULL DEFAULT 'raftopoulos-live',
      title text,
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
      linked_task_id text,
      action_group_name text DEFAULT 'ATLAS Action Center',
      source_action_id text,
      source_ref text,
      writeback_status text,
      signal_writeback_status text,
      writeback_synced_at timestamp with time zone,
      writeback_events jsonb DEFAULT '[]'::jsonb,
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
      ADD COLUMN IF NOT EXISTS linked_task_id text,
      ADD COLUMN IF NOT EXISTS action_group_name text DEFAULT 'ATLAS Action Center',
      ADD COLUMN IF NOT EXISTS source_action_id text,
      ADD COLUMN IF NOT EXISTS source_ref text,
      ADD COLUMN IF NOT EXISTS writeback_status text,
      ADD COLUMN IF NOT EXISTS signal_writeback_status text,
      ADD COLUMN IF NOT EXISTS writeback_synced_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS writeback_events jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS due_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()
  `);
}

function buildSeedActionItems(tenantId) {
  return [
    {
      id: 'action-raftop-001',
      tenant_id: tenantId,
      title: 'Low usage intervention required',
      description: 'Patient is below 80h/month compliance reference point.',
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
      source_action_id: 'action-raftop-001',
      source_ref: 'sig-raftop-001',
      due_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      metadata: {
        nextBestAction: 'Create follow-up task and call patient within 48h.',
        commercialDemoSafe: true
      }
    },
    {
      id: 'action-raftop-002',
      tenant_id: tenantId,
      title: 'Early CPAP adherence coaching',
      description: 'New CPAP patient needs early coaching during first 14 days.',
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
      source_action_id: 'action-raftop-002',
      source_ref: 'sig-raftop-002',
      due_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      metadata: {
        nextBestAction: 'Create coaching task and review setup comfort.',
        commercialDemoSafe: true
      }
    },
    {
      id: 'action-raftop-003',
      tenant_id: tenantId,
      title: 'Doctor compliance report ready',
      description: 'Prepare and send doctor-facing compliance progress report.',
      patient_name: 'Μαρία Κωνσταντίνου',
      patient_email: 'masked@patient.gr',
      owner: 'Doctor Channel',
      priority: 'medium',
      status: 'open',
      source: 'REPORTING',
      source_type: 'doctor_report',
      signal_id: 'sig-raftop-003',
      linked_signal_id: 'sig-raftop-003',
      action_group_name: 'Doctor channel reporting',
      source_action_id: 'action-raftop-003',
      source_ref: 'sig-raftop-003',
      due_at: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
      metadata: {
        nextBestAction: 'Create report delivery task.',
        commercialDemoSafe: true
      }
    }
  ];
}

async function seedActionsIfEmpty(tenantId) {
  await ensureAtlasTasksTable();

  const result = await dbQuery(
    `
      SELECT COUNT(*)::int AS count
      FROM atlas_tasks
      WHERE tenant_id = $1::text
        AND id LIKE 'action-raftop-%'
    `,
    [tenantId]
  );

  if (Number(result.rows?.[0]?.count || 0) > 0) return;

  for (const item of buildSeedActionItems(tenantId)) {
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
          source_action_id,
          source_ref,
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
          $15::text,
          $16::text,
          $17::timestamptz,
          $18::jsonb,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        item.id,
        item.tenant_id,
        item.title,
        item.description,
        item.patient_name,
        item.patient_email,
        item.owner,
        item.priority,
        item.status,
        item.source,
        item.source_type,
        item.signal_id,
        item.linked_signal_id,
        item.action_group_name,
        item.source_action_id,
        item.source_ref,
        item.due_at,
        JSON.stringify(item.metadata || {})
      ]
    );
  }
}

function normalizeAction(row = {}) {
  const metadata = safeJson(row.metadata, {});
  const priority = lower(row.priority, 'medium');
  const rawStatus = lower(row.status, 'open');
  const linkedTaskId = firstValue(row.linked_task_id, metadata.createdTaskId, metadata.created_task_id);
  const writebackStatus = lower(row.writeback_status || row.signal_writeback_status, '');

  const isHandled =
    Boolean(linkedTaskId) ||
    ['synced', 'done', 'resolved', 'completed'].includes(writebackStatus) ||
    ['done', 'resolved', 'completed'].includes(rawStatus);

  const operationalStatus = isHandled ? 'task_linked_handled' : rawStatus;
  const operationalLabel = isHandled ? 'Task Linked / Handled' : 'Open';

  return {
    id: row.id,
    actionId: row.id,
    action_id: row.id,

    tenantId: row.tenant_id,
    tenant_id: row.tenant_id,

    title: row.title || 'ATLAS action',
    description: row.description || row.title || 'ATLAS action',

    patientName: row.patient_name,
    patient_name: row.patient_name,
    patientEmail: row.patient_email,
    patient_email: row.patient_email,

    owner: row.owner || 'Operations Admin',

    priority,
    severity: upper(priority, 'MEDIUM'),

    status: operationalStatus,
    rawStatus,
    raw_status: rawStatus,
    operationalStatus,
    operational_status: operationalStatus,
    operationalLabel,
    operational_label: operationalLabel,

    source: row.source || 'ATLAS',
    sourceType: row.source_type || row.source || 'ATLAS',
    source_type: row.source_type || row.source || 'ATLAS',

    signalId: firstValue(row.signal_id, row.linked_signal_id),
    signal_id: firstValue(row.signal_id, row.linked_signal_id),
    linkedSignalId: firstValue(row.linked_signal_id, row.signal_id),
    linked_signal_id: firstValue(row.linked_signal_id, row.signal_id),

    linkedTaskId,
    linked_task_id: linkedTaskId,

    actionGroupName: row.action_group_name || 'ATLAS Action Center',
    action_group_name: row.action_group_name || 'ATLAS Action Center',

    sourceActionId: row.source_action_id || row.id,
    source_action_id: row.source_action_id || row.id,
    sourceRef: row.source_ref || row.signal_id || row.linked_signal_id || row.id,
    source_ref: row.source_ref || row.signal_id || row.linked_signal_id || row.id,

    writebackStatus: row.writeback_status,
    writeback_status: row.writeback_status,
    signalWritebackStatus: row.signal_writeback_status,
    signal_writeback_status: row.signal_writeback_status,
    writebackSyncedAt: row.writeback_synced_at,
    writeback_synced_at: row.writeback_synced_at,

    nextBestAction:
      metadata.nextBestAction ||
      metadata.next_best_action ||
      'Create or review follow-up task.',

    next_best_action:
      metadata.nextBestAction ||
      metadata.next_best_action ||
      'Create or review follow-up task.',

    canCreateTask: !linkedTaskId,
    can_create_task: !linkedTaskId,

    metadata,

    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    dueAt: row.due_at,
    due_at: row.due_at,

    badges: [
      {
        label: row.action_group_name || row.source_type || 'ATLAS',
        tone: ['critical', 'high'].includes(priority) ? 'danger' : 'neutral'
      },
      {
        label: linkedTaskId ? 'TASK LINKED' : 'CREATE TASK',
        tone: linkedTaskId ? 'success' : 'warning'
      },
      {
        label: operationalLabel,
        tone: isHandled ? 'success' : 'neutral'
      }
    ]
  };
}

function calculateSummary(items = []) {
  return {
    total: items.length,
    critical: items.filter((item) => ['critical'].includes(item.priority)).length,
    warning: items.filter((item) => ['high', 'warning'].includes(item.priority)).length,
    createTaskNow: items.filter((item) => item.canCreateTask).length,
    taskCreated: items.filter((item) => item.linkedTaskId).length,
    handled: items.filter((item) => item.isOperationallyHandled || item.operationalStatus === 'task_linked_handled').length,
    writeback: {
      synced: items.filter((item) => lower(item.writebackStatus) === 'synced').length,
      partial: items.filter((item) => lower(item.writebackStatus) === 'partial').length,
      failed: items.filter((item) => ['failed', 'error'].includes(lower(item.writebackStatus))).length,
      pending: items.filter((item) => lower(item.writebackStatus) === 'pending').length,
      noWriteback: items.filter((item) => !item.writebackStatus).length
    }
  };
}

async function listActionCenterItems(tenantId) {
  await ensureAtlasTasksTable();
  await seedActionsIfEmpty(tenantId);

  const result = await dbQuery(
    `
      SELECT *
      FROM atlas_tasks
      WHERE tenant_id = $1::text
        AND (
          id LIKE 'action-%'
          OR source_type IN ('patient_signal', 'early_adherence', 'doctor_report', 'ATLAS')
          OR source IN ('ATLAS', 'REPORTING')
        )
      ORDER BY
        CASE
          WHEN linked_task_id IS NULL OR linked_task_id = '' THEN 0
          ELSE 1
        END ASC,
        CASE
          WHEN priority = 'critical' THEN 0
          WHEN priority = 'high' THEN 1
          WHEN priority = 'medium' THEN 2
          WHEN priority = 'low' THEN 3
          ELSE 4
        END ASC,
        created_at DESC NULLS LAST
      LIMIT 100
    `,
    [tenantId]
  );

  return (result.rows || []).map(normalizeAction);
}

async function findAction(actionId, tenantId) {
  await ensureAtlasTasksTable();

  const result = await dbQuery(
    `
      SELECT *
      FROM atlas_tasks
      WHERE tenant_id = $2::text
        AND (
          id = $1::text
          OR source_action_id = $1::text
          OR source_ref = $1::text
          OR signal_id = $1::text
          OR linked_signal_id = $1::text
        )
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1
    `,
    [actionId, tenantId]
  );

  return result.rows?.[0] || null;
}

async function createTaskFromAction({ action, tenantId, body = {} }) {
  await ensureAtlasTasksTable();

  const actionNormalized = normalizeAction(action);
  const existingTaskId = actionNormalized.linkedTaskId;

  if (existingTaskId) {
    const existing = await findAction(existingTaskId, tenantId);

    return {
      reusedExistingTask: true,
      createdTask: existing || { id: existingTaskId },
      createdTaskId: existingTaskId
    };
  }

  const createdTaskId = makeId('atlas-task');

  const title = firstValue(
    body.title,
    body.task_title,
    `Follow-up: ${actionNormalized.title}`
  );

  const description = firstValue(
    body.description,
    body.task_description,
    actionNormalized.nextBestAction,
    actionNormalized.description
  );

  const metadata = {
    ...(actionNormalized.metadata || {}),
    source: 'atlas_action_center',
    sourceActionId: actionNormalized.id,
    source_action_id: actionNormalized.id,
    linkedSignalId: actionNormalized.linkedSignalId,
    linked_signal_id: actionNormalized.linkedSignalId,
    createdFromActionCenter: true,
    createdAt: nowIso()
  };

  const insert = await dbQuery(
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
        source_action_id,
        source_ref,
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
        'open',
        'atlas_action_center',
        'followup_task',
        $9::text,
        $10::text,
        $11::text,
        $12::text,
        $13::text,
        $14::timestamptz,
        $15::jsonb,
        NOW(),
        NOW()
      )
      RETURNING *
    `,
    [
      createdTaskId,
      tenantId,
      title,
      description,
      actionNormalized.patientName || null,
      actionNormalized.patientEmail || null,
      body.owner || actionNormalized.owner || 'Operations Admin',
      lower(actionNormalized.priority, 'medium'),
      actionNormalized.signalId || null,
      actionNormalized.linkedSignalId || null,
      actionNormalized.actionGroupName || 'ATLAS Action Center',
      actionNormalized.id,
      actionNormalized.sourceRef || actionNormalized.linkedSignalId || actionNormalized.id,
      actionNormalized.dueAt || null,
      JSON.stringify(metadata)
    ]
  );

  await dbQuery(
    `
      UPDATE atlas_tasks
      SET
        linked_task_id = $3::text,
        writeback_status = 'synced',
        signal_writeback_status = CASE
          WHEN COALESCE(linked_signal_id, signal_id, '') = '' THEN 'skipped'
          ELSE 'synced'
        END,
        writeback_synced_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
        updated_at = NOW()
      WHERE id = $1::text
        AND tenant_id = $2::text
    `,
    [
      actionNormalized.id,
      tenantId,
      createdTaskId,
      JSON.stringify({
        linkedTaskId: createdTaskId,
        linked_task_id: createdTaskId,
        writebackStatus: 'synced',
        writeback_status: 'synced',
        lastAction: 'create_task',
        last_action: 'create_task',
        updatedAt: nowIso()
      })
    ]
  );

  return {
    reusedExistingTask: false,
    createdTask: insert.rows?.[0] || null,
    createdTaskId
  };
}

function fallbackItems(tenantId) {
  return buildSeedActionItems(tenantId).map((row) =>
    normalizeAction({
      ...row,
      created_at: nowIso(),
      updated_at: nowIso()
    })
  );
}

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    route: 'atlasActionCenterForceRoute',
    phase: '25E-real-action-center',
    dbBacked: true,
    createTaskNow: true,
    timestamp: nowIso()
  });
});

router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);

  try {
    const items = await listActionCenterItems(tenantId);

    return res.json({
      ok: true,
      fallback: false,
      phase: '25E-real-action-center',
      source: 'atlas-action-center-real',
      tenantId,
      tenant_id: tenantId,
      summary: calculateSummary(items),
      items,
      tasks: items,
      queue: items,
      rows: items,
      total: items.length,
      generatedAt: nowIso(),
      data: {
        ok: true,
        fallback: false,
        phase: '25E-real-action-center',
        tenantId,
        tenant_id: tenantId,
        summary: calculateSummary(items),
        items,
        tasks: items,
        queue: items,
        rows: items,
        total: items.length
      }
    });
  } catch (error) {
    const items = fallbackItems(tenantId);

    return res.json({
      ok: true,
      fallback: true,
      phase: '25E-real-action-center',
      source: 'atlas-action-center-fallback',
      tenantId,
      tenant_id: tenantId,
      summary: calculateSummary(items),
      items,
      tasks: items,
      queue: items,
      rows: items,
      total: items.length,
      warning: error.message || 'Action Center DB unavailable. Returned fallback actions.',
      generatedAt: nowIso(),
      data: {
        ok: true,
        fallback: true,
        phase: '25E-real-action-center',
        tenantId,
        tenant_id: tenantId,
        summary: calculateSummary(items),
        items,
        tasks: items,
        queue: items,
        rows: items,
        total: items.length
      }
    });
  }
});

router.get('/summary', async (req, res) => {
  const tenantId = getTenantId(req);

  try {
    const items = await listActionCenterItems(tenantId);

    return res.json({
      ok: true,
      fallback: false,
      tenantId,
      tenant_id: tenantId,
      summary: calculateSummary(items),
      generatedAt: nowIso(),
      data: calculateSummary(items)
    });
  } catch (error) {
    const items = fallbackItems(tenantId);

    return res.json({
      ok: true,
      fallback: true,
      tenantId,
      tenant_id: tenantId,
      summary: calculateSummary(items),
      warning: error.message || 'Action Center summary fallback used.',
      generatedAt: nowIso(),
      data: calculateSummary(items)
    });
  }
});

router.post('/:actionId/create-task', async (req, res) => {
  const tenantId = getTenantId(req);
  const actionId = firstValue(req.params.actionId, req.body?.actionId, req.body?.action_id);

  if (!actionId) {
    return res.status(400).json({
      ok: false,
      fallback: false,
      message: 'Missing actionId for ATLAS Action Center create-task.'
    });
  }

  try {
    const action = await findAction(actionId, tenantId);

    if (!action) {
      return res.status(404).json({
        ok: false,
        fallback: false,
        message: `Action not found: ${actionId}`
      });
    }

    const result = await createTaskFromAction({
      action,
      tenantId,
      body: req.body || {}
    });

    const items = await listActionCenterItems(tenantId);
    const updatedAction = items.find((item) => item.id === action.id) || null;

    return res.json({
      ok: true,
      fallback: false,
      phase: '25E-real-action-center',
      action: 'create_task',
      reusedExistingTask: result.reusedExistingTask,
      createdTask: result.createdTask,
      createdTaskId: result.createdTaskId,
      task: updatedAction,
      updatedTask: updatedAction,
      writeback: {
        status: 'synced',
        signalStatus: updatedAction?.linkedSignalId ? 'synced' : 'skipped',
        syncedAt: nowIso(),
        error: null
      },
      data: {
        ok: true,
        action: 'create_task',
        reusedExistingTask: result.reusedExistingTask,
        createdTask: result.createdTask,
        createdTaskId: result.createdTaskId,
        task: updatedAction,
        updatedTask: updatedAction
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      phase: '25E-real-action-center',
      message: error.message || 'ATLAS Action Center create-task failed.'
    });
  }
});

module.exports = router;