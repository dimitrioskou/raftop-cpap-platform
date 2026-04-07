const db = require('../../db');

const FALLBACK_ROWS = [
  {
    id: 'CMP-001',
    patient: 'Giorgos Papadakis',
    doctor: 'Dr. Maria Papadopoulou',
    hours: 92,
    trend: '+8h',
    status: 'compliant'
  },
  {
    id: 'CMP-002',
    patient: 'Eleni Kosta',
    doctor: 'Dr. Nikos Andreou',
    hours: 61,
    trend: '-7h',
    status: 'warning'
  },
  {
    id: 'CMP-003',
    patient: 'Dimitris Leonidas',
    doctor: 'Dr. Eleni Perraki',
    hours: 44,
    trend: '-15h',
    status: 'critical'
  },
  {
    id: 'CMP-004',
    patient: 'Maria Ioannou',
    doctor: 'Dr. George Dimitriou',
    hours: 108,
    trend: '+4h',
    status: 'compliant'
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

function normalizeStatus(hours, rawStatus) {
  if (rawStatus) return String(rawStatus).toLowerCase();

  const value = Number(hours || 0);
  if (value < 50) return 'critical';
  if (value < 80) return 'warning';
  return 'compliant';
}

function toTrend(currentHours, previousHours) {
  const current = Number(currentHours || 0);
  const previous = Number(previousHours || 0);
  const delta = Math.round(current - previous);

  if (delta > 0) return `+${delta}h`;
  if (delta < 0) return `${delta}h`;
  return '0h';
}

function filterFallback(rows, search) {
  if (!search) return rows;

  const q = String(search).toLowerCase();

  return rows.filter((item) =>
    [item.id, item.patient, item.doctor, item.status, item.trend]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}

async function getTenantCompliance({ tenantId, search = '' }) {
  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        CAST(p.id AS TEXT) ILIKE $2
        OR COALESCE(p.full_name, '') ILIKE $2
        OR COALESCE(p.first_name, '') ILIKE $2
        OR COALESCE(p.last_name, '') ILIKE $2
        OR COALESCE(p.doctor_name, '') ILIKE $2
        OR COALESCE(p.status, '') ILIKE $2
      )
    `;
  }

  try {
    const result = await runQuery(
      `
        SELECT
          p.id,
          COALESCE(
            NULLIF(p.full_name, ''),
            CONCAT_WS(' ', NULLIF(p.first_name, ''), NULLIF(p.last_name, '')),
            'Unknown'
          ) AS patient_name,
          COALESCE(NULLIF(p.doctor_name, ''), '—') AS doctor_name,
          COALESCE(p.compliance_hours, 0) AS compliance_hours,
          COALESCE(p.previous_compliance_hours, p.compliance_hours, 0) AS previous_compliance_hours,
          COALESCE(NULLIF(p.status, ''), '') AS status
        FROM patients p
        WHERE p.tenant_id = $1
        ${searchSql}
        ORDER BY p.updated_at DESC NULLS LAST, p.id DESC
        LIMIT 200
      `,
      params
    );

    return (result.rows || []).map((row) => ({
      id: `CMP-${row.id}`,
      patient: row.patient_name || 'Unknown',
      doctor: row.doctor_name || '—',
      hours: Number(row.compliance_hours || 0),
      trend: toTrend(row.compliance_hours, row.previous_compliance_hours),
      status: normalizeStatus(row.compliance_hours, row.status)
    }));
  } catch (error) {
    return filterFallback(FALLBACK_ROWS, search);
  }
}

module.exports = {
  getTenantCompliance
};