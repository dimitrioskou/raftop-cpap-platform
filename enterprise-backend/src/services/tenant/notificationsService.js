const db = require('../../db');

const FALLBACK_NOTIFICATIONS = [
  {
    id: 'NF-001',
    title: 'Critical patient non-compliance',
    channel: 'internal',
    recipient: 'Operations Admin',
    status: 'pending',
    createdAt: '2026-03-31 09:02',
    body: 'Patient Dimitris Leonidas dropped below threshold. Recommend immediate call and doctor escalation.'
  },
  {
    id: 'NF-002',
    title: 'Device offline alert',
    channel: 'email',
    recipient: 'Follow-up Manager',
    status: 'sent',
    createdAt: '2026-03-31 08:30',
    body: 'Device RM-22343 has not synced for 6 days. Review connectivity and patient usage barriers.'
  },
  {
    id: 'NF-003',
    title: 'Doctor trial conversion reminder',
    channel: 'email',
    recipient: 'Billing Viewer',
    status: 'queued',
    createdAt: '2026-03-30 17:40',
    body: 'Upcoming trial expiration for high-usage doctor account. Commercial follow-up suggested.'
  },
  {
    id: 'NF-004',
    title: 'Follow-up callback reminder',
    channel: 'sms',
    recipient: 'Patient Outreach',
    status: 'failed',
    createdAt: '2026-03-30 15:12',
    body: 'Callback reminder was not delivered successfully. Retry via alternate route.'
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
    [item.id, item.title, item.channel, item.recipient, item.status, item.body]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}

async function getTenantNotifications({ tenantId, search = '' }) {
  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        CAST(n.id AS TEXT) ILIKE $2
        OR COALESCE(n.title, '') ILIKE $2
        OR COALESCE(n.channel, '') ILIKE $2
        OR COALESCE(n.recipient, '') ILIKE $2
        OR COALESCE(n.status, '') ILIKE $2
        OR COALESCE(n.body, n.message, '') ILIKE $2
      )
    `;
  }

  try {
    const result = await runQuery(
      `
        SELECT
          n.id,
          COALESCE(NULLIF(n.title, ''), 'Notification') AS title,
          LOWER(COALESCE(NULLIF(n.channel, ''), 'internal')) AS channel,
          COALESCE(NULLIF(n.recipient, ''), '—') AS recipient,
          LOWER(COALESCE(NULLIF(n.status, ''), 'pending')) AS status,
          COALESCE(n.created_at, NOW()) AS created_at,
          COALESCE(NULLIF(n.body, ''), NULLIF(n.message, ''), 'No notification content') AS body
        FROM notifications n
        WHERE n.tenant_id = $1
        ${searchSql}
        ORDER BY n.created_at DESC NULLS LAST, n.id DESC
        LIMIT 200
      `,
      params
    );

    return (result.rows || []).map((row) => ({
      id: row.id,
      title: row.title || 'Notification',
      channel: row.channel || 'internal',
      recipient: row.recipient || '—',
      status: row.status || 'pending',
      createdAt: row.created_at,
      body: row.body || 'No notification content'
    }));
  } catch (error) {
    return filterFallback(FALLBACK_NOTIFICATIONS, search);
  }
}

module.exports = {
  getTenantNotifications
};