const express = require('express');
const db = require('../../db');

const router = express.Router();

function ok(res, data) {
  return res.json({
    success: true,
    data
  });
}

function fail(res, status, message, details = null) {
  return res.status(status).json({
    success: false,
    message,
    details
  });
}

async function tableExists(tableName) {
  const sql = `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS exists
  `;
  const result = await db.query(sql, [tableName]);
  return result.rows[0]?.exists === true;
}

async function getTableColumns(tableName) {
  const sql = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
  `;
  const result = await db.query(sql, [tableName]);
  return result.rows.map((r) => r.column_name);
}

function firstExisting(columns, candidates) {
  return candidates.find((c) => columns.includes(c)) || null;
}

function buildDoctorFullNameExpr(doctorCols, alias = 'd') {
  const firstNameCol = firstExisting(doctorCols, ['first_name']);
  const lastNameCol = firstExisting(doctorCols, ['last_name']);
  const fullNameCol = firstExisting(doctorCols, ['full_name', 'name']);

  if (firstNameCol && lastNameCol) {
    return `
      COALESCE(
        NULLIF(TRIM(CONCAT(COALESCE(${alias}.${firstNameCol}, ''), ' ', COALESCE(${alias}.${lastNameCol}, ''))), ''),
        ${fullNameCol ? `CAST(${alias}.${fullNameCol} AS text),` : ''}
        'Unknown Doctor'
      )
    `;
  }

  if (fullNameCol) {
    return `COALESCE(CAST(${alias}.${fullNameCol} AS text), 'Unknown Doctor')`;
  }

  return `'Unknown Doctor'`;
}

function normalizeDoctorRow(row = {}) {
  return {
    id: row.id,
    full_name: row.full_name || 'Unknown Doctor',
    specialty: row.specialty || 'General',
    email: row.email || null,
    phone: row.phone || null,
    clinic: row.clinic || '-',
    city: row.city || '-',
    status: row.status || 'active',
    patients_count: Number(row.patients_count || 0),
    active_cases: Number(row.active_cases || 0),
    compliance_rate: Number(row.compliance_rate || 0),
    referrals_count: Number(row.referrals_count || 0),
    revenue: Number(row.revenue || 0),
    created_at: row.created_at || null,
    notes: row.notes || ''
  };
}

async function getDoctorList() {
  const doctorsExists = await tableExists('doctors');

  if (!doctorsExists) {
    return [];
  }

  const doctorCols = await getTableColumns('doctors');
  const patientsExists = await tableExists('patients');
  const referralsExists = await tableExists('referrals');
  const atlasCasesExists = await tableExists('atlas_cases');
  const actionGroupsExists = await tableExists('action_groups');

  const patientCols = patientsExists ? await getTableColumns('patients') : [];
  const referralCols = referralsExists ? await getTableColumns('referrals') : [];
  const atlasCols = atlasCasesExists ? await getTableColumns('atlas_cases') : [];
  const actionCols = actionGroupsExists ? await getTableColumns('action_groups') : [];

  const doctorIdCol = firstExisting(doctorCols, ['id']);
  const doctorNameExpr = buildDoctorFullNameExpr(doctorCols, 'd');

  const specialtyCol = firstExisting(doctorCols, ['specialty', 'doctor_specialty', 'role_specialty']);
  const emailCol = firstExisting(doctorCols, ['email', 'contact_email', 'mail']);
  const phoneCol = firstExisting(doctorCols, ['phone', 'mobile', 'contact_phone']);
  const clinicCol = firstExisting(doctorCols, ['clinic', 'clinic_name', 'organization', 'practice']);
  const cityCol = firstExisting(doctorCols, ['city', 'location_city', 'area']);
  const statusCol = firstExisting(doctorCols, ['status', 'doctor_status']);
  const complianceCol = firstExisting(doctorCols, ['compliance_rate', 'adherence_rate']);
  const revenueCol = firstExisting(doctorCols, ['revenue', 'total_revenue', 'generated_revenue']);
  const createdAtCol = firstExisting(doctorCols, ['created_at', 'joined_at', 'registered_at']);
  const notesCol = firstExisting(doctorCols, ['notes', 'description']);

  const patientDoctorIdCol = firstExisting(patientCols, ['doctor_id']);
  const referralDoctorIdCol = firstExisting(referralCols, ['doctor_id']);
  const atlasDoctorIdCol = firstExisting(atlasCols, ['doctor_id']);
  const actionDoctorIdCol = firstExisting(actionCols, ['doctor_id']);

  const activeCaseSource = atlasCasesExists
    ? { table: 'atlas_cases', col: atlasDoctorIdCol }
    : actionGroupsExists
    ? { table: 'action_groups', col: actionDoctorIdCol }
    : null;

  const sql = `
    SELECT
      d.${doctorIdCol} AS id,
      ${doctorNameExpr} AS full_name,
      ${specialtyCol ? `COALESCE(CAST(d.${specialtyCol} AS text), 'General')` : `'General'`} AS specialty,
      ${emailCol ? `CAST(d.${emailCol} AS text)` : `NULL`} AS email,
      ${phoneCol ? `CAST(d.${phoneCol} AS text)` : `NULL`} AS phone,
      ${clinicCol ? `COALESCE(CAST(d.${clinicCol} AS text), '-')` : `'-'`} AS clinic,
      ${cityCol ? `COALESCE(CAST(d.${cityCol} AS text), '-')` : `'-'`} AS city,
      ${statusCol ? `LOWER(COALESCE(CAST(d.${statusCol} AS text), 'active'))` : `'active'`} AS status,
      ${
        patientsExists && patientDoctorIdCol
          ? `(SELECT COUNT(*)::int FROM patients p WHERE p.${patientDoctorIdCol} = d.${doctorIdCol})`
          : `0`
      } AS patients_count,
      ${
        activeCaseSource && activeCaseSource.col
          ? `(SELECT COUNT(*)::int FROM ${activeCaseSource.table} ac WHERE ac.${activeCaseSource.col} = d.${doctorIdCol})`
          : `0`
      } AS active_cases,
      ${complianceCol ? `COALESCE(d.${complianceCol}, 0)` : `0`} AS compliance_rate,
      ${
        referralsExists && referralDoctorIdCol
          ? `(SELECT COUNT(*)::int FROM referrals r WHERE r.${referralDoctorIdCol} = d.${doctorIdCol})`
          : `0`
      } AS referrals_count,
      ${revenueCol ? `COALESCE(d.${revenueCol}, 0)` : `0`} AS revenue,
      ${createdAtCol ? `d.${createdAtCol}` : `NULL`} AS created_at,
      ${notesCol ? `COALESCE(CAST(d.${notesCol} AS text), '')` : `''`} AS notes
    FROM doctors d
    ORDER BY d.${doctorIdCol} DESC
  `;

  const result = await db.query(sql);
  return result.rows.map(normalizeDoctorRow);
}

router.get('/', async (req, res) => {
  try {
    const rows = await getDoctorList();
    return ok(res, rows);
  } catch (err) {
    console.error('GET /tenant/doctors error:', err);
    return fail(res, 500, 'Failed to load doctors', err.message);
  }
});

router.get('/:doctorId', async (req, res) => {
  try {
    const exists = await tableExists('doctors');
    if (!exists) {
      return fail(res, 404, 'Doctors table not found');
    }

    const cols = await getTableColumns('doctors');
    const idCol = firstExisting(cols, ['id']);

    const result = await db.query(
      `SELECT * FROM doctors WHERE ${idCol} = $1 LIMIT 1`,
      [req.params.doctorId]
    );

    if (result.rows.length === 0) {
      return fail(res, 404, 'Doctor not found');
    }

    return ok(res, result.rows[0]);
  } catch (err) {
    console.error('GET /tenant/doctors/:doctorId error:', err);
    return fail(res, 500, 'Failed to load doctor', err.message);
  }
});

router.post('/', async (req, res) => {
  try {
    const exists = await tableExists('doctors');
    if (!exists) {
      return fail(res, 404, 'Doctors table not found');
    }

    const cols = await getTableColumns('doctors');
    const body = req.body || {};

    const allowedFields = [
      'first_name',
      'last_name',
      'full_name',
      'name',
      'specialty',
      'doctor_specialty',
      'role_specialty',
      'email',
      'contact_email',
      'mail',
      'phone',
      'mobile',
      'contact_phone',
      'clinic',
      'clinic_name',
      'organization',
      'practice',
      'city',
      'location_city',
      'area',
      'status',
      'doctor_status',
      'compliance_rate',
      'adherence_rate',
      'revenue',
      'total_revenue',
      'generated_revenue',
      'notes',
      'description'
    ].filter((field) => cols.includes(field));

    const fields = [];
    const placeholders = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        fields.push(field);
        placeholders.push(`$${values.length + 1}`);
        values.push(body[field]);
      }
    });

    if (fields.length === 0) {
      return fail(res, 400, 'No valid doctor fields provided');
    }

    const sql = `
      INSERT INTO doctors (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await db.query(sql, values);
    return ok(res, result.rows[0]);
  } catch (err) {
    console.error('POST /tenant/doctors error:', err);
    return fail(res, 500, 'Failed to create doctor', err.message);
  }
});

