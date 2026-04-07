const db = require('../config/db');

// =============================
// HELPERS
// =============================
function generateActionText(row) {
  if (row.action_group_code === 'CRITICAL_CLINICAL') {
    return 'Immediate clinical review required';
  }

  if (row.action_group_code === 'NO_DATA') {
    return `No data for ${row.no_data_days} days`;
  }

  if (row.action_group_code === 'COMPLIANCE_RISK') {
    return 'Low CPAP usage – contact patient';
  }

  if (row.action_group_code === 'NEW_SETUP') {
    return 'New patient follow-up';
  }

  if (row.action_group_code === 'THERAPY_ISSUES') {
    return 'Check mask / pressure / leaks';
  }

  return 'General follow-up required';
}

function generateTaskTitle(row) {
  if (row.action_group_code === 'CRITICAL_CLINICAL') {
    return 'URGENT: Clinical review required';
  }

  if (row.action_group_code === 'NO_DATA') {
    return 'Contact patient – No data';
  }

  if (row.action_group_code === 'COMPLIANCE_RISK') {
    return 'Low CPAP usage follow-up';
  }

  if (row.action_group_code === 'THERAPY_ISSUES') {
    return 'Therapy issue follow-up';
  }

  if (row.action_group_code === 'NEW_SETUP') {
    return 'New setup follow-up';
  }

  return 'Patient follow-up required';
}

function generateTaskDescription(row) {
  return `[${row.action_group_name}] ${row.reason || 'ATLAS case detected'}`;
}

function getDueIntervalByPriority(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'critical':
      return `NOW() + INTERVAL '4 hours'`;
    case 'high':
      return `NOW() + INTERVAL '1 day'`;
    case 'medium':
      return `NOW() + INTERVAL '2 days'`;
    default:
      return `NOW() + INTERVAL '3 days'`;
  }
}

