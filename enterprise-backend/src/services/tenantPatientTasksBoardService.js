const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../utils/routeDbHelpers');
const taskWorkflowWritebackService = require('./taskWorkflowWritebackService');

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
      // continue scanning
    }
  }

  throw new Error('Could not resolve database client in tenantPatientTasksBoardService.');
}

const db = resolveDb();

function normalizeText(value) {
  if (value === null || typeof value === 'undefined') return null;
  const text = String(value).trim();
  return text || null;
}

function safeLower(value) {
  return String(value || '').trim().toLowerCase();
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

function normalizeTaskPriority(value) {
  const raw = safeLower(value);

  if (!raw) return 'normal';
  if (['normal', 'warning', 'critical'].includes(raw)) return raw;
  if (raw.includes('crit')) return 'critical';
  if (raw.includes('warn')) return 'warning';

  return 'normal';
}

function parseTaskMetadata(notes) {
  const text = String(notes || '');

  function extract(pattern) {
    const match = text.match(pattern);
    return match?.[1] ? String(match[1]).trim() : null;
  }

  return {
    actionId: extract(/action_id=([^\n\r]+)/i),
    signalId: extract(/signal_id=([^\n\r]+)/i),
    signalKind: extract(/signal_kind=([^\n\r]+)/i),
    patientEmail: extract(/patient_email=([^\n\r]+)/i),
    atlasCategory: extract(/category=([A-Z0-9_]+)/i),
    sourceRef: extract(/source_ref=([^\n\r]+)/i)
  };
}

async function resolveTasksTable() {
  const candidates = ['tasks', 'tenant_tasks', 'followup_tasks'];

  for (const candidate of candidates) {
    if (await tableExists(db, candidate)) {
      return candidate;
    }
  }

  return null;
}

async function resolvePatientContext(patientRef) {
  const rawRef = normalizeText(patientRef) || 'patient@raftop.local';

  const base = {
    patientId: /^\d+$/.test(rawRef) ? rawRef : null,
    userId: null,
    email: rawRef.includes('@') ? rawRef : 'patient@raftop.local',
    fullName: 'Patient User'
  };

  if (!(await tableExists(db, 'patients'))) {
    return base;
  }

  const columns = await getColumns(db, 'patients');
  const idCol = firstExisting(columns, ['id', 'patient_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const nameCol = firstExisting(columns, ['full_name', 'name', 'display_name', 'patient_name']);

  let row = null;

  if (idCol && /^\d+$/.test(rawRef)) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients WHERE ${q(idCol)}::text = $1 LIMIT 1`,
      [String(rawRef)]
    );
    row = result.rows?.[0] || null;
  }

  if (!row && emailCol && rawRef.includes('@')) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients WHERE LOWER(${q(emailCol)}) = LOWER($1) LIMIT 1`,
      [String(rawRef)]
    );
    row = result.rows?.[0] || null;
  }

  if (!row) {
    return base;
  }

  return {
    patientId: idCol ? row[idCol] : base.patientId,
    userId: userIdCol ? row[userIdCol] || null : null,
    email: emailCol ? row[emailCol] || base.email : base.email,
    fullName: (nameCol ? row[nameCol] : null) || base.fullName
  };
}

function buildWhereForPatient(columns, patient) {
  const where = [];
  const params = [];

  const patientEmailCol = firstExisting(columns, ['patient_email', 'email', 'user_email']);
  const patientIdCol = firstExisting(columns, ['patient_id']);
  const notesCol = firstExisting(columns, ['notes', 'comment']);

  if (patientEmailCol && patient.email) {
    params.push(String(patient.email));
    where.push(`LOWER(${q(patientEmailCol)}) = LOWER($${params.length})`);
  }

  if (patientIdCol && patient.patientId) {
    params.push(String(patient.patientId));
    where.push(`${q(patientIdCol)}::text = $${params.length}`);
  }

  if (notesCol && patient.email) {
    params.push(`%patient_email=${String(patient.email)}%`);
    where.push(`${q(notesCol)} ILIKE $${params.length}`);
  }

  return { where, params };
}

function mapTaskRow(row, columns, index = 0) {
  const idCol = firstExisting(columns, ['id', 'task_id']);
  const titleCol = firstExisting(columns, ['title', 'task_title', 'name']);
  const statusCol = firstExisting(columns, ['status', 'task_status']);
  const priorityCol = firstExisting(columns, ['priority', 'severity']);
  const notesCol = firstExisting(columns, ['notes', 'comment']);
  const assignedToCol = firstExisting(columns, ['assigned_to', 'owner']);
  const dueAtCol = firstExisting(columns, ['due_at', 'scheduled_at']);
  const createdAtCol = firstExisting(columns, ['created_at']);
  const updatedAtCol = firstExisting(columns, ['updated_at']);
  const patientEmailCol = firstExisting(columns, ['patient_email', 'email', 'user_email']);

  const notes = notesCol ? row[notesCol] || '' : '';
  const meta = parseTaskMetadata(notes);

  return {
    id: idCol ? String(row[idCol]) : `task-${index + 1}`,
    title: titleCol ? row[titleCol] || 'Task' : 'Task',
    status: normalizeTaskStatus(statusCol ? row[statusCol] : 'pending'),
    priority: normalizeTaskPriority(priorityCol ? row[priorityCol] : 'normal'),
    notes,
    assignedTo: assignedToCol ? row[assignedToCol] || 'RAFTOP Team' : 'RAFTOP Team',
    dueAt: dueAtCol ? row[dueAtCol] || null : null,
    createdAt: createdAtCol ? row[createdAtCol] || null : null,
    updatedAt: updatedAtCol ? row[updatedAtCol] || null : null,
    patientEmail:
      (patientEmailCol ? row[patientEmailCol] || null : null) ||
      meta.patientEmail ||
      null,
    atlasCategory: meta.atlasCategory || null,
    signalId: meta.signalId || null,
    signalKind: meta.signalKind || null,
    actionId: meta.actionId || null,
    sourceRef: meta.sourceRef || null
  };
}

async function loadPatientTasks(patientRef) {
  const patient = await resolvePatientContext(patientRef);
  const tableName = await resolveTasksTable();

  if (!tableName) {
    return {
      patient,
      tableName: null,
      items: []
    };
  }

  const columns = await getColumns(db, tableName);
  const idCol = firstExisting(columns, ['id', 'task_id']);
  const createdAtCol = firstExisting(columns, ['created_at']);
  const updatedAtCol = firstExisting(columns, ['updated_at']);

  const { where, params } = buildWhereForPatient(columns, patient);

  if (!where.length) {
    return {
      patient,
      tableName,
      items: []
    };
  }

  const sql = `
    SELECT *
    FROM ${tableName}
    WHERE ${where.join(' OR ')}
    ORDER BY ${q(updatedAtCol || createdAtCol || idCol || 'id')} DESC NULLS LAST
    LIMIT 200
  `;

  const result = await querySafe(db, sql, params);

  if (result.error) {
    throw new Error(result.error.message || 'Failed to load patient tasks.');
  }

  const rows = result.rows || [];

  const items = rows.map((row, index) => mapTaskRow(row, columns, index));

  return {
    patient,
    tableName,
    items
  };
}

function groupTasks(items) {
  const columns = {
    pending: [],
    in_progress: [],
    escalated: [],
    done: []
  };

  for (const item of items) {
    if (item.status === 'in_progress') {
      columns.in_progress.push(item);
      continue;
    }

    if (item.status === 'escalated') {
      columns.escalated.push(item);
      continue;
    }

    if (['done', 'resolved', 'closed', 'completed'].includes(item.status)) {
      columns.done.push(item);
      continue;
    }

    columns.pending.push(item);
  }

  return columns;
}

function buildSummary(items) {
  return {
    total: items.length,
    pending: items.filter((item) => item.status === 'pending').length,
    inProgress: items.filter((item) => item.status === 'in_progress').length,
    escalated: items.filter((item) => item.status === 'escalated').length,
    done: items.filter((item) => ['done', 'resolved', 'closed', 'completed'].includes(item.status)).length,
    critical: items.filter((item) => item.priority === 'critical').length,
    warning: items.filter((item) => item.priority === 'warning').length
  };
}

async function getPatientTaskBoard(patientRef) {
  const payload = await loadPatientTasks(patientRef);

  return {
    patient: payload.patient,
    summary: buildSummary(payload.items),
    columns: groupTasks(payload.items),
    items: payload.items
  };
}

async function getTaskContextById(taskId) {
  const tableName = await resolveTasksTable();

  if (!tableName) {
    throw new Error('No tasks table found.');
  }

  const columns = await getColumns(db, tableName);
  const idCol = firstExisting(columns, ['id', 'task_id']);

  if (!idCol) {
    throw new Error('Task id column is missing.');
  }

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM ${tableName}
      WHERE ${q(idCol)}::text = $1
      LIMIT 1
    `,
    [String(taskId)]
  );

  if (result.error) {
    throw new Error(result.error.message || 'Failed to load task context.');
  }

  if (!result.rows?.length) {
    throw new Error('Task not found.');
  }

  return {
    tableName,
    columns,
    task: mapTaskRow(result.rows[0], columns, 0),
    idCol,
    statusCol: firstExisting(columns, ['status', 'task_status']),
    updatedAtCol: firstExisting(columns, ['updated_at'])
  };
}

async function updateTaskStatus(taskId, nextStatus) {
  const context = await getTaskContextById(taskId);

  if (!context.statusCol) {
    throw new Error('Task status column is missing.');
  }

  const normalizedStatus = normalizeTaskStatus(nextStatus);

  const values = [normalizedStatus];
  let setClause = `${q(context.statusCol)} = $1`;

  if (context.updatedAtCol) {
    values.push(new Date().toISOString());
    setClause += `, ${q(context.updatedAtCol)} = $2`;
  }

  values.push(String(taskId));

  const result = await querySafe(
    db,
    `
      UPDATE ${context.tableName}
      SET ${setClause}
      WHERE ${q(context.idCol)}::text = $${values.length}
      RETURNING ${q(context.idCol)}::text AS id, ${q(context.statusCol)}::text AS status
    `,
    values
  );

  if (result.error) {
    throw new Error(result.error.message || 'Failed to update task status.');
  }

  if (!result.rows?.length) {
    throw new Error('Task not found.');
  }

  const writeback = await taskWorkflowWritebackService.syncOnTaskStatusChange({
    taskId: context.task.id,
    nextStatus: normalizedStatus,
    patientEmail: context.task.patientEmail,
    atlasCategory: context.task.atlasCategory,
    actionId: context.task.actionId,
    signalId: context.task.signalId,
    signalKind: context.task.signalKind,
    sourceRef: context.task.sourceRef
  });

  return {
    id: result.rows[0].id,
    status: result.rows[0].status,
    writeback
  };
}

module.exports = {
  getPatientTaskBoard,
  updateTaskStatus
};