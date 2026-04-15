const express = require('express');
const router = express.Router();
const db = require('../../db');
const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting,
  textExpr
} = require('../../utils/routeDbHelpers');

function normalizeText(value) {
  if (value === null || typeof value === 'undefined') return null;
  const text = String(value).trim();
  return text ? text : null;
}

function normalizeDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return 'pending';
  if (['pending', 'in_progress', 'done', 'cancelled', 'escalated'].includes(raw)) {
    return raw;
  }

  if (raw.includes('progress')) return 'in_progress';
  if (raw.includes('done') || raw.includes('complete')) return 'done';
  if (raw.includes('cancel')) return 'cancelled';
  if (raw.includes('escal')) return 'escalated';

  return 'pending';
}

function normalizePriority(value) {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return 'normal';
  if (['normal', 'warning', 'critical'].includes(raw)) return raw;
  if (raw.includes('crit')) return 'critical';
  if (raw.includes('warn')) return 'warning';

  return 'normal';
}

function buildReadOrder(columns) {
  const orderColumn = firstExisting(columns, ['updated_at', 'due_at', 'created_at']);
  const idColumn = firstExisting(columns, ['id', 'task_id']);

  if (orderColumn) return `t.${q(orderColumn)} DESC NULLS LAST`;
  if (idColumn) return `t.${q(idColumn)} DESC`;

  return '1 DESC';
}

function pushIfColumnExists(payload, columns, candidates, value) {
  const column = firstExisting(columns, candidates);
  if (!column) return null;
  if (typeof value === 'undefined') return null;

  payload.push({ column, value });
  return column;
}

async function resolveLinkedId(tableName, rawId, idCandidates) {
  if (!rawId) return null;

  const exists = await tableExists(db, tableName);
  if (!exists) return null;

  const columns = await getColumns(db, tableName);
  const pkColumn = firstExisting(columns, idCandidates);

  if (!pkColumn) return null;

  const check = await querySafe(
    db,
    `SELECT 1 FROM ${tableName} x WHERE x.${q(pkColumn)}::text = $1 LIMIT 1`,
    [rawId]
  );

  if (check.error || !check.rows?.length) return null;

  return rawId;
}

async function readTasks() {
  const exists = await tableExists(db, 'tasks');

  if (!exists) {
    return {
      tasks: [],
      totalTasks: 0,
      debug: 'tasks_table_missing'
    };
  }

  const columns = await getColumns(db, 'tasks');

  const idColumn = firstExisting(columns, ['id', 'task_id']);
  const titleColumn = firstExisting(columns, ['title', 'task_title', 'name']);
  const patientIdColumn = firstExisting(columns, ['patient_id']);
  const patientNameColumn = firstExisting(columns, ['patient_name']);
  const doctorIdColumn = firstExisting(columns, ['doctor_id']);
  const doctorNameColumn = firstExisting(columns, ['doctor_name']);
  const followupIdColumn = firstExisting(columns, ['followup_id']);
  const statusColumn = firstExisting(columns, ['status', 'task_status']);
  const priorityColumn = firstExisting(columns, ['priority', 'severity']);
  const dueAtColumn = firstExisting(columns, ['due_at', 'scheduled_at']);
  const assignedToColumn = firstExisting(columns, ['assigned_to', 'owner']);
  const notesColumn = firstExisting(columns, ['notes', 'comment']);
  const tenantIdColumn = firstExisting(columns, ['tenant_id']);
  const createdAtColumn = firstExisting(columns, ['created_at']);
  const updatedAtColumn = firstExisting(columns, ['updated_at']);

  const sql = `
    SELECT
      ${textExpr('t', idColumn, 'id')},
      ${textExpr('t', titleColumn, 'title')},
      ${textExpr('t', patientIdColumn, 'patient_id')},
      ${textExpr('t', patientNameColumn, 'patient_name')},
      ${textExpr('t', doctorIdColumn, 'doctor_id')},
      ${textExpr('t', doctorNameColumn, 'doctor_name')},
      ${textExpr('t', followupIdColumn, 'followup_id')},
      ${textExpr('t', statusColumn, 'status')},
      ${textExpr('t', priorityColumn, 'priority')},
      ${textExpr('t', dueAtColumn, 'due_at')},
      ${textExpr('t', assignedToColumn, 'assigned_to')},
      ${textExpr('t', notesColumn, 'notes')},
      ${textExpr('t', tenantIdColumn, 'tenant_id')},
      ${textExpr('t', createdAtColumn, 'created_at')},
      ${textExpr('t', updatedAtColumn, 'updated_at')}
    FROM tasks t
    ORDER BY ${buildReadOrder(columns)}
    LIMIT 500
  `;

  const result = await querySafe(db, sql);

  if (result.error) {
    return {
      tasks: [],
      totalTasks: 0,
      debug: result.error.message
    };
  }

  return {
    tasks: result.rows || [],
    totalTasks: result.rows?.length || 0,
    debug: null
  };
}

