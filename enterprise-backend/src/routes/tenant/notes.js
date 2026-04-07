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

async function readNotes() {
  const exists = await tableExists(db, 'notes');

  if (!exists) {
    return {
      notes: [],
      totalNotes: 0
    };
  }

  const columns = await getColumns(db, 'notes');

  const idColumn = firstExisting(columns, ['id', 'note_id']);
  const titleColumn = firstExisting(columns, ['title', 'note', 'message', 'body']);
  const patientNameColumn = firstExisting(columns, ['patient_name']);
  const authorColumn = firstExisting(columns, ['author', 'created_by']);
  const typeColumn = firstExisting(columns, ['note_type', 'type']);
  const statusColumn = firstExisting(columns, ['status']);
  const createdAtColumn = firstExisting(columns, ['created_at', 'updated_at']);

  const sql = `
    SELECT
      ${textExpr('n', idColumn, 'id')},
      ${textExpr('n', titleColumn, 'title')},
      ${textExpr('n', patientNameColumn, 'patient_name')},
      ${textExpr('n', authorColumn, 'author')},
      ${textExpr('n', typeColumn, 'note_type')},
      ${textExpr('n', statusColumn, 'status')},
      ${textExpr('n', createdAtColumn, 'created_at')}
    FROM notes n
    ORDER BY ${createdAtColumn ? `n.${q(createdAtColumn)} DESC NULLS LAST` : '1 DESC'}
    LIMIT 200
  `;

  const result = await querySafe(db, sql);
  if (result.error) {
    return {
      notes: [],
      totalNotes: 0
    };
  }

  return {
    notes: result.rows || [],
    totalNotes: result.rows?.length || 0
  };
}

router.get('/', async (req, res) => {
  const data = await readNotes();

  return res.json({
    ok: true,
    notes: data.notes,
    totalNotes: data.totalNotes,
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;