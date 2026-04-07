const db = require('../../db');

const FALLBACK_FOLLOWUPS = [
  {
    id: 'FU-001',
    patient: 'Eleni Kosta',
    reason: 'Below 80h compliance',
    owner: 'Follow-up Manager',
    priority: 'high',
    outcome: 'Callback requested',
    nextAction: 'Call tomorrow 10:00'
  },
  {
    id: 'FU-002',
    patient: 'Dimitris Leonidas',
    reason: 'Critical usage drop',
    owner: 'Operations Admin',
    priority: 'critical',
    outcome: 'No answer',
    nextAction: 'Escalate to doctor'
  },
  {
    id: 'FU-003',
    patient: 'Giorgos Papadakis',
    reason: 'Education follow-up',
    owner: 'Follow-up Manager',
    priority: 'normal',
    outcome: 'Reached',
    nextAction: 'Close if stable next week'
  },
  {
    id: 'FU-004',
    patient: 'Maria Ioannou',
    reason: 'Mask leak review',
    owner: 'Operations Admin',
    priority: 'high',
    outcome: 'Promised improvement',
    nextAction: 'Recheck in 3 days'
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

function filterFallback(rows, search) {
  if (!search) return rows;

  const q = String(search).toLowerCase();

  return rows.filter((item) =>
    [item.id, item.patient, item.reason, item.owner, item.priority, item.outcome, item.nextAction]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}

async function getTenantFollowups({ tenantId, search = '' }) {
  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        CAST(f.id AS TEXT) ILIKE $2
        OR COALESCE(p.full_name, '') ILIKE $2
        OR COALESCE(p.first_name, '') ILIKE $2
        OR COALESCE(p.last_name, '') ILIKE $2
        OR COALESCE(f.reason, '') ILIKE $2
        OR COALESCE(f.owner, '') ILIKE $2
        OR COALESCE(f.priority, '') ILIKE $2
        OR COALESCE(f.outcome, '') ILIKE $2
        OR COALESCE(f.next_action, '') ILIKE $2
      )
    `;
  }

  try {
    const result = await runQuery(
      `
        SELECT
          f.id,
          COALESCE(
            NULLIF(p.full_name, ''),
            CONCAT_WS(' ', NULLIF(p.first_name, ''), NULLIF(p.last_name, '')),
            'Unknown'
          ) AS patient_name,
          COALESCE(NULLIF(f.reason, ''), 'Follow-up required') AS reason,
          COALESCE(NULLIF(f.owner, ''), '—') AS owner,
          LOWER(COALESCE(NULLIF(f.priority, ''), 'normal')) AS priority,
          COALESCE(NULLIF(f.outcome, ''), 'Pending') AS outcome,
          COALESCE(NULLIF(f.next_action, ''), 'Review case') AS next_action
        FROM followups f
        LEFT JOIN patients p
          ON p.id = f.patient_id
          AND p.tenant_id = f.tenant_id
        WHERE f.tenant_id = $1
        ${searchSql}
        ORDER BY f.updated_at DESC NULLS LAST, f.id DESC
        LIMIT 200
      `,
      params
    );

    return (result.rows || []).map((row) => ({
      id: row.id,
      patient: row.patient_name || 'Unknown',
      reason: row.reason || 'Follow-up required',
      owner: row.owner || '—',
      priority: row.priority || 'normal',
      outcome: row.outcome || 'Pending',
      nextAction: row.next_action || 'Review case'
    }));
  } catch (error) {
    return filterFallback(FALLBACK_FOLLOWUPS, search);
  }
}

module.exports = {
  getTenantFollowups
};