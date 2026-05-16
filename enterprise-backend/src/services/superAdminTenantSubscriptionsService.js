const db = require('./db');

const {
  ensureTenantSubscriptionTable,
  calculateAccessStatus
} = require('./tenantSubscriptionService');

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase();

  if (['ACTIVE', 'TRIAL', 'PAST_DUE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'].includes(value)) {
    return value;
  }

  return 'TRIAL';
}

function normalizePlan(plan) {
  const value = String(plan || '').toUpperCase();

  if (['FREE', 'TRIAL', 'PRO', 'CLINIC', 'DISTRIBUTOR', 'ENTERPRISE'].includes(value)) {
    return value;
  }

  return 'TRIAL';
}

function normalizeTenantId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toSafeInteger(value, fallback, min, max) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(parsed), min), max);
}

async function tableExists(tableName) {
  const result = await db.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS exists
    `,
    [tableName]
  );

  return result.rows[0]?.exists === true;
}

async function getColumns(tableName) {
  const result = await db.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    `,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

async function countRowsByTenant(tableName, tenantId) {
  const exists = await tableExists(tableName);

  if (!exists) {
    return {
      table: tableName,
      exists: false,
      count: 0,
      reason: 'TABLE_NOT_FOUND'
    };
  }

  const columns = await getColumns(tableName);

  if (!columns.includes('tenant_id')) {
    return {
      table: tableName,
      exists: true,
      count: 0,
      reason: 'TENANT_ID_COLUMN_NOT_FOUND'
    };
  }

  const result = await db.query(
    `
    SELECT COUNT(*)::int AS count
    FROM ${tableName}
    WHERE tenant_id::text = $1
    `,
    [tenantId]
  );

  return {
    table: tableName,
    exists: true,
    count: Number(result.rows[0]?.count || 0),
    reason: 'OK'
  };
}

async function countDistinctPatientsFromSignals(tenantId) {
  const exists = await tableExists('patient_signals');

  if (!exists) {
    return {
      table: 'patient_signals',
      exists: false,
      count: 0,
      reason: 'TABLE_NOT_FOUND'
    };
  }

  const columns = await getColumns('patient_signals');

  if (!columns.includes('tenant_id')) {
    return {
      table: 'patient_signals',
      exists: true,
      count: 0,
      reason: 'TENANT_ID_COLUMN_NOT_FOUND'
    };
  }

  if (!columns.includes('patient_id')) {
    return {
      table: 'patient_signals',
      exists: true,
      count: 0,
      reason: 'PATIENT_ID_COLUMN_NOT_FOUND'
    };
  }

  const result = await db.query(
    `
    SELECT COUNT(DISTINCT patient_id)::int AS count
    FROM patient_signals
    WHERE tenant_id::text = $1
      AND patient_id IS NOT NULL
      AND patient_id::text <> ''
    `,
    [tenantId]
  );

  return {
    table: 'patient_signals',
    exists: true,
    count: Number(result.rows[0]?.count || 0),
    reason: 'OK_DISTINCT_PATIENT_ID'
  };
}

async function countPatientsForTenant(tenantId) {
  const patients = await countRowsByTenant('patients', tenantId);

  if (patients.exists && patients.reason === 'OK') {
    return {
      used: patients.count,
      source: 'patients'
    };
  }

  const tenantPatients = await countRowsByTenant('tenant_patients', tenantId);

  if (tenantPatients.exists && tenantPatients.reason === 'OK') {
    return {
      used: tenantPatients.count,
      source: 'tenant_patients'
    };
  }

  const signalPatients = await countDistinctPatientsFromSignals(tenantId);

  return {
    used: signalPatients.count,
    source:
      signalPatients.reason === 'OK_DISTINCT_PATIENT_ID'
        ? 'patient_signals_distinct_patient_id'
        : 'none'
  };
}

async function countUsersForTenant(tenantId) {
  const tenantUsers = await countRowsByTenant('tenant_users', tenantId);

  if (tenantUsers.exists && tenantUsers.reason === 'OK') {
    return {
      used: tenantUsers.count,
      source: 'tenant_users'
    };
  }

  const users = await countRowsByTenant('users', tenantId);

  if (users.exists && users.reason === 'OK') {
    return {
      used: users.count,
      source: 'users'
    };
  }

  return {
    used: 0,
    source: 'none'
  };
}

function calculatePercentage(used, limit) {
  const safeUsed = Number(used || 0);
  const safeLimit = Number(limit || 0);

  if (safeLimit <= 0) {
    return safeUsed > 0 ? 100 : 0;
  }

  return Math.round((safeUsed / safeLimit) * 100);
}

function buildLimitState(used, limit) {
  const percentage = calculatePercentage(used, limit);

  if (Number(used || 0) > Number(limit || 0)) {
    return {
      percentage,
      state: 'LIMIT_EXCEEDED',
      exceeded: true,
      warning: true
    };
  }

  if (percentage >= 80) {
    return {
      percentage,
      state: 'WARNING',
      exceeded: false,
      warning: true
    };
  }

  return {
    percentage,
    state: 'OK',
    exceeded: false,
    warning: false
  };
}

function normalizeSubscriptionRow(row, usage = null) {
  const access = calculateAccessStatus(row);

  const patientsUsed = Number(usage?.patients?.used || 0);
  const usersUsed = Number(usage?.users?.used || 0);

  const patientLimit = Number(row.patient_limit || 0);
  const seatLimit = Number(row.seats || 0);

  const patientState = buildLimitState(patientsUsed, patientLimit);
  const seatState = buildLimitState(usersUsed, seatLimit);

  const usageState =
    patientState.exceeded || seatState.exceeded
      ? 'LIMIT_EXCEEDED'
      : patientState.warning || seatState.warning
        ? 'WARNING'
        : 'OK';

  return {
    id: row.id,
    tenantId: row.tenant_id,
    plan: normalizePlan(row.plan),
    status: normalizeStatus(row.status),
    seats: Number(row.seats || 0),
    patientLimit: Number(row.patient_limit || 0),
    billingEmail: row.billing_email || null,
    stripeCustomerId: row.stripe_customer_id || null,
    stripeSubscriptionId: row.stripe_subscription_id || null,
    trialStartedAt: row.trial_started_at || null,
    trialEndsAt: row.trial_ends_at || null,
    currentPeriodStartedAt: row.current_period_started_at || null,
    currentPeriodEndsAt: row.current_period_ends_at || null,
    lockedReason: row.locked_reason || null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    access,
    usage: usage || {
      patients: {
        used: 0,
        source: 'not_loaded'
      },
      users: {
        used: 0,
        source: 'not_loaded'
      }
    },
    limits: {
      usageState,
      patientLimit: {
        used: patientsUsed,
        limit: patientLimit,
        source: usage?.patients?.source || 'not_loaded',
        ...patientState
      },
      seatLimit: {
        used: usersUsed,
        limit: seatLimit,
        source: usage?.users?.source || 'not_loaded',
        ...seatState
      }
    }
  };
}

async function getUsageForTenant(tenantId) {
  const patients = await countPatientsForTenant(tenantId);
  const users = await countUsersForTenant(tenantId);

  return {
    patients,
    users
  };
}

async function getAllTenantSubscriptions() {
  await ensureTenantSubscriptionTable();

  const result = await db.query(`
    SELECT *
    FROM tenant_subscriptions
    ORDER BY updated_at DESC, created_at DESC
  `);

  const subscriptions = [];

  for (const row of result.rows) {
    const usage = await getUsageForTenant(row.tenant_id);
    subscriptions.push(normalizeSubscriptionRow(row, usage));
  }

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((item) => item.status === 'ACTIVE').length,
    trial: subscriptions.filter((item) => item.status === 'TRIAL').length,
    pastDue: subscriptions.filter((item) => item.status === 'PAST_DUE').length,
    expired: subscriptions.filter((item) => item.status === 'EXPIRED').length,
    suspended: subscriptions.filter((item) => item.status === 'SUSPENDED').length,
    cancelled: subscriptions.filter((item) => item.status === 'CANCELLED').length,
    locked: subscriptions.filter((item) => item.access?.isAllowed === false).length,
    limitExceeded: subscriptions.filter((item) => item.limits?.usageState === 'LIMIT_EXCEEDED').length,
    warning: subscriptions.filter((item) => item.limits?.usageState === 'WARNING').length
  };

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.12-super-admin-tenant-provisioning',
    stats,
    subscriptions,
    generatedAt: new Date().toISOString()
  };
}

