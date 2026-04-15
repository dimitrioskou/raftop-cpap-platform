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
  if (
    [
      'pending',
      'contacted',
      'no_answer',
      'callback_requested',
      'resolved',
      'escalated'
    ].includes(raw)
  ) {
    return raw;
  }

  if (raw.includes('contact')) return 'contacted';
  if (raw.includes('no')) return 'no_answer';
  if (raw.includes('callback')) return 'callback_requested';
  if (raw.includes('resolve')) return 'resolved';
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

function generateFollowupId() {
  return `followup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildReadOrder(columns) {
  const orderColumn = firstExisting(columns, [
    'updated_at',
    'scheduled_at',
    'created_at'
  ]);
  const idColumn = firstExisting(columns, ['id', 'followup_id']);

  if (orderColumn) return `f.${q(orderColumn)} DESC NULLS LAST`;
  if (idColumn) return `f.${q(idColumn)} DESC`;

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
    `SELECT 1 FROM ${tableName} t WHERE t.${q(pkColumn)}::text = $1 LIMIT 1`,
    [rawId]
  );

  if (check.error || !check.rows?.length) return null;

  return rawId;
}

async function readFollowups() {
  const exists = await tableExists(db, 'followup');

  if (!exists) {
    return {
      followups: [],
      totalFollowups: 0,
      debug: 'followup_table_missing'
    };
  }

  const columns = await getColumns(db, 'followup');

  const idColumn = firstExisting(columns, ['id', 'followup_id']);
  const patientIdColumn = firstExisting(columns, ['patient_id']);
  const patientNameColumn = firstExisting(columns, ['patient_name']);
  const doctorIdColumn = firstExisting(columns, ['doctor_id']);
  const doctorNameColumn = firstExisting(columns, ['doctor_name']);
  const statusColumn = firstExisting(columns, ['status', 'followup_status']);
  const outcomeColumn = firstExisting(columns, ['outcome', 'followup_outcome']);
  const priorityColumn = firstExisting(columns, ['priority', 'severity']);
  const channelColumn = firstExisting(columns, ['channel', 'contact_channel']);
  const scheduledAtColumn = firstExisting(columns, ['scheduled_at', 'due_at']);
  const contactedAtColumn = firstExisting(columns, ['contacted_at']);
  const assignedToColumn = firstExisting(columns, ['assigned_to', 'owner']);
  const notesColumn = firstExisting(columns, ['notes', 'comment']);
  const tenantIdColumn = firstExisting(columns, ['tenant_id']);
  const createdAtColumn = firstExisting(columns, ['created_at']);
  const updatedAtColumn = firstExisting(columns, ['updated_at']);

  const sql = `
    SELECT
      ${textExpr('f', idColumn, 'id')},
      ${textExpr('f', patientIdColumn, 'patient_id')},
      ${textExpr('f', patientNameColumn, 'patient_name')},
      ${textExpr('f', doctorIdColumn, 'doctor_id')},
      ${textExpr('f', doctorNameColumn, 'doctor_name')},
      ${textExpr('f', statusColumn, 'status')},
      ${textExpr('f', outcomeColumn, 'outcome')},
      ${textExpr('f', priorityColumn, 'priority')},
      ${textExpr('f', channelColumn, 'channel')},
      ${textExpr('f', scheduledAtColumn, 'scheduled_at')},
      ${textExpr('f', contactedAtColumn, 'contacted_at')},
      ${textExpr('f', assignedToColumn, 'assigned_to')},
      ${textExpr('f', notesColumn, 'notes')},
      ${textExpr('f', tenantIdColumn, 'tenant_id')},
      ${textExpr('f', createdAtColumn, 'created_at')},
      ${textExpr('f', updatedAtColumn, 'updated_at')}
    FROM followup f
    ORDER BY ${buildReadOrder(columns)}
    LIMIT 500
  `;

  const result = await querySafe(db, sql);

  if (result.error) {
    return {
      followups: [],
      totalFollowups: 0,
      debug: result.error.message
    };
  }

  return {
    followups: result.rows || [],
    totalFollowups: result.rows?.length || 0,
    debug: null
  };
}

router.get('/', async (_req, res) => {
  const data = await readFollowups();

  return res.json({
    ok: true,
    followups: data.followups,
    totalFollowups: data.totalFollowups,
    timestamp: new Date().toISOString(),
    debug: data.debug || null
  });
});

router.post('/', async (req, res) => {
  const exists = await tableExists(db, 'followup');

  if (!exists) {
    return res.status(500).json({
      ok: false,
      message: 'Follow-up table is missing.'
    });
  }

  const columns = await getColumns(db, 'followup');

  const patientIdRaw = normalizeText(req.body?.patient_id);
  const patientName = normalizeText(req.body?.patient_name);
  const doctorIdRaw = normalizeText(req.body?.doctor_id);
  const doctorName = normalizeText(req.body?.doctor_name);
  const status = normalizeStatus(req.body?.status);
  const outcome = normalizeText(req.body?.outcome || status);
  const priority = normalizePriority(req.body?.priority);
  const channel = normalizeText(req.body?.channel || 'phone');
  const scheduledAt = normalizeDateTime(req.body?.scheduled_at) || new Date().toISOString();
  const contactedAt = normalizeDateTime(req.body?.contacted_at);
  const assignedTo = normalizeText(req.body?.assigned_to || 'RAFTOP Team');
  const notes = normalizeText(req.body?.notes);
  const tenantId = normalizeText(req.body?.tenant_id || 'demo-tenant');

  if (!patientName && !patientIdRaw) {
    return res.status(400).json({
      ok: false,
      message: 'Patient name or patient ID is required.'
    });
  }

  const patientId = await resolveLinkedId('patients', patientIdRaw, ['id', 'patient_id']);
  const doctorId = await resolveLinkedId('doctors', doctorIdRaw, ['id', 'doctor_id']);
  const generatedFollowupId = generateFollowupId();

  const insertPairs = [];

  pushIfColumnExists(insertPairs, columns, ['id', 'followup_id'], generatedFollowupId);
  pushIfColumnExists(insertPairs, columns, ['patient_id'], patientId);
  pushIfColumnExists(insertPairs, columns, ['patient_name'], patientName);
  pushIfColumnExists(insertPairs, columns, ['doctor_id'], doctorId);
  pushIfColumnExists(insertPairs, columns, ['doctor_name'], doctorName);
  pushIfColumnExists(insertPairs, columns, ['status', 'followup_status'], status);
  pushIfColumnExists(insertPairs, columns, ['outcome', 'followup_outcome'], outcome);
  pushIfColumnExists(insertPairs, columns, ['priority', 'severity'], priority);
  pushIfColumnExists(insertPairs, columns, ['channel', 'contact_channel'], channel);
  pushIfColumnExists(insertPairs, columns, ['scheduled_at', 'due_at'], scheduledAt);
  pushIfColumnExists(insertPairs, columns, ['contacted_at'], contactedAt);
  pushIfColumnExists(insertPairs, columns, ['assigned_to', 'owner'], assignedTo);
  pushIfColumnExists(insertPairs, columns, ['notes', 'comment'], notes);
  pushIfColumnExists(insertPairs, columns, ['tenant_id'], tenantId);
  pushIfColumnExists(insertPairs, columns, ['created_at'], new Date().toISOString());
  pushIfColumnExists(insertPairs, columns, ['updated_at'], new Date().toISOString());

  if (!insertPairs.length) {
    return res.status(500).json({
      ok: false,
      message: 'No compatible follow-up columns were found for insert.'
    });
  }

  const insertColumns = insertPairs.map((entry) => q(entry.column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map((entry) => entry.value);

  const returningIdColumn = firstExisting(columns, ['id', 'followup_id']);

  const sql = `
    INSERT INTO followup (${insertColumns})
    VALUES (${placeholders})
    ${returningIdColumn ? `RETURNING ${q(returningIdColumn)}::text AS id` : ''}
  `;

  const result = await querySafe(db, sql, values);

  if (result.error) {
    return res.status(500).json({
      ok: false,
      message: result.error.message || 'Failed to create follow-up.'
    });
  }

  return res.status(201).json({
    ok: true,
    message: 'Follow-up created successfully.',
    followup: {
      id: result.rows?.[0]?.id || generatedFollowupId,
      patient_id: patientId,
      patient_name: patientName,
      doctor_id: doctorId,
      doctor_name: doctorName,
      status,
      outcome,
      priority,
      channel,
      scheduled_at: scheduledAt,
      contacted_at: contactedAt,
      assigned_to: assignedTo,
      notes,
      tenant_id: tenantId
    }
  });
});

router.put('/:id', async (req, res) => {
  const exists = await tableExists(db, 'followup');

  if (!exists) {
    return res.status(500).json({
      ok: false,
      message: 'Follow-up table is missing.'
    });
  }

  const columns = await getColumns(db, 'followup');
  const idColumn = firstExisting(columns, ['id', 'followup_id']);

  if (!idColumn) {
    return res.status(500).json({
      ok: false,
      message: 'Follow-up ID column is missing.'
    });
  }

  const existing = await querySafe(
    db,
    `SELECT 1 FROM followup f WHERE f.${q(idColumn)}::text = $1 LIMIT 1`,
    [String(req.params.id)]
  );

  if (existing.error || !existing.rows?.length) {
    return res.status(404).json({
      ok: false,
      message: 'Follow-up not found.'
    });
  }

  const patientIdRaw = normalizeText(req.body?.patient_id);
  const patientName = normalizeText(req.body?.patient_name);
  const doctorIdRaw = normalizeText(req.body?.doctor_id);
  const doctorName = normalizeText(req.body?.doctor_name);
  const status =
    typeof req.body?.status !== 'undefined'
      ? normalizeStatus(req.body?.status)
      : undefined;
  const outcome =
    typeof req.body?.outcome !== 'undefined'
      ? normalizeText(req.body?.outcome)
      : undefined;
  const priority =
    typeof req.body?.priority !== 'undefined'
      ? normalizePriority(req.body?.priority)
      : undefined;
  const channel =
    typeof req.body?.channel !== 'undefined'
      ? normalizeText(req.body?.channel)
      : undefined;
  const scheduledAt =
    typeof req.body?.scheduled_at !== 'undefined'
      ? normalizeDateTime(req.body?.scheduled_at)
      : undefined;
  const contactedAt =
    typeof req.body?.contacted_at !== 'undefined'
      ? normalizeDateTime(req.body?.contacted_at)
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

  const updatePairs = [];

  pushIfColumnExists(updatePairs, columns, ['patient_id'], patientId);
  pushIfColumnExists(updatePairs, columns, ['patient_name'], patientName);
  pushIfColumnExists(updatePairs, columns, ['doctor_id'], doctorId);
  pushIfColumnExists(updatePairs, columns, ['doctor_name'], doctorName);
  pushIfColumnExists(updatePairs, columns, ['status', 'followup_status'], status);
  pushIfColumnExists(updatePairs, columns, ['outcome', 'followup_outcome'], outcome);
  pushIfColumnExists(updatePairs, columns, ['priority', 'severity'], priority);
  pushIfColumnExists(updatePairs, columns, ['channel', 'contact_channel'], channel);
  pushIfColumnExists(updatePairs, columns, ['scheduled_at', 'due_at'], scheduledAt);
  pushIfColumnExists(updatePairs, columns, ['contacted_at'], contactedAt);
  pushIfColumnExists(updatePairs, columns, ['assigned_to', 'owner'], assignedTo);
  pushIfColumnExists(updatePairs, columns, ['notes', 'comment'], notes);
  pushIfColumnExists(updatePairs, columns, ['updated_at'], new Date().toISOString());

  if (!updatePairs.length) {
    return res.status(400).json({
      ok: false,
      message: 'No valid follow-up fields were provided for update.'
    });
  }

  const assignments = updatePairs
    .map((entry, index) => `${q(entry.column)} = $${index + 1}`)
    .join(', ');

  const values = updatePairs.map((entry) => entry.value);
  values.push(String(req.params.id));

  const sql = `
    UPDATE followup
    SET ${assignments}
    WHERE ${q(idColumn)}::text = $${values.length}
  `;

  const result = await querySafe(db, sql, values);

  if (result.error) {
    return res.status(500).json({
      ok: false,
      message: result.error.message || 'Failed to update follow-up.'
    });
  }

  return res.json({
    ok: true,
    message: 'Follow-up updated successfully.'
  });
});

module.exports = router;