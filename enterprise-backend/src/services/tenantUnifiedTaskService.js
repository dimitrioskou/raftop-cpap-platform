const db = require('../db');
const {
  q,
  querySafe,
  getColumns,
  firstExisting
} = require('../utils/routeDbHelpers');

function normalizeText(value) {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getTenantIdFromUser(user) {
  return normalizeText(
    user?.tenantId ||
      user?.organizationId ||
      user?.raw?.tenant_id ||
      user?.raw?.organization_id
  );
}

function buildSummary(items) {
  return {
    total: items.length,
    openCount: items.filter((item) => String(item.status || '').toLowerCase() !== 'resolved').length,
    resolvedCount: items.filter((item) => String(item.status || '').toLowerCase() === 'resolved').length,
    nativeCount: items.filter((item) => item.sourceType === 'native').length,
    patientSignalCount: items.filter((item) => item.sourceType === 'patient_signal_task').length
  };
}

function normalizeUnifiedStatus(raw) {
  const value = String(raw || '').trim().toLowerCase();

  if (!value) return 'open';
  if (['done', 'completed', 'resolved', 'cancelled'].includes(value)) return 'resolved';
  if (['critical', 'urgent', 'priority', 'escalated'].includes(value)) return 'priority';
  return 'open';
}

function parsePatientSignalMeta(text) {
  const raw = String(text || '');
  const blockMatch = raw.match(/\[PATIENT_SIGNAL\]([\s\S]*?)\[\/PATIENT_SIGNAL\]/i);

  if (!blockMatch?.[1]) {
    return null;
  }

  const meta = {};

  blockMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        meta[key] = value;
      }
    });

  return meta;
}

function stripPatientSignalMeta(text) {
  const raw = String(text || '');
  return raw
    .replace(/\[PATIENT_SIGNAL\][\s\S]*?\[\/PATIENT_SIGNAL\]/i, '')
    .trim();
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

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
}

function hoursBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);

  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return 0;
  }

  return (a.getTime() - b.getTime()) / (1000 * 60 * 60);
}

function toAtlasLabel(category) {
  const labels = {
    THERAPY_ISSUE_CRITICAL: 'Therapy Issue Critical',
    THERAPY_ISSUE: 'Therapy Issue',
    CALLBACK_REQUEST: 'Callback Request',
    COMPLIANCE_REVIEW: 'Compliance Review',
    ACTIVE_WORK: 'Active Work',
    GENERAL_TASK: 'General Task'
  };

  return labels[category] || 'General Task';
}

function deriveAtlasCategory(task) {
  const signalKind = String(task.signalKind || '').toLowerCase();
  const title = String(task.title || '').toLowerCase();
  const description = String(task.description || '').toLowerCase();
  const rawStatus = String(task.rawStatus || '').toLowerCase();
  const priority = String(task.priority || '').toLowerCase();

  if (signalKind === 'issue' && (priority === 'critical' || rawStatus === 'escalated')) {
    return 'THERAPY_ISSUE_CRITICAL';
  }

  if (signalKind === 'issue') {
    return 'THERAPY_ISSUE';
  }

  if (signalKind === 'callback') {
    return 'CALLBACK_REQUEST';
  }

  if (
    title.includes('compliance') ||
    description.includes('compliance') ||
    title.includes('adherence') ||
    description.includes('adherence')
  ) {
    return 'COMPLIANCE_REVIEW';
  }

  if (rawStatus === 'in_progress') {
    return 'ACTIVE_WORK';
  }

  return 'GENERAL_TASK';
}

function deriveSlaTargetHours(task, category) {
  const priority = String(task.priority || '').toLowerCase();
  const rawStatus = String(task.rawStatus || '').toLowerCase();

  if (category === 'THERAPY_ISSUE_CRITICAL') return 4;
  if (category === 'CALLBACK_REQUEST') return 8;
  if (category === 'THERAPY_ISSUE') return 12;
  if (category === 'COMPLIANCE_REVIEW') return 24;
  if (rawStatus === 'escalated' || priority === 'critical') return 6;
  if (priority === 'warning') return 12;

  return 48;
}

function deriveUrgencyScore(task, category, ageHours, remainingHours, slaState) {
  let score = 20;

  if (task.sourceType === 'patient_signal_task') score += 12;
  if (category === 'THERAPY_ISSUE_CRITICAL') score += 35;
  else if (category === 'CALLBACK_REQUEST') score += 22;
  else if (category === 'THERAPY_ISSUE') score += 18;
  else if (category === 'COMPLIANCE_REVIEW') score += 12;

  if (String(task.rawStatus || '').toLowerCase() === 'escalated') score += 18;
  if (String(task.rawStatus || '').toLowerCase() === 'in_progress') score += 6;
  if (String(task.priority || '').toLowerCase() === 'critical') score += 15;
  if (String(task.priority || '').toLowerCase() === 'warning') score += 8;

  score += Math.min(20, Math.floor(ageHours / 6) * 2);

  if (slaState === 'overdue') score += 20;
  if (slaState === 'warning') score += 10;
  if (remainingHours <= 2) score += 6;

  return Math.max(0, Math.min(100, score));
}

