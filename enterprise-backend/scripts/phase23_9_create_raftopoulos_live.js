const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env')
});

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing.');
  console.error('Expected .env path:', path.resolve(__dirname, '..', '.env'));
  process.exit(1);
}

const db = require('../src/services/db');

const TENANT_ID = 'raftopoulos-live';

function nowIso() {
  return new Date().toISOString();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
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
    ORDER BY ordinal_position
    `,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

function has(columns, name) {
  return columns.includes(name);
}

function pickColumn(columns, candidates) {
  return candidates.find((candidate) => columns.includes(candidate)) || null;
}

async function upsertDynamic({
  tableName,
  conflictColumn,
  values
}) {
  const columns = await getColumns(tableName);

  const filteredEntries = Object.entries(values).filter(([key]) =>
    columns.includes(key)
  );

  if (!columns.includes(conflictColumn)) {
    throw new Error(`${tableName} does not contain conflict column ${conflictColumn}`);
  }

  const insertColumns = filteredEntries.map(([key]) => key);
  const insertValues = filteredEntries.map(([, value]) => value);
  const placeholders = insertColumns.map((_, index) => `$${index + 1}`);

  const updateColumns = insertColumns.filter((column) => column !== conflictColumn);

  const updateSql =
    updateColumns.length > 0
      ? updateColumns
          .map((column) => `"${column}" = EXCLUDED."${column}"`)
          .join(', ')
      : `"${conflictColumn}" = EXCLUDED."${conflictColumn}"`;

  const sql = `
    INSERT INTO "${tableName}" (${insertColumns.map((column) => `"${column}"`).join(', ')})
    VALUES (${placeholders.join(', ')})
    ON CONFLICT ("${conflictColumn}")
    DO UPDATE SET ${updateSql}
    RETURNING *
  `;

  const result = await db.query(sql, insertValues);

  return {
    tableName,
    columns,
    usedColumns: insertColumns,
    row: result.rows[0] || null
  };
}

async function ensureTenantSubscriptionsTable() {
  if (!(await tableExists('tenant_subscriptions'))) {
    throw new Error('tenant_subscriptions table does not exist.');
  }

  const columns = await getColumns('tenant_subscriptions');

  const tenantColumn = pickColumn(columns, ['tenant_id', 'tenantId']);
  if (!tenantColumn) {
    throw new Error('tenant_subscriptions has no tenant_id / tenantId column.');
  }

  if (!has(columns, 'id')) {
    throw new Error('tenant_subscriptions has no id column.');
  }

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id_unique
    ON tenant_subscriptions (${tenantColumn})
  `);

  const now = nowIso();
  const periodEnd = addDays(now, 365);

  const values = {
    id: `sub-${TENANT_ID}`,
    [tenantColumn]: TENANT_ID,
    plan: 'ENTERPRISE',
    status: 'ACTIVE',
    seats: 100,
    patient_limit: 50000,
    patientLimit: 50000,
    billing_email: 'billing@raftopoulos.gr',
    billingEmail: 'billing@raftopoulos.gr',
    stripe_customer_id: null,
    stripeCustomerId: null,
    stripe_subscription_id: null,
    stripeSubscriptionId: null,
    trial_started_at: null,
    trialStartedAt: null,
    trial_ends_at: null,
    trialEndsAt: null,
    current_period_started_at: now,
    currentPeriodStartedAt: now,
    current_period_ends_at: periodEnd,
    currentPeriodEndsAt: periodEnd,
    locked_reason: null,
    lockedReason: null,
    metadata: {
      createdBy: 'phase23_9_raftopoulos_live_polish',
      purpose: 'commercial_demo_candidate',
      resellerScenario: true,
      expectedPatientBase: 7000,
      notes: 'Polished Raftopoulos live tenant for controlled commercial demo.'
    },
    created_at: now,
    createdAt: now,
    updated_at: now,
    updatedAt: now
  };

  return upsertDynamic({
    tableName: 'tenant_subscriptions',
    conflictColumn: tenantColumn,
    values
  });
}

async function ensureTenantProfilesTable() {
  if (!(await tableExists('tenant_profiles'))) {
    throw new Error('tenant_profiles table does not exist.');
  }

  const columns = await getColumns('tenant_profiles');

  const tenantColumn = pickColumn(columns, ['tenant_id', 'tenantId']);
  if (!tenantColumn) {
    throw new Error('tenant_profiles has no tenant_id / tenantId column.');
  }

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_profiles_tenant_id_unique
    ON tenant_profiles (${tenantColumn})
  `);

  const now = nowIso();

  const values = {
    id: `profile-${TENANT_ID}`,
    [tenantColumn]: TENANT_ID,

    display_name: 'Raftopoulos CPAP Care',
    displayName: 'Raftopoulos CPAP Care',

    legal_name: 'Raftopoulos',
    legalName: 'Raftopoulos',

    brand_name: 'Raftopoulos CPAP Care',
    brandName: 'Raftopoulos CPAP Care',

    contact_name: 'Raftopoulos Team',
    contactName: 'Raftopoulos Team',

    contact_email: 'support@raftopoulos.gr',
    contactEmail: 'support@raftopoulos.gr',

    support_email: 'support@raftopoulos.gr',
    supportEmail: 'support@raftopoulos.gr',

    billing_email: 'billing@raftopoulos.gr',
    billingEmail: 'billing@raftopoulos.gr',

    phone: '',
    website: 'https://raftopoulos.gr',

    tenant_type: 'DISTRIBUTOR',
    tenantType: 'DISTRIBUTOR',
    type: 'DISTRIBUTOR',

    primary_color: '#0f766e',
    primaryColor: '#0f766e',

    secondary_color: '#1e3a8a',
    secondaryColor: '#1e3a8a',

    accent_color: '#14b8a6',
    accentColor: '#14b8a6',

    logo_url: '',
    logoUrl: '',

    notes: 'Polished Raftopoulos tenant profile for controlled commercial demo.',

    metadata: {
      createdBy: 'phase23_9_raftopoulos_live_polish',
      presentationReady: true,
      resellerScenario: true,
      expectedPatientBase: 7000,
      whiteLabel: true,
      productName: 'Raftopoulos CPAP Care',
      commercialPositioning:
        'Enterprise CPAP monitoring, compliance, follow-up and ATLAS prioritization platform.'
    },

    created_at: now,
    createdAt: now,
    updated_at: now,
    updatedAt: now
  };

  return upsertDynamic({
    tableName: 'tenant_profiles',
    conflictColumn: tenantColumn,
    values
  });
}

async function main() {
  console.log('Phase 23.9 — Raftopoulos live tenant polish');
  console.log('Tenant:', TENANT_ID);

  const subscription = await ensureTenantSubscriptionsTable();
  console.log('\nSubscription upserted:');
  console.log({
    table: subscription.tableName,
    usedColumns: subscription.usedColumns,
    tenant: TENANT_ID
  });

  const profile = await ensureTenantProfilesTable();
  console.log('\nProfile upserted:');
  console.log({
    table: profile.tableName,
    usedColumns: profile.usedColumns,
    tenant: TENANT_ID
  });

  console.log('\nDONE.');
  console.log('Next tenant to use in frontend/localStorage: raftopoulos-live');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFAILED:', error);
    process.exit(1);
  });