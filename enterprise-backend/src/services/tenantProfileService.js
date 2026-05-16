const db = require('./db');

function normalizeTenantId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getTenantId(req) {
  return normalizeTenantId(
    req.headers['x-tenant-id'] ||
      req.headers['x-tenant'] ||
      req.query.tenantId ||
      req.body?.tenantId ||
      req.body?.tenant_id ||
      'demo-tenant'
  );
}

function normalizeProfileRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    displayName: row.display_name,
    legalName: row.legal_name,
    brandName: row.brand_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    supportEmail: row.support_email,
    billingEmail: row.billing_email,
    phone: row.phone,
    country: row.country,
    city: row.city,
    website: row.website,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    resellerType: row.reseller_type,
    isDistributor: row.is_distributor === true,
    notes: row.notes,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function cleanText(value, fallback = null) {
  if (value === undefined || value === null) return fallback;

  const text = String(value).trim();

  return text.length > 0 ? text : fallback;
}

function cleanColor(value, fallback) {
  const text = cleanText(value, fallback);

  if (!text) return fallback;

  if (/^#[0-9A-Fa-f]{6}$/.test(text)) {
    return text;
  }

  return fallback;
}

function cleanBoolean(value, fallback = false) {
  if (value === true) return true;
  if (value === false) return false;

  const text = String(value || '').toLowerCase();

  if (['true', '1', 'yes', 'y'].includes(text)) return true;
  if (['false', '0', 'no', 'n'].includes(text)) return false;

  return fallback;
}

function cleanResellerType(value) {
  const normalized = String(value || 'DIRECT')
    .trim()
    .toUpperCase();

  if (['DIRECT', 'RESELLER', 'DISTRIBUTOR', 'WHITE_LABEL', 'ENTERPRISE'].includes(normalized)) {
    return normalized;
  }

  return 'DIRECT';
}

