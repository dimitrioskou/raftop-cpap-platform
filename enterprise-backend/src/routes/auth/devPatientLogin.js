const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

function resolveDb() {
  const candidates = [
    '../../db',
    '../../config/db',
    '../../config/database',
    '../../database',
    '../../lib/db',
    '../db',
    '../config/db'
  ];

  for (const candidate of candidates) {
    try {
      const mod = require(candidate);

      if (mod && typeof mod.query === 'function') {
        return mod;
      }

      if (mod && mod.pool && typeof mod.pool.query === 'function') {
        return mod.pool;
      }

      if (typeof mod === 'function') {
        const maybeDb = mod();
        if (maybeDb && typeof maybeDb.query === 'function') {
          return maybeDb;
        }
      }
    } catch (_error) {
      // keep scanning
    }
  }

  throw new Error('Could not resolve database client.');
}

const db = resolveDb();

function resolveJwtSecret() {
  return (
    process.env.JWT_SECRET ||
    process.env.JWT_KEY ||
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.TOKEN_SECRET ||
    'raftop-dev-secret'
  );
}

function isLocalRequest(req) {
  const host = String(req.headers.host || '').toLowerCase();
  return host.includes('localhost') || host.includes('127.0.0.1');
}

function isDevPatientLoginAllowed(req) {
  if (process.env.ALLOW_DEV_PATIENT_LOGIN === 'true') {
    return true;
  }

  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return isLocalRequest(req);
}

async function getUsersColumnsMeta() {
  const result = await db.query(`
    SELECT
      column_name,
      data_type,
      udt_name,
      is_nullable,
      column_default,
      is_identity
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
    ORDER BY ordinal_position
  `);

  return result.rows;
}

function getColumnSet(columnsMeta) {
  return new Set(columnsMeta.map((col) => col.column_name));
}

function firstExisting(columns, names) {
  for (const name of names) {
    if (columns.has(name)) return name;
  }
  return null;
}

function hasUsableDefault(column) {
  return (
    String(column.is_identity || '').toUpperCase() === 'YES' ||
    column.column_default !== null
  );
}

function assignIfPresent(target, key, value) {
  if (key && typeof value !== 'undefined' && value !== null) {
    target[key] = value;
  }
}

async function getFirstUserRow(idKey, emailKey) {
  const orderKey = idKey || emailKey;

  if (!orderKey) {
    return null;
  }

  const result = await db.query(
    `SELECT * FROM "users" ORDER BY "${orderKey}" ASC LIMIT 1`
  );

  return result.rows[0] || null;
}

async function findPatientUser(roleKey, idKey) {
  const orderKey = idKey || roleKey;

  const result = await db.query(
    `SELECT * FROM "users" WHERE LOWER("${roleKey}") = 'patient' ORDER BY "${orderKey}" ASC LIMIT 1`
  );

  return result.rows[0] || null;
}

async function findAvailableEmail(emailKey) {
  for (let i = 1; i <= 100; i += 1) {
    const candidate = `patient${i}@raftop.local`;

    const exists = await db.query(
      `SELECT 1 FROM "users" WHERE "${emailKey}" = $1 LIMIT 1`,
      [candidate]
    );

    if (!exists.rows.length) {
      return candidate;
    }
  }

  throw new Error('Could not find available patient email.');
}

async function findAvailableUsername(usernameKey) {
  for (let i = 1; i <= 100; i += 1) {
    const candidate = `patient${i}`;

    const exists = await db.query(
      `SELECT 1 FROM "users" WHERE "${usernameKey}" = $1 LIMIT 1`,
      [candidate]
    );

    if (!exists.rows.length) {
      return candidate;
    }
  }

  throw new Error('Could not find available patient username.');
}

