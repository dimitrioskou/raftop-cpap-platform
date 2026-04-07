const express = require('express');
const router = express.Router();
const db = require('../../db');
const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting,
  textExpr
} = require('../../utils/routeDbHelpers');

async function readReferrals() {
  const exists = await tableExists(db, 'referrals');

  if (!exists) {
    return {
      referrals: [],
      totalReferrals: 0
    };
  }

  const columns = await getColumns(db, 'referrals');

  const idColumn = firstExisting(columns, ['id', 'referral_id']);
  const titleColumn = firstExisting(columns, ['title', 'referral_title', 'reason']);
  const patientNameColumn = firstExisting(columns, ['patient_name']);
  const doctorNameColumn = firstExisting(columns, ['doctor_name']);
  const sourceColumn = firstExisting(columns, ['source', 'department', 'referral_source']);
  const statusColumn = firstExisting(columns, ['status']);
  const createdAtColumn = firstExisting(columns, ['created_at', 'updated_at']);

  const sql = `
    SELECT
      ${textExpr('r', idColumn, 'id')},
      ${textExpr('r', titleColumn, 'title')},
      ${textExpr('r', patientNameColumn, 'patient_name')},
      ${textExpr('r', doctorNameColumn, 'doctor_name')},
      ${textExpr('r', sourceColumn, 'source')},
      ${textExpr('r', statusColumn, 'status')},
      ${textExpr('r', createdAtColumn, 'created_at')}
    FROM referrals r
    ORDER BY ${createdAtColumn ? `r.${q(createdAtColumn)} DESC NULLS LAST` : '1 DESC'}
    LIMIT 200
  `;

  const result = await querySafe(db, sql);
  if (result.error) {
    return {
      referrals: [],
      totalReferrals: 0
    };
  }

  return {
    referrals: result.rows || [],
    totalReferrals: result.rows?.length || 0
  };
}

router.get('/', async (req, res) => {
  const data = await readReferrals();

  return res.json({
    ok: true,
    referrals: data.referrals,
    totalReferrals: data.totalReferrals,
    newReferrals: data.referrals.filter((row) => String(row.status || '').toLowerCase() === 'new').length,
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;