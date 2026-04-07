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

function buildDisplayNameExpr(alias, columns, outAlias) {
  const fullName = firstExisting(columns, ['full_name', 'fullname', 'name']);
  const firstName = firstExisting(columns, ['first_name', 'firstname', 'given_name']);
  const lastName = firstExisting(columns, ['last_name', 'lastname', 'family_name']);
  const email = firstExisting(columns, ['email']);

  if (fullName) {
    return `${alias}.${q(fullName)}::text AS ${q(outAlias)}`;
  }

  if (firstName && lastName) {
    return `NULLIF(TRIM(COALESCE(${alias}.${q(firstName)}::text, '') || ' ' || COALESCE(${alias}.${q(lastName)}::text, '')), '') AS ${q(outAlias)}`;
  }

  if (firstName) {
    return `${alias}.${q(firstName)}::text AS ${q(outAlias)}`;
  }

  if (email) {
    return `split_part(${alias}.${q(email)}::text, '@', 1) AS ${q(outAlias)}`;
  }

  return `NULL AS ${q(outAlias)}`;
}

async function readFromUsersTable() {
  const exists = await tableExists(db, 'users');
  if (!exists) return null;

  const columns = await getColumns(db, 'users');

  const idColumn = firstExisting(columns, ['id', 'user_id']);
  const roleColumn = firstExisting(columns, ['role', 'user_role']);
  const statusColumn = firstExisting(columns, ['status', 'account_status', 'is_active']);
  const emailColumn = firstExisting(columns, ['email']);
  const createdAtColumn = firstExisting(columns, ['created_at', 'createdAt', 'updated_at']);

  const sql = `
    SELECT
      ${textExpr('u', idColumn, 'id')},
      ${buildDisplayNameExpr('u', columns, 'name')},
      ${textExpr('u', emailColumn, 'email')},
      ${textExpr('u', roleColumn, 'role')},
      ${textExpr('u', statusColumn, 'status')},
      ${textExpr('u', createdAtColumn, 'created_at')}
    FROM users u
    ORDER BY ${createdAtColumn ? `u.${q(createdAtColumn)} DESC NULLS LAST` : '1 DESC'}
    LIMIT 200
  `;

  const result = await querySafe(db, sql);
  if (result.error) return null;

  const users = (result.rows || []).map((row, index) => ({
    id: row.id || `user-${index + 1}`,
    name: row.name || row.email || `User ${index + 1}`,
    email: row.email || '—',
    role: row.role || 'user',
    status:
      String(row.status || '').toLowerCase() === 'false'
        ? 'inactive'
        : row.status || 'active',
    created_at: row.created_at || null
  }));

  return users;
}

async function readFromDoctorsTable() {
  const exists = await tableExists(db, 'doctors');
  if (!exists) return [];

  const columns = await getColumns(db, 'doctors');
  const idColumn = firstExisting(columns, ['id', 'doctor_id']);
  const nameColumn = firstExisting(columns, ['name', 'full_name', 'fullname']);
  const emailColumn = firstExisting(columns, ['email']);
  const createdAtColumn = firstExisting(columns, ['created_at', 'updated_at']);

  const sql = `
    SELECT
      ${textExpr('d', idColumn, 'id')},
      ${textExpr('d', nameColumn, 'name')},
      ${textExpr('d', emailColumn, 'email')},
      ${textExpr('d', createdAtColumn, 'created_at')}
    FROM doctors d
    ORDER BY ${createdAtColumn ? `d.${q(createdAtColumn)} DESC NULLS LAST` : '1 DESC'}
    LIMIT 200
  `;

  const result = await querySafe(db, sql);
  if (result.error) return [];

  const doctorUsers = (result.rows || []).map((row, index) => ({
    id: row.id || `doctor-user-${index + 1}`,
    name: row.name || row.email || `Doctor ${index + 1}`,
    email: row.email || '—',
    role: 'doctor_user',
    status: 'active',
    created_at: row.created_at || null
  }));

  return [
    {
      id: 'tenant-admin-1',
      name: 'Tenant Admin',
      email: 'admin@raftop.local',
      role: 'tenant_admin',
      status: 'active',
      created_at: null
    },
    ...doctorUsers
  ];
}

router.get('/', async (req, res) => {
  let users = await readFromUsersTable();

  if (!users) {
    users = await readFromDoctorsTable();
  }

  const roles = Array.from(new Set(users.map((user) => user.role).filter(Boolean)));
  const activeUsers = users.filter(
    (user) => !['inactive', 'disabled', 'false', '0'].includes(String(user.status || '').toLowerCase())
  ).length;

  return res.json({
    ok: true,
    users,
    totalUsers: users.length,
    activeUsers,
    roles,
    accessModel: 'role_based',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;