function inferFallbackValue(column) {
  const dataType = String(column.data_type || '').toLowerCase();
  const udtName = String(column.udt_name || '').toLowerCase();
  const name = String(column.column_name || '').toLowerCase();

  if (
    dataType.includes('timestamp') ||
    dataType === 'date' ||
    udtName.includes('timestamp') ||
    udtName === 'date'
  ) {
    return new Date();
  }

  if (dataType === 'boolean') {
    return false;
  }

  if (
    dataType.includes('int') ||
    dataType === 'numeric' ||
    dataType === 'real' ||
    dataType === 'double precision'
  ) {
    if (name.includes('tenant') || name.includes('org') || name.includes('workspace')) {
      return 1;
    }
    return 0;
  }

  if (
    dataType.includes('char') ||
    dataType === 'text' ||
    udtName === 'varchar' ||
    udtName === 'text'
  ) {
    return 'N/A';
  }

  return undefined;
}

async function createDevPatientUser(columnsMeta) {
  const columnSet = getColumnSet(columnsMeta);

  const idKey = firstExisting(columnSet, ['id', 'user_id']);
  const emailKey = firstExisting(columnSet, ['email', 'user_email']);
  const roleKey = firstExisting(columnSet, ['role', 'user_role']);
  const tenantKey = firstExisting(columnSet, ['tenant_id', 'organization_id', 'org_id', 'workspace_id']);
  const nameKey = firstExisting(columnSet, ['full_name', 'name', 'display_name']);
  const usernameKey = firstExisting(columnSet, ['username', 'user_name']);
  const firstNameKey = firstExisting(columnSet, ['first_name']);
  const lastNameKey = firstExisting(columnSet, ['last_name']);
  const passwordKey = firstExisting(columnSet, [
    'password',
    'password_hash',
    'hashed_password',
    'user_password',
    'pass_hash'
  ]);

  if (!emailKey || !roleKey) {
    throw new Error('Users table is missing email or role column.');
  }

  const templateUser = await getFirstUserRow(idKey, emailKey);

  if (!templateUser) {
    throw new Error('Cannot auto-create patient user because users table is empty.');
  }

  const availableEmail = await findAvailableEmail(emailKey);
  const availableUsername = usernameKey
    ? await findAvailableUsername(usernameKey)
    : null;

  const now = new Date();
  const passwordHash = bcrypt.hashSync('patient123!', 10);
  const patientCode = `PT-DEV-${Date.now().toString().slice(-6)}`;

  const valuesMap = {};

  assignIfPresent(valuesMap, emailKey, availableEmail);
  assignIfPresent(valuesMap, roleKey, 'patient');
  assignIfPresent(valuesMap, tenantKey, tenantKey ? templateUser[tenantKey] || 1 : undefined);
  assignIfPresent(valuesMap, nameKey, 'Demo Patient');
  assignIfPresent(valuesMap, usernameKey, availableUsername);
  assignIfPresent(valuesMap, firstNameKey, 'Demo');
  assignIfPresent(valuesMap, lastNameKey, 'Patient');
  assignIfPresent(valuesMap, passwordKey, passwordHash);

  if (columnSet.has('patient_code')) valuesMap.patient_code = patientCode;
  if (columnSet.has('phone')) valuesMap.phone = '6900000000';
  if (columnSet.has('mobile')) valuesMap.mobile = '6900000000';
  if (columnSet.has('status')) valuesMap.status = 'active';
  if (columnSet.has('active')) valuesMap.active = true;
  if (columnSet.has('is_active')) valuesMap.is_active = true;
  if (columnSet.has('enabled')) valuesMap.enabled = true;
  if (columnSet.has('is_enabled')) valuesMap.is_enabled = true;
  if (columnSet.has('verified')) valuesMap.verified = true;
  if (columnSet.has('is_verified')) valuesMap.is_verified = true;
  if (columnSet.has('email_verified')) valuesMap.email_verified = true;
  if (columnSet.has('created_at')) valuesMap.created_at = now;
  if (columnSet.has('updated_at')) valuesMap.updated_at = now;

  const doNotCopyFromTemplate = new Set([
    'id',
    'user_id',
    'email',
    'user_email',
    'username',
    'user_name',
    'patient_code'
  ]);

  const unsupportedRequired = [];

  for (const column of columnsMeta) {
    const name = column.column_name;

    if (Object.prototype.hasOwnProperty.call(valuesMap, name)) {
      continue;
    }

    if (hasUsableDefault(column)) {
      continue;
    }

    if (String(column.is_nullable || '').toUpperCase() === 'YES') {
      continue;
    }

    if (!doNotCopyFromTemplate.has(name) && templateUser[name] !== null && typeof templateUser[name] !== 'undefined') {
      valuesMap[name] = templateUser[name];
      continue;
    }

    const inferred = inferFallbackValue(column);
    if (typeof inferred !== 'undefined') {
      valuesMap[name] = inferred;
      continue;
    }

    unsupportedRequired.push(name);
  }

  if (unsupportedRequired.length) {
    throw new Error(
      `Cannot auto-create patient user. Required columns need manual mapping: ${unsupportedRequired.join(', ')}`
    );
  }

  const insertColumns = Object.keys(valuesMap);

  if (!insertColumns.length) {
    throw new Error('No insertable values were prepared for patient seed.');
  }

  const placeholders = insertColumns.map((_, index) => `$${index + 1}`);
  const insertValues = insertColumns.map((key) => valuesMap[key]);

  const result = await db.query(
    `INSERT INTO "users" (${insertColumns.map((col) => `"${col}"`).join(', ')})
     VALUES (${placeholders.join(', ')})
     RETURNING *`,
    insertValues
  );

  return result.rows[0] || null;
}