async function readTaskById(taskId) {
  const exists = await tableExists(db, 'tasks');

  if (!exists) {
    return {
      task: null,
      debug: 'tasks_table_missing'
    };
  }

  const columns = await getColumns(db, 'tasks');
  const idColumn = firstExisting(columns, ['id', 'task_id']);

  if (!idColumn) {
    return {
      task: null,
      debug: 'task_id_column_missing'
    };
  }

  const titleColumn = firstExisting(columns, ['title', 'task_title', 'name']);
  const patientIdColumn = firstExisting(columns, ['patient_id']);
  const patientNameColumn = firstExisting(columns, ['patient_name']);
  const doctorIdColumn = firstExisting(columns, ['doctor_id']);
  const doctorNameColumn = firstExisting(columns, ['doctor_name']);
  const followupIdColumn = firstExisting(columns, ['followup_id']);
  const statusColumn = firstExisting(columns, ['status', 'task_status']);
  const priorityColumn = firstExisting(columns, ['priority', 'severity']);
  const dueAtColumn = firstExisting(columns, ['due_at', 'scheduled_at']);
  const assignedToColumn = firstExisting(columns, ['assigned_to', 'owner']);
  const notesColumn = firstExisting(columns, ['notes', 'comment']);
  const tenantIdColumn = firstExisting(columns, ['tenant_id']);
  const createdAtColumn = firstExisting(columns, ['created_at']);
  const updatedAtColumn = firstExisting(columns, ['updated_at']);

  const sql = `
    SELECT
      ${textExpr('t', idColumn, 'id')},
      ${textExpr('t', titleColumn, 'title')},
      ${textExpr('t', patientIdColumn, 'patient_id')},
      ${textExpr('t', patientNameColumn, 'patient_name')},
      ${textExpr('t', doctorIdColumn, 'doctor_id')},
      ${textExpr('t', doctorNameColumn, 'doctor_name')},
      ${textExpr('t', followupIdColumn, 'followup_id')},
      ${textExpr('t', statusColumn, 'status')},
      ${textExpr('t', priorityColumn, 'priority')},
      ${textExpr('t', dueAtColumn, 'due_at')},
      ${textExpr('t', assignedToColumn, 'assigned_to')},
      ${textExpr('t', notesColumn, 'notes')},
      ${textExpr('t', tenantIdColumn, 'tenant_id')},
      ${textExpr('t', createdAtColumn, 'created_at')},
      ${textExpr('t', updatedAtColumn, 'updated_at')}
    FROM tasks t
    WHERE t.${q(idColumn)}::text = $1
    LIMIT 1
  `;

  const result = await querySafe(db, sql, [String(taskId)]);

  if (result.error) {
    return {
      task: null,
      debug: result.error.message
    };
  }

  return {
    task: result.rows?.[0] || null,
    debug: null
  };
}

router.get('/', async (_req, res) => {
  const data = await readTasks();

  return res.json({
    ok: true,
    tasks: data.tasks,
    totalTasks: data.totalTasks,
    timestamp: new Date().toISOString(),
    debug: data.debug || null
  });
});

router.get('/:id', async (req, res) => {
  const data = await readTaskById(req.params.id);

  if (!data.task) {
    return res.status(404).json({
      ok: false,
      message: 'Task not found.'
    });
  }

  return res.json({
    ok: true,
    task: data.task,
    timestamp: new Date().toISOString(),
    debug: data.debug || null
  });
});