function buildAtlasMeta(task) {
  const category = deriveAtlasCategory(task);
  const label = toAtlasLabel(category);
  const slaTargetHours = deriveSlaTargetHours(task, category);
  const ageHours = round(hoursBetween(new Date(), task.createdAt), 1);
  const slaRemainingHours = round(slaTargetHours - ageHours, 1);

  let slaState = 'on_track';

  if (slaRemainingHours < 0) {
    slaState = 'overdue';
  } else if (slaRemainingHours <= Math.max(2, slaTargetHours * 0.25)) {
    slaState = 'warning';
  }

  const urgencyScore = deriveUrgencyScore(
    task,
    category,
    ageHours,
    slaRemainingHours,
    slaState
  );

  return {
    category,
    label,
    slaTargetHours,
    ageHours,
    slaRemainingHours,
    slaState,
    urgencyScore
  };
}

function mapNativeTaskRow(row, columns, tableName) {
  const titleKey = firstExisting(columns, ['title', 'task_title', 'name']);
  const descriptionKey = firstExisting(columns, ['description', 'summary', 'details']);
  const notesKey = firstExisting(columns, ['notes', 'comment']);
  const statusKey = firstExisting(columns, ['status', 'task_status']);
  const createdAtKey = firstExisting(columns, ['created_at', 'date', 'inserted_at']);
  const updatedAtKey = firstExisting(columns, ['updated_at']);
  const createdByKey = firstExisting(columns, ['created_by', 'owner', 'author', 'user_email']);
  const assigneeKey = firstExisting(columns, ['assignee', 'assigned_to', 'assigned_to_email', 'assigned_user', 'owner']);
  const emailKey = firstExisting(columns, ['patient_email', 'email', 'user_email']);
  const priorityKey = firstExisting(columns, ['priority', 'severity']);
  const tenantKey = firstExisting(columns, ['tenant_id', 'organization_id']);

  const notesText = notesKey ? row[notesKey] || '' : '';
  const signalMeta = parsePatientSignalMeta(notesText);
  const rawStatus = statusKey ? String(row[statusKey] || '').trim().toLowerCase() : '';
  const cleanedDescription =
    (descriptionKey ? row[descriptionKey] : null) || stripPatientSignalMeta(notesText) || '';

  const base = {
    id: row.id || row.task_id || `native-${Math.random().toString(36).slice(2)}`,
    title: (titleKey ? row[titleKey] : null) || 'Native task',
    description: cleanedDescription,
    notes: notesText || '',
    patientEmail:
      (signalMeta?.patient_email || null) ||
      (emailKey ? row[emailKey] || null : null),
    patientUserId: null,
    tenantId: tenantKey ? row[tenantKey] || null : null,
    patientSignalId: signalMeta?.signal_id || null,
    signalKind: signalMeta?.signal_kind || null,
    signalTitle: signalMeta?.signal_title || null,
    status: normalizeUnifiedStatus(rawStatus),
    rawStatus: rawStatus || 'pending',
    createdBy: createdByKey ? row[createdByKey] || null : null,
    assignee: assigneeKey ? row[assigneeKey] || null : null,
    createdAt: createdAtKey ? row[createdAtKey] || new Date().toISOString() : new Date().toISOString(),
    updatedAt: updatedAtKey ? row[updatedAtKey] || null : null,
    priority: priorityKey ? row[priorityKey] || null : null,
    source: tableName,
    sourceType: signalMeta?.signal_id ? 'patient_signal_task' : 'native',
    resolvable: Boolean(statusKey),
    statusColumn: statusKey || null,
    tableName
  };

  return {
    ...base,
    atlas: buildAtlasMeta(base)
  };
}

