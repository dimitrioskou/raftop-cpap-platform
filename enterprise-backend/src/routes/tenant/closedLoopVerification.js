'use strict';

const crypto = require('crypto');
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

  let lastError = null;

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(candidate);

      if (mod && (typeof mod.query === 'function' || mod.pool || mod.default)) {
        cachedDb = mod;
        return cachedDb;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Unable to load DB in closedLoopVerification route. Last error: ${
      lastError ? lastError.message : 'unknown'
    }`
  );
}

function getQueryExecutor() {
  const db = loadDb();

  if (db && typeof db.query === 'function') return db;
  if (db && db.pool && typeof db.pool.query === 'function') return db.pool;
  if (db && db.default && typeof db.default.query === 'function') return db.default;
  if (db && db.default && db.default.pool && typeof db.default.pool.query === 'function') {
    return db.default.pool;
  }

  throw new Error('DB module loaded, but no query executor was found.');
}

async function query(text, params = []) {
  const executor = getQueryExecutor();
  return executor.query(text, params);
}

function safeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return null;
}

function parseJsonObject(value) {
  if (!value) return {};

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_error) {
      return {};
    }
  }

  return {};
}

function parseJsonArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === 'object') {
    if (Array.isArray(value.events)) return value.events;
    if (Array.isArray(value.logs)) return value.logs;
    if (Array.isArray(value.history)) return value.history;
    return [];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.events)) return parsed.events;
      if (parsed && Array.isArray(parsed.logs)) return parsed.logs;
      if (parsed && Array.isArray(parsed.history)) return parsed.history;

      return [];
    } catch (_error) {
      return [];
    }
  }

  return [];
}

function makeVerificationId() {
  return `clv-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

async function ensureAtlasTasksTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS atlas_tasks (
      id text PRIMARY KEY,
      tenant_id text NOT NULL DEFAULT '1',
      case_id text,
      patient_name text,
      title text,
      owner text,
      priority text DEFAULT 'medium',
      status text DEFAULT 'open',
      due_at timestamp with time zone,
      action_group_name text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    )
  `);

  await query(`
    ALTER TABLE atlas_tasks
      ADD COLUMN IF NOT EXISTS description text,
      ADD COLUMN IF NOT EXISTS patient_email text,
      ADD COLUMN IF NOT EXISTS linked_signal_id text,
      ADD COLUMN IF NOT EXISTS signal_id text,
      ADD COLUMN IF NOT EXISTS atlas_signal_id text,
      ADD COLUMN IF NOT EXISTS coaching_context_id text,
      ADD COLUMN IF NOT EXISTS linked_coaching_context_id text,
      ADD COLUMN IF NOT EXISTS patient_coaching_context_id text,
      ADD COLUMN IF NOT EXISTS source_type text,
      ADD COLUMN IF NOT EXISTS source text,
      ADD COLUMN IF NOT EXISTS module text,
      ADD COLUMN IF NOT EXISTS action_type text,
      ADD COLUMN IF NOT EXISTS task_type text,
      ADD COLUMN IF NOT EXISTS linked_task_id text,
      ADD COLUMN IF NOT EXISTS source_action_id text,
      ADD COLUMN IF NOT EXISTS source_ref text,
      ADD COLUMN IF NOT EXISTS writeback_status text,
      ADD COLUMN IF NOT EXISTS signal_writeback_status text,
      ADD COLUMN IF NOT EXISTS coaching_writeback_status text,
      ADD COLUMN IF NOT EXISTS writeback_synced_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS writeback_error text,
      ADD COLUMN IF NOT EXISTS writeback_events jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS duplicate_group_key text,
      ADD COLUMN IF NOT EXISTS duplicate_rank integer,
      ADD COLUMN IF NOT EXISTS duplicate_archived_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS duplicate_keep_reason text
  `);
}

async function ensureAtlasSignalsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS atlas_signals (
      id text PRIMARY KEY,
      tenant_id text,
      patient_name text,
      patient_email text,
      title text,
      description text,
      priority text DEFAULT 'medium',
      status text DEFAULT 'open',
      task_status text DEFAULT 'pending',
      followup_status text DEFAULT 'pending',
      source_type text DEFAULT 'closed_loop_verification',
      source_action_id text,
      source_ref text,
      last_task_action text,
      last_action text,
      last_action_by text,
      last_action_payload jsonb DEFAULT '{}'::jsonb,
      last_writeback_at timestamp with time zone,
      writeback_synced_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      metadata jsonb DEFAULT '{}'::jsonb
    )
  `);

  await query(`
    ALTER TABLE atlas_signals
      ADD COLUMN IF NOT EXISTS tenant_id text,
      ADD COLUMN IF NOT EXISTS patient_name text,
      ADD COLUMN IF NOT EXISTS patient_email text,
      ADD COLUMN IF NOT EXISTS title text,
      ADD COLUMN IF NOT EXISTS description text,
      ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS status text DEFAULT 'open',
      ADD COLUMN IF NOT EXISTS task_status text DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS followup_status text DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'closed_loop_verification',
      ADD COLUMN IF NOT EXISTS source_action_id text,
      ADD COLUMN IF NOT EXISTS source_ref text,
      ADD COLUMN IF NOT EXISTS last_task_action text,
      ADD COLUMN IF NOT EXISTS last_action text,
      ADD COLUMN IF NOT EXISTS last_action_by text,
      ADD COLUMN IF NOT EXISTS last_action_payload jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS last_writeback_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS writeback_synced_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb
  `);
}

