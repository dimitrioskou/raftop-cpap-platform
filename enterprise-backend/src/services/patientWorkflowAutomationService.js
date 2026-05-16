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

  throw new Error('Could not resolve database client in patientWorkflowAutomationService.');
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

function roundDateHoursFromNow(hoursToAdd) {
  const date = new Date();
  date.setHours(date.getHours() + Number(hoursToAdd || 0));
  return date.toISOString();
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

function pushIfColumnExists(pairs, columns, typeMap, candidates, value) {
  const column = firstExisting(columns, candidates);

  if (!column || typeof value === 'undefined') {
    return null;
  }

  pairs.push({
    column,
    value: coerceValueForColumnType(value, typeMap[column])
  });

  return column;
}

function pushAssigneeField(pairs, columns, typeMap, value) {
  if (typeof value === 'undefined') {
    return null;
  }

  const textColumn = ['assigned_to', 'owner'].find(
    (name) => columns.includes(name) && !isIntegerType(typeMap[name])
  );

  if (textColumn) {
    pairs.push({
      column: textColumn,
      value
    });
    return textColumn;
  }

  const numericColumn = ['assigned_to', 'owner'].find(
    (name) => columns.includes(name) && isIntegerType(typeMap[name])
  );

  if (numericColumn) {
    pairs.push({
      column: numericColumn,
      value: coerceValueForColumnType(value, typeMap[numericColumn])
    });
    return numericColumn;
  }

  return null;
}

async function resolveTaskTable() {
  const candidates = ['tasks', 'tenant_tasks', 'followup_tasks'];

  for (const tableName of candidates) {
    if (await tableExists(db, tableName)) {
      return tableName;
    }
  }

  return null;
}

async function findExistingTaskByMeta(pattern) {
  const taskTable = await resolveTaskTable();

  if (!taskTable) return null;

  const columns = await getColumns(db, taskTable);
  const idColumn = firstExisting(columns, ['id', 'task_id']);
  const notesColumn = firstExisting(columns, ['notes', 'comment']);

  if (!idColumn || !notesColumn) {
    return null;
  }

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM ${taskTable}
      WHERE ${q(notesColumn)} ILIKE $1
      ORDER BY ${q(idColumn)} DESC
      LIMIT 1
    `,
    [`%${pattern}%`]
  );

  if (result.error || !result.rows?.[0]) {
    return null;
  }

  return {
    tableName: taskTable,
    row: result.rows[0]
  };
}

function deriveSignalRule(signal) {
  const kind = safeLower(signal?.kind);
  const title = normalizeText(signal?.title) || 'Patient Signal';
  const description = normalizeText(signal?.description) || '';
  const patientEmail = normalizeText(signal?.patientEmail || signal?.email);
  const signalId = normalizeText(signal?.id);
  const severity =
    safeLower(signal?.metadata?.severity) ||
    (safeLower(signal?.status) === 'priority' ? 'high' : 'medium');

  if (kind === 'callback') {
    return {
      shouldCreate: true,
      category: 'CALLBACK_REQUEST',
      title: `Follow-up: ${title}`,
      description,
      priority: 'warning',
      status: 'pending',
      dueAt: roundDateHoursFromNow(8),
      assignee: 'RAFTOP Team',
      patientEmail,
      signalId,
      metaBlock: [
        '[PATIENT_SIGNAL]',
        `signal_id=${signalId || ''}`,
        `signal_kind=${kind}`,
        `signal_title=${title}`,
        `patient_email=${patientEmail || ''}`,
        'source=patient_signal',
        '[/PATIENT_SIGNAL]',
        '[ATLAS_RULE]',
        'category=CALLBACK_REQUEST',
        'sla_hours=8',
        'priority=warning',
        'origin=patient_automation',
        '[/ATLAS_RULE]'
      ].join('\n')
    };
  }

  if (kind === 'issue') {
    const critical = severity === 'high' || safeLower(signal?.status) === 'priority';

    return {
      shouldCreate: true,
      category: critical ? 'THERAPY_ISSUE_CRITICAL' : 'THERAPY_ISSUE',
      title: `Follow-up: ${title}`,
      description,
      priority: critical ? 'critical' : 'warning',
      status: critical ? 'escalated' : 'pending',
      dueAt: roundDateHoursFromNow(critical ? 4 : 12),
      assignee: 'RAFTOP Team',
      patientEmail,
      signalId,
      metaBlock: [
        '[PATIENT_SIGNAL]',
        `signal_id=${signalId || ''}`,
        `signal_kind=${kind}`,
        `signal_title=${title}`,
        `patient_email=${patientEmail || ''}`,
        'source=patient_signal',
        '[/PATIENT_SIGNAL]',
        '[ATLAS_RULE]',
        `category=${critical ? 'THERAPY_ISSUE_CRITICAL' : 'THERAPY_ISSUE'}`,
        `sla_hours=${critical ? 4 : 12}`,
        `priority=${critical ? 'critical' : 'warning'}`,
        'origin=patient_automation',
        '[/ATLAS_RULE]'
      ].join('\n')
    };
  }

  if (kind === 'acknowledge') {
    return {
      shouldCreate: false,
      category: 'ACKNOWLEDGEMENT_ONLY'
    };
  }

  return {
    shouldCreate: false,
    category: 'NO_RULE'
  };
}

function derivePatientReplyRule(message) {
  const messageId = normalizeText(message?.id);
  const patientEmail =
    normalizeText(message?.senderEmail) ||
    normalizeText(message?.recipientEmail) ||
    'unknown@patient.local';

  const subject = normalizeText(message?.subject) || 'Patient reply';
  const body = normalizeText(message?.body) || '';

  return {
    shouldCreate: true,
    category: 'PATIENT_REPLY_REVIEW',
    title: `Review patient reply: ${subject}`,
    description: body,
    priority: 'warning',
    status: 'pending',
    dueAt: roundDateHoursFromNow(12),
    assignee: 'RAFTOP Team',
    patientEmail,
    messageId,
    metaBlock: [
      '[PATIENT_MESSAGE]',
      `message_id=${messageId || ''}`,
      `patient_email=${patientEmail || ''}`,
      `subject=${subject}`,
      'origin=patient_reply',
      '[/PATIENT_MESSAGE]',
      '[ATLAS_RULE]',
      'category=PATIENT_REPLY_REVIEW',
      'sla_hours=12',
      'priority=warning',
      'origin=patient_reply_automation',
      '[/ATLAS_RULE]'
    ].join('\n')
  };
}

async function insertTask(rule, actor) {
  const taskTable = await resolveTaskTable();

  if (!taskTable) {
    throw new Error('No compatible task table exists');
  }

  const columns = await getColumns(db, taskTable);
  const typeMap = await getColumnTypeMap(taskTable);
  const insertPairs = [];

  pushIfColumnExists(insertPairs, columns, typeMap, ['title', 'task_title', 'name'], rule.title);
  pushIfColumnExists(insertPairs, columns, typeMap, ['description', 'summary', 'details'], rule.description);
  pushIfColumnExists(insertPairs, columns, typeMap, ['status', 'task_status'], rule.status);
  pushIfColumnExists(insertPairs, columns, typeMap, ['priority', 'severity'], rule.priority);
  pushIfColumnExists(insertPairs, columns, typeMap, ['due_at', 'scheduled_at'], rule.dueAt);
  pushIfColumnExists(insertPairs, columns, typeMap, ['patient_email'], rule.patientEmail);
  pushIfColumnExists(insertPairs, columns, typeMap, ['created_by'], normalizeText(actor?.email || actor?.id) || 'patient-automation');
  pushIfColumnExists(insertPairs, columns, typeMap, ['tenant_id'], normalizeText(actor?.tenantId || actor?.organizationId || actor?.raw?.tenant_id || actor?.raw?.organization_id));
  pushIfColumnExists(insertPairs, columns, typeMap, ['created_at'], new Date().toISOString());
  pushIfColumnExists(insertPairs, columns, typeMap, ['updated_at'], new Date().toISOString());
  pushIfColumnExists(insertPairs, columns, typeMap, ['notes', 'comment'], rule.metaBlock);
  pushAssigneeField(insertPairs, columns, typeMap, rule.assignee);

  if (!insertPairs.length) {
    throw new Error('No compatible task columns found');
  }

  const insertColumns = insertPairs.map((entry) => q(entry.column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map((entry) => entry.value);

  const idColumn = firstExisting(columns, ['id', 'task_id']);

  const result = await querySafe(
    db,
    `
      INSERT INTO ${taskTable} (${insertColumns})
      VALUES (${placeholders})
      ${idColumn ? `RETURNING ${q(idColumn)}::text AS id` : ''}
    `,
    values
  );

  return {
    ok: true,
    tableName: taskTable,
    taskId: result.rows?.[0]?.id || null,
    category: rule.category,
    title: rule.title,
    priority: rule.priority,
    patientEmail: rule.patientEmail
  };
}

async function autoCreateTaskForSignal(signal, actor) {
  const rule = deriveSignalRule(signal);

  if (!rule.shouldCreate) {
    return {
      ok: true,
      skipped: true,
      reason: rule.category || 'NO_RULE'
    };
  }

  if (rule.signalId) {
    const existing = await findExistingTaskByMeta(`signal_id=${rule.signalId}`);

    if (existing) {
      return {
        ok: true,
        deduped: true,
        tableName: existing.tableName,
        existingTaskId: existing.row?.id || existing.row?.task_id || null,
        category: rule.category
      };
    }
  }

  return insertTask(rule, actor);
}

async function autoCreateTaskForPatientReply(message, actor) {
  const rule = derivePatientReplyRule(message);

  if (!rule.shouldCreate) {
    return {
      ok: true,
      skipped: true,
      reason: 'NO_RULE'
    };
  }

  if (rule.messageId) {
    const existing = await findExistingTaskByMeta(`message_id=${rule.messageId}`);

    if (existing) {
      return {
        ok: true,
        deduped: true,
        tableName: existing.tableName,
        existingTaskId: existing.row?.id || existing.row?.task_id || null,
        category: rule.category
      };
    }
  }

  return insertTask(rule, actor);
}

module.exports = {
  autoCreateTaskForSignal,
  autoCreateTaskForPatientReply
};