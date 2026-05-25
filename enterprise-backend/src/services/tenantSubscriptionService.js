const db = require('./db');

const VALID_STATUSES = [
  'ACTIVE',
  'TRIAL',
  'PAST_DUE',
  'EXPIRED',
  'CANCELLED',
  'SUSPENDED'
];

const VALID_PLANS = [
  'FREE',
  'TRIAL',
  'STARTER',
  'PROFESSIONAL',
  'PRO',
  'CLINIC',
  'DISTRIBUTOR',
  'ENTERPRISE'
];

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
  const value = String(status || '').trim().toUpperCase();

  if (VALID_STATUSES.includes(value)) {
    return value;
  }

  return 'TRIAL';
}

function normalizePlan(plan) {
  const value = String(plan || '').trim().toUpperCase();

  if (VALID_PLANS.includes(value)) {
    if (value === 'PRO') return 'PROFESSIONAL';
    return value;
  }

  return 'TRIAL';
}

function bool(value, fallback = false) {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 1) return true;
  if (value === 0) return false;
  return fallback;
}

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPlanDefaults(plan) {
  const normalized = normalizePlan(plan);

  if (normalized === 'ENTERPRISE' || normalized === 'DISTRIBUTOR') {
    return {
      patientLimit: 50000,
      seatLimit: 100,
      atlasEnabled: true,
      actionCenterEnabled: true,
      closedLoopEnabled: true,
      executiveMetricsEnabled: true,
      securityCenterEnabled: true
    };
  }

  if (normalized === 'PROFESSIONAL' || normalized === 'CLINIC') {
    return {
      patientLimit: 1000,
      seatLimit: 20,
      atlasEnabled: true,
      actionCenterEnabled: true,
      closedLoopEnabled: false,
      executiveMetricsEnabled: true,
      securityCenterEnabled: false
    };
  }

  return {
    patientLimit: 100,
    seatLimit: 5,
    atlasEnabled: false,
    actionCenterEnabled: false,
    closedLoopEnabled: false,
    executiveMetricsEnabled: false,
    securityCenterEnabled: false
  };
}

function getTrialEnd(row) {
  return row.trial_end || row.trial_ends_at || null;
}

function getPeriodEnd(row) {
  return row.period_end || row.current_period_ends_at || null;
}

function calculateAccessStatus(subscription) {
  const now = new Date();

  const status = normalizeStatus(subscription.status);
  const trialEndsAtValue = getTrialEnd(subscription);
  const periodEndsAtValue = getPeriodEnd(subscription);

  const trialEndsAt = trialEndsAtValue ? new Date(trialEndsAtValue) : null;
  const currentPeriodEndsAt = periodEndsAtValue ? new Date(periodEndsAtValue) : null;

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
      allowed: false,
      isAllowed: false,
      accessState: 'LOCKED',
      state: 'LOCKED',
      reason: `Subscription status is ${status}.`
    };
  }

  if (trialExpired) {
    return {
      allowed: false,
      isAllowed: false,
      accessState: 'TRIAL_EXPIRED',
      state: 'TRIAL_EXPIRED',
      reason: 'Trial period has expired.'
    };
  }

  if (periodExpired) {
    return {
      allowed: false,
      isAllowed: false,
      accessState: 'PERIOD_EXPIRED',
      state: 'PERIOD_EXPIRED',
      reason: 'Current billing period has expired.'
    };
  }

  if (status === 'PAST_DUE') {
    return {
      allowed: true,
      isAllowed: true,
      accessState: 'DEGRADED',
      state: 'DEGRADED',
      reason: 'Subscription is past due. Access remains temporarily allowed.'
    };
  }

  return {
    allowed: true,
    isAllowed: true,
    accessState: 'ACTIVE',
    state: 'ACTIVE',
    reason: 'Subscription access is allowed.'
  };
}

function calculateLimitState(row) {
  const patientLimit = numberOrZero(row.patient_limit);
  const seatLimit = numberOrZero(row.seat_limit || row.seats);
  const currentPatients = numberOrZero(row.current_patients);
  const currentSeats = numberOrZero(row.current_seats);

  const patientLimitReached =
    patientLimit > 0 && currentPatients >= patientLimit;

  const seatLimitReached =
    seatLimit > 0 && currentSeats >= seatLimit;

  return {
    patientLimit,
    seatLimit,
    currentPatients,
    currentSeats,
    patientLimitReached,
    seatLimitReached,
    patientUsagePercent:
      patientLimit > 0 ? Math.round((currentPatients / patientLimit) * 100) : 0,
    seatUsagePercent:
      seatLimit > 0 ? Math.round((currentSeats / seatLimit) * 100) : 0,
    warnings: [
      patientLimitReached ? 'PATIENT_LIMIT_REACHED' : null,
      seatLimitReached ? 'SEAT_LIMIT_REACHED' : null
    ].filter(Boolean)
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

  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'TRIAL';`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'TRIAL';`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS seats INTEGER NOT NULL DEFAULT 5;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS patient_limit INTEGER NOT NULL DEFAULT 100;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS billing_email TEXT;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS current_period_started_at TIMESTAMPTZ;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS current_period_ends_at TIMESTAMPTZ;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS locked_reason TEXT;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);

  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS seat_limit INTEGER;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS current_patients INTEGER NOT NULL DEFAULT 0;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS current_seats INTEGER NOT NULL DEFAULT 0;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS atlas_enabled BOOLEAN NOT NULL DEFAULT FALSE;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS action_center_enabled BOOLEAN NOT NULL DEFAULT FALSE;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS closed_loop_enabled BOOLEAN NOT NULL DEFAULT FALSE;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS executive_metrics_enabled BOOLEAN NOT NULL DEFAULT FALSE;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS security_center_enabled BOOLEAN NOT NULL DEFAULT FALSE;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;`);
  await db.query(`ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ;`);

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

  const plan = 'TRIAL';
  const defaults = getPlanDefaults(plan);

  const insert = await db.query(
    `
    INSERT INTO tenant_subscriptions
      (
        id,
        tenant_id,
        plan,
        status,
        seats,
        seat_limit,
        patient_limit,
        current_patients,
        current_seats,
        atlas_enabled,
        action_center_enabled,
        closed_loop_enabled,
        executive_metrics_enabled,
        security_center_enabled,
        trial_started_at,
        trial_ends_at,
        trial_end,
        current_period_started_at,
        current_period_ends_at,
        period_end,
        metadata
      )
    VALUES
      (
        $1,
        $2,
        $3,
        'TRIAL',
        $4,
        $4,
        $5,
        0,
        0,
        $6,
        $7,
        $8,
        $9,
        $10,
        NOW(),
        NOW() + INTERVAL '14 days',
        NOW() + INTERVAL '14 days',
        NOW(),
        NOW() + INTERVAL '14 days',
        NOW() + INTERVAL '14 days',
        '{"createdBy":"phase35B_default_bootstrap"}'::jsonb
      )
    RETURNING *
    `,
    [
      `sub-${tenantId}-${Date.now()}`,
      tenantId,
      plan,
      defaults.seatLimit,
      defaults.patientLimit,
      defaults.atlasEnabled,
      defaults.actionCenterEnabled,
      defaults.closedLoopEnabled,
      defaults.executiveMetricsEnabled,
      defaults.securityCenterEnabled
    ]
  );

  return insert.rows[0];
}

function toSubscriptionPayload(row) {
  const plan = normalizePlan(row.plan);
  const status = normalizeStatus(row.status);
  const defaults = getPlanDefaults(plan);
  const access = calculateAccessStatus(row);
  const limits = calculateLimitState(row);

  const modules = {
    atlas: bool(row.atlas_enabled, defaults.atlasEnabled),
    actionCenter: bool(row.action_center_enabled, defaults.actionCenterEnabled),
    closedLoop: bool(row.closed_loop_enabled, defaults.closedLoopEnabled),
    executiveMetrics: bool(row.executive_metrics_enabled, defaults.executiveMetricsEnabled),
    rolloutRoadmap: plan === 'ENTERPRISE' || plan === 'DISTRIBUTOR',
    securityCenter: bool(row.security_center_enabled, defaults.securityCenterEnabled)
  };

  const entitlements = {
    canUseAtlas: modules.atlas,
    canUseActionCenter: modules.actionCenter,
    canUseClosedLoop: modules.closedLoop,
    canUseExecutiveMetrics: modules.executiveMetrics,
    canUseRolloutRoadmap: modules.rolloutRoadmap,
    canUseSecurityCenter: modules.securityCenter,
    canCreatePatients: access.allowed && !limits.patientLimitReached,
    canCreateUsers: access.allowed && !limits.seatLimitReached
  };

  const upgradeRequired =
    !modules.atlas ||
    !modules.actionCenter ||
    !modules.closedLoop ||
    !modules.executiveMetrics ||
    !modules.securityCenter ||
    limits.patientLimitReached ||
    limits.seatLimitReached;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenant_id: row.tenant_id,

    plan,
    status,

    seats: numberOrZero(row.seats || limits.seatLimit),
    seatLimit: limits.seatLimit,
    seat_limit: limits.seatLimit,

    patientLimit: limits.patientLimit,
    patient_limit: limits.patientLimit,

    currentPatients: limits.currentPatients,
    current_patients: limits.currentPatients,
    currentSeats: limits.currentSeats,
    current_seats: limits.currentSeats,

    billingEmail: row.billing_email || null,
    billing_email: row.billing_email || null,

    stripeCustomerId: row.stripe_customer_id || null,
    stripe_customer_id: row.stripe_customer_id || null,

    stripeSubscriptionId: row.stripe_subscription_id || null,
    stripe_subscription_id: row.stripe_subscription_id || null,

    trialStartedAt: row.trial_started_at || null,
    trial_started_at: row.trial_started_at || null,

    trialEndsAt: getTrialEnd(row),
    trial_ends_at: getTrialEnd(row),

    currentPeriodStartedAt: row.current_period_started_at || null,
    current_period_started_at: row.current_period_started_at || null,

    currentPeriodEndsAt: getPeriodEnd(row),
    current_period_ends_at: getPeriodEnd(row),

    lockedReason: row.locked_reason || null,
    locked_reason: row.locked_reason || null,

    metadata: row.metadata || {},

    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,

    modules,
    entitlements,
    limits,

    upgradeRequired,
    upgrade_required: upgradeRequired,

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
    phase: '35B.2-saas-subscription-status-hardening',
    tenantId,
    tenant_id: tenantId,
    subscription: payload,
    modules: payload.modules,
    entitlements: payload.entitlements,
    access: payload.access,
    limits: payload.limits,
    generatedAt: new Date().toISOString()
  };
}

async function updateTenantSubscription(req) {
  const tenantId = getTenantId(req);
  const body = req.body || {};

  await createDefaultSubscriptionIfMissing(tenantId);

  const plan = body.plan ? normalizePlan(body.plan) : null;
  const defaults = plan ? getPlanDefaults(plan) : null;

  const result = await db.query(
    `
    UPDATE tenant_subscriptions
    SET
      plan = COALESCE($2, plan),
      status = COALESCE($3, status),
      seats = COALESCE($4, seats),
      seat_limit = COALESCE($5, seat_limit),
      patient_limit = COALESCE($6, patient_limit),
      current_patients = COALESCE($7, current_patients),
      current_seats = COALESCE($8, current_seats),
      atlas_enabled = COALESCE($9, atlas_enabled),
      action_center_enabled = COALESCE($10, action_center_enabled),
      closed_loop_enabled = COALESCE($11, closed_loop_enabled),
      executive_metrics_enabled = COALESCE($12, executive_metrics_enabled),
      security_center_enabled = COALESCE($13, security_center_enabled),
      billing_email = COALESCE($14, billing_email),
      stripe_customer_id = COALESCE($15, stripe_customer_id),
      stripe_subscription_id = COALESCE($16, stripe_subscription_id),
      trial_ends_at = COALESCE($17, trial_ends_at),
      trial_end = COALESCE($17, trial_end),
      current_period_ends_at = COALESCE($18, current_period_ends_at),
      period_end = COALESCE($18, period_end),
      locked_reason = COALESCE($19, locked_reason),
      metadata = COALESCE($20::jsonb, metadata),
      updated_at = NOW()
    WHERE tenant_id = $1
    RETURNING *
    `,
    [
      tenantId,
      plan,
      body.status ? normalizeStatus(body.status) : null,
      Number.isFinite(Number(body.seats)) ? Number(body.seats) : null,
      Number.isFinite(Number(body.seatLimit || body.seat_limit))
        ? Number(body.seatLimit || body.seat_limit)
        : defaults?.seatLimit || null,
      Number.isFinite(Number(body.patientLimit || body.patient_limit))
        ? Number(body.patientLimit || body.patient_limit)
        : defaults?.patientLimit || null,
      Number.isFinite(Number(body.currentPatients || body.current_patients))
        ? Number(body.currentPatients || body.current_patients)
        : null,
      Number.isFinite(Number(body.currentSeats || body.current_seats))
        ? Number(body.currentSeats || body.current_seats)
        : null,
      typeof body.atlasEnabled === 'boolean'
        ? body.atlasEnabled
        : typeof body.atlas_enabled === 'boolean'
          ? body.atlas_enabled
          : defaults?.atlasEnabled ?? null,
      typeof body.actionCenterEnabled === 'boolean'
        ? body.actionCenterEnabled
        : typeof body.action_center_enabled === 'boolean'
          ? body.action_center_enabled
          : defaults?.actionCenterEnabled ?? null,
      typeof body.closedLoopEnabled === 'boolean'
        ? body.closedLoopEnabled
        : typeof body.closed_loop_enabled === 'boolean'
          ? body.closed_loop_enabled
          : defaults?.closedLoopEnabled ?? null,
      typeof body.executiveMetricsEnabled === 'boolean'
        ? body.executiveMetricsEnabled
        : typeof body.executive_metrics_enabled === 'boolean'
          ? body.executive_metrics_enabled
          : defaults?.executiveMetricsEnabled ?? null,
      typeof body.securityCenterEnabled === 'boolean'
        ? body.securityCenterEnabled
        : typeof body.security_center_enabled === 'boolean'
          ? body.security_center_enabled
          : defaults?.securityCenterEnabled ?? null,
      body.billingEmail || body.billing_email || null,
      body.stripeCustomerId || body.stripe_customer_id || null,
      body.stripeSubscriptionId || body.stripe_subscription_id || null,
      body.trialEndsAt || body.trial_ends_at || body.trial_end || null,
      body.currentPeriodEndsAt || body.current_period_ends_at || body.period_end || null,
      body.lockedReason || body.locked_reason || null,
      body.metadata ? JSON.stringify(body.metadata) : null
    ]
  );

  const payload = toSubscriptionPayload(result.rows[0]);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '35B.2-saas-subscription-status-hardening',
    tenantId,
    tenant_id: tenantId,
    subscription: payload,
    modules: payload.modules,
    entitlements: payload.entitlements,
    access: payload.access,
    limits: payload.limits,
    updatedAt: new Date().toISOString()
  };
}

async function forceSubscriptionStatus(req, status) {
  const tenantId = getTenantId(req);

  await createDefaultSubscriptionIfMissing(tenantId);

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
      `Forced status changed to ${normalizedStatus}.`
    ]
  );

  const payload = toSubscriptionPayload(result.rows[0]);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '35B.2-saas-subscription-status-hardening',
    tenantId,
    tenant_id: tenantId,
    subscription: payload,
    modules: payload.modules,
    entitlements: payload.entitlements,
    access: payload.access,
    limits: payload.limits,
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