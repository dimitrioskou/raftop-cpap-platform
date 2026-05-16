const db = require('../db');
const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../utils/routeDbHelpers');

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
  if (raw.includes('done') || raw.includes('complete') || raw.includes('resolved')) return 'done';
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

function generateTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isIntegerType(dataType) {
  return ['integer', 'bigint', 'smallint'].includes(String(dataType || '').toLowerCase());
}

async function getColumnTypeMap(tableName) {
  const result = await querySafe(
    db,
    `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
    `,
    [tableName]
  );

  if (result.error) return {};

  return (result.rows || []).reduce((acc, row) => {
    acc[row.column_name] = row.data_type;
    return acc;
  }, {});
}

function coerceValueForColumnType(value, dataType) {
  if (typeof value === 'undefined') return undefined;
  if (value === null) return null;

  if (isIntegerType(dataType)) {
    const raw = String(value).trim();
    if (!raw) return null;
    if (!/^-?\d+$/.test(raw)) return null;
    return Number(raw);
  }

  return value;
}

function pushTypedIfColumnExists(payload, columns, typeMap, candidates, value) {
  const column = firstExisting(columns, candidates);
  if (!column) return null;
  if (typeof value === 'undefined') return null;

  payload.push({
    column,
    value: coerceValueForColumnType(value, typeMap[column])
  });

  return column;
}