async function ensureVerificationAuditTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS closed_loop_verifications (
      id text PRIMARY KEY,
      tenant_id text DEFAULT '1',
      task_id text,
      signal_id text,
      source_action_id text,
      verdict text NOT NULL DEFAULT 'unknown',
      passed_count integer DEFAULT 0,
      warning_count integer DEFAULT 0,
      failed_count integer DEFAULT 0,
      checks jsonb DEFAULT '[]'::jsonb,
      evidence jsonb DEFAULT '{}'::jsonb,
      query_params jsonb DEFAULT '{}'::jsonb,
      task_snapshot jsonb DEFAULT '{}'::jsonb,
      signal_snapshot jsonb DEFAULT '{}'::jsonb,
      phase text DEFAULT '19.33-closed-loop-verification-dashboard-summary',
      created_at timestamp with time zone DEFAULT now()
    )
  `);

  await query(`
    ALTER TABLE closed_loop_verifications
      ADD COLUMN IF NOT EXISTS tenant_id text DEFAULT '1',
      ADD COLUMN IF NOT EXISTS task_id text,
      ADD COLUMN IF NOT EXISTS signal_id text,
      ADD COLUMN IF NOT EXISTS source_action_id text,
      ADD COLUMN IF NOT EXISTS verdict text NOT NULL DEFAULT 'unknown',
      ADD COLUMN IF NOT EXISTS passed_count integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS warning_count integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS failed_count integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS checks jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS evidence jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS query_params jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS task_snapshot jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS signal_snapshot jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS phase text DEFAULT '19.33-closed-loop-verification-dashboard-summary',
      ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_closed_loop_verifications_signal_id
    ON closed_loop_verifications (signal_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_closed_loop_verifications_task_id
    ON closed_loop_verifications (task_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_closed_loop_verifications_verdict
    ON closed_loop_verifications (verdict)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_closed_loop_verifications_created_at
    ON closed_loop_verifications (created_at DESC)
  `);
}

function normalizeTask(row = {}) {
  const linkedSignalId = firstValue(
    row.linked_signal_id,
    row.signal_id,
    row.atlas_signal_id,
    row.case_id
  );

  const writebackEvents = parseJsonArray(row.writeback_events);
  const metadata = parseJsonObject(row.metadata);

  return {
    ...row,

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

    priority: row.priority || 'medium',
    status: row.status || 'open',

    linkedSignalId,
    linked_signal_id: linkedSignalId,
    signalId: firstValue(row.signal_id, linkedSignalId),
    signal_id: firstValue(row.signal_id, linkedSignalId),
    atlasSignalId: firstValue(row.atlas_signal_id, linkedSignalId),
    atlas_signal_id: firstValue(row.atlas_signal_id, linkedSignalId),

    sourceActionId: row.source_action_id,
    source_action_id: row.source_action_id,
    sourceRef: row.source_ref,
    source_ref: row.source_ref,

    writebackStatus: row.writeback_status,
    writeback_status: row.writeback_status,
    signalWritebackStatus: row.signal_writeback_status,
    signal_writeback_status: row.signal_writeback_status,

    writebackSyncedAt: row.writeback_synced_at,
    writeback_synced_at: row.writeback_synced_at,
    writebackEvents,
    writeback_events: writebackEvents,

    metadata,

    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
}

function normalizeSignal(row = {}) {
  const payload = parseJsonObject(row.last_action_payload);
  const metadata = parseJsonObject(row.metadata);

  return {
    ...row,

    id: row.id,
    signalId: row.id,
    signal_id: row.id,

    tenantId: row.tenant_id,
    tenant_id: row.tenant_id,

    patientName: row.patient_name,
    patient_name: row.patient_name,
    patientEmail: row.patient_email,
    patient_email: row.patient_email,

    title: row.title || `Signal ${row.id}`,
    description: row.description || 'Signal',

    priority: row.priority || 'medium',
    status: row.status || 'open',

    taskStatus: row.task_status || 'pending',
    task_status: row.task_status || 'pending',

    followupStatus: row.followup_status || 'pending',
    followup_status: row.followup_status || 'pending',

    sourceActionId: row.source_action_id,
    source_action_id: row.source_action_id,
    sourceRef: row.source_ref,
    source_ref: row.source_ref,

    lastTaskAction: row.last_task_action,
    last_task_action: row.last_task_action,
    lastAction: row.last_action,
    last_action: row.last_action,

    lastActionPayload: payload,
    last_action_payload: payload,

    lastWritebackAt: row.last_writeback_at,
    last_writeback_at: row.last_writeback_at,
    writebackSyncedAt: row.writeback_synced_at,
    writeback_synced_at: row.writeback_synced_at,

    metadata,

    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
}

function normalizeVerificationRecord(row = {}) {
  return {
    ...row,

    id: row.id,

    tenantId: row.tenant_id,
    tenant_id: row.tenant_id,

    taskId: row.task_id,
    task_id: row.task_id,

    signalId: row.signal_id,
    signal_id: row.signal_id,

    sourceActionId: row.source_action_id,
    source_action_id: row.source_action_id,

    verdict: row.verdict || 'unknown',

    passedCount: row.passed_count || 0,
    passed_count: row.passed_count || 0,

    warningCount: row.warning_count || 0,
    warning_count: row.warning_count || 0,

    failedCount: row.failed_count || 0,
    failed_count: row.failed_count || 0,

    checks: parseJsonArray(row.checks),
    evidence: parseJsonObject(row.evidence),
    queryParams: parseJsonObject(row.query_params),
    query_params: parseJsonObject(row.query_params),
    taskSnapshot: parseJsonObject(row.task_snapshot),
    task_snapshot: parseJsonObject(row.task_snapshot),
    signalSnapshot: parseJsonObject(row.signal_snapshot),
    signal_snapshot: parseJsonObject(row.signal_snapshot),

    phase: row.phase,

    createdAt: row.created_at,
    created_at: row.created_at
  };
}

async function findTask({ taskId, signalId, sourceActionId }) {
  await ensureAtlasTasksTable();

  const filters = [];
  const params = [];

  if (taskId) {
    params.push(safeString(taskId));
    filters.push(`
      (
        id::text = $${params.length}::text
        OR linked_task_id::text = $${params.length}::text
      )
    `);
  }

  if (signalId) {
    params.push(safeString(signalId));
    filters.push(`
      (
        linked_signal_id::text = $${params.length}::text
        OR signal_id::text = $${params.length}::text
        OR atlas_signal_id::text = $${params.length}::text
        OR case_id::text = $${params.length}::text
        OR source_ref::text = $${params.length}::text
      )
    `);
  }

  if (sourceActionId) {
    params.push(safeString(sourceActionId));
    filters.push(`
      (
        source_action_id::text = $${params.length}::text
        OR source_ref::text = $${params.length}::text
      )
    `);
  }

  const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const result = await query(
    `
      SELECT *
      FROM atlas_tasks
      ${whereSql}
      ORDER BY
        CASE
          WHEN id::text = COALESCE($${params.length + 1}::text, '') THEN 0
          ELSE 1
        END ASC,
        updated_at DESC NULLS LAST,
        created_at DESC NULLS LAST
      LIMIT 1
    `,
    [...params, safeString(taskId)]
  );

  return result.rows && result.rows[0] ? normalizeTask(result.rows[0]) : null;
}

async function findSignal({ signalId, task }) {
  await ensureAtlasSignalsTable();

  const resolvedSignalId = firstValue(
    signalId,
    task && task.linked_signal_id,
    task && task.signal_id,
    task && task.atlas_signal_id,
    task && task.case_id
  );

  if (!resolvedSignalId) return null;

  const result = await query(
    `
      SELECT *
      FROM atlas_signals
      WHERE id::text = $1::text
      ORDER BY
        COALESCE(last_writeback_at, writeback_synced_at, updated_at, created_at) DESC NULLS LAST
      LIMIT 1
    `,
    [safeString(resolvedSignalId)]
  );

  return result.rows && result.rows[0] ? normalizeSignal(result.rows[0]) : null;
}

function getTaskId(task) {
  return firstValue(task && task.id, task && task.taskId, task && task.task_id);
}

function getTaskStatus(task) {
  return firstValue(task && task.status, task && task.taskStatus, task && task.task_status);
}

function getTaskSignalId(task) {
  return firstValue(
    task && task.linked_signal_id,
    task && task.linkedSignalId,
    task && task.signal_id,
    task && task.signalId,
    task && task.atlas_signal_id,
    task && task.atlasSignalId,
    task && task.case_id
  );
}

function getSignalId(signal) {
  return firstValue(signal && signal.id, signal && signal.signalId, signal && signal.signal_id);
}

function getSignalTaskStatus(signal) {
  return firstValue(signal && signal.task_status, signal && signal.taskStatus);
}

function getSignalFollowupStatus(signal) {
  return firstValue(signal && signal.followup_status, signal && signal.followupStatus);
}

function getLastWritebackAt(signal) {
  return firstValue(
    signal && signal.last_writeback_at,
    signal && signal.lastWritebackAt,
    signal && signal.writeback_synced_at,
    signal && signal.writebackSyncedAt
  );
}

function getSignalPayload(signal) {
  return parseJsonObject(
    firstValue(signal && signal.last_action_payload, signal && signal.lastActionPayload, {})
  );
}

function statusIsTerminalOrProgress(value) {
  const status = safeString(value).toLowerCase();

  return [
    'open',
    'in_progress',
    'escalated',
    'done',
    'resolved',
    'completed'
  ].includes(status);
}

function makeCheck({ id, label, passed, warning, detail }) {
  let status = 'passed';

  if (!passed) {
    status = warning ? 'warning' : 'failed';
  }

  return {
    id,
    label,
    status,
    passed: status === 'passed',
    detail: detail || ''
  };
}

function calculateVerification({ task, signal, expectedSignalId }) {
  const taskId = getTaskId(task);
  const taskStatus = getTaskStatus(task);
  const taskSignalId = getTaskSignalId(task);

  const signalId = getSignalId(signal);
  const signalTaskStatus = getSignalTaskStatus(signal);
  const signalFollowupStatus = getSignalFollowupStatus(signal);
  const lastWritebackAt = getLastWritebackAt(signal);
  const payload = getSignalPayload(signal);

  const checks = [
    makeCheck({
      id: 'task_found',
      label: 'Task exists',
      passed: Boolean(taskId),
      detail: taskId || 'No task found'
    }),
    makeCheck({
      id: 'task_has_linked_signal',
      label: 'Task has linked signal',
      passed: Boolean(taskSignalId),
      detail: taskSignalId || 'Task has no linked signal id'
    }),
    makeCheck({
      id: 'signal_found',
      label: 'Signal exists',
      passed: Boolean(signalId),
      detail: signalId || 'No signal found'
    }),
    makeCheck({
      id: 'signal_matches_task',
      label: 'Signal matches task context',
      passed: Boolean(signalId && taskSignalId && String(signalId) === String(taskSignalId)),
      detail: `taskSignal=${taskSignalId || '—'} signal=${signalId || '—'} expected=${expectedSignalId || '—'}`
    }),
    makeCheck({
      id: 'task_status_written_back',
      label: 'Task status written back',
      passed: statusIsTerminalOrProgress(signalTaskStatus) && signalTaskStatus !== 'pending',
      warning: true,
      detail: signalTaskStatus || 'No task_status'
    }),
    makeCheck({
      id: 'followup_status_written_back',
      label: 'Follow-up status written back',
      passed: statusIsTerminalOrProgress(signalFollowupStatus) && signalFollowupStatus !== 'pending',
      warning: true,
      detail: signalFollowupStatus || 'No followup_status'
    }),
    makeCheck({
      id: 'writeback_timestamp_exists',
      label: 'Writeback timestamp exists',
      passed: Boolean(lastWritebackAt),
      warning: true,
      detail: lastWritebackAt || 'No writeback timestamp'
    }),
    makeCheck({
      id: 'payload_has_task_id',
      label: 'Last payload includes task id',
      passed: Boolean(payload.task_id || payload.taskId),
      warning: true,
      detail: payload.task_id || payload.taskId || 'No task id in last_action_payload'
    })
  ];

  const failed = checks.filter((item) => item.status === 'failed').length;
  const warnings = checks.filter((item) => item.status === 'warning').length;
  const passed = checks.filter((item) => item.status === 'passed').length;

  let verdict = 'passed';

  if (failed > 0) verdict = 'failed';
  else if (warnings > 0) verdict = 'warning';

  return {
    verdict,
    failed,
    warnings,
    passed,
    checks,
    evidence: {
      taskId,
      taskStatus,
      taskSignalId,
      signalId,
      signalTaskStatus,
      signalFollowupStatus,
      lastWritebackAt,
      payloadAction: payload.action || null,
      payloadTaskId: payload.task_id || payload.taskId || null,
      payloadNextStatus: payload.next_status || payload.task_status || null,
      payloadFollowupStatus: payload.followup_status || null
    }
  };
}

async function storeVerificationResult({
  task,
  signal,
  verification,
  queryParams,
  sourceActionId
}) {
  await ensureVerificationAuditTable();

  const taskId = getTaskId(task);
  const signalId = getSignalId(signal) || getTaskSignalId(task);
  const id = makeVerificationId();

  const result = await query(
    `
      INSERT INTO closed_loop_verifications (
        id,
        tenant_id,
        task_id,
        signal_id,
        source_action_id,
        verdict,
        passed_count,
        warning_count,
        failed_count,
        checks,
        evidence,
        query_params,
        task_snapshot,
        signal_snapshot,
        phase,
        created_at
      )
      VALUES (
        $1::text,
        $2::text,
        $3::text,
        $4::text,
        $5::text,
        $6::text,
        $7::integer,
        $8::integer,
        $9::integer,
        $10::jsonb,
        $11::jsonb,
        $12::jsonb,
        $13::jsonb,
        $14::jsonb,
        '19.33-closed-loop-verification-dashboard-summary',
        NOW()
      )
      RETURNING *
    `,
    [
      id,
      firstValue(task && task.tenant_id, signal && signal.tenant_id, '1'),
      taskId || null,
      signalId || null,
      sourceActionId || firstValue(task && task.source_action_id, signal && signal.source_action_id, null),
      verification.verdict,
      verification.passed || 0,
      verification.warnings || 0,
      verification.failed || 0,
      JSON.stringify(verification.checks || []),
      JSON.stringify(verification.evidence || {}),
      JSON.stringify(queryParams || {}),
      JSON.stringify(task || {}),
      JSON.stringify(signal || {})
    ]
  );

  return result.rows && result.rows[0] ? normalizeVerificationRecord(result.rows[0]) : null;
}

async function listVerificationHistory(queryParams = {}) {
  await ensureVerificationAuditTable();

  const filters = [];
  const params = [];

  const taskId = firstValue(queryParams.taskId, queryParams.task_id);
  const signalId = firstValue(queryParams.signalId, queryParams.signal_id);
  const verdict = firstValue(queryParams.verdict);
  const sourceActionId = firstValue(queryParams.sourceActionId, queryParams.source_action_id);

  if (taskId) {
    params.push(safeString(taskId));
    filters.push(`task_id::text = $${params.length}::text`);
  }

  if (signalId) {
    params.push(safeString(signalId));
    filters.push(`signal_id::text = $${params.length}::text`);
  }

  if (sourceActionId) {
    params.push(safeString(sourceActionId));
    filters.push(`source_action_id::text = $${params.length}::text`);
  }

  if (verdict) {
    params.push(safeString(verdict).toLowerCase());
    filters.push(`LOWER(COALESCE(verdict::text, '')) = $${params.length}::text`);
  }

  const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const limitValue = Number.parseInt(firstValue(queryParams.limit, 50), 10);
  const safeLimit = Number.isFinite(limitValue) && limitValue > 0 && limitValue <= 250 ? limitValue : 50;

  const result = await query(
    `
      SELECT *
      FROM closed_loop_verifications
      ${whereSql}
      ORDER BY created_at DESC NULLS LAST
      LIMIT ${safeLimit}
    `,
    params
  );

  return (result.rows || []).map(normalizeVerificationRecord);
}

async function getVerificationSummary(queryParams = {}) {
  await ensureVerificationAuditTable();

  const filters = [];
  const params = [];

  const signalId = firstValue(queryParams.signalId, queryParams.signal_id);
  const taskId = firstValue(queryParams.taskId, queryParams.task_id);
  const sourceActionId = firstValue(queryParams.sourceActionId, queryParams.source_action_id);
  const hoursRaw = Number.parseInt(firstValue(queryParams.hours, 168), 10);
  const hours = Number.isFinite(hoursRaw) && hoursRaw > 0 && hoursRaw <= 4320 ? hoursRaw : 168;

  params.push(hours);
  filters.push(`created_at >= NOW() - ($${params.length}::integer * INTERVAL '1 hour')`);

  if (signalId) {
    params.push(safeString(signalId));
    filters.push(`signal_id::text = $${params.length}::text`);
  }

  if (taskId) {
    params.push(safeString(taskId));
    filters.push(`task_id::text = $${params.length}::text`);
  }

  if (sourceActionId) {
    params.push(safeString(sourceActionId));
    filters.push(`source_action_id::text = $${params.length}::text`);
  }

  const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const totalsResult = await query(
    `
      SELECT
        COUNT(*)::integer AS total,
        COUNT(*) FILTER (WHERE verdict = 'passed')::integer AS passed,
        COUNT(*) FILTER (WHERE verdict = 'warning')::integer AS warning,
        COUNT(*) FILTER (WHERE verdict = 'failed')::integer AS failed,
        MAX(created_at) AS last_checked_at
      FROM closed_loop_verifications
      ${whereSql}
    `,
    params
  );

  const byVerdictResult = await query(
    `
      SELECT
        verdict,
        COUNT(*)::integer AS count
      FROM closed_loop_verifications
      ${whereSql}
      GROUP BY verdict
      ORDER BY count DESC, verdict ASC
    `,
    params
  );

  const topProblemSignalsResult = await query(
    `
      SELECT
        signal_id,
        COUNT(*)::integer AS total,
        COUNT(*) FILTER (WHERE verdict = 'failed')::integer AS failed,
        COUNT(*) FILTER (WHERE verdict = 'warning')::integer AS warning,
        MAX(created_at) AS last_checked_at
      FROM closed_loop_verifications
      ${whereSql}
      GROUP BY signal_id
      HAVING
        COUNT(*) FILTER (WHERE verdict = 'failed') > 0
        OR COUNT(*) FILTER (WHERE verdict = 'warning') > 0
      ORDER BY failed DESC, warning DESC, last_checked_at DESC NULLS LAST
      LIMIT 10
    `,
    params
  );

  const recentProblemRowsResult = await query(
    `
      SELECT *
      FROM closed_loop_verifications
      ${whereSql}
      AND verdict IN ('failed', 'warning')
      ORDER BY created_at DESC NULLS LAST
      LIMIT 15
    `,
    params
  );

  const recentRowsResult = await query(
    `
      SELECT *
      FROM closed_loop_verifications
      ${whereSql}
      ORDER BY created_at DESC NULLS LAST
      LIMIT 15
    `,
    params
  );

  const totals = totalsResult.rows && totalsResult.rows[0]
    ? totalsResult.rows[0]
    : {
        total: 0,
        passed: 0,
        warning: 0,
        failed: 0,
        last_checked_at: null
      };

  const total = Number(totals.total || 0);
  const passed = Number(totals.passed || 0);
  const warning = Number(totals.warning || 0);
  const failed = Number(totals.failed || 0);

  let healthStatus = 'healthy';

  if (failed > 0) healthStatus = 'critical';
  else if (warning > 0) healthStatus = 'warning';
  else if (total === 0) healthStatus = 'no_data';

  const passRate = total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;
  const problemRate = total > 0 ? Math.round(((warning + failed) / total) * 1000) / 10 : 0;

  return {
    windowHours: hours,
    filters: {
      signalId: signalId || null,
      taskId: taskId || null,
      sourceActionId: sourceActionId || null
    },
    totals: {
      total,
      passed,
      warning,
      failed,
      lastCheckedAt: totals.last_checked_at,
      last_checked_at: totals.last_checked_at
    },
    health: {
      status: healthStatus,
      passRate,
      pass_rate: passRate,
      problemRate,
      problem_rate: problemRate
    },
    byVerdict: byVerdictResult.rows || [],
    by_verdict: byVerdictResult.rows || [],
    topProblemSignals: topProblemSignalsResult.rows || [],
    top_problem_signals: topProblemSignalsResult.rows || [],
    recentProblems: (recentProblemRowsResult.rows || []).map(normalizeVerificationRecord),
    recent_problems: (recentProblemRowsResult.rows || []).map(normalizeVerificationRecord),
    recent: (recentRowsResult.rows || []).map(normalizeVerificationRecord)
  };
}

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    route: 'tenant/closedLoopVerification',
    phase: '19.33-closed-loop-verification-dashboard-summary',
    auditTrail: true,
    summaryEndpoint: true,
    verifies: [
      'atlas_tasks',
      'atlas_signals',
      'linked_signal_id',
      'task_status',
      'followup_status',
      'last_action_payload',
      'closed_loop_verifications',
      'summary_kpis'
    ],
    timestamp: new Date().toISOString()
  });
});

router.get('/summary', async (req, res) => {
  try {
    const summary = await getVerificationSummary(req.query || {});

    return res.json({
      ok: true,
      data: {
        ok: true,
        phase: '19.33-closed-loop-verification-dashboard-summary',
        generatedAt: new Date().toISOString(),
        summary,
        debug: {
          route: 'tenant/closedLoopVerification/summary',
          query: req.query || {}
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Closed loop verification summary endpoint failed.',
      phase: '19.33-closed-loop-verification-dashboard-summary'
    });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await listVerificationHistory(req.query || {});

    return res.json({
      ok: true,
      data: {
        ok: true,
        phase: '19.33-closed-loop-verification-dashboard-summary',
        generatedAt: new Date().toISOString(),
        total: history.length,
        items: history,
        history,
        rows: history,
        debug: {
          route: 'tenant/closedLoopVerification/history',
          query: req.query || {}
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Closed loop verification history endpoint failed.',
      phase: '19.33-closed-loop-verification-dashboard-summary'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const taskId = firstValue(req.query.taskId, req.query.task_id);
    const signalId = firstValue(req.query.signalId, req.query.signal_id);
    const sourceActionId = firstValue(req.query.sourceActionId, req.query.source_action_id);

    const task = await findTask({
      taskId,
      signalId,
      sourceActionId
    });

    const resolvedSignalId = firstValue(signalId, task && getTaskSignalId(task));

    const signal = await findSignal({
      signalId: resolvedSignalId,
      task
    });

    const verification = calculateVerification({
      task,
      signal,
      expectedSignalId: resolvedSignalId
    });

    let verificationRecord = null;
    let auditWarning = null;

    try {
      verificationRecord = await storeVerificationResult({
        task,
        signal,
        verification,
        queryParams: {
          taskId: taskId || null,
          signalId: signalId || null,
          resolvedSignalId: resolvedSignalId || null,
          sourceActionId: sourceActionId || null
        },
        sourceActionId
      });
    } catch (auditError) {
      auditWarning = auditError.message || 'Verification audit write failed.';
    }

    return res.json({
      ok: true,
      data: {
        ok: true,
        phase: '19.33-closed-loop-verification-dashboard-summary',
        generatedAt: new Date().toISOString(),
        query: {
          taskId: taskId || null,
          signalId: signalId || null,
          resolvedSignalId: resolvedSignalId || null,
          sourceActionId: sourceActionId || null
        },
        verdict: verification.verdict,
        verification,
        verificationRecord,
        verification_record: verificationRecord,
        audit: {
          stored: Boolean(verificationRecord),
          warning: auditWarning
        },
        task,
        signal
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Closed loop verification endpoint failed.',
      phase: '19.33-closed-loop-verification-dashboard-summary'
    });
  }
});

module.exports = router;