function mapUserResponse(row, columnsMeta) {
  const columnSet = getColumnSet(columnsMeta);

  const idKey = firstExisting(columnSet, ['id', 'user_id']);
  const emailKey = firstExisting(columnSet, ['email', 'user_email']);
  const roleKey = firstExisting(columnSet, ['role', 'user_role']);
  const tenantKey = firstExisting(columnSet, ['tenant_id', 'organization_id', 'org_id', 'workspace_id']);
  const nameKey = firstExisting(columnSet, ['full_name', 'name', 'display_name']);

  return {
    id: idKey ? row[idKey] : null,
    userId: idKey ? row[idKey] : null,
    email: emailKey ? row[emailKey] : null,
    role: roleKey ? String(row[roleKey]).toLowerCase() : 'patient',
    tenantId: tenantKey ? row[tenantKey] : null,
    fullName: nameKey ? row[nameKey] : 'Patient User',
    name: nameKey ? row[nameKey] : 'Patient User'
  };
}

router.post('/dev-patient-login', async (req, res) => {
  try {
    if (!isDevPatientLoginAllowed(req)) {
      return res.status(403).json({
        ok: false,
        message: 'Dev patient login is disabled for this environment.'
      });
    }

    const columnsMeta = await getUsersColumnsMeta();
    const columnSet = getColumnSet(columnsMeta);

    const idKey = firstExisting(columnSet, ['id', 'user_id']);
    const emailKey = firstExisting(columnSet, ['email', 'user_email']);
    const roleKey = firstExisting(columnSet, ['role', 'user_role']);

    if (!emailKey || !roleKey) {
      return res.status(500).json({
        ok: false,
        message: 'Users table is missing required columns for dev patient login.'
      });
    }

    let patient = await findPatientUser(roleKey, idKey);

    if (!patient) {
      patient = await createDevPatientUser(columnsMeta);
    }

    if (!patient) {
      return res.status(500).json({
        ok: false,
        message: 'Patient user could not be created.'
      });
    }

    const mappedUser = mapUserResponse(patient, columnsMeta);

    const tokenPayload = {
      id: mappedUser.id,
      email: mappedUser.email,
      role: mappedUser.role
    };

    const token = jwt.sign(tokenPayload, resolveJwtSecret(), {
      expiresIn: '7d'
    });

    return res.json({
      ok: true,
      token,
      user: mappedUser
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Dev patient login failed',
      error: error.message
    });
  }
});

module.exports = router;