async function ensureTasksTableExists() {
  const result = await db.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'tasks'
    ) AS exists
  `);

  if (!result.rows[0]?.exists) {
    throw new Error('tasks table does not exist');
  }
}

// =============================
// SUMMARY
// =============================
async function getAtlasSummary() {
  const result = await db.query(`
    SELECT
      ag.code AS code,
      ag.name AS name,
      COUNT(pas.id)::int AS total,
      COALESCE(SUM(pas.revenue_estimate), 0)::numeric AS revenue
    FROM action_groups ag
    LEFT JOIN patient_action_status pas
      ON pas.action_group_id = ag.id
      AND pas.status = 'open'
      AND pas.is_current = true
    GROUP BY ag.code, ag.name
    ORDER BY ag.name ASC
  `);

  return result.rows;
}

// =============================
// QUEUE
// =============================
async function getAtlasQueue() {
  const result = await db.query(`
    SELECT
      pas.id,
      pas.patient_id,
      p.name AS patient_name,
      ag.code AS action_group_code,
      ag.name AS action_group_name,
      pas.reason,
      pas.score,
      pas.priority,
      pas.status,
      pas.assigned_to,
      pas.last_contact_at,
      pas.revenue_estimate,
      pas.no_data_days,
      pas.usage_avg_3d,
      pas.usage_avg_7d,
      pas.ahi_avg_7d,
      pas.leak_avg_7d,
      pas.unresolved_days,
      pas.updated_at
    FROM patient_action_status pas
    JOIN patients p ON p.id = pas.patient_id
    JOIN action_groups ag ON ag.id = pas.action_group_id
    WHERE pas.status = 'open'
      AND pas.is_current = true
    ORDER BY
      CASE pas.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      pas.score DESC,
      pas.updated_at DESC
  `);

  return result.rows;
}

// =============================
// DOCTOR SUMMARY
// =============================
async function getDoctorAtlasSummary(doctorId) {
  const result = await db.query(`
    SELECT
      ag.code AS code,
      ag.name AS name,
      COUNT(pas.id)::int AS total,
      COALESCE(SUM(pas.revenue_estimate), 0)::numeric AS revenue
    FROM action_groups ag
    LEFT JOIN patient_action_status pas
      ON pas.action_group_id = ag.id
      AND pas.status = 'open'
      AND pas.is_current = true
      AND pas.patient_id IN (
        SELECT id FROM patients WHERE doctor_id = $1
      )
    GROUP BY ag.code, ag.name
    ORDER BY ag.name ASC
  `, [doctorId]);

  return result.rows;
}

// =============================
// DOCTOR QUEUE
// =============================
async function getDoctorAtlasQueue(doctorId) {
  const result = await db.query(`
    SELECT
      pas.id,
      pas.patient_id,
      p.name AS patient_name,
      p.doctor_id,
      ag.code AS action_group_code,
      ag.name AS action_group_name,
      pas.reason,
      pas.score,
      pas.priority,
      pas.status,
      pas.assigned_to,
      pas.last_contact_at,
      pas.revenue_estimate,
      pas.no_data_days,
      pas.usage_avg_3d,
      pas.usage_avg_7d,
      pas.ahi_avg_7d,
      pas.leak_avg_7d,
      pas.unresolved_days,
      pas.updated_at
    FROM patient_action_status pas
    JOIN patients p ON p.id = pas.patient_id
    JOIN action_groups ag ON ag.id = pas.action_group_id
    WHERE pas.status = 'open'
      AND pas.is_current = true
      AND p.doctor_id = $1
    ORDER BY
      CASE pas.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      pas.score DESC,
      pas.updated_at DESC
  `, [doctorId]);

  return result.rows;
}

// =============================
// DAILY BOARD
// =============================
async function getDailyBoard(doctorId) {
  let query = `
    SELECT
      pas.id,
      pas.patient_id,
      p.name AS patient_name,
      ag.code AS action_group_code,
      ag.name AS action_group_name,
      pas.priority,
      pas.score,
      pas.reason,
      pas.unresolved_days,
      pas.no_data_days,
      pas.revenue_estimate,

      CASE
        WHEN pas.priority = 'critical' THEN 1
        WHEN pas.priority = 'high' THEN 2
        WHEN pas.priority = 'medium' THEN 3
        ELSE 4
      END AS priority_order

    FROM patient_action_status pas
    JOIN patients p ON p.id = pas.patient_id
    JOIN action_groups ag ON ag.id = pas.action_group_id
    WHERE pas.status = 'open'
      AND pas.is_current = true
  `;

  const params = [];

  if (doctorId) {
    query += ` AND p.doctor_id = $1`;
    params.push(doctorId);
  }

  query += `
    ORDER BY priority_order ASC, pas.score DESC, pas.updated_at DESC
    LIMIT 10
  `;

  const result = await db.query(query, params);

  return result.rows.map((row) => ({
    ...row,
    action_text: generateActionText(row)
  }));
}

// =============================
// AUTO TASKS
// =============================
async function createAutoTasks() {
  await ensureTasksTableExists();

  const result = await db.query(`
    SELECT
      pas.id,
      pas.patient_id,
      pas.priority,
      pas.reason,
      pas.revenue_estimate,
      ag.code AS action_group_code,
      ag.name AS action_group_name
    FROM patient_action_status pas
    JOIN action_groups ag ON ag.id = pas.action_group_id
    LEFT JOIN tasks t ON t.action_group_id = pas.id
    WHERE pas.status = 'open'
      AND pas.is_current = true
      AND t.id IS NULL
  `);

  const createdTasks = [];

  for (const row of result.rows) {
    const dueExpr = getDueIntervalByPriority(row.priority);

    const task = await db.query(`
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
      row.patient_id,
      row.id,
      generateTaskTitle(row),
      generateTaskDescription(row),
      row.priority
    ]);

    createdTasks.push(task.rows[0]);
  }

  return createdTasks;
}

