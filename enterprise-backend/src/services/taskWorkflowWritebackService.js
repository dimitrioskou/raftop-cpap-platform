const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
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

  throw new Error('Could not resolve database client in taskWorkflowWritebackService.');
}

const db = resolveDb();

function safeLower(value) {
  return String(value || '').trim().toLowerCase();
}

function safeJsonParse(raw, fallback = {}) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function normalizeTaskStatus(value) {
  const raw = safeLower(value);

  if (!raw) return 'pending';
  if (
    [
      'pending',
      'in_progress',
      'done',
      'cancelled',
      'escalated',
      'resolved',
      'closed',
      'completed'
    ].includes(raw)
  ) {
    return raw;
  }

  if (raw.includes('progress')) return 'in_progress';
  if (raw.includes('escal')) return 'escalated';
  if (raw.includes('done') || raw.includes('complete') || raw.includes('resolv') || raw.includes('close')) {
    return 'done';
  }
  if (raw.includes('cancel')) return 'cancelled';

  return 'pending';
}

async function resolveSignalsTable() {
  if (!(await tableExists(db, 'patient_signals'))) return null;

  const columns = await getColumns(db, 'patient_signals');

  return {
    tableName: 'patient_signals',
    columns,
    idCol: firstExisting(columns, ['id', 'signal_id']),
    statusCol: firstExisting(columns, ['status']),
    metadataCol: firstExisting(columns, ['metadata', 'meta', 'payload']),
    updatedAtCol: firstExisting(columns, ['updated_at', 'created_at'])
  };
}

async function resolveCoachingTable() {
  const candidates = ['patient_coaching_assignments', 'coaching_assignments'];

  for (const tableName of candidates) {
    if (await tableExists(db, tableName)) {
      const columns = await getColumns(db, tableName);

      return {
        tableName,
        columns,
        emailCol: firstExisting(columns, ['patient_email', 'email', 'user_email']),
        lessonIdCol: firstExisting(columns, ['lesson_id', 'coaching_lesson_id']),
        statusCol: firstExisting(columns, ['status']),
        updatedAtCol: firstExisting(columns, ['updated_at', 'assigned_at', 'created_at'])
      };
    }
  }

  return null;
}

async function updateSignalRecord(signalId, { nextStatus, metadataPatch }) {
  const signalTable = await resolveSignalsTable();

  if (!signalTable || !signalTable.idCol) {
    return {
      ok: false,
      skipped: true,
      reason: 'signal_table_missing'
    };
  }

  const existing = await querySafe(
    db,
    `
      SELECT *
      FROM ${signalTable.tableName}
      WHERE ${q(signalTable.idCol)}::text = $1
      LIMIT 1
    `,
    [String(signalId)]
  );

  if (existing.error || !existing.rows?.length) {
    return {
      ok: false,
      skipped: true,
      reason: 'signal_not_found'
    };
  }

  const row = existing.rows[0];
  const assignments = [];
  const values = [];

  if (typeof nextStatus !== 'undefined' && signalTable.statusCol) {
    values.push(nextStatus);
    assignments.push(`${q(signalTable.statusCol)} = $${values.length}`);
  }

  if (signalTable.metadataCol && metadataPatch) {
    const currentMetadata = safeJsonParse(row[signalTable.metadataCol], {});
    const nextMetadata = {
      ...currentMetadata,
      ...metadataPatch
    };

    values.push(JSON.stringify(nextMetadata));
    assignments.push(`${q(signalTable.metadataCol)} = $${values.length}`);
  }

  if (signalTable.updatedAtCol) {
    values.push(new Date().toISOString());
    assignments.push(`${q(signalTable.updatedAtCol)} = $${values.length}`);
  }

  if (!assignments.length) {
    return {
      ok: true,
      skipped: true,
      reason: 'nothing_to_update'
    };
  }

  values.push(String(signalId));

  const result = await querySafe(
    db,
    `
      UPDATE ${signalTable.tableName}
      SET ${assignments.join(', ')}
      WHERE ${q(signalTable.idCol)}::text = $${values.length}
    `,
    values
  );

  if (result.error) {
    return {
      ok: false,
      skipped: false,
      reason: result.error.message || 'signal_update_failed'
    };
  }

  return {
    ok: true,
    skipped: false
  };
}

