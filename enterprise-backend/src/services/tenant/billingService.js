const db = require('../../db');

async function runQuery(sql, params = []) {
  if (typeof db.query === 'function') {
    return db.query(sql, params);
  }

  if (db.pool && typeof db.pool.query === 'function') {
    return db.pool.query(sql, params);
  }

  throw new Error('Database query function is not available.');
}

function safe(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(value, fallback = '') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function buildAppUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3001';
}

function buildPriceForPlan(plan) {
  const normalized = String(plan || '').toLowerCase();

  if (normalized === 'enterprise') return 248;
  if (normalized === 'professional') return 199;
  return 149;
}

async function ensureBillingTable() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS doctor_subscriptions (
      id BIGSERIAL PRIMARY KEY
    )
  `);

  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS tenant_id TEXT
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS doctor_id TEXT
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS doctor_name TEXT
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS specialty TEXT
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS plan_name TEXT
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS patient_count INTEGER DEFAULT 0
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC DEFAULT 0
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
  `);
  await runQuery(`
    ALTER TABLE doctor_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);

  await runQuery(`
    UPDATE doctor_subscriptions
    SET tenant_id = 'demo-tenant'
    WHERE tenant_id IS NULL
  `);

  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_doctor_subscriptions_tenant_id
    ON doctor_subscriptions(tenant_id)
  `);
}

async function seedBillingIfEmpty(tenantId) {
  await ensureBillingTable();

  const countResult = await runQuery(
    `
      SELECT COUNT(*)::int AS count
      FROM doctor_subscriptions
      WHERE tenant_id = $1
    `,
    [tenantId]
  );

  if (safe(countResult.rows?.[0]?.count) > 0) {
    return;
  }

  const demoRows = [
    {
      doctorId: '1001',
      doctorName: 'Dr. Maria Papadopoulou',
      specialty: 'Pulmonology',
      planName: 'Starter',
      patientCount: 120,
      monthlyFee: 149,
      status: 'active',
      stripeCustomerId: 'cus_raftop_1001',
      stripeSubscriptionId: 'sub_raftop_1001'
    },
    {
      doctorId: '1002',
      doctorName: 'Dr. Nikos Andreou',
      specialty: 'Cardiology',
      planName: 'Professional',
      patientCount: 86,
      monthlyFee: 199,
      status: 'active',
      stripeCustomerId: 'cus_raftop_1002',
      stripeSubscriptionId: 'sub_raftop_1002'
    },
    {
      doctorId: '1003',
      doctorName: 'Dr. Eleni Perraki',
      specialty: 'Pulmonology',
      planName: 'Enterprise',
      patientCount: 205,
      monthlyFee: 248,
      status: 'trial',
      stripeCustomerId: 'cus_raftop_1003',
      stripeSubscriptionId: 'sub_raftop_1003'
    },
    {
      doctorId: '1004',
      doctorName: 'Dr. George Dimitriou',
      specialty: 'ENT',
      planName: 'Starter',
      patientCount: 40,
      monthlyFee: 99,
      status: 'inactive',
      stripeCustomerId: '',
      stripeSubscriptionId: ''
    }
  ];

  for (const item of demoRows) {
    await runQuery(
      `
        INSERT INTO doctor_subscriptions (
          tenant_id,
          doctor_id,
          doctor_name,
          specialty,
          plan_name,
          patient_count,
          monthly_fee,
          status,
          stripe_customer_id,
          stripe_subscription_id,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      `,
      [
        tenantId,
        item.doctorId,
        item.doctorName,
        item.specialty,
        item.planName,
        item.patientCount,
        item.monthlyFee,
        item.status,
        item.stripeCustomerId,
        item.stripeSubscriptionId
      ]
    );
  }
}

