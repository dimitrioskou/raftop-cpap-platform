const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  writeFailedLoginFromRequest
} = require('../services/failedLoginAuditService');
const router = express.Router();

function resolveDb() {
  const candidates = [
    '../db',
    '../config/db',
    '../config/database',
    '../database',
    '../lib/db',
    '../../db',
    '../../config/db'
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
      // continue scanning candidates
    }
  }

  throw new Error('Could not resolve database client in auth routes.');
}

const db = resolveDb();

function normalizeText(value) {
  if (value === null || typeof value === 'undefined') return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeRole(value) {
  return String(value || 'guest').trim().toLowerCase();
}

function resolveJwtSecret() {
  const secret =
    process.env.JWT_SECRET ||
    process.env.JWT_KEY ||
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.TOKEN_SECRET ||
    null;

  if (secret && String(secret).trim().length >= 24) {
    return String(secret).trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required and must be at least 24 characters in production.');
  }

  return 'local-development-jwt-secret-change-before-production';
}

function isDevAuthAllowed() {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.ALLOW_DEV_PATIENT_LOGIN === 'true'
  );
}

async function getUserColumns() {
  const result = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
  `);

  return new Set((result.rows || []).map((row) => row.column_name));
}

function firstExisting(columns, names) {
  for (const name of names) {
    if (columns.has(name)) {
      return name;
    }
  }
  return null;
}

function mapDbUserToAuthUser(row) {
  if (!row) return null;

  const id = row.id || row.user_id || null;
  const tenantId =
    row.tenant_id ||
    row.organization_id ||
    row.org_id ||
    row.workspace_id ||
    null;

  const fullName =
    row.full_name ||
    row.name ||
    row.display_name ||
    row.username ||
    null;

  return {
    id,
    userId: id,
    email: row.email || row.user_email || null,
    role: normalizeRole(row.role || row.user_role || 'guest'),
    tenantId,
    organizationId: tenantId,
    fullName,
    name: fullName
  };
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id || user.userId || null,
      userId: user.userId || user.id || null,
      email: user.email || null,
      role: normalizeRole(user.role || 'guest'),
      tenantId: user.tenantId || user.organizationId || null
    },
    resolveJwtSecret(),
    { expiresIn: '7d' }
  );
}

function buildSyntheticAdminUser() {
  return {
    id: 999001,
    userId: 999001,
    email: 'admin@raftop.local',
    role: 'tenant_admin',
    tenantId: 'demo-tenant',
    organizationId: 'demo-tenant',
    fullName: 'Tenant Admin',
    name: 'Tenant Admin'
  };
}

function buildSyntheticPatientUser() {
  return {
    id: 999002,
    userId: 999002,
    email: 'patient@raftop.local',
    role: 'patient',
    tenantId: 'demo-tenant',
    organizationId: 'demo-tenant',
    fullName: 'Patient Demo',
    name: 'Patient Demo'
  };
}

function readBearerToken(req) {
  const header =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    '';

  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }

  return null;
}

function decodeToken(token) {
  if (!token) return null;

  try {
    return jwt.verify(token, resolveJwtSecret());
  } catch (_error) {
    return null;
  }
}

async function findUserByEmail(email) {
  const safeEmail = normalizeText(email);
  if (!safeEmail) return null;

  const columns = await getUserColumns();
  const emailColumn = firstExisting(columns, ['email', 'user_email']);

  if (!emailColumn) {
    return null;
  }

  const result = await db.query(
    `SELECT * FROM "users" WHERE LOWER("${emailColumn}") = LOWER($1) LIMIT 1`,
    [safeEmail]
  );

  return result.rows?.[0] || null;
}

async function findUserById(id) {
  const safeId = normalizeText(id);
  if (!safeId) return null;

  const numericId = Number(safeId);
  if (!Number.isInteger(numericId)) return null;

  const columns = await getUserColumns();
  const idColumn = firstExisting(columns, ['id', 'user_id']);

  if (!idColumn) {
    return null;
  }

  const result = await db.query(
    `SELECT * FROM "users" WHERE "${idColumn}" = $1 LIMIT 1`,
    [numericId]
  );

  return result.rows?.[0] || null;
}

async function verifyPassword(row, inputPassword) {
  const columns = await getUserColumns();
  const passwordColumn = firstExisting(columns, [
    'password_hash',
    'hashed_password',
    'password',
    'pass_hash'
  ]);

  if (!passwordColumn) {
    return false;
  }

  const storedValue = row?.[passwordColumn];
  if (!storedValue) {
    return false;
  }

  const stored = String(storedValue);
  const incoming = String(inputPassword || '');

  if (
    stored.startsWith('$2a$') ||
    stored.startsWith('$2b$') ||
    stored.startsWith('$2y$')
  ) {
    try {
      return await bcrypt.compare(incoming, stored);
    } catch (_error) {
      return false;
    }
  }

  return stored === incoming;
}

router.post('/login', async (req, res) => {
  try {
    const email = normalizeText(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      await writeFailedLoginFromRequest(req, {
        reason: 'MISSING_CREDENTIALS',
        statusCode: 400,
        metadata: {
          hasEmail: Boolean(email),
          hasPassword: Boolean(password)
        }
      });

      return res.status(400).json({
        ok: false,
        message: 'Email and password are required.'
      });
    }

    const userRow = await findUserByEmail(email);

    if (userRow) {
      const passwordOk = await verifyPassword(userRow, password);

      if (!passwordOk) {
        await writeFailedLoginFromRequest(req, {
          reason: 'INVALID_PASSWORD',
          statusCode: 401,
          metadata: {
            email,
            userFound: true
          }
        });

        return res.status(401).json({
          ok: false,
          message: 'Invalid credentials.'
        });
      }

      const user = mapDbUserToAuthUser(userRow);
      const token = signToken(user);

      return res.json({
        ok: true,
        token,
        user
      });
    }

    if (
      isDevAuthAllowed() &&
      email.toLowerCase() === 'admin@raftop.local' &&
      password === 'admin123!'
    ) {
      const user = buildSyntheticAdminUser();
      const token = signToken(user);

      return res.json({
        ok: true,
        token,
        user
      });
    }

    await writeFailedLoginFromRequest(req, {
      reason: 'UNKNOWN_EMAIL_OR_INVALID_DEV_CREDENTIALS',
      statusCode: 401,
      metadata: {
        email,
        userFound: false,
        devAuthAllowed: isDevAuthAllowed()
      }
    });

    return res.status(401).json({
      ok: false,
      message: 'Invalid credentials.'
    });
  } catch (error) {
    await writeFailedLoginFromRequest(req, {
      reason: 'LOGIN_EXCEPTION',
      statusCode: 500,
      metadata: {
        error: error.message || 'Login failed.'
      }
    });

    return res.status(500).json({
      ok: false,
      message: error.message || 'Login failed.'
    });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = readBearerToken(req);
    const decoded = decodeToken(token);

    if (!decoded) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized'
      });
    }

    const decodedEmail = normalizeText(decoded.email);
    const decodedRole = normalizeRole(decoded.role);

    if (decodedEmail === 'admin@raftop.local' && decodedRole === 'tenant_admin') {
      return res.json({
        ok: true,
        user: buildSyntheticAdminUser()
      });
    }

    if (decodedEmail === 'patient@raftop.local' && decodedRole === 'patient') {
      return res.json({
        ok: true,
        user: buildSyntheticPatientUser()
      });
    }

    let userRow = null;

    if (normalizeText(decoded.id || decoded.userId)) {
      userRow = await findUserById(decoded.id || decoded.userId);
    }

    if (!userRow && decodedEmail) {
      userRow = await findUserByEmail(decodedEmail);
    }

    if (!userRow) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized'
      });
    }

    return res.json({
      ok: true,
      user: mapDbUserToAuthUser(userRow)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Session restore failed.'
    });
  }
});

router.post('/logout', async (_req, res) => {
  return res.json({
    ok: true,
    message: 'Logged out'
  });
});

router.post('/dev-patient-login', async (_req, res) => {
  try {
    if (!isDevAuthAllowed()) {
      return res.status(403).json({
        ok: false,
        message: 'Dev patient login is disabled in production.'
      });
    }

    const columns = await getUserColumns();

    const idColumn = firstExisting(columns, ['id', 'user_id']);
    const emailColumn = firstExisting(columns, ['email', 'user_email']);
    const roleColumn = firstExisting(columns, ['role', 'user_role']);

    if (idColumn && emailColumn && roleColumn) {
      const result = await db.query(
        `SELECT * FROM "users" WHERE LOWER("${roleColumn}") = 'patient' ORDER BY "${idColumn}" ASC LIMIT 1`
      );

      const patientRow = result.rows?.[0];

      if (patientRow) {
        const user = mapDbUserToAuthUser(patientRow);
        const token = signToken(user);

        return res.json({
          ok: true,
          token,
          user
        });
      }
    }

    const user = buildSyntheticPatientUser();
    const token = signToken(user);

    return res.json({
      ok: true,
      token,
      user
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Dev patient login failed.'
    });
  }
});

module.exports = router;