const db = require('../../db');

const FALLBACK_DEVICES = [
  {
    id: 'DV-1001',
    serial: 'RM-22341',
    patient: 'Giorgos Papadakis',
    doctor: 'Dr. Maria Papadopoulou',
    lastSync: '2026-03-31 08:55',
    usage7d: 7.2,
    leak: 8,
    status: 'online'
  },
  {
    id: 'DV-1002',
    serial: 'RM-22342',
    patient: 'Eleni Kosta',
    doctor: 'Dr. Nikos Andreou',
    lastSync: '2026-03-29 12:20',
    usage7d: 4.8,
    leak: 18,
    status: 'warning'
  },
  {
    id: 'DV-1003',
    serial: 'RM-22343',
    patient: 'Dimitris Leonidas',
    doctor: 'Dr. Eleni Perraki',
    lastSync: '2026-03-24 09:10',
    usage7d: 3.1,
    leak: 26,
    status: 'offline'
  },
  {
    id: 'DV-1004',
    serial: 'RM-22344',
    patient: 'Maria Ioannou',
    doctor: 'Dr. George Dimitriou',
    lastSync: '2026-03-31 09:02',
    usage7d: 8.0,
    leak: 6,
    status: 'online'
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

function normalizeStatus({ status, leak, lastSync }) {
  if (status) return String(status).toLowerCase();

  const numericLeak = Number(leak || 0);
  const syncDate = lastSync ? new Date(lastSync) : null;

  if (syncDate instanceof Date && !Number.isNaN(syncDate.getTime())) {
    const diffMs = Date.now() - syncDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays >= 5) return 'offline';
  }

  if (numericLeak >= 15) return 'warning';
  return 'online';
}

function filterFallback(rows, search) {
  if (!search) return rows;

  const q = String(search).toLowerCase();

  return rows.filter((item) =>
    [item.id, item.serial, item.patient, item.doctor, item.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}

async function getTenantDevices({ tenantId, search = '' }) {
  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        CAST(d.id AS TEXT) ILIKE $2
        OR COALESCE(d.serial, '') ILIKE $2
        OR COALESCE(p.full_name, '') ILIKE $2
        OR COALESCE(p.first_name, '') ILIKE $2
        OR COALESCE(p.last_name, '') ILIKE $2
        OR COALESCE(p.doctor_name, '') ILIKE $2
        OR COALESCE(d.status, '') ILIKE $2
      )
    `;
  }

  try {
    const result = await runQuery(
      `
        SELECT
          d.id,
          COALESCE(NULLIF(d.serial, ''), '—') AS serial,
          COALESCE(
            NULLIF(p.full_name, ''),
            CONCAT_WS(' ', NULLIF(p.first_name, ''), NULLIF(p.last_name, '')),
            'Unknown'
          ) AS patient_name,
          COALESCE(NULLIF(p.doctor_name, ''), '—') AS doctor_name,
          COALESCE(d.last_sync, d.updated_at, NOW()) AS last_sync,
          COALESCE(d.usage_7d, d.usage_avg_7d, 0) AS usage_7d,
          COALESCE(d.leak, d.mask_leak, 0) AS leak,
          COALESCE(NULLIF(d.status, ''), '') AS status
        FROM devices d
        LEFT JOIN patients p
          ON p.id = d.patient_id
          AND p.tenant_id = d.tenant_id
        WHERE d.tenant_id = $1
        ${searchSql}
        ORDER BY d.updated_at DESC NULLS LAST, d.id DESC
        LIMIT 200
      `,
      params
    );

    return (result.rows || []).map((row) => ({
      id: row.id,
      serial: row.serial || '—',
      patient: row.patient_name || 'Unknown',
      doctor: row.doctor_name || '—',
      lastSync: row.last_sync,
      usage7d: Number(row.usage_7d || 0),
      leak: Number(row.leak || 0),
      status: normalizeStatus({
        status: row.status,
        leak: row.leak,
        lastSync: row.last_sync
      })
    }));
  } catch (error) {
    return filterFallback(FALLBACK_DEVICES, search);
  }
}

module.exports = {
  getTenantDevices
};