function mapDoctor(row = {}) {
  return {
    id: normalizeText(row.doctor_id || row.id),
    doctorId: normalizeText(row.doctor_id || row.id),
    doctor_id: normalizeText(row.doctor_id || row.id),
    name: normalizeText(row.doctor_name, 'Unknown Doctor'),
    doctorName: normalizeText(row.doctor_name, 'Unknown Doctor'),
    doctor_name: normalizeText(row.doctor_name, 'Unknown Doctor'),
    specialty: normalizeText(row.specialty, '—'),
    plan: normalizeText(row.plan_name, 'Starter'),
    plan_name: normalizeText(row.plan_name, 'Starter'),
    patientCount: safe(row.patient_count),
    patient_count: safe(row.patient_count),
    monthlyFee: safe(row.monthly_fee),
    monthly_fee: safe(row.monthly_fee),
    status: normalizeText(row.status, 'active').toLowerCase(),
    customerId: normalizeText(row.stripe_customer_id),
    customer_id: normalizeText(row.stripe_customer_id),
    subscriptionId: normalizeText(row.stripe_subscription_id),
    subscription_id: normalizeText(row.stripe_subscription_id)
  };
}

async function getDoctorRows({ tenantId, search = '' }) {
  await seedBillingIfEmpty(tenantId);

  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        COALESCE(doctor_name, '') ILIKE $2
        OR COALESCE(doctor_id, '') ILIKE $2
        OR COALESCE(specialty, '') ILIKE $2
        OR COALESCE(plan_name, '') ILIKE $2
        OR COALESCE(status, '') ILIKE $2
      )
    `;
  }

  const result = await runQuery(
    `
      SELECT *
      FROM doctor_subscriptions
      WHERE tenant_id = $1
      ${searchSql}
      ORDER BY
        CASE
          WHEN status = 'active' THEN 1
          WHEN status = 'trial' THEN 2
          ELSE 3
        END,
        monthly_fee DESC,
        doctor_name ASC
    `,
    params
  );

  return result.rows.map(mapDoctor);
}

async function getDoctorBillingSummary({ tenantId, search = '' }) {
  const doctors = await getDoctorRows({ tenantId, search });

  const activeSubscriptions = doctors.filter((x) => x.status === 'active').length;
  const monetizedDoctors = doctors.filter((x) => x.status === 'active' || x.status === 'trial');

  const mrr = monetizedDoctors.reduce((sum, item) => sum + safe(item.monthlyFee), 0);
  const arr = mrr * 12;
  const avgRevenuePerDoctor = doctors.length > 0 ? Math.round(mrr / doctors.length) : 0;

  return {
    summary: {
      totalDoctors: doctors.length,
      total_doctors: doctors.length,
      activeSubscriptions,
      active_subscriptions: activeSubscriptions,
      mrr,
      arr,
      avgRevenuePerDoctor,
      avg_revenue_per_doctor: avgRevenuePerDoctor
    },
    doctors
  };
}

function buildMonthlyRevenue(range) {
  const months3 = [
    { month: 'Jan', revenue: 2790, growth: 17.2 },
    { month: 'Feb', revenue: 3150, growth: 12.9 },
    { month: 'Mar', revenue: 3580, growth: 13.7 }
  ];

  const months6 = [
    { month: 'Oct', revenue: 1850, growth: 6.0 },
    { month: 'Nov', revenue: 2140, growth: 15.7 },
    { month: 'Dec', revenue: 2380, growth: 11.2 },
    { month: 'Jan', revenue: 2790, growth: 17.2 },
    { month: 'Feb', revenue: 3150, growth: 12.9 },
    { month: 'Mar', revenue: 3580, growth: 13.7 }
  ];

  const months12 = [
    { month: 'Apr', revenue: 980, growth: 4.2 },
    { month: 'May', revenue: 1120, growth: 14.3 },
    { month: 'Jun', revenue: 1290, growth: 15.2 },
    { month: 'Jul', revenue: 1450, growth: 12.4 },
    { month: 'Aug', revenue: 1620, growth: 11.7 },
    { month: 'Sep', revenue: 1740, growth: 7.4 },
    ...months6
  ];

  if (String(range) === '3m') return months3;
  if (String(range) === '12m') return months12;
  return months6;
}

async function getRevenueAnalytics({ tenantId, range = '6m' }) {
  const doctors = await getDoctorRows({ tenantId });

  const monetizedDoctors = doctors.filter((x) => x.status === 'active' || x.status === 'trial');
  const mrr = monetizedDoctors.reduce((sum, item) => sum + safe(item.monthlyFee), 0);
  const arr = mrr * 12;

  const planMap = monetizedDoctors.reduce((acc, item) => {
    const key = normalizeText(item.plan, 'Starter');
    acc[key] = (acc[key] || 0) + safe(item.monthlyFee);
    return acc;
  }, {});

  const planSplit = Object.keys(planMap).map((key) => ({
    label: key,
    revenue: planMap[key]
  }));

  const monthlyRevenue = buildMonthlyRevenue(range);

  const growthPct = monthlyRevenue.length > 1
    ? safe(monthlyRevenue[monthlyRevenue.length - 1].growth)
    : 0;

  const pipeline = [
    {
      id: '3001',
      name: 'Raftopoulos Reseller Pack',
      stage: 'Negotiation',
      value: 2400,
      probability: 70
    },
    {
      id: '3002',
      name: 'Cardiology Group SaaS',
      stage: 'Proposal',
      value: 1200,
      probability: 45
    },
    {
      id: '3003',
      name: 'Sleep Clinic Expansion',
      stage: 'Discovery',
      value: 900,
      probability: 25
    }
  ];

  const weightedPipeline = pipeline.reduce(
    (sum, item) => sum + Math.round((safe(item.value) * safe(item.probability)) / 100),
    0
  );

  return {
    stats: {
      mrr,
      arr,
      growthPct,
      growth_pct: growthPct,
      weightedPipeline,
      weighted_pipeline: weightedPipeline,
      planCount: planSplit.length,
      plan_count: planSplit.length
    },
    monthlyRevenue,
    planSplit,
    pipeline
  };
}

async function createDoctorCheckoutSession({ tenantId, doctorId, plan = 'Starter' }) {
  await seedBillingIfEmpty(tenantId);

  const url = `${buildAppUrl()}/tenant/payments/checkout?tenantId=${encodeURIComponent(
    tenantId
  )}&doctorId=${encodeURIComponent(doctorId)}&plan=${encodeURIComponent(plan)}`;

  const existing = await runQuery(
    `
      SELECT id
      FROM doctor_subscriptions
      WHERE tenant_id = $1
        AND doctor_id = $2
      LIMIT 1
    `,
    [tenantId, doctorId]
  );

  if (existing.rows?.[0]?.id) {
    await runQuery(
      `
        UPDATE doctor_subscriptions
        SET
          plan_name = $3,
          monthly_fee = $4,
          updated_at = NOW()
        WHERE tenant_id = $1
          AND doctor_id = $2
      `,
      [tenantId, doctorId, plan, buildPriceForPlan(plan)]
    );
  }

  return {
    ok: true,
    url,
    doctorId,
    plan
  };
}

async function createDoctorBillingPortalSession({ tenantId, doctorId }) {
  await seedBillingIfEmpty(tenantId);

  const subscription = await runQuery(
    `
      SELECT *
      FROM doctor_subscriptions
      WHERE tenant_id = $1
        AND doctor_id = $2
      LIMIT 1
    `,
    [tenantId, doctorId]
  );

  const row = subscription.rows?.[0];

  if (!row) {
    throw new Error('Doctor subscription not found.');
  }

  const url = `${buildAppUrl()}/tenant/payments/admin?tenantId=${encodeURIComponent(
    tenantId
  )}&doctorId=${encodeURIComponent(doctorId)}`;

  return {
    ok: true,
    url,
    customerId: normalizeText(row.stripe_customer_id),
    subscriptionId: normalizeText(row.stripe_subscription_id)
  };
}

module.exports = {
  getDoctorBillingSummary,
  getRevenueAnalytics,
  createDoctorCheckoutSession,
  createDoctorBillingPortalSession
};