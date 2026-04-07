const db = require('../../db');

const FALLBACK_USERS = [
  {
    id: 'USR-001',
    name: 'RAFTOP Owner',
    email: 'owner@raftop.local',
    role: 'owner',
    status: 'active',
    lastActive: '2026-04-02 10:15'
  },
  {
    id: 'USR-002',
    name: 'Operations Admin',
    email: 'ops@raftop.local',
    role: 'admin',
    status: 'active',
    lastActive: '2026-04-02 09:50'
  },
  {
    id: 'USR-003',
    name: 'Follow-up Manager',
    email: 'followup@raftop.local',
    role: 'manager',
    status: 'active',
    lastActive: '2026-04-01 18:35'
  },
  {
    id: 'USR-004',
    name: 'Billing Viewer',
    email: 'billing@raftop.local',
    role: 'viewer',
    status: 'invited',
    lastActive: '—'
  }
];

async function runQuery(sql, params = []) {
  if (typeof db.query === 'function') return db.query(sql, params);
  if (db.pool && typeof db.pool.query === 'function') return db.pool.query(sql, params);
  throw new Error('Database query function is not available.');
}

function filterFallback(rows, search) {
  if (!search) return rows;
  const q = String(search).toLowerCase();

  return rows.filter((item) =>
    [item.id, item.name, item.email, item.role, item.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}

async function getTenantUsers({ tenantId, search = '' }) {
  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        CAST(u.id AS TEXT) ILIKE $2
        OR COALESCE(u.name, '') ILIKE $2
        OR COALESCE(u.email, '') ILIKE $2
        OR COALESCE(u.role, '') ILIKE $2
        OR COALESCE(u.status, '') ILIKE $2
      )
    `;
  }

  try {
    const result = await runQuery(
      `
        SELECT
          u.id,
          COALESCE(NULLIF(u.name, ''), 'Unknown User') AS name,
          COALESCE(NULLIF(u.email, ''), '—') AS email,
          LOWER(COALESCE(NULLIF(u.role, ''), 'viewer')) AS role,
          LOWER(COALESCE(NULLIF(u.status, ''), 'active')) AS status,
          COALESCE(u.last_active_at, u.updated_at, u.created_at) AS last_active
        FROM users u
        WHERE u.tenant_id = $1
        ${searchSql}
        ORDER BY u.created_at DESC NULLS LAST, u.id DESC
        LIMIT 200
      `,
      params
    );

    return (result.rows || []).map((row) => ({
      id: row.id,
      name: row.name || 'Unknown User',
      email: row.email || '—',
      role: row.role || 'viewer',
      status: row.status || 'active',
      lastActive: row.last_active || '—'
    }));
  } catch (error) {
    return filterFallback(FALLBACK_USERS, search);
  }
}

module.exports = {
  getTenantUsers
};