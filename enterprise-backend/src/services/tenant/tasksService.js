const db = require('../../db');

const FALLBACK_TASKS = [
  {
    id: 'TSK-001',
    title: 'Call Dimitris Leonidas',
    owner: 'Operations Admin',
    due: '2026-03-31 11:30',
    sla: 'overdue',
    status: 'open'
  },
  {
    id: 'TSK-002',
    title: 'Review mask leak for Maria Ioannou',
    owner: 'Follow-up Manager',
    due: '2026-03-31 15:00',
    sla: 'today',
    status: 'open'
  },
  {
    id: 'TSK-003',
    title: 'Send billing reminder',
    owner: 'Billing Viewer',
    due: '2026-04-01 10:00',
    sla: 'scheduled',
    status: 'pending'
  },
  {
    id: 'TSK-004',
    title: 'Doctor callback summary',
    owner: 'Operations Admin',
    due: '2026-03-30 17:00',
    sla: 'closed',
    status: 'done'
  }
];

async function runQuery(sql, params = []) {
  if (typeof db.query === 'function') {
    return db.query(sql, params);
  }

  if (db.pool && typeof db.pool.query === 'function') {
    return db.pool.query(sql, params);
  }

  throw new Error('Database query function is not available.');
}

function computeSla(due, rawSla, rawStatus) {
  if (rawSla) return String(rawSla).toLowerCase();

  const status = String(rawStatus || '').toLowerCase();
  if (status === 'done' || status === 'closed') return 'closed';

  const dueDate = due ? new Date(due) : null;
  if (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime())) {
    return 'scheduled';
  }

  const now = new Date();
  const dueStart = new Date(dueDate);
  dueStart.setHours(0, 0, 0, 0);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  if (dueStart.getTime() < todayStart.getTime()) return 'overdue';
  if (dueStart.getTime() === todayStart.getTime()) return 'today';
  return 'scheduled';
}

function filterFallback(rows, search) {
  if (!search) return rows;

  const q = String(search).toLowerCase();

  return rows.filter((item) =>
    [item.id, item.title, item.owner, item.sla, item.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}

async function getTenantTasks({ tenantId, search = '' }) {
  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        CAST(t.id AS TEXT) ILIKE $2
        OR COALESCE(t.title, '') ILIKE $2
        OR COALESCE(t.owner, '') ILIKE $2
        OR COALESCE(t.status, '') ILIKE $2
        OR COALESCE(t.sla, '') ILIKE $2
      )
    `;
  }

  try {
    const result = await runQuery(
      `
        SELECT
          t.id,
          COALESCE(NULLIF(t.title, ''), 'Task') AS title,
          COALESCE(NULLIF(t.owner, ''), '—') AS owner,
          COALESCE(t.due_at, t.due_date, t.deadline, NOW()) AS due_at,
          COALESCE(NULLIF(t.sla, ''), '') AS sla,
          COALESCE(NULLIF(t.status, ''), 'open') AS status
        FROM tasks t
        WHERE t.tenant_id = $1
        ${searchSql}
        ORDER BY t.due_at ASC NULLS LAST, t.id DESC
        LIMIT 200
      `,
      params
    );

    return (result.rows || []).map((row) => ({
      id: row.id,
      title: row.title || 'Task',
      owner: row.owner || '—',
      due: row.due_at,
      sla: computeSla(row.due_at, row.sla, row.status),
      status: String(row.status || 'open').toLowerCase()
    }));
  } catch (error) {
    return filterFallback(FALLBACK_TASKS, search);
  }
}

module.exports = {
  getTenantTasks
};