const db = require('../config/db');

async function getCaseById(caseId) {
  const result = await db.query(`
    SELECT
      pas.*,
      p.name AS patient_name,
      ag.code AS action_group_code,
      ag.name AS action_group_name
    FROM patient_action_status pas
    JOIN patients p ON p.id = pas.patient_id
    JOIN action_groups ag ON ag.id = pas.action_group_id
    WHERE pas.id = $1
    LIMIT 1
  `, [caseId]);

  return result.rows[0] || null;
}

async function addCaseEvent(caseId, eventType, note) {
  const result = await db.query(`
    INSERT INTO action_group_events (
      patient_action_status_id,
      event_type,
      note,
      created_at
    )
    VALUES ($1, $2, $3, NOW())
    RETURNING *
  `, [caseId, eventType, note || null]);

  return result.rows[0] || null;
}

async function assignCase(caseId, assignedTo) {
  const existing = await getCaseById(caseId);
  if (!existing) {
    throw new Error('ATLAS case not found');
  }

  const result = await db.query(`
    UPDATE patient_action_status
    SET assigned_to = $2,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [caseId, assignedTo || null]);

  await addCaseEvent(
    caseId,
    'assigned',
    assignedTo ? `Case assigned to user ${assignedTo}` : 'Case unassigned'
  );

  return result.rows[0] || null;
}

async function markCaseContacted(caseId, note) {
  const existing = await getCaseById(caseId);
  if (!existing) {
    throw new Error('ATLAS case not found');
  }

  const result = await db.query(`
    UPDATE patient_action_status
    SET last_contact_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [caseId]);

  await addCaseEvent(
    caseId,
    'contacted',
    note || 'Patient contacted'
  );

  return result.rows[0] || null;
}

async function resolveCase(caseId, note) {
  const existing = await getCaseById(caseId);
  if (!existing) {
    throw new Error('ATLAS case not found');
  }

  const result = await db.query(`
    UPDATE patient_action_status
    SET status = 'resolved',
        is_current = false,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [caseId]);

  await addCaseEvent(
    caseId,
    'resolved',
    note || 'Case resolved'
  );

  return result.rows[0] || null;
}

async function createTaskFromCase(caseId) {
  const existing = await getCaseById(caseId);
  if (!existing) {
    throw new Error('ATLAS case not found');
  }

  const title = `ATLAS follow-up: ${existing.patient_name}`;
  const description = `[${existing.action_group_name}] ${existing.reason || 'Follow-up required'}`;

  const taskInsert = await db.query(`
    INSERT INTO tasks (
      patient_id,
      action_group_id,
      title,
      description,
      status,
      priority,
      due_date,
      sla_status,
      created_at
    )
    VALUES ($1, $2, $3, $4, 'open', $5, NOW() + INTERVAL '1 day', 'on_time', NOW())
    RETURNING *
  `, [
    existing.patient_id,
    existing.id,
    title,
    description,
    existing.priority || 'medium'
  ]);

  await addCaseEvent(
    caseId,
    'task_created',
    `Task created: ${title}`
  );

  return taskInsert.rows[0] || null;
}

module.exports = {
  getCaseById,
  addCaseEvent,
  assignCase,
  markCaseContacted,
  resolveCase,
  createTaskFromCase
};