async function getTenantSubscriptionByTenantId(tenantId) {
  await ensureTenantSubscriptionTable();

  const result = await db.query(
    `
    SELECT *
    FROM tenant_subscriptions
    WHERE tenant_id = $1
    LIMIT 1
    `,
    [tenantId]
  );

  if (result.rows.length === 0) {
    return {
      ok: false,
      fallback: false,
      error: 'TENANT_SUBSCRIPTION_NOT_FOUND',
      message: 'Tenant subscription was not found.',
      tenantId
    };
  }

  const usage = await getUsageForTenant(tenantId);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.12-super-admin-tenant-provisioning',
    tenantId,
    subscription: normalizeSubscriptionRow(result.rows[0], usage),
    generatedAt: new Date().toISOString()
  };
}

async function createTenantSubscription(body = {}) {
  await ensureTenantSubscriptionTable();

  const tenantId = normalizeTenantId(body.tenantId || body.tenant_id);

  if (!tenantId) {
    return {
      ok: false,
      fallback: false,
      error: 'TENANT_ID_REQUIRED',
      message: 'tenantId is required.'
    };
  }

  const existing = await db.query(
    `
    SELECT tenant_id
    FROM tenant_subscriptions
    WHERE tenant_id = $1
    LIMIT 1
    `,
    [tenantId]
  );

  if (existing.rows.length > 0) {
    return {
      ok: false,
      fallback: false,
      error: 'TENANT_ALREADY_EXISTS',
      message: `Tenant subscription already exists for ${tenantId}.`,
      tenantId
    };
  }

  const plan = normalizePlan(body.plan || 'TRIAL');
  const status = normalizeStatus(body.status || 'TRIAL');
  const seats = toSafeInteger(body.seats, 5, 0, 100000);
  const patientLimit = toSafeInteger(body.patientLimit || body.patient_limit, 100, 0, 10000000);
  const billingEmail = body.billingEmail || body.billing_email || null;

  const trialDays = toSafeInteger(body.trialDays || body.trial_days, 14, 0, 3650);
  const periodDays = toSafeInteger(body.periodDays || body.period_days, 30, 1, 3650);

  const insert = await db.query(
    `
    INSERT INTO tenant_subscriptions
      (
        id,
        tenant_id,
        plan,
        status,
        seats,
        patient_limit,
        billing_email,
        trial_started_at,
        trial_ends_at,
        current_period_started_at,
        current_period_ends_at,
        locked_reason,
        metadata,
        created_at,
        updated_at
      )
    VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        NOW(),
        NOW() + ($8::text || ' days')::interval,
        NOW(),
        NOW() + ($9::text || ' days')::interval,
        CASE
          WHEN $4 IN ('EXPIRED', 'CANCELLED', 'SUSPENDED') THEN $10
          ELSE null
        END,
        $11::jsonb,
        NOW(),
        NOW()
      )
    RETURNING *
    `,
    [
      `sub-${tenantId}-${Date.now()}`,
      tenantId,
      plan,
      status,
      seats,
      patientLimit,
      billingEmail,
      trialDays,
      periodDays,
      `Created as ${status} by super admin.`,
      JSON.stringify({
        createdBy: 'phase22_12_super_admin_provisioning',
        createdFrom: 'super_admin_console'
      })
    ]
  );

  const usage = await getUsageForTenant(tenantId);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.12-super-admin-tenant-provisioning',
    tenantId,
    subscription: normalizeSubscriptionRow(insert.rows[0], usage),
    createdAt: new Date().toISOString()
  };
}

