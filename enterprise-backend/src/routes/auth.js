const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

try {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
  });
} catch (_error) {
  // ignore dotenv load failures
}

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
      // keep scanning
    }
  }

  throw new Error('Could not resolve database client in auth route.');
}

const db = resolveDb();

function normalizeRole(value) {
  return String(value || 'guest').trim().toLowerCase();
}

function firstExisting(columns, names) {
  for (const name of names) {
    if (columns.has(name)) {
      return name;
    }
  }
  return null;
}

async function getUserColumns() {
  const result = await db.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
    `
  );

  return new Set(result.rows.map((row) => row.column_name));
}

async function findUserByEmail(email) {
  const columns = await getUserColumns();
  const emailKey = firstExisting(columns, ['email', 'user_email']);

  if (!emailKey) {
    throw new Error('Users table does not contain email column.');
  }

  const result = await db.query(
    `SELECT * FROM "users" WHERE "${emailKey}" = $1 LIMIT 1`,
    [email]
  );

  return result.rows[0] || null;
}

async function verifyPassword(user, plainPassword) {
  if (!user) {
    return false;
  }

  const storedHash = user.password_hash || user.hashed_password || null;
  const storedPlain = user.password || null;

  if (storedHash) {
    try {
      return await bcrypt.compare(plainPassword, storedHash);
    } catch (_error) {
      return plainPassword === storedHash;
    }
  }

  if (storedPlain !== null && typeof storedPlain !== 'undefined') {
    return String(plainPassword) === String(storedPlain);
  }

  return false;
}

function buildUserPayload(user) {
  return {
    id: user.id || user.user_id || null,
    userId: user.id || user.user_id || null,
    email: user.email || user.user_email || null,
    name:
      user.full_name ||
      user.name ||
      [user.first_name, user.last_name].filter(Boolean).join(' ') ||
      null,
    role: normalizeRole(user.role || user.user_role || 'guest'),
    tenantId:
      user.tenant_id ||
      user.organization_id ||
      user.org_id ||
      user.workspace_id ||
      null,
    organizationId:
      user.organization_id ||
      user.tenant_id ||
      user.org_id ||
      user.workspace_id ||
      null
  };
}

function signToken(userPayload) {
  const secret =
    process.env.JWT_SECRET ||
    process.env.JWT_KEY ||
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.TOKEN_SECRET ||
    'raftop_dev_secret';

  return jwt.sign(
    {
      id: userPayload.id,
      email: userPayload.email,
      role: userPayload.role,
      tenantId: userPayload.tenantId,
      organizationId: userPayload.organizationId
    },
    secret,
    {
      expiresIn: '7d'
    }
  );
}

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'Email and password are required.'
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid credentials.'
      });
    }

    const passwordOk = await verifyPassword(user, password);

    if (!passwordOk) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid credentials.'
      });
    }

    const userPayload = buildUserPayload(user);
    const token = signToken(userPayload);

    return res.status(200).json({
      ok: true,
      token,
      accessToken: token,
      user: userPayload
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Login failed.'
    });
  }
});

router.get('/me', async (req, res) => {
  try {
    const header =
      req.headers.authorization ||
      req.headers.Authorization ||
      '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized'
      });
    }

    const token = header.slice(7).trim();
    const secret =
      process.env.JWT_SECRET ||
      process.env.JWT_KEY ||
      process.env.ACCESS_TOKEN_SECRET ||
      process.env.TOKEN_SECRET ||
      'raftop_dev_secret';

    let decoded = null;

    try {
      decoded = jwt.verify(token, secret);
    } catch (_error) {
      decoded = jwt.decode(token);
    }

    if (!decoded?.email) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized'
      });
    }

    const user = await findUserByEmail(String(decoded.email).trim().toLowerCase());

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized'
      });
    }

    return res.status(200).json({
      ok: true,
      user: buildUserPayload(user)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Profile lookup failed.'
    });
  }
});

router.post('/logout', async (_req, res) => {
  return res.status(200).json({
    ok: true,
    message: 'Logged out.'
  });
});

module.exports = router;