router.put('/:doctorId', async (req, res) => {
  try {
    const exists = await tableExists('doctors');
    if (!exists) {
      return fail(res, 404, 'Doctors table not found');
    }

    const cols = await getTableColumns('doctors');
    const idCol = firstExisting(cols, ['id']);
    const body = req.body || {};

    const allowedFields = [
      'first_name',
      'last_name',
      'full_name',
      'name',
      'specialty',
      'doctor_specialty',
      'role_specialty',
      'email',
      'contact_email',
      'mail',
      'phone',
      'mobile',
      'contact_phone',
      'clinic',
      'clinic_name',
      'organization',
      'practice',
      'city',
      'location_city',
      'area',
      'status',
      'doctor_status',
      'compliance_rate',
      'adherence_rate',
      'revenue',
      'total_revenue',
      'generated_revenue',
      'notes',
      'description'
    ].filter((field) => cols.includes(field));

    const setClauses = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        setClauses.push(`${field} = $${values.length + 1}`);
        values.push(body[field]);
      }
    });

    if (cols.includes('updated_at')) {
      setClauses.push('updated_at = NOW()');
    }

    if (setClauses.length === 0) {
      return fail(res, 400, 'No valid doctor fields provided');
    }

    values.push(req.params.doctorId);

    const sql = `
      UPDATE doctors
      SET ${setClauses.join(', ')}
      WHERE ${idCol} = $${values.length}
      RETURNING *
    `;

    const result = await db.query(sql, values);

    if (result.rows.length === 0) {
      return fail(res, 404, 'Doctor not found');
    }

    return ok(res, result.rows[0]);
  } catch (err) {
    console.error('PUT /tenant/doctors/:doctorId error:', err);
    return fail(res, 500, 'Failed to update doctor', err.message);
  }
});

router.delete('/:doctorId', async (req, res) => {
  try {
    const exists = await tableExists('doctors');
    if (!exists) {
      return fail(res, 404, 'Doctors table not found');
    }

    const cols = await getTableColumns('doctors');
    const idCol = firstExisting(cols, ['id']);

    const result = await db.query(
      `DELETE FROM doctors WHERE ${idCol} = $1 RETURNING ${idCol} AS id`,
      [req.params.doctorId]
    );

    if (result.rows.length === 0) {
      return fail(res, 404, 'Doctor not found');
    }

    return ok(res, {
      deleted: true,
      id: req.params.doctorId
    });
  } catch (err) {
    console.error('DELETE /tenant/doctors/:doctorId error:', err);
    return fail(res, 500, 'Failed to delete doctor', err.message);
  }
});

module.exports = router;