async function updateTenantSubscriptionByTenantId(tenantId, body = {}) {
  await ensureTenantSubscriptionTable();

  const result = await db.query(
    `
    UPDATE tenant_subscriptions
    SET
      plan = COALESCE($2, plan),
      status = COALESCE($3, status),
      seats = COALESCE($4, seats),
      patient_limit = COALESCE($5, patient_limit),
      billing_email = COALESCE($6, billing_email),
      stripe_customer_id = COALESCE($7, stripe_customer_id),
      stripe_subscription_id = COALESCE($8, stripe_subscription_id),
      trial_ends_at = COALESCE($9, trial_ends_at),
      current_period_ends_at = COALESCE($10, current_period_ends_at),
      locked_reason = COALESCE($11, locked_reason),
      metadata = COALESCE($12::jsonb, metadata),
      updated_at = NOW()
    WHERE tenant_id = $1
    RETURNING *
    `,
    [
      tenantId,
      body.plan ? normalizePlan(body.plan) : null,
      body.status ? normalizeStatus(body.status) : null,
      Number.isFinite(Number(body.seats)) ? Number(body.seats) : null,
      Number.isFinite(Number(body.patientLimit || body.patient_limit))
        ? Number(body.patientLimit || body.patient_limit)
        : null,
      body.billingEmail || body.billing_email || null,
      body.stripeCustomerId || body.stripe_customer_id || null,
      body.stripeSubscriptionId || body.stripe_subscription_id || null,
      body.trialEndsAt || body.trial_ends_at || null,
      body.currentPeriodEndsAt || body.current_period_ends_at || null,
      body.lockedReason || body.locked_reason || null,
      body.metadata ? JSON.stringify(body.metadata) : null
    ]
  );

  if (result.rows.length === 0) {
    return {
      ok: false,
      fallback: false,
      error: 'TENANT_SUBSCRIPTION_NOT_FOUND',
      message: 'Tenant subscription was not found.',
      tenantId
    };
  }

  const usage = await getUsageForTenant(tenantId);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.12-super-admin-tenant-provisioning',
    tenantId,
    subscription: normalizeSubscriptionRow(result.rows[0], usage),
    updatedAt: new Date().toISOString()
  };
}

async function forceTenantSubscriptionStatus(tenantId, status) {
  const normalizedStatus = normalizeStatus(status);

  const result = await db.query(
    `
    UPDATE tenant_subscriptions
    SET
      status = $2,
      locked_reason = CASE
        WHEN $2 IN ('EXPIRED', 'CANCELLED', 'SUSPENDED') THEN $3
        ELSE null
      END,
      updated_at = NOW()
    WHERE tenant_id = $1
    RETURNING *
    `,
    [
      tenantId,
      normalizedStatus,
      `Super admin forced status changed to ${normalizedStatus}.`
    ]
  );

  if (result.rows.length === 0) {
    return {
      ok: false,
      fallback: false,
      error: 'TENANT_SUBSCRIPTION_NOT_FOUND',
      message: 'Tenant subscription was not found.',
      tenantId
    };
  }

  const usage = await getUsageForTenant(tenantId);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.12-super-admin-tenant-provisioning',
    tenantId,
    subscription: normalizeSubscriptionRow(result.rows[0], usage),
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  getAllTenantSubscriptions,
  getTenantSubscriptionByTenantId,
  createTenantSubscription,
  updateTenantSubscriptionByTenantId,
  forceTenantSubscriptionStatus
};