// =============================
// SLA UPDATE
// =============================
async function updateTaskSlaStatuses() {
  await ensureTasksTableExists();

  await db.query(`
    UPDATE tasks
    SET sla_status = CASE
      WHEN status = 'completed' THEN 'completed'
      WHEN due_date < NOW() THEN 'overdue'
      ELSE 'on_time'
    END
  `);

  const result = await db.query(`
    SELECT
      id,
      patient_id,
      action_group_id,
      title,
      description,
      status,
      priority,
      due_date,
      sla_status,
      assigned_to,
      created_at,
      completed_at
    FROM tasks
    ORDER BY
      CASE sla_status
        WHEN 'overdue' THEN 1
        WHEN 'on_time' THEN 2
        ELSE 3
      END,
      due_date ASC
  `);

  return result.rows;
}

// =============================
// TASK BOARD
// =============================
async function getTaskBoard() {
  await ensureTasksTableExists();

  const result = await db.query(`
    SELECT
      id,
      patient_id,
      action_group_id,
      title,
      description,
      status,
      priority,
      due_date,
      sla_status,
      assigned_to,
      created_at,
      completed_at
    FROM tasks
    ORDER BY
      CASE sla_status
        WHEN 'overdue' THEN 1
        WHEN 'on_time' THEN 2
        ELSE 3
      END,
      due_date ASC
  `);

  return result.rows;
}

// =============================
// COMPLETE TASK
// =============================
async function completeTask(taskId) {
  await ensureTasksTableExists();

  const result = await db.query(`
    UPDATE tasks
    SET status = 'completed',
        sla_status = 'completed',
        completed_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [taskId]);

  return result.rows[0] || null;
}

// =============================
// ALERTS PANEL
// =============================
async function getAlertsPanel(doctorId) {
  const params = [];
  let doctorFilterCases = '';
  let doctorFilterTasks = '';
  let doctorFilterRevenue = '';

  if (doctorId) {
    params.push(doctorId);
    doctorFilterCases = ` AND p.doctor_id = $1 `;
    doctorFilterTasks = `
      AND t.patient_id IN (
        SELECT id FROM patients WHERE doctor_id = $1
      )
    `;
    doctorFilterRevenue = ` AND p.doctor_id = $1 `;
  }

  let overdueTasks = 0;

  try {
    await ensureTasksTableExists();

    const overdueTasksResult = await db.query(`
      SELECT COUNT(*)::int AS total
      FROM tasks t
      WHERE t.sla_status = 'overdue'
      ${doctorFilterTasks}
    `, params);

    overdueTasks = overdueTasksResult.rows[0]?.total || 0;
  } catch (error) {
    overdueTasks = 0;
  }

  const criticalCasesResult = await db.query(`
    SELECT COUNT(*)::int AS total
    FROM patient_action_status pas
    JOIN patients p ON p.id = pas.patient_id
    WHERE pas.status = 'open'
      AND pas.is_current = true
      AND pas.priority = 'critical'
      ${doctorFilterCases}
  `, params);

  const noDataResult = await db.query(`
    SELECT COUNT(*)::int AS total
    FROM patient_action_status pas
    JOIN patients p ON p.id = pas.patient_id
    JOIN action_groups ag ON ag.id = pas.action_group_id
    WHERE pas.status = 'open'
      AND pas.is_current = true
      AND ag.code = 'NO_DATA'
      ${doctorFilterCases}
  `, params);

  const revenueRiskResult = await db.query(`
    SELECT COALESCE(SUM(pas.revenue_estimate), 0)::numeric AS total
    FROM patient_action_status pas
    JOIN patients p ON p.id = pas.patient_id
    WHERE pas.status = 'open'
      AND pas.is_current = true
      ${doctorFilterRevenue}
  `, params);

  return {
    criticalCases: criticalCasesResult.rows[0]?.total || 0,
    overdueTasks,
    noDataPatients: noDataResult.rows[0]?.total || 0,
    revenueRisk: revenueRiskResult.rows[0]?.total || 0
  };
}

module.exports = {
  getAtlasSummary,
  getAtlasQueue,
  getDoctorAtlasSummary,
  getDoctorAtlasQueue,
  getDailyBoard,
  createAutoTasks,
  updateTaskSlaStatuses,
  getTaskBoard,
  completeTask,
  getAlertsPanel
};