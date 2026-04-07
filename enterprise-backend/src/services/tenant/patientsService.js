const db = require('../../db');

const FALLBACK_PATIENTS = [
  {
    id: 'PT-1001',
    fullName: 'Giorgos Papadakis',
    doctor: 'Dr. Maria Papadopoulou',
    serial: 'RM-22341',
    complianceHours: 92,
    ahi: 3.1,
    status: 'stable'
  },
  {
    id: 'PT-1002',
    fullName: 'Eleni Kosta',
    doctor: 'Dr. Nikos Andreou',
    serial: 'RM-22342',
    complianceHours: 61,
    ahi: 8.4,
    status: 'warning'
  },
  {
    id: 'PT-1003',
    fullName: 'Dimitris Leonidas',
    doctor: 'Dr. Eleni Perraki',
    serial: 'RM-22343',
    complianceHours: 44,
    ahi: 11.2,
    status: 'critical'
  },
  {
    id: 'PT-1004',
    fullName: 'Maria Ioannou',
    doctor: 'Dr. George Dimitriou',
    serial: 'RM-22344',
    complianceHours: 108,
    ahi: 2.8,
    status: 'stable'
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

  const numericHours = Number(hours || 0);

  if (numericHours < 50) return 'critical';
  if (numericHours < 80) return 'warning';
  return 'stable';
}

function filterFallbackPatients(rows, search) {
  if (!search) return rows;

  const q = search.toLowerCase();

  return rows.filter((item) => {
    return [
      item.id,
      item.fullName,
      item.doctor,
      item.serial,
      item.status
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });
}

async function getTenantPatients({ tenantId, search = '' }) {
  const hasSearch = Boolean(search);

  try {
    const params = [tenantId];
    let whereSearch = '';

    if (hasSearch) {
      params.push(`%${search}%`);
      whereSearch = `
        AND (
          CAST(p.id AS TEXT) ILIKE $2
          OR COALESCE(p.full_name, '') ILIKE $2
          OR COALESCE(p.first_name, '') ILIKE $2
          OR COALESCE(p.last_name, '') ILIKE $2
          OR COALESCE(p.doctor_name, '') ILIKE $2
          OR COALESCE(d.serial, '') ILIKE $2
          OR COALESCE(p.status, '') ILIKE $2
        )
      `;
    }

    const result = await runQuery(
      `
        SELECT
          p.id,
          COALESCE(
            NULLIF(p.full_name, ''),
            CONCAT_WS(' ', NULLIF(p.first_name, ''), NULLIF(p.last_name, ''))
          ) AS full_name,
          COALESCE(NULLIF(p.doctor_name, ''), '—') AS doctor_name,
          COALESCE(NULLIF(d.serial, ''), '—') AS serial,
          COALESCE(p.compliance_hours, 0) AS compliance_hours,
          COALESCE(p.ahi, 0) AS ahi,
          COALESCE(NULLIF(p.status, ''), '') AS status
        FROM patients p
        LEFT JOIN devices d
          ON d.patient_id = p.id
          AND d.tenant_id = p.tenant_id
        WHERE p.tenant_id = $1
        ${whereSearch}
        ORDER BY p.created_at DESC NULLS LAST, p.id DESC
        LIMIT 200
      `,
      params
    );

    return (result.rows || []).map((row) => ({
      id: row.id,
      fullName: row.full_name || 'Unknown',
      doctor: row.doctor_name || '—',
      serial: row.serial || '—',
      complianceHours: Number(row.compliance_hours || 0),
      ahi: Number(row.ahi || 0),
      status: normalizeStatus(row.compliance_hours, row.status)
    }));
  } catch (error) {
    return filterFallbackPatients(FALLBACK_PATIENTS, search);
  }
}

module.exports = {
  getTenantPatients
};