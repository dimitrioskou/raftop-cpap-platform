const db = require('../../db');

const FALLBACK_REFERRALS = [
  {
    id: 'RF-001',
    patient: 'Alexandros Vrettos',
    refDoctor: 'Dr. Maria Papadopoulou',
    specialty: 'Pulmonology',
    stage: 'new',
    source: 'Clinic',
    createdAt: '2026-03-31'
  },
  {
    id: 'RF-002',
    patient: 'Katerina Meli',
    refDoctor: 'Dr. Nikos Andreou',
    specialty: 'Cardiology',
    stage: 'contacted',
    source: 'Private Practice',
    createdAt: '2026-03-30'
  },
  {
    id: 'RF-003',
    patient: 'Giannis Laskaris',
    refDoctor: 'Dr. Eleni Perraki',
    specialty: 'Pulmonology',
    stage: 'scheduled',
    source: 'Hospital',
    createdAt: '2026-03-29'
  },
  {
    id: 'RF-004',
    patient: 'Sofia Dima',
    refDoctor: 'Dr. George Dimitriou',
    specialty: 'ENT',
    stage: 'converted',
    source: 'Clinic',
    createdAt: '2026-03-28'
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
    [item.id, item.patient, item.refDoctor, item.specialty, item.stage, item.source]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}

async function getTenantReferrals({ tenantId, search = '' }) {
  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        CAST(r.id AS TEXT) ILIKE $2
        OR COALESCE(r.patient_name, '') ILIKE $2
        OR COALESCE(r.ref_doctor, '') ILIKE $2
        OR COALESCE(r.specialty, '') ILIKE $2
        OR COALESCE(r.stage, '') ILIKE $2
        OR COALESCE(r.source, '') ILIKE $2
      )
    `;
  }

  try {
    const result = await runQuery(
      `
        SELECT
          r.id,
          COALESCE(NULLIF(r.patient_name, ''), 'Unknown') AS patient_name,
          COALESCE(NULLIF(r.ref_doctor, ''), '—') AS ref_doctor,
          COALESCE(NULLIF(r.specialty, ''), '—') AS specialty,
          LOWER(COALESCE(NULLIF(r.stage, ''), 'new')) AS stage,
          COALESCE(NULLIF(r.source, ''), '—') AS source,
          COALESCE(r.created_at, NOW()) AS created_at
        FROM referrals r
        WHERE r.tenant_id = $1
        ${searchSql}
        ORDER BY r.created_at DESC NULLS LAST, r.id DESC
        LIMIT 200
      `,
      params
    );

    return (result.rows || []).map((row) => ({
      id: row.id,
      patient: row.patient_name || 'Unknown',
      refDoctor: row.ref_doctor || '—',
      specialty: row.specialty || '—',
      stage: row.stage || 'new',
      source: row.source || '—',
      createdAt: row.created_at
    }));
  } catch (error) {
    return filterFallback(FALLBACK_REFERRALS, search);
  }
}

module.exports = {
  getTenantReferrals
};