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

async function readNotifications() {
  const exists = await tableExists(db, 'notifications');

  if (!exists) {
    return {
      notifications: [],
      totalNotifications: 0
    };
  }

  const columns = await getColumns(db, 'notifications');

  const idColumn = firstExisting(columns, ['id', 'notification_id']);
  const titleColumn = firstExisting(columns, ['title', 'subject', 'message']);
  const categoryColumn = firstExisting(columns, ['category', 'type']);
  const patientNameColumn = firstExisting(columns, ['patient_name']);
  const priorityColumn = firstExisting(columns, ['priority', 'severity']);
  const statusColumn = firstExisting(columns, ['status']);
  const createdAtColumn = firstExisting(columns, ['created_at', 'updated_at', 'timestamp']);

  const sql = `
    SELECT
      ${textExpr('n', idColumn, 'id')},
      ${textExpr('n', titleColumn, 'title')},
      ${textExpr('n', categoryColumn, 'category')},
      ${textExpr('n', patientNameColumn, 'patient_name')},
      ${textExpr('n', priorityColumn, 'priority')},
      ${textExpr('n', statusColumn, 'status')},
      ${textExpr('n', createdAtColumn, 'created_at')}
    FROM notifications n
    ORDER BY ${createdAtColumn ? `n.${q(createdAtColumn)} DESC NULLS LAST` : '1 DESC'}
    LIMIT 200
  `;

  const result = await querySafe(db, sql);
  if (result.error) {
    return {
      notifications: [],
      totalNotifications: 0
    };
  }

  return {
    notifications: result.rows || [],
    totalNotifications: result.rows?.length || 0
  };
}

router.get('/', async (req, res) => {
  const data = await readNotifications();

  return res.json({
    ok: true,
    notifications: data.notifications,
    totalNotifications: data.totalNotifications,
    unreadNotifications: data.notifications.filter(
      (row) => String(row.status || '').toLowerCase() === 'unread'
    ).length,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;