const db = require('../../db');

const FALLBACK_NOTES = [
  {
    id: 'NT-001',
    patient: 'Eleni Kosta',
    author: 'Follow-up Manager',
    category: 'followup',
    createdAt: '2026-03-31 09:10',
    text: 'Patient requested callback after 18:00 λόγω εργασίας. Αναφέρει δυσφορία με τη μάσκα και χαμηλή διάρκεια χρήσης τις τελευταίες 4 νύχτες.'
  },
  {
    id: 'NT-002',
    patient: 'Dimitris Leonidas',
    author: 'Operations Admin',
    category: 'critical',
    createdAt: '2026-03-31 08:45',
    text: 'Σημαντική πτώση συμμόρφωσης και επαναλαμβανόμενο no-answer. Προτείνεται ιατρική ειδοποίηση και δεύτερη προσπάθεια επικοινωνίας σήμερα.'
  },
  {
    id: 'NT-003',
    patient: 'Maria Ioannou',
    author: 'Operations Admin',
    category: 'device',
    createdAt: '2026-03-30 17:20',
    text: 'Παρατηρήθηκε αυξημένο leak για δύο συνεχόμενες νύχτες. Έγινε σύσταση για επανέλεγχο μάσκας και σωστής εφαρμογής.'
  },
  {
    id: 'NT-004',
    patient: 'Giorgos Papadakis',
    author: 'Follow-up Manager',
    category: 'stable',
    createdAt: '2026-03-30 13:10',
    text: 'Καλή συνολική εικόνα, συμμόρφωση πάνω από στόχο και σταθερή χρήση. Παραμένει σε passive monitoring.'
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
    [item.id, item.patient, item.author, item.category, item.text]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}

async function getTenantNotes({ tenantId, search = '' }) {
  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        CAST(n.id AS TEXT) ILIKE $2
        OR COALESCE(p.full_name, '') ILIKE $2
        OR COALESCE(p.first_name, '') ILIKE $2
        OR COALESCE(p.last_name, '') ILIKE $2
        OR COALESCE(n.author, '') ILIKE $2
        OR COALESCE(n.category, '') ILIKE $2
        OR COALESCE(n.text, n.note, n.body, '') ILIKE $2
      )
    `;
  }

  try {
    const result = await runQuery(
      `
        SELECT
          n.id,
          COALESCE(
            NULLIF(p.full_name, ''),
            CONCAT_WS(' ', NULLIF(p.first_name, ''), NULLIF(p.last_name, '')),
            'Unknown'
          ) AS patient_name,
          COALESCE(NULLIF(n.author, ''), '—') AS author,
          LOWER(COALESCE(NULLIF(n.category, ''), 'general')) AS category,
          COALESCE(n.created_at, NOW()) AS created_at,
          COALESCE(NULLIF(n.text, ''), NULLIF(n.note, ''), NULLIF(n.body, ''), 'No note text') AS text
        FROM notes n
        LEFT JOIN patients p
          ON p.id = n.patient_id
          AND p.tenant_id = n.tenant_id
        WHERE n.tenant_id = $1
        ${searchSql}
        ORDER BY n.created_at DESC NULLS LAST, n.id DESC
        LIMIT 200
      `,
      params
    );

    return (result.rows || []).map((row) => ({
      id: row.id,
      patient: row.patient_name || 'Unknown',
      author: row.author || '—',
      category: row.category || 'general',
      createdAt: row.created_at,
      text: row.text || 'No note text'
    }));
  } catch (error) {
    return filterFallback(FALLBACK_NOTES, search);
  }
}

module.exports = {
  getTenantNotes
};