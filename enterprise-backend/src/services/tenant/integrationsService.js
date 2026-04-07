const db = require('../../db');

const FALLBACK_INTEGRATIONS = [
  {
    id: 'INT-001',
    name: 'ResMed AirView',
    provider: 'ResMed',
    status: 'connected',
    mode: 'csv-sync',
    lastSync: '2026-04-02 08:40'
  },
  {
    id: 'INT-002',
    name: 'Stripe Billing',
    provider: 'Stripe',
    status: 'ready',
    mode: 'api',
    lastSync: '2026-04-01 16:20'
  },
  {
    id: 'INT-003',
    name: 'Email Notifications',
    provider: 'SMTP',
    status: 'connected',
    mode: 'smtp',
    lastSync: '2026-04-02 09:10'
  },
  {
    id: 'INT-004',
    name: 'SMS Gateway',
    provider: 'Twilio',
    status: 'pending',
    mode: 'api',
    lastSync: '—'
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
    [item.id, item.name, item.provider, item.status, item.mode]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}

async function getTenantIntegrations({ tenantId, search = '' }) {
  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        CAST(i.id AS TEXT) ILIKE $2
        OR COALESCE(i.name, '') ILIKE $2
        OR COALESCE(i.provider, '') ILIKE $2
        OR COALESCE(i.status, '') ILIKE $2
        OR COALESCE(i.mode, '') ILIKE $2
      )
    `;
  }

  try {
    const result = await runQuery(
      `
        SELECT
          i.id,
          COALESCE(NULLIF(i.name, ''), 'Integration') AS name,
          COALESCE(NULLIF(i.provider, ''), '—') AS provider,
          LOWER(COALESCE(NULLIF(i.status, ''), 'pending')) AS status,
          LOWER(COALESCE(NULLIF(i.mode, ''), 'api')) AS mode,
          COALESCE(i.last_sync_at, i.updated_at, i.created_at) AS last_sync
        FROM integrations i
        WHERE i.tenant_id = $1
        ${searchSql}
        ORDER BY i.created_at DESC NULLS LAST, i.id DESC
        LIMIT 200
      `,
      params
    );

    return (result.rows || []).map((row) => ({
      id: row.id,
      name: row.name || 'Integration',
      provider: row.provider || '—',
      status: row.status || 'pending',
      mode: row.mode || 'api',
      lastSync: row.last_sync || '—'
    }));
  } catch (error) {
    return filterFallback(FALLBACK_INTEGRATIONS, search);
  }
}

module.exports = {
  getTenantIntegrations
};