function pushAssigneeField(payload, columns, typeMap, value) {
  if (typeof value === 'undefined') return null;

  const textColumn = ['assigned_to', 'owner'].find(
    (name) => columns.includes(name) && !isIntegerType(typeMap[name])
  );

  if (textColumn) {
    payload.push({
      column: textColumn,
      value
    });
    return textColumn;
  }

  const numericColumn = ['assigned_to', 'owner'].find(
    (name) => columns.includes(name) && isIntegerType(typeMap[name])
  );

  if (numericColumn) {
    payload.push({
      column: numericColumn,
      value: coerceValueForColumnType(value, typeMap[numericColumn])
    });
    return numericColumn;
  }

  return null;
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

function deriveSeverityFromSignal(signal) {
  const explicit =
    normalizeText(signal?.metadata?.severity) ||
    normalizeText(signal?.severity);

  if (explicit) return explicit.toLowerCase();

  const description = String(signal?.description || '');
  const match = description.match(/severity:\s*([a-zA-Z_]+)/i);

  if (match?.[1]) {
    return String(match[1]).toLowerCase();
  }

  return 'medium';
}

function derivePriorityFromSignal(signal) {
  const kind = String(signal?.kind || '').toLowerCase();
  const severity = deriveSeverityFromSignal(signal);

  if (kind === 'issue' && severity === 'high') return 'critical';
  if (kind === 'callback') return 'warning';
  if (kind === 'issue' && severity === 'medium') return 'warning';

  return 'normal';
}

function derivePatientNameFromSignal(signal) {
  if (normalizeText(signal?.patientName)) return signal.patientName;
  if (normalizeText(signal?.email)) return signal.email;
  if (normalizeText(signal?.patientEmail)) return signal.patientEmail;
  if (normalizeText(signal?.patient_user_id)) return `Patient ${signal.patient_user_id}`;

  return 'Patient User';
}

async function resolvePatientContextFromSignal(signal) {
  const exists = await tableExists(db, 'patients');

  if (!exists) {
    return {
      patientId: null,
      patientName: derivePatientNameFromSignal(signal)
    };
  }

  const columns = await getColumns(db, 'patients');
  const idColumn = firstExisting(columns, ['id', 'patient_id']);
  const userIdColumn = firstExisting(columns, ['user_id']);
  const emailColumn = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const nameColumn = firstExisting(columns, ['full_name', 'name', 'display_name', 'patient_name']);

  if (userIdColumn && normalizeText(signal?.userId || signal?.patientUserId || signal?.patient_user_id)) {
    const rawUserId = normalizeText(signal?.userId || signal?.patientUserId || signal?.patient_user_id);

    const result = await querySafe(
      db,
      `SELECT * FROM patients p WHERE p.${q(userIdColumn)}::text = $1 LIMIT 1`,
      [rawUserId]
    );

    if (!result.error && result.rows?.[0]) {
      const row = result.rows[0];
      return {
        patientId: idColumn ? row[idColumn] : null,
        patientName: nameColumn ? row[nameColumn] || derivePatientNameFromSignal(signal) : derivePatientNameFromSignal(signal)
      };
    }
  }

  if (emailColumn && normalizeText(signal?.email || signal?.patientEmail || signal?.patient_email)) {
    const rawEmail = normalizeText(signal?.email || signal?.patientEmail || signal?.patient_email);

    const result = await querySafe(
      db,
      `SELECT * FROM patients p WHERE LOWER(p.${q(emailColumn)}) = LOWER($1) LIMIT 1`,
      [rawEmail]
    );

    if (!result.error && result.rows?.[0]) {
      const row = result.rows[0];
      return {
        patientId: idColumn ? row[idColumn] : null,
        patientName: nameColumn ? row[nameColumn] || derivePatientNameFromSignal(signal) : derivePatientNameFromSignal(signal)
      };
    }
  }

  return {
    patientId: null,
    patientName: derivePatientNameFromSignal(signal)
  };
}

function buildSignalNotes(signal) {
  const signalId = normalizeText(signal?.id) || 'unknown';
  const signalKind = normalizeText(signal?.kind) || 'action';
  const patientEmail = normalizeText(signal?.email || signal?.patientEmail || signal?.patient_email) || 'unknown';
  const signalTitle = normalizeText(signal?.title) || 'Patient signal';
  const source = normalizeText(signal?.source) || 'patient_signal';
  const description = normalizeText(signal?.description) || 'No description provided.';

  return [
    '[PATIENT_SIGNAL]',
    `signal_id=${signalId}`,
    `signal_kind=${signalKind}`,
    `signal_title=${signalTitle}`,
    `patient_email=${patientEmail}`,
    `source=${source}`,
    '[/PATIENT_SIGNAL]',
    '',
    description
  ].join('\n');
}

async function createNativeTaskFromSignal(signal, actor) {
  const exists = await tableExists(db, 'tasks');

  if (!exists) {
    throw new Error('Tasks table is missing.');
  }

  const columns = await getColumns(db, 'tasks');
  const typeMap = await getColumnTypeMap('tasks');

  const { patientId, patientName } = await resolvePatientContextFromSignal(signal);

  const title = normalizeText(`Follow-up: ${signal?.title || 'Patient signal'}`);
  const doctorName = normalizeText(actor?.name || actor?.email || 'RAFTOP Team');
  const status = normalizeStatus('pending');
  const priority = normalizePriority(derivePriorityFromSignal(signal));
  const dueAt = normalizeDateTime(new Date().toISOString()) || new Date().toISOString();
  const assignedTo = normalizeText(actor?.email || actor?.name || 'RAFTOP Team');
  const notes = buildSignalNotes(signal);
  const tenantId = normalizeText(signal?.tenantId || signal?.tenant_id);

  const insertPairs = [];
  const idColumn = firstExisting(columns, ['id', 'task_id']);

  if (idColumn && !isIntegerType(typeMap[idColumn])) {
    pushTypedIfColumnExists(
      insertPairs,
      columns,
      typeMap,
      ['id', 'task_id'],
      generateTaskId()
    );
  }

  pushTypedIfColumnExists(insertPairs, columns, typeMap, ['title', 'task_title', 'name'], title);
  pushTypedIfColumnExists(
    insertPairs,
    columns,
    typeMap,
    ['patient_id'],
    await resolveLinkedId('patients', normalizeText(patientId), ['id', 'patient_id'])
  );
  pushTypedIfColumnExists(insertPairs, columns, typeMap, ['patient_name'], patientName);
  pushTypedIfColumnExists(insertPairs, columns, typeMap, ['doctor_name'], doctorName);
  pushTypedIfColumnExists(insertPairs, columns, typeMap, ['status', 'task_status'], status);
  pushTypedIfColumnExists(insertPairs, columns, typeMap, ['priority', 'severity'], priority);
  pushTypedIfColumnExists(insertPairs, columns, typeMap, ['due_at', 'scheduled_at'], dueAt);
  pushAssigneeField(insertPairs, columns, typeMap, assignedTo);
  pushTypedIfColumnExists(insertPairs, columns, typeMap, ['notes', 'comment'], notes);
  pushTypedIfColumnExists(insertPairs, columns, typeMap, ['tenant_id'], tenantId);
  pushTypedIfColumnExists(insertPairs, columns, typeMap, ['created_at'], new Date().toISOString());
  pushTypedIfColumnExists(insertPairs, columns, typeMap, ['updated_at'], new Date().toISOString());

  if (!insertPairs.length) {
    throw new Error('No compatible task columns were found for native task insert.');
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
    throw new Error(result.error.message || 'Failed to create native task from signal.');
  }

  const taskId = result.rows?.[0]?.id || null;

  return {
    id: taskId,
    title,
    description: notes,
    patientId: patientId || null,
    patientName: patientName || null,
    patientEmail: normalizeText(signal?.email || signal?.patientEmail || signal?.patient_email),
    status,
    priority,
    dueAt,
    assignedTo,
    tenantId
  };
}

module.exports = {
  createNativeTaskFromSignal
};