async function getPublicTables() {
  const result = await querySafe(
    db,
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `
  );

  return new Set((result.rows || []).map((row) => row.table_name));
}

async function loadNativeTasks(user) {
  const tenantId = getTenantIdFromUser(user);
  const tables = await getPublicTables();
  const candidates = ['tasks', 'tenant_tasks', 'followup_tasks'];
  const collected = [];

  for (const tableName of candidates) {
    if (!tables.has(tableName)) continue;

    const columns = await getColumns(db, tableName);
    const tenantKey = firstExisting(columns, ['tenant_id', 'organization_id']);
    const orderKey = firstExisting(columns, ['updated_at', 'created_at', 'date', 'id', 'task_id']) || 'id';

    let result;

    if (tenantId && tenantKey) {
      result = await querySafe(
        db,
        `
          SELECT *
          FROM ${tableName}
          WHERE ${q(tenantKey)}::text = $1
          ORDER BY ${q(orderKey)} DESC
          LIMIT 300
        `,
        [tenantId]
      );
    } else {
      result = await querySafe(
        db,
        `
          SELECT *
          FROM ${tableName}
          ORDER BY ${q(orderKey)} DESC
          LIMIT 300
        `
      );
    }

    if (!result.error && result.rows?.length) {
      collected.push(
        ...result.rows.map((row) => mapNativeTaskRow(row, columns, tableName))
      );
    }
  }

  return collected;
}

async function listUnifiedTasks(user) {
  const nativeTasks = await loadNativeTasks(user);

  const items = [...safeArray(nativeTasks)].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return {
    summary: buildSummary(items),
    items
  };
}

async function readUnifiedTaskById(user, taskId) {
  const id = normalizeText(taskId);

  if (!id) {
    throw new Error('Task id is required');
  }

  const items = await loadNativeTasks(user);
  const found = items.find((item) => String(item.id) === String(id));

  if (!found) {
    throw new Error('Unified task not found');
  }

  return found;
}

async function syncLinkedPatientSignal(actor, mappedTask, targetSignalStatus) {
  const signalId = normalizeText(mappedTask?.patientSignalId);

  if (!signalId) {
    return;
  }

  const resolvedBy = normalizeText(actor?.email || actor?.userId || actor?.id) || 'tenant-user';

  if (targetSignalStatus === 'resolved') {
    await querySafe(
      db,
      `
        UPDATE patient_signals
        SET
          status = 'resolved',
          resolved_at = NOW(),
          resolved_by = $2,
          updated_at = NOW()
        WHERE id = $1
      `,
      [signalId, resolvedBy]
    );

    return;
  }

  if (targetSignalStatus === 'priority') {
    await querySafe(
      db,
      `
        UPDATE patient_signals
        SET
          status = 'priority',
          updated_at = NOW()
        WHERE id = $1
      `,
      [signalId]
    );
  }
}

async function updateNativeTaskAcrossTables(actor, taskId, action, payload = {}) {
  const id = normalizeText(taskId);
  const tables = await getPublicTables();
  const candidateTables = ['tasks', 'tenant_tasks', 'followup_tasks'];

  for (const tableName of candidateTables) {
    if (!tables.has(tableName)) continue;

    const columns = await getColumns(db, tableName);
    const typeMap = await getColumnTypeMap(tableName);

    const idColumn = firstExisting(columns, ['id', 'task_id']);
    const statusColumn = firstExisting(columns, ['status', 'task_status']);
    const priorityColumn = firstExisting(columns, ['priority', 'severity']);
    const updatedAtColumn = firstExisting(columns, ['updated_at']);
    const notesColumn = firstExisting(columns, ['notes', 'comment']);

    const assigneeTextColumn = ['assigned_to', 'owner'].find(
      (name) => columns.includes(name) && !isIntegerType(typeMap[name])
    );

    const assigneeNumericColumn = ['assigned_to', 'owner'].find(
      (name) => columns.includes(name) && isIntegerType(typeMap[name])
    );

    if (!idColumn) {
      continue;
    }

    const assignments = [];
    const params = [];
    let linkedSignalStatus = null;

    if (action === 'resolve') {
      if (!statusColumn) continue;
      params.push('done');
      assignments.push(`${q(statusColumn)} = $${params.length}`);
      linkedSignalStatus = 'resolved';
    }

    if (action === 'in_progress') {
      if (!statusColumn) continue;
      params.push('in_progress');
      assignments.push(`${q(statusColumn)} = $${params.length}`);
    }

    if (action === 'escalate') {
      if (statusColumn) {
        params.push('escalated');
        assignments.push(`${q(statusColumn)} = $${params.length}`);
      }

      if (priorityColumn) {
        params.push('critical');
        assignments.push(`${q(priorityColumn)} = $${params.length}`);
      }

      if (notesColumn) {
        const noteLine = `[SYSTEM] Escalated by ${normalizeText(actor?.email || actor?.userId || actor?.id) || 'tenant-user'} at ${new Date().toISOString()}`;
        params.push(noteLine);
        assignments.push(`${q(notesColumn)} = COALESCE(${q(notesColumn)}, '') || CASE WHEN COALESCE(${q(notesColumn)}, '') = '' THEN '' ELSE E'\\n' END || $${params.length}`);
      }

      linkedSignalStatus = 'priority';
    }

    if (action === 'assign') {
      const assignee = normalizeText(payload.assignee);

      if (!assignee) {
        throw new Error('Assignee is required');
      }

      if (assigneeTextColumn) {
        params.push(assignee);
        assignments.push(`${q(assigneeTextColumn)} = $${params.length}`);
      } else if (assigneeNumericColumn) {
        const coerced = coerceValueForColumnType(assignee, typeMap[assigneeNumericColumn]);

        if (coerced === null || typeof coerced === 'undefined') {
          throw new Error('No compatible assignee column for this task schema');
        }

        params.push(coerced);
        assignments.push(`${q(assigneeNumericColumn)} = $${params.length}`);
      } else {
        throw new Error('No assignee column exists in the task schema');
      }

      if (notesColumn) {
        const noteLine = `[SYSTEM] Assigned to ${assignee} by ${normalizeText(actor?.email || actor?.userId || actor?.id) || 'tenant-user'} at ${new Date().toISOString()}`;
        params.push(noteLine);
        assignments.push(`${q(notesColumn)} = COALESCE(${q(notesColumn)}, '') || CASE WHEN COALESCE(${q(notesColumn)}, '') = '' THEN '' ELSE E'\\n' END || $${params.length}`);
      }
    }

    if (action === 'note') {
      const note = normalizeText(payload.note);

      if (!note) {
        throw new Error('Note is required');
      }

      if (!notesColumn) {
        throw new Error('No notes/comment column exists in the task schema');
      }

      const noteLine = `[INTERNAL_NOTE] ${normalizeText(actor?.email || actor?.userId || actor?.id) || 'tenant-user'} @ ${new Date().toISOString()} — ${note}`;
      params.push(noteLine);
      assignments.push(`${q(notesColumn)} = COALESCE(${q(notesColumn)}, '') || CASE WHEN COALESCE(${q(notesColumn)}, '') = '' THEN '' ELSE E'\\n' END || $${params.length}`);
    }

    if (!assignments.length) {
      continue;
    }

    if (updatedAtColumn) {
      params.push(new Date().toISOString());
      assignments.push(`${q(updatedAtColumn)} = $${params.length}`);
    }

    params.push(id);
    const whereIndex = params.length;

    const result = await querySafe(
      db,
      `
        UPDATE ${tableName}
        SET ${assignments.join(', ')}
        WHERE ${q(idColumn)}::text = $${whereIndex}
        RETURNING *
      `,
      params
    );

    if (!result.error && result.rows?.[0]) {
      const mapped = mapNativeTaskRow(result.rows[0], columns, tableName);

      if (linkedSignalStatus) {
        await syncLinkedPatientSignal(actor, mapped, linkedSignalStatus);
      }

      return mapped;
    }
  }

  throw new Error('Unified task not found or not actionable');
}

async function resolveUnifiedTask(actor, taskId) {
  return updateNativeTaskAcrossTables(actor, taskId, 'resolve');
}

async function markTaskInProgress(actor, taskId) {
  return updateNativeTaskAcrossTables(actor, taskId, 'in_progress');
}

async function escalateTask(actor, taskId) {
  return updateNativeTaskAcrossTables(actor, taskId, 'escalate');
}

async function assignTask(actor, taskId, assignee) {
  return updateNativeTaskAcrossTables(actor, taskId, 'assign', { assignee });
}

async function appendTaskNote(actor, taskId, note) {
  return updateNativeTaskAcrossTables(actor, taskId, 'note', { note });
}

async function bulkUpdateTasks(actor, taskIds, action, payload = {}) {
  const normalizedIds = [...new Set(
    safeArray(taskIds)
      .map((id) => normalizeText(id))
      .filter(Boolean)
  )];

  if (!normalizedIds.length) {
    throw new Error('At least one task id is required');
  }

  const successes = [];
  const errors = [];

  for (const taskId of normalizedIds) {
    try {
      let updatedTask = null;

      if (action === 'resolve') {
        updatedTask = await resolveUnifiedTask(actor, taskId);
      } else if (action === 'in_progress') {
        updatedTask = await markTaskInProgress(actor, taskId);
      } else if (action === 'escalate') {
        updatedTask = await escalateTask(actor, taskId);
      } else if (action === 'assign') {
        updatedTask = await assignTask(actor, taskId, payload.assignee);
      } else {
        throw new Error('Unsupported bulk action');
      }

      successes.push(updatedTask);
    } catch (error) {
      errors.push({
        taskId,
        message: error?.message || 'Bulk action failed'
      });
    }
  }

  return {
    totalRequested: normalizedIds.length,
    successCount: successes.length,
    errorCount: errors.length,
    items: successes,
    errors
  };
}

module.exports = {
  listUnifiedTasks,
  readUnifiedTaskById,
  resolveUnifiedTask,
  markTaskInProgress,
  escalateTask,
  assignTask,
  appendTaskNote,
  bulkUpdateTasks
};