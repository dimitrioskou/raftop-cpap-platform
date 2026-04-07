const path = require('path');
const { performance } = require('node:perf_hooks');

try {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
  });
} catch (_error) {
  // ignore dotenv load failures
}

let cachedDb = null;

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

  throw new Error(
    'Database module not found. Update resolveDb() candidates in liveVerificationService.js.'
  );
}

function getDb() {
  if (!cachedDb) {
    cachedDb = resolveDb();
  }
  return cachedDb;
}

async function query(text, params = []) {
  const db = getDb();
  return db.query(text, params);
}

const TABLE_GROUPS = {
  tenant: ['organizations', 'tenants'],
  users: ['users'],
  patients: ['patients'],
  devices: ['devices'],
  tasks: ['tasks'],
  notes: ['notes'],
  referrals: ['referrals'],
  doctorSubscriptions: ['doctor_subscriptions'],
  payments: ['payments', 'payment_transactions'],
  revenue: ['revenue_events', 'revenues', 'revenue'],
  atlasAlerts: ['atlas_alerts'],
  atlasTasks: ['atlas_tasks', 'action_tasks']
};

function pickTable(tableSet, candidates = []) {
  for (const name of candidates) {
    if (tableSet.has(name)) {
      return name;
    }
  }
  return null;
}

async function listTables() {
  const result = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  return new Set(result.rows.map((row) => row.table_name));
}

async function countRows(tableName) {
  if (!tableName) {
    return 0;
  }

  const result = await query(`SELECT COUNT(*)::int AS count FROM "${tableName}"`);
  return result.rows[0]?.count || 0;
}

function hasAnyEnv(names) {
  return names.some((name) => {
    const value = process.env[name];
    return typeof value === 'string' && value.trim() !== '';
  });
}

function hasDiscreteDbEnv() {
  const host = process.env.PGHOST || process.env.DB_HOST;
  const database = process.env.PGDATABASE || process.env.DB_NAME;
  const user = process.env.PGUSER || process.env.DB_USER;

  return Boolean(
    typeof host === 'string' &&
      host.trim() &&
      typeof database === 'string' &&
      database.trim() &&
      typeof user === 'string' &&
      user.trim()
  );
}

async function buildLiveVerificationReport() {
  const startedAt = performance.now();

  const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrlConfigured: hasAnyEnv(['DATABASE_URL']) || hasDiscreteDbEnv(),
    jwtSecretConfigured: hasAnyEnv([
      'JWT_SECRET',
      'JWT_KEY',
      'ACCESS_TOKEN_SECRET',
      'TOKEN_SECRET'
    ]),
    frontendUrlConfigured: hasAnyEnv([
      'FRONTEND_URL',
      'CLIENT_URL',
      'APP_URL',
      'CORS_ORIGIN'
    ]),
    stripeSecretConfigured: hasAnyEnv([
      'STRIPE_SECRET_KEY',
      'STRIPE_SECRET',
      'STRIPE_API_KEY'
    ]),
    stripePublishableConfigured: hasAnyEnv([
      'STRIPE_PUBLISHABLE_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ])
  };

  let dbLatencyMs = null;
  let dbConnected = false;
  let dbError = null;
  let tableSet = new Set();

  try {
    const dbStartedAt = performance.now();
    await query('SELECT 1');
    dbLatencyMs = Number((performance.now() - dbStartedAt).toFixed(2));
    dbConnected = true;
  } catch (error) {
    dbConnected = false;
    dbError = error.message;
  }

  if (dbConnected) {
    tableSet = await listTables();
  }

  const resolvedTables = {};
  for (const [logicalName, candidates] of Object.entries(TABLE_GROUPS)) {
    resolvedTables[logicalName] = pickTable(tableSet, candidates);
  }

  const counts = {};
  for (const [logicalName, tableName] of Object.entries(resolvedTables)) {
    counts[logicalName] = tableName ? await countRows(tableName) : 0;
  }

  const missingLogicalTables = Object.entries(resolvedTables)
    .filter(([, tableName]) => !tableName)
    .map(([logicalName]) => logicalName);

  const missingCriticalTables = ['tenant', 'users', 'patients', 'devices', 'doctorSubscriptions']
    .filter((name) => !resolvedTables[name]);

  return {
    ok:
      env.databaseUrlConfigured &&
      dbConnected &&
      env.jwtSecretConfigured &&
      missingCriticalTables.length === 0,
    generatedAt: new Date().toISOString(),
    runtimeMs: Number((performance.now() - startedAt).toFixed(2)),
    environment: env,
    database: {
      connected: dbConnected,
      latencyMs: dbLatencyMs,
      error: dbError,
      tables: resolvedTables,
      counts,
      missingLogicalTables,
      missingCriticalTables
    },
    auth: {
      configured: env.jwtSecretConfigured,
      usersSeeded: counts.users > 0
    },
    monetization: {
      doctorSubscriptionsTable: Boolean(resolvedTables.doctorSubscriptions),
      doctorSubscriptionsSeeded: counts.doctorSubscriptions > 0,
      paymentsTable: Boolean(resolvedTables.payments),
      revenueTable: Boolean(resolvedTables.revenue)
    },
    atlas: {
      alertsTable: resolvedTables.atlasAlerts,
      tasksTable: resolvedTables.atlasTasks,
      atlasDataPresent: counts.atlasAlerts > 0 || counts.atlasTasks > 0
    },
    nextChecks: [
      'GET /api/health',
      'GET /api/system/live-verification',
      'GET /api/tenant/subscription/status'
    ]
  };
}

module.exports = {
  buildLiveVerificationReport,
  countRows,
  listTables,
  pickTable,
  query,
  resolveDb,
  TABLE_GROUPS
};