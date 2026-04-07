const db = require('../config/db');
const notificationQueueService = require('./notificationQueueService');

function buildActionType(row) {
  if (row.risk_level === 'critical') {
    return 'doctor_alert';
  }

  if (row.action_group_code === 'NO_DATA') {
    return 'patient_outreach';
  }

  if (row.action_group_code === 'COMPLIANCE_RISK') {
    return 'compliance_call';
  }

  if (row.action_group_code === 'THERAPY_ISSUES') {
    return 'therapy_review';
  }

  return 'standard_followup';
}

function buildActionTitle(row) {
  if (row.risk_level === 'critical') {
    return `URGENT AI Alert: ${row.patient_name}`;
  }

  if (row.action_group_code === 'NO_DATA') {
    return `AI Outreach: No data patient ${row.patient_name}`;
  }

  if (row.action_group_code === 'COMPLIANCE_RISK') {
    return `AI Compliance Recovery: ${row.patient_name}`;
  }

  if (row.action_group_code === 'THERAPY_ISSUES') {
    return `AI Therapy Review: ${row.patient_name}`;
  }

  return `AI Follow-up: ${row.patient_name}`;
}

function buildActionDescription(row) {
  return [
    `Patient: ${row.patient_name}`,
    `Group: ${row.action_group_name}`,
    `Priority: ${row.priority}`,
    `Risk Level: ${row.risk_level}`,
    `AI Score: ${row.ai_score}`,
    `Reason: ${row.reason || 'No reason provided'}`
  ].join(' | ');
}

async function ensureAutoActionsTableExists() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS atlas_auto_actions (
      id SERIAL PRIMARY KEY,
      patient_action_status_id INTEGER NOT NULL REFERENCES patient_action_status(id) ON DELETE CASCADE,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      action_type VARCHAR(50) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      executed_at TIMESTAMP NULL
    )
  `);
}

function getTaskDueInterval(actionType) {
  switch (actionType) {
    case 'doctor_alert':
      return `NOW() + INTERVAL '4 hours'`;
    case 'patient_outreach':
      return `NOW() + INTERVAL '12 hours'`;
    case 'compliance_call':
      return `NOW() + INTERVAL '1 day'`;
    case 'therapy_review':
      return `NOW() + INTERVAL '1 day'`;
    default:
      return `NOW() + INTERVAL '2 days'`;
  }
}

function getTaskPriority(actionType) {
  switch (actionType) {
    case 'doctor_alert':
      return 'critical';
    case 'patient_outreach':
      return 'high';
    case 'compliance_call':
      return 'high';
    case 'therapy_review':
      return 'high';
    default:
      return 'medium';
  }
}

async function runAutoActions() {
  await ensureAutoActionsTableExists();

  const result = await db.query(`
    SELECT
      pas.id,
      pas.patient_id,
      pas.priority,
      pas.ai_score,
      pas.risk_level,
      pas.reason,
      ag.code AS action_group_code,
      ag.name AS action_group_name,
      p.name AS patient_name,
      p.phone AS patient_phone
    FROM patient_action_status pas
    JOIN action_groups ag ON ag.id = pas.action_group_id
    JOIN patients p ON p.id = pas.patient_id
    LEFT JOIN atlas_auto_actions aaa
      ON aaa.patient_action_status_id = pas.id
      AND aaa.status = 'pending'
    WHERE pas.status = 'open'
      AND pas.is_current = true
      AND aaa.id IS NULL
      AND (
        pas.risk_level IN ('high', 'critical')
        OR pas.ai_score >= 60
      )
    ORDER BY pas.ai_score DESC, pas.updated_at DESC
  `);

  const created = [];

  for (const row of result.rows) {
    const insert = await db.query(`
      INSERT INTO atlas_auto_actions (
        patient_action_status_id,
        patient_id,
        action_type,
        title,
        description,
        status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING *
    `, [
      row.id,
      row.patient_id,
      buildActionType(row),
      buildActionTitle(row),
      buildActionDescription(row)
    ]);

    created.push(insert.rows[0]);
  }

  return created;
}

async function getAutoActions() {
  await ensureAutoActionsTableExists();

  const result = await db.query(`
    SELECT
      aaa.*,
      p.name AS patient_name
    FROM atlas_auto_actions aaa
    JOIN patients p ON p.id = aaa.patient_id
    ORDER BY
      CASE aaa.status
        WHEN 'pending' THEN 1
        WHEN 'executed' THEN 2
        ELSE 3
      END,
      aaa.created_at DESC
  `);

  return result.rows;
}

async function executeAutoAction(actionId) {
  await ensureAutoActionsTableExists();

  const actionResult = await db.query(`
    SELECT
      aaa.*,
      pas.action_group_id,
      pas.reason,
      p.name AS patient_name,
      p.phone AS patient_phone
    FROM atlas_auto_actions aaa
    JOIN patient_action_status pas ON pas.id = aaa.patient_action_status_id
    JOIN patients p ON p.id = aaa.patient_id
    WHERE aaa.id = $1
    LIMIT 1
  `, [actionId]);

  if (!actionResult.rows.length) {
    return null;
  }

  const action = actionResult.rows[0];

  if (action.status === 'executed') {
    return action;
  }

  const taskPriority = getTaskPriority(action.action_type);
  const dueExpr = getTaskDueInterval(action.action_type);

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
    VALUES ($1, $2, $3, $4, 'open', $5, ${dueExpr}, 'on_time', NOW())
    RETURNING *
  `, [
    action.patient_id,
    action.patient_action_status_id,
    action.title,
    action.description,
    taskPriority
  ]);

  const notification = await notificationQueueService.createNotificationFromAutoAction({
    ...action,
    patient_action_status_id: action.patient_action_status_id
  });

  const eventNote = `AI auto action executed: ${action.action_type} | Task created: ${taskInsert.rows[0].title} | Notification queued: ${notification.channel}`;

  await db.query(`
    INSERT INTO action_group_events (
      patient_action_status_id,
      event_type,
      note,
      created_at
    )
    VALUES ($1, 'ai_auto_action_executed', $2, NOW())
  `, [
    action.patient_action_status_id,
    eventNote
  ]);

  const updatedAction = await db.query(`
    UPDATE atlas_auto_actions
    SET status = 'executed',
        executed_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [actionId]);

  return {
    action: updatedAction.rows[0] || null,
    task: taskInsert.rows[0] || null,
    notification
  };
}

module.exports = {
  runAutoActions,
  getAutoActions,
  executeAutoAction
};