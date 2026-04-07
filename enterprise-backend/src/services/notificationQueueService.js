const db = require('../config/db');

async function ensureNotificationQueueTableExists() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notification_queue (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      patient_action_status_id INTEGER REFERENCES patient_action_status(id) ON DELETE SET NULL,
      auto_action_id INTEGER REFERENCES atlas_auto_actions(id) ON DELETE SET NULL,
      channel VARCHAR(30) NOT NULL,
      recipient TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      error_message TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      sent_at TIMESTAMP NULL
    )
  `);
}

function buildNotificationPayload(action) {
  const actionType = action.action_type;

  if (actionType === 'doctor_alert') {
    return {
      channel: 'email',
      recipient: 'doctor@clinic.local',
      subject: `URGENT Doctor Alert: ${action.patient_name}`,
      message: `Patient ${action.patient_name} has a critical AI auto action.\n\n${action.description}`
    };
  }

  if (actionType === 'patient_outreach') {
    return {
      channel: 'sms',
      recipient: action.patient_phone || 'unknown',
      subject: null,
      message: `Please contact the clinic regarding your CPAP therapy follow-up.`
    };
  }

  if (actionType === 'compliance_call') {
    return {
      channel: 'call',
      recipient: action.patient_phone || 'unknown',
      subject: null,
      message: `Call patient for compliance recovery: ${action.patient_name}`
    };
  }

  if (actionType === 'therapy_review') {
    return {
      channel: 'email',
      recipient: 'therapy@clinic.local',
      subject: `Therapy Review Needed: ${action.patient_name}`,
      message: `Therapy review requested.\n\n${action.description}`
    };
  }

  return {
    channel: 'internal',
    recipient: 'operations',
    subject: `Follow-up: ${action.patient_name}`,
    message: action.description || 'ATLAS follow-up action'
  };
}

async function queueNotification({
  patientId,
  patientActionStatusId,
  autoActionId,
  channel,
  recipient,
  subject,
  message
}) {
  await ensureNotificationQueueTableExists();

  const result = await db.query(`
    INSERT INTO notification_queue (
      patient_id,
      patient_action_status_id,
      auto_action_id,
      channel,
      recipient,
      subject,
      message,
      status,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
    RETURNING *
  `, [
    patientId,
    patientActionStatusId,
    autoActionId,
    channel,
    recipient,
    subject,
    message
  ]);

  return result.rows[0];
}

async function createNotificationFromAutoAction(action) {
  const payload = buildNotificationPayload(action);

  return queueNotification({
    patientId: action.patient_id,
    patientActionStatusId: action.patient_action_status_id,
    autoActionId: action.id,
    channel: payload.channel,
    recipient: payload.recipient,
    subject: payload.subject,
    message: payload.message
  });
}

async function getNotificationQueue() {
  await ensureNotificationQueueTableExists();

  const result = await db.query(`
    SELECT
      nq.*,
      p.name AS patient_name
    FROM notification_queue nq
    LEFT JOIN patients p ON p.id = nq.patient_id
    ORDER BY
      CASE nq.status
        WHEN 'pending' THEN 1
        WHEN 'sent' THEN 2
        WHEN 'failed' THEN 3
        ELSE 4
      END,
      nq.created_at DESC
  `);

  return result.rows;
}

async function markNotificationSent(notificationId) {
  await ensureNotificationQueueTableExists();

  const result = await db.query(`
    UPDATE notification_queue
    SET status = 'sent',
        sent_at = NOW(),
        error_message = NULL
    WHERE id = $1
    RETURNING *
  `, [notificationId]);

  return result.rows[0] || null;
}

async function markNotificationFailed(notificationId, errorMessage) {
  await ensureNotificationQueueTableExists();

  const result = await db.query(`
    UPDATE notification_queue
    SET status = 'failed',
        error_message = $2
    WHERE id = $1
    RETURNING *
  `, [notificationId, errorMessage || 'Unknown error']);

  return result.rows[0] || null;
}

module.exports = {
  ensureNotificationQueueTableExists,
  queueNotification,
  createNotificationFromAutoAction,
  getNotificationQueue,
  markNotificationSent,
  markNotificationFailed
};