router.post('/', async (req, res) => {
  const exists = await tableExists(db, 'tasks');

  if (!exists) {
    return res.status(500).json({
      ok: false,
      message: 'Tasks table is missing.'
    });
  }

  const columns = await getColumns(db, 'tasks');

  const title = normalizeText(req.body?.title || req.body?.task_title || req.body?.name);
  const patientIdRaw = normalizeText(req.body?.patient_id);
  const patientName = normalizeText(req.body?.patient_name);
  const doctorIdRaw = normalizeText(req.body?.doctor_id);
  const doctorName = normalizeText(req.body?.doctor_name);
  const followupIdRaw = normalizeText(req.body?.followup_id);
  const status = normalizeStatus(req.body?.status);
  const priority = normalizePriority(req.body?.priority);
  const dueAt = normalizeDateTime(req.body?.due_at) || new Date().toISOString();
  const assignedTo = normalizeText(req.body?.assigned_to || 'RAFTOP Team');
  const notes = normalizeText(req.body?.notes);
  const tenantId = normalizeText(req.body?.tenant_id || 'demo-tenant');

  if (!title) {
    return res.status(400).json({
      ok: false,
      message: 'Task title is required.'
    });
  }

  const patientId = await resolveLinkedId('patients', patientIdRaw, ['id', 'patient_id']);
  const doctorId = await resolveLinkedId('doctors', doctorIdRaw, ['id', 'doctor_id']);
  const followupId = await resolveLinkedId('followup', followupIdRaw, ['id', 'followup_id']);

  const insertPairs = [];

  pushIfColumnExists(insertPairs, columns, ['title', 'task_title', 'name'], title);
  pushIfColumnExists(insertPairs, columns, ['patient_id'], patientId);
  pushIfColumnExists(insertPairs, columns, ['patient_name'], patientName);
  pushIfColumnExists(insertPairs, columns, ['doctor_id'], doctorId);
  pushIfColumnExists(insertPairs, columns, ['doctor_name'], doctorName);
  pushIfColumnExists(insertPairs, columns, ['followup_id'], followupId);
  pushIfColumnExists(insertPairs, columns, ['status', 'task_status'], status);
  pushIfColumnExists(insertPairs, columns, ['priority', 'severity'], priority);
  pushIfColumnExists(insertPairs, columns, ['due_at', 'scheduled_at'], dueAt);
  pushIfColumnExists(insertPairs, columns, ['assigned_to', 'owner'], assignedTo);
  pushIfColumnExists(insertPairs, columns, ['notes', 'comment'], notes);
  pushIfColumnExists(insertPairs, columns, ['tenant_id'], tenantId);
  pushIfColumnExists(insertPairs, columns, ['created_at'], new Date().toISOString());
  pushIfColumnExists(insertPairs, columns, ['updated_at'], new Date().toISOString());

  if (!insertPairs.length) {
    return res.status(500).json({
      ok: false,
      message: 'No compatible task columns were found for insert.'
    });
  }

  const insertColumns = insertPairs.map((entry) => q(entry.column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map((entry) => entry.value);

  const returningIdColumn = firstExisting(columns, ['id', 'task_id']);

  const sql = `
    INSERT INTO tasks (${insertColumns})
    VALUES (${placeholders})
    ${returningIdColumn ? `RETURNING ${q(returningIdColumn)}::text AS id` : ''}
  `;

  const result = await querySafe(db, sql, values);

  if (result.error) {
    return res.status(500).json({
      ok: false,
      message: result.error.message || 'Failed to create task.'
    });
  }

  return res.status(201).json({
    ok: true,
    message: 'Task created successfully.',
    task: {
      id: result.rows?.[0]?.id || null,
      title,
      patient_id: patientId,
      patient_name: patientName,
      doctor_id: doctorId,
      doctor_name: doctorName,
      followup_id: followupId,
      status,
      priority,
      due_at: dueAt,
      assigned_to: assignedTo,
      notes,
      tenant_id: tenantId
    }
  });
});

router.put('/:id', async (req, res) => {
  const exists = await tableExists(db, 'tasks');

  if (!exists) {
    return res.status(500).json({
      ok: false,
      message: 'Tasks table is missing.'
    });
  }

  const columns = await getColumns(db, 'tasks');
  const idColumn = firstExisting(columns, ['id', 'task_id']);

  if (!idColumn) {
    return res.status(500).json({
      ok: false,
      message: 'Task ID column is missing.'
    });
  }

  const existing = await querySafe(
    db,
    `SELECT 1 FROM tasks t WHERE t.${q(idColumn)}::text = $1 LIMIT 1`,
    [String(req.params.id)]
  );

  if (existing.error || !existing.rows?.length) {
    return res.status(404).json({
      ok: false,
      message: 'Task not found.'
    });
  }

  const title =
    typeof req.body?.title !== 'undefined' ||
    typeof req.body?.task_title !== 'undefined' ||
    typeof req.body?.name !== 'undefined'
      ? normalizeText(req.body?.title || req.body?.task_title || req.body?.name)
      : undefined;

  const patientIdRaw = normalizeText(req.body?.patient_id);
  const patientName =
    typeof req.body?.patient_name !== 'undefined'
      ? normalizeText(req.body?.patient_name)
      : undefined;

  const doctorIdRaw = normalizeText(req.body?.doctor_id);
  const doctorName =
    typeof req.body?.doctor_name !== 'undefined'
      ? normalizeText(req.body?.doctor_name)
      : undefined;

  const followupIdRaw = normalizeText(req.body?.followup_id);

  const status =
    typeof req.body?.status !== 'undefined'
      ? normalizeStatus(req.body?.status)
      : undefined;

  const priority =
    typeof req.body?.priority !== 'undefined'
      ? normalizePriority(req.body?.priority)
      : undefined;

  const dueAt =
    typeof req.body?.due_at !== 'undefined'
      ? normalizeDateTime(req.body?.due_at)
      : undefined;

  const assignedTo =
    typeof req.body?.assigned_to !== 'undefined'
      ? normalizeText(req.body?.assigned_to)
      : undefined;

  const notes =
    typeof req.body?.notes !== 'undefined'
      ? normalizeText(req.body?.notes)
      : undefined;

  const patientId =
    typeof req.body?.patient_id !== 'undefined'
      ? await resolveLinkedId('patients', patientIdRaw, ['id', 'patient_id'])
      : undefined;

  const doctorId =
    typeof req.body?.doctor_id !== 'undefined'
      ? await resolveLinkedId('doctors', doctorIdRaw, ['id', 'doctor_id'])
      : undefined;

  const followupId =
    typeof req.body?.followup_id !== 'undefined'
      ? await resolveLinkedId('followup', followupIdRaw, ['id', 'followup_id'])
      : undefined;

  const updatePairs = [];

  pushIfColumnExists(updatePairs, columns, ['title', 'task_title', 'name'], title);
  pushIfColumnExists(updatePairs, columns, ['patient_id'], patientId);
  pushIfColumnExists(updatePairs, columns, ['patient_name'], patientName);
  pushIfColumnExists(updatePairs, columns, ['doctor_id'], doctorId);
  pushIfColumnExists(updatePairs, columns, ['doctor_name'], doctorName);
  pushIfColumnExists(updatePairs, columns, ['followup_id'], followupId);
  pushIfColumnExists(updatePairs, columns, ['status', 'task_status'], status);
  pushIfColumnExists(updatePairs, columns, ['priority', 'severity'], priority);
  pushIfColumnExists(updatePairs, columns, ['due_at', 'scheduled_at'], dueAt);
  pushIfColumnExists(updatePairs, columns, ['assigned_to', 'owner'], assignedTo);
  pushIfColumnExists(updatePairs, columns, ['notes', 'comment'], notes);
  pushIfColumnExists(updatePairs, columns, ['updated_at'], new Date().toISOString());

  if (!updatePairs.length) {
    return res.status(400).json({
      ok: false,
      message: 'No valid task fields were provided for update.'
    });
  }

  const assignments = updatePairs
    .map((entry, index) => `${q(entry.column)} = $${index + 1}`)
    .join(', ');

  const values = updatePairs.map((entry) => entry.value);
  values.push(String(req.params.id));

  const sql = `
    UPDATE tasks
    SET ${assignments}
    WHERE ${q(idColumn)}::text = $${values.length}
  `;

  const result = await querySafe(db, sql, values);

  if (result.error) {
    return res.status(500).json({
      ok: false,
      message: result.error.message || 'Failed to update task.'
    });
  }

  const refreshed = await readTaskById(req.params.id);

  return res.json({
    ok: true,
    message: 'Task updated successfully.',
    task: refreshed.task || null
  });
});

module.exports = router;