async function updateCoachingAssignment({
  patientEmail,
  lessonId,
  nextStatus
}) {
  const coachingTable = await resolveCoachingTable();

  if (
    !coachingTable ||
    !coachingTable.emailCol ||
    !coachingTable.lessonIdCol ||
    !coachingTable.statusCol ||
    !patientEmail ||
    !lessonId
  ) {
    return {
      ok: false,
      skipped: true,
      reason: 'coaching_table_missing_or_incomplete'
    };
  }

  const values = [String(patientEmail), String(lessonId), nextStatus];
  const assignments = [`${q(coachingTable.statusCol)} = $3`];

  if (coachingTable.updatedAtCol) {
    values.push(new Date().toISOString());
    assignments.push(`${q(coachingTable.updatedAtCol)} = $4`);
  }

  const result = await querySafe(
    db,
    `
      UPDATE ${coachingTable.tableName}
      SET ${assignments.join(', ')}
      WHERE LOWER(${q(coachingTable.emailCol)}) = LOWER($1)
        AND ${q(coachingTable.lessonIdCol)}::text = $2
    `,
    values
  );

  if (result.error) {
    return {
      ok: false,
      skipped: false,
      reason: result.error.message || 'coaching_update_failed'
    };
  }

  return {
    ok: true,
    skipped: false
  };
}

function workflowStateFromTaskStatus(status) {
  const normalized = normalizeTaskStatus(status);

  if (normalized === 'done') return 'task_done';
  if (normalized === 'escalated') return 'task_escalated';
  if (normalized === 'in_progress') return 'task_in_progress';
  return 'task_open';
}

async function syncOnActionTaskCreated(context = {}) {
  const now = new Date().toISOString();
  const result = {
    signal: null,
    coaching: null
  };

  if (context.signalId) {
    result.signal = await updateSignalRecord(context.signalId, {
      metadataPatch: {
        linkedTaskId: context.taskId || null,
        linkedTaskStatus: 'pending',
        linkedActionId: context.actionId || null,
        linkedSignalKind: context.signalKind || null,
        workflowState: 'task_created',
        linkedAt: now
      }
    });
  }

  if (
    safeLower(context.atlasCategory) === 'coaching_review' &&
    context.patientEmail &&
    context.sourceRef
  ) {
    result.coaching = await updateCoachingAssignment({
      patientEmail: context.patientEmail,
      lessonId: context.sourceRef,
      nextStatus: 'in_progress'
    });
  }

  return result;
}

async function syncOnTaskStatusChange(context = {}) {
  const normalizedStatus = normalizeTaskStatus(context.nextStatus);
  const now = new Date().toISOString();

  const result = {
    signal: null,
    coaching: null
  };

  if (context.signalId) {
    result.signal = await updateSignalRecord(context.signalId, {
      nextStatus: normalizedStatus === 'done' ? 'resolved' : undefined,
      metadataPatch: {
        linkedTaskId: context.taskId || null,
        linkedTaskStatus: normalizedStatus,
        linkedActionId: context.actionId || null,
        linkedSignalKind: context.signalKind || null,
        workflowState: workflowStateFromTaskStatus(normalizedStatus),
        lastTaskSyncAt: now
      }
    });
  }

  if (
    safeLower(context.atlasCategory) === 'coaching_review' &&
    context.patientEmail &&
    context.sourceRef
  ) {
    let coachingNextStatus = 'assigned';

    if (normalizedStatus === 'in_progress' || normalizedStatus === 'escalated') {
      coachingNextStatus = 'in_progress';
    } else if (normalizedStatus === 'done') {
      coachingNextStatus = 'completed';
    }

    result.coaching = await updateCoachingAssignment({
      patientEmail: context.patientEmail,
      lessonId: context.sourceRef,
      nextStatus: coachingNextStatus
    });
  }

  return result;
}

module.exports = {
  syncOnActionTaskCreated,
  syncOnTaskStatusChange
};