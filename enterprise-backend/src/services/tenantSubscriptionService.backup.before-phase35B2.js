const db = require('./db');

function getTenantId(req) {
  return (
    req.user?.tenant_id ||
    req.user?.tenantId ||
    req.headers['x-tenant-id'] ||
    req.query.tenant_id ||
    req.query.tenantId ||
    'demo-tenant'
  );
}

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

function calculateAccessStatus(subscription) {
  const now = new Date();

  const status = normalizeStatus(subscription.status);
  const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const currentPeriodEndsAt = subscription.current_period_ends_at
    ? new Date(subscription.current_period_ends_at)
    : null;

  const trialExpired =
    status === 'TRIAL' &&
    trialEndsAt &&
    !Number.isNaN(trialEndsAt.getTime()) &&
    trialEndsAt.getTime() < now.getTime();

  const periodExpired =
    ['ACTIVE', 'PAST_DUE'].includes(status) &&
    currentPeriodEndsAt &&
    !Number.isNaN(currentPeriodEndsAt.getTime()) &&
    currentPeriodEndsAt.getTime() < now.getTime();

  if (['CANCELLED', 'SUSPENDED', 'EXPIRED'].includes(status)) {
    return {
      isAllowed: false,
      accessState: 'LOCKED',
      reason: `Subscription status is ${status}.`
    };
  }

  if (trialExpired) {
    return {
      isAllowed: false,
      accessState: 'TRIAL_EXPIRED',
      reason: 'Trial period has expired.'
    };
  }

  if (periodExpired) {
    return {
      isAllowed: false,
      accessState: 'PERIOD_EXPIRED',
      reason: 'Current billing period has expired.'
    };
  }

  if (status === 'PAST_DUE') {
    return {
      isAllowed: true,
      accessState: 'DEGRADED',
      reason: 'Subscription is past due. Access remains temporarily allowed.'
    };
  }

  return {
    isAllowed: true,
    accessState: 'ACTIVE',
    reason: 'Subscription access is allowed.'
  };
}

async function ensureTenantSubscriptionTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tenant_subscriptions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL UNIQUE,
      plan TEXT NOT NULL DEFAULT 'TRIAL',
      status TEXT NOT NULL DEFAULT 'TRIAL',
      seats INTEGER NOT NULL DEFAULT 5,
      patient_limit INTEGER NOT NULL DEFAULT 100,
      billing_email TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      trial_started_at TIMESTAMPTZ,
      trial_ends_at TIMESTAMPTZ,
      current_period_started_at TIMESTAMPTZ,
      current_period_ends_at TIMESTAMPTZ,
      locked_reason TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'TRIAL';
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'TRIAL';
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS seats INTEGER NOT NULL DEFAULT 5;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS patient_limit INTEGER NOT NULL DEFAULT 100;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS billing_email TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS current_period_started_at TIMESTAMPTZ;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS current_period_ends_at TIMESTAMPTZ;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS locked_reason TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    ALTER TABLE tenant_subscriptions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id
    ON tenant_subscriptions (tenant_id);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status
    ON tenant_subscriptions (status);
  `);
}

async function createDefaultSubscriptionIfMissing(tenantId) {
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

  if (result.rows.length > 0) {
    return result.rows[0];
  }

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
        trial_started_at,
        trial_ends_at,
        current_period_started_at,
        current_period_ends_at,
        metadata
      )
    VALUES
      (
        $1,
        $2,
        'TRIAL',
        'TRIAL',
        5,
        100,
        NOW(),
        NOW() + INTERVAL '14 days',
        NOW(),
        NOW() + INTERVAL '14 days',
        '{"createdBy":"phase22_default_bootstrap"}'::jsonb
      )
    RETURNING *
    `,
    [`sub-${tenantId}-${Date.now()}`, tenantId]
  );

  return insert.rows[0];
}

function toSubscriptionPayload(row) {
  const access = calculateAccessStatus(row);

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
    access
  };
}

async function getTenantSubscriptionStatus(req) {
  const tenantId = getTenantId(req);

  const subscription = await createDefaultSubscriptionIfMissing(tenantId);
  const payload = toSubscriptionPayload(subscription);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.1-saas-subscription-status',
    tenantId,
    subscription: payload,
    generatedAt: new Date().toISOString()
  };
}

async function updateTenantSubscription(req) {
  const tenantId = getTenantId(req);
  const body = req.body || {};

  await createDefaultSubscriptionIfMissing(tenantId);

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

  const payload = toSubscriptionPayload(result.rows[0]);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.1-saas-subscription-status',
    tenantId,
    subscription: payload,
    updatedAt: new Date().toISOString()
  };
}

async function forceSubscriptionStatus(req, status) {
  const tenantId = getTenantId(req);

  await createDefaultSubscriptionIfMissing(tenantId);

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
      normalizeStatus(status),
      `Forced status changed to ${normalizeStatus(status)}.`
    ]
  );

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.1-saas-subscription-status',
    tenantId,
    subscription: toSubscriptionPayload(result.rows[0]),
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  getTenantId,
  ensureTenantSubscriptionTable,
  getTenantSubscriptionStatus,
  updateTenantSubscription,
  forceSubscriptionStatus,
  calculateAccessStatus
};