function guessDisplayNameFromTenantId(tenantId) {
  const normalized = normalizeTenantId(tenantId);

  if (!normalized) return 'Tenant';

  return normalized
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferProfileDefaultsFromSubscription(subscription) {
  const tenantId = normalizeTenantId(subscription.tenant_id);
  const plan = String(subscription.plan || 'TRIAL').toUpperCase();
  const billingEmail = cleanText(subscription.billing_email);

  const displayName = guessDisplayNameFromTenantId(tenantId);
  const brandName = displayName;

  const isDistributor = ['DISTRIBUTOR', 'ENTERPRISE'].includes(plan);

  let resellerType = 'DIRECT';

  if (plan === 'DISTRIBUTOR') {
    resellerType = 'DISTRIBUTOR';
  } else if (plan === 'ENTERPRISE') {
    resellerType = 'ENTERPRISE';
  } else if (plan === 'CLINIC' || plan === 'PRO') {
    resellerType = 'DIRECT';
  }

  return {
    tenantId,
    displayName,
    legalName: displayName,
    brandName,
    contactName: null,
    contactEmail: null,
    supportEmail: billingEmail,
    billingEmail,
    phone: null,
    country: 'Greece',
    city: null,
    website: null,
    logoUrl: null,
    primaryColor: '#1d4ed8',
    secondaryColor: '#0f172a',
    resellerType,
    isDistributor,
    notes: `Auto-created from tenant_subscriptions. Plan: ${plan}.`,
    metadata: {
      createdBy: 'phase22_17B_auto_backfill_from_subscription',
      sourcePlan: plan,
      sourceSubscriptionId: subscription.id || null
    }
  };
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

async function ensureTenantProfilesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tenant_profiles (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      legal_name TEXT,
      brand_name TEXT,
      contact_name TEXT,
      contact_email TEXT,
      support_email TEXT,
      billing_email TEXT,
      phone TEXT,
      country TEXT,
      city TEXT,
      website TEXT,
      logo_url TEXT,
      primary_color TEXT NOT NULL DEFAULT '#1d4ed8',
      secondary_color TEXT NOT NULL DEFAULT '#0f172a',
      reseller_type TEXT NOT NULL DEFAULT 'DIRECT',
      is_distributor BOOLEAN NOT NULL DEFAULT false,
      notes TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS id TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS tenant_id TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS display_name TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS legal_name TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS brand_name TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS contact_name TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS contact_email TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS support_email TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS billing_email TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS phone TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS country TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS city TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS website TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS logo_url TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#1d4ed8';
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS secondary_color TEXT NOT NULL DEFAULT '#0f172a';
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS reseller_type TEXT NOT NULL DEFAULT 'DIRECT';
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS is_distributor BOOLEAN NOT NULL DEFAULT false;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS notes TEXT;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    ALTER TABLE tenant_profiles
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await db.query(`
    UPDATE tenant_profiles
    SET id = 'profile-' || tenant_id
    WHERE id IS NULL;
  `);

  await db.query(`
    UPDATE tenant_profiles
    SET display_name = tenant_id
    WHERE display_name IS NULL OR display_name = '';
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_profiles_tenant_id_unique
    ON tenant_profiles (tenant_id);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_profiles_reseller_type
    ON tenant_profiles (reseller_type);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_profiles_updated_at
    ON tenant_profiles (updated_at DESC);
  `);
}

async function getTenantProfileByTenantId(tenantId) {
  await ensureTenantProfilesTable();

  const normalizedTenantId = normalizeTenantId(tenantId);

  const result = await db.query(
    `
    SELECT *
    FROM tenant_profiles
    WHERE tenant_id = $1
    LIMIT 1
    `,
    [normalizedTenantId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return normalizeProfileRow(result.rows[0]);
}

async function createDefaultTenantProfile(tenantId, overrides = {}) {
  await ensureTenantProfilesTable();

  const normalizedTenantId = normalizeTenantId(tenantId);

  if (!normalizedTenantId) {
    return {
      ok: false,
      fallback: false,
      error: 'TENANT_ID_REQUIRED',
      message: 'tenantId is required.'
    };
  }

  const existing = await getTenantProfileByTenantId(normalizedTenantId);

  if (existing) {
    return {
      ok: true,
      fallback: false,
      source: 'database',
      phase: '22.17B-tenant-profile-auto-backfill',
      created: false,
      tenantId: normalizedTenantId,
      profile: existing
    };
  }

  const displayName =
    cleanText(overrides.displayName || overrides.display_name) ||
    guessDisplayNameFromTenantId(normalizedTenantId);

  const brandName =
    cleanText(overrides.brandName || overrides.brand_name) ||
    displayName;

  const result = await db.query(
    `
    INSERT INTO tenant_profiles
      (
        id,
        tenant_id,
        display_name,
        legal_name,
        brand_name,
        contact_name,
        contact_email,
        support_email,
        billing_email,
        phone,
        country,
        city,
        website,
        logo_url,
        primary_color,
        secondary_color,
        reseller_type,
        is_distributor,
        notes,
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
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19,
        $20::jsonb,
        NOW(),
        NOW()
      )
    RETURNING *
    `,
    [
      `profile-${normalizedTenantId}-${Date.now()}`,
      normalizedTenantId,
      displayName,
      cleanText(overrides.legalName || overrides.legal_name, displayName),
      brandName,
      cleanText(overrides.contactName || overrides.contact_name),
      cleanText(overrides.contactEmail || overrides.contact_email),
      cleanText(overrides.supportEmail || overrides.support_email),
      cleanText(overrides.billingEmail || overrides.billing_email),
      cleanText(overrides.phone),
      cleanText(overrides.country, 'Greece'),
      cleanText(overrides.city),
      cleanText(overrides.website),
      cleanText(overrides.logoUrl || overrides.logo_url),
      cleanColor(overrides.primaryColor || overrides.primary_color, '#1d4ed8'),
      cleanColor(overrides.secondaryColor || overrides.secondary_color, '#0f172a'),
      cleanResellerType(overrides.resellerType || overrides.reseller_type),
      cleanBoolean(overrides.isDistributor || overrides.is_distributor, false),
      cleanText(overrides.notes),
      JSON.stringify({
        createdBy: 'phase22_17B_tenant_profile_auto_backfill',
        createdFrom: 'profile_service',
        ...(overrides.metadata || {})
      })
    ]
  );

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.17B-tenant-profile-auto-backfill',
    created: true,
    tenantId: normalizedTenantId,
    profile: normalizeProfileRow(result.rows[0])
  };
}

async function getTenantSubscriptionsForProfileBackfill() {
  const subscriptionsTableExists = await tableExists('tenant_subscriptions');

  if (!subscriptionsTableExists) {
    return [];
  }

  const result = await db.query(`
    SELECT
      id,
      tenant_id,
      plan,
      status,
      billing_email,
      seats,
      patient_limit,
      created_at,
      updated_at
    FROM tenant_subscriptions
    WHERE tenant_id IS NOT NULL
      AND tenant_id::text <> ''
    ORDER BY updated_at DESC, created_at DESC
  `);

  return result.rows;
}

async function backfillTenantProfilesFromSubscriptions() {
  await ensureTenantProfilesTable();

  const subscriptions = await getTenantSubscriptionsForProfileBackfill();

  if (subscriptions.length === 0) {
    return {
      checked: 0,
      created: 0,
      skipped: 0,
      missing: []
    };
  }

  let created = 0;
  let skipped = 0;
  const missing = [];

  for (const subscription of subscriptions) {
    const tenantId = normalizeTenantId(subscription.tenant_id);

    if (!tenantId) {
      skipped += 1;
      continue;
    }

    const existing = await getTenantProfileByTenantId(tenantId);

    if (existing) {
      skipped += 1;
      continue;
    }

    const defaults = inferProfileDefaultsFromSubscription(subscription);

    const createdPayload = await createDefaultTenantProfile(tenantId, defaults);

    if (createdPayload.ok && createdPayload.created) {
      created += 1;
      missing.push(tenantId);
    } else {
      skipped += 1;
    }
  }

  return {
    checked: subscriptions.length,
    created,
    skipped,
    missing
  };
}

async function getTenantProfilePayload(req) {
  const tenantId = getTenantId(req);

  let profile = await getTenantProfileByTenantId(tenantId);

  if (!profile) {
    const created = await createDefaultTenantProfile(tenantId);
    profile = created.profile;
  }

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.17B-tenant-profile-auto-backfill',
    tenantId,
    profile,
    generatedAt: new Date().toISOString()
  };
}

async function listTenantProfiles(options = {}) {
  await ensureTenantProfilesTable();

  let backfill = {
    checked: 0,
    created: 0,
    skipped: 0,
    missing: []
  };

  if (options.backfill !== false) {
    backfill = await backfillTenantProfilesFromSubscriptions();
  }

  const result = await db.query(`
    SELECT *
    FROM tenant_profiles
    ORDER BY updated_at DESC, created_at DESC
  `);

  const profiles = result.rows.map(normalizeProfileRow);

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.17B-tenant-profile-auto-backfill',
    stats: {
      total: profiles.length,
      distributors: profiles.filter((item) => item.isDistributor === true).length,
      direct: profiles.filter((item) => item.resellerType === 'DIRECT').length,
      reseller: profiles.filter((item) => item.resellerType === 'RESELLER').length,
      whiteLabel: profiles.filter((item) => item.resellerType === 'WHITE_LABEL').length,
      enterprise: profiles.filter((item) => item.resellerType === 'ENTERPRISE').length
    },
    backfill,
    profiles,
    generatedAt: new Date().toISOString()
  };
}

async function upsertTenantProfile(tenantId, body = {}) {
  await ensureTenantProfilesTable();

  const normalizedTenantId = normalizeTenantId(tenantId || body.tenantId || body.tenant_id);

  if (!normalizedTenantId) {
    return {
      ok: false,
      fallback: false,
      error: 'TENANT_ID_REQUIRED',
      message: 'tenantId is required.'
    };
  }

  const displayName =
    cleanText(body.displayName || body.display_name) ||
    cleanText(body.display_name) ||
    guessDisplayNameFromTenantId(normalizedTenantId);

  const existing = await getTenantProfileByTenantId(normalizedTenantId);

  if (!existing) {
    return createDefaultTenantProfile(normalizedTenantId, {
      ...body,
      displayName
    });
  }

  const result = await db.query(
    `
    UPDATE tenant_profiles
    SET
      display_name = COALESCE($2, display_name),
      legal_name = COALESCE($3, legal_name),
      brand_name = COALESCE($4, brand_name),
      contact_name = COALESCE($5, contact_name),
      contact_email = COALESCE($6, contact_email),
      support_email = COALESCE($7, support_email),
      billing_email = COALESCE($8, billing_email),
      phone = COALESCE($9, phone),
      country = COALESCE($10, country),
      city = COALESCE($11, city),
      website = COALESCE($12, website),
      logo_url = COALESCE($13, logo_url),
      primary_color = COALESCE($14, primary_color),
      secondary_color = COALESCE($15, secondary_color),
      reseller_type = COALESCE($16, reseller_type),
      is_distributor = COALESCE($17, is_distributor),
      notes = COALESCE($18, notes),
      metadata = COALESCE($19::jsonb, metadata),
      updated_at = NOW()
    WHERE tenant_id = $1
    RETURNING *
    `,
    [
      normalizedTenantId,
      cleanText(body.displayName || body.display_name),
      cleanText(body.legalName || body.legal_name),
      cleanText(body.brandName || body.brand_name),
      cleanText(body.contactName || body.contact_name),
      cleanText(body.contactEmail || body.contact_email),
      cleanText(body.supportEmail || body.support_email),
      cleanText(body.billingEmail || body.billing_email),
      cleanText(body.phone),
      cleanText(body.country),
      cleanText(body.city),
      cleanText(body.website),
      cleanText(body.logoUrl || body.logo_url),
      body.primaryColor || body.primary_color
        ? cleanColor(body.primaryColor || body.primary_color, '#1d4ed8')
        : null,
      body.secondaryColor || body.secondary_color
        ? cleanColor(body.secondaryColor || body.secondary_color, '#0f172a')
        : null,
      body.resellerType || body.reseller_type
        ? cleanResellerType(body.resellerType || body.reseller_type)
        : null,
      body.isDistributor !== undefined || body.is_distributor !== undefined
        ? cleanBoolean(body.isDistributor ?? body.is_distributor, false)
        : null,
      cleanText(body.notes),
      body.metadata ? JSON.stringify(body.metadata) : null
    ]
  );

  return {
    ok: true,
    fallback: false,
    source: 'database',
    phase: '22.17B-tenant-profile-auto-backfill',
    created: false,
    tenantId: normalizedTenantId,
    profile: normalizeProfileRow(result.rows[0]),
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  ensureTenantProfilesTable,
  getTenantId,
  normalizeTenantId,
  getTenantProfilePayload,
  getTenantProfileByTenantId,
  createDefaultTenantProfile,
  backfillTenantProfilesFromSubscriptions,
  listTenantProfiles,
  upsertTenantProfile
};