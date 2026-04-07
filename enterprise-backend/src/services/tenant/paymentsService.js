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

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function ensurePaymentsTable() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_payments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      doctor_id TEXT,
      customer_name TEXT,
      customer_email TEXT,
      description TEXT,
      amount NUMERIC DEFAULT 0,
      currency TEXT DEFAULT 'EUR',
      payment_method TEXT,
      status TEXT DEFAULT 'pending',
      provider_order_id TEXT,
      bank_reference TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_tenant_payments_tenant_id
    ON tenant_payments(tenant_id)
  `);
}

async function seedPaymentsIfEmpty(tenantId) {
  await ensurePaymentsTable();

  const result = await runQuery(
    `SELECT COUNT(*)::int AS count FROM tenant_payments WHERE tenant_id = $1`,
    [tenantId]
  );

  if (safe(result.rows?.[0]?.count) > 0) {
    return;
  }

  const rows = [
    ['PAY-1001', tenantId, '1001', 'Dr. Maria Papadopoulou', 'maria@example.com', 'RAFTOP doctor subscription payment', 149, 'EUR', 'card', 'paid', 'pi_demo_1001', '', ''],
    ['PAY-1002', tenantId, '1002', 'Dr. Nikos Andreou', 'nikos@example.com', 'RAFTOP doctor subscription payment', 199, 'EUR', 'paypal', 'paid', 'pp_demo_1002', '', ''],
    ['PAY-1003', tenantId, '1003', 'Dr. Eleni Perraki', 'eleni@example.com', 'RAFTOP enterprise doctor subscription', 248, 'EUR', 'bank_transfer', 'pending_verification', '', 'RF-BANK-1003', 'Pending bank confirmation'],
    ['PAY-1004', tenantId, '1004', 'Dr. George Dimitriou', 'george@example.com', 'RAFTOP starter doctor subscription', 99, 'EUR', 'cash', 'pending_verification', '', '', 'Cash expected at office']
  ];

  for (const row of rows) {
    await runQuery(
      `
        INSERT INTO tenant_payments
          (id, tenant_id, doctor_id, customer_name, customer_email, description, amount, currency, payment_method, status, provider_order_id, bank_reference, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      `,
      row
    );
  }
}

function mapPayment(row = {}) {
  return {
    id: normalizeText(row.id),
    doctorId: normalizeText(row.doctor_id),
    doctor_id: normalizeText(row.doctor_id),
    customerName: normalizeText(row.customer_name, 'Unknown customer'),
    customer_name: normalizeText(row.customer_name, 'Unknown customer'),
    customerEmail: normalizeText(row.customer_email, '—'),
    customer_email: normalizeText(row.customer_email, '—'),
    description: normalizeText(row.description, 'Payment'),
    amount: safe(row.amount),
    currency: normalizeText(row.currency, 'EUR'),
    paymentMethod: normalizeText(row.payment_method, 'unknown').toLowerCase(),
    payment_method: normalizeText(row.payment_method, 'unknown').toLowerCase(),
    status: normalizeText(row.status, 'pending').toLowerCase(),
    createdAt: row.created_at,
    created_at: row.created_at,
    bankReference: normalizeText(row.bank_reference),
    bank_reference: normalizeText(row.bank_reference)
  };
}

async function getPaymentsConfig() {
  return {
    methods: {
      stripe: {
        enabled: true,
        publishableKeyConfigured: Boolean(process.env.STRIPE_PUBLISHABLE_KEY || '')
      },
      paypal: {
        enabled: true,
        clientId: process.env.PAYPAL_CLIENT_ID || 'demo-paypal-client-id'
      },
      bankTransfer: {
        enabled: true,
        bankName: 'Alpha Bank',
        beneficiaryName: 'RAFTOP Enterprise',
        iban: 'GR0000000000000000000000000',
        swift: 'CRBAGRAA'
      },
      cash: {
        enabled: true
      }
    }
  };
}

async function createCardPaymentIntent({
  tenantId,
  doctorId,
  customerName,
  customerEmail,
  description,
  amount,
  currency = 'EUR'
}) {
  await seedPaymentsIfEmpty(tenantId);

  const paymentId = makeId('PAY');
  const providerOrderId = makeId('pi_demo');
  const clientSecret = `${providerOrderId}_secret_demo`;

  await runQuery(
    `
      INSERT INTO tenant_payments
        (id, tenant_id, doctor_id, customer_name, customer_email, description, amount, currency, payment_method, status, provider_order_id, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'card','paid',$9,NOW())
    `,
    [
      paymentId,
      tenantId,
      normalizeText(doctorId),
      normalizeText(customerName, 'Unknown customer'),
      normalizeText(customerEmail, '—'),
      normalizeText(description, 'Card payment'),
      safe(amount),
      normalizeText(currency, 'EUR'),
      providerOrderId
    ]
  );

  return {
    clientSecret: clientSecret,
    payment: {
      id: paymentId,
      paymentMethod: 'card',
      status: 'paid'
    }
  };
}

async function createPayPalOrder({
  tenantId,
  doctorId,
  customerName,
  customerEmail,
  description,
  amount,
  currency = 'EUR'
}) {
  await seedPaymentsIfEmpty(tenantId);

  const paymentId = makeId('PAY');
  const providerOrderId = makeId('pp_demo');

  await runQuery(
    `
      INSERT INTO tenant_payments
        (id, tenant_id, doctor_id, customer_name, customer_email, description, amount, currency, payment_method, status, provider_order_id, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'paypal','pending',$9,NOW())
    `,
    [
      paymentId,
      tenantId,
      normalizeText(doctorId),
      normalizeText(customerName, 'Unknown customer'),
      normalizeText(customerEmail, '—'),
      normalizeText(description, 'PayPal payment'),
      safe(amount),
      normalizeText(currency, 'EUR'),
      providerOrderId
    ]
  );

  return {
    paymentId,
    providerOrderId
  };
}

async function capturePayPalOrder({ tenantId, providerOrderId }) {
  await seedPaymentsIfEmpty(tenantId);

  const result = await runQuery(
    `
      UPDATE tenant_payments
      SET status = 'paid', updated_at = NOW()
      WHERE tenant_id = $1
        AND provider_order_id = $2
      RETURNING *
    `,
    [tenantId, providerOrderId]
  );

  const row = result.rows?.[0];

  if (!row) {
    throw new Error('PayPal order not found.');
  }

  return {
    payment: mapPayment(row)
  };
}

async function createBankTransferPayment({
  tenantId,
  doctorId,
  customerName,
  customerEmail,
  description,
  amount,
  currency = 'EUR',
  notes = ''
}) {
  await seedPaymentsIfEmpty(tenantId);

  const paymentId = makeId('PAY');
  const reference = makeId('RF-BANK');

  await runQuery(
    `
      INSERT INTO tenant_payments
        (id, tenant_id, doctor_id, customer_name, customer_email, description, amount, currency, payment_method, status, bank_reference, notes, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'bank_transfer','pending_verification',$9,$10,NOW())
    `,
    [
      paymentId,
      tenantId,
      normalizeText(doctorId),
      normalizeText(customerName, 'Unknown customer'),
      normalizeText(customerEmail, '—'),
      normalizeText(description, 'Bank transfer payment'),
      safe(amount),
      normalizeText(currency, 'EUR'),
      reference,
      normalizeText(notes)
    ]
  );

  return {
    payment: {
      id: paymentId,
      paymentMethod: 'bank_transfer',
      status: 'pending_verification',
      bankReference: reference
    },
    bankAccount: {
      beneficiaryName: 'RAFTOP Enterprise',
      bankName: 'Alpha Bank',
      iban: 'GR0000000000000000000000000',
      swift: 'CRBAGRAA'
    }
  };
}

async function createCashPayment({
  tenantId,
  doctorId,
  customerName,
  customerEmail,
  description,
  amount,
  currency = 'EUR',
  notes = ''
}) {
  await seedPaymentsIfEmpty(tenantId);

  const paymentId = makeId('PAY');

  await runQuery(
    `
      INSERT INTO tenant_payments
        (id, tenant_id, doctor_id, customer_name, customer_email, description, amount, currency, payment_method, status, notes, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'cash','pending_verification',$9,NOW())
    `,
    [
      paymentId,
      tenantId,
      normalizeText(doctorId),
      normalizeText(customerName, 'Unknown customer'),
      normalizeText(customerEmail, '—'),
      normalizeText(description, 'Cash payment'),
      safe(amount),
      normalizeText(currency, 'EUR'),
      normalizeText(notes)
    ]
  );

  return {
    payment: {
      id: paymentId,
      paymentMethod: 'cash',
      status: 'pending_verification'
    }
  };
}

async function listPayments({ tenantId, search = '' }) {
  await seedPaymentsIfEmpty(tenantId);

  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        COALESCE(id, '') ILIKE $2
        OR COALESCE(customer_name, '') ILIKE $2
        OR COALESCE(customer_email, '') ILIKE $2
        OR COALESCE(payment_method, '') ILIKE $2
        OR COALESCE(status, '') ILIKE $2
        OR COALESCE(description, '') ILIKE $2
        OR COALESCE(doctor_id, '') ILIKE $2
      )
    `;
  }

  const result = await runQuery(
    `
      SELECT *
      FROM tenant_payments
      WHERE tenant_id = $1
      ${searchSql}
      ORDER BY created_at DESC
    `,
    params
  );

  return result.rows.map(mapPayment);
}

async function verifyPayment({ tenantId, paymentId, status = 'verified' }) {
  await seedPaymentsIfEmpty(tenantId);

  const normalizedStatus = ['verified', 'rejected', 'paid'].includes(String(status).toLowerCase())
    ? String(status).toLowerCase()
    : 'verified';

  const result = await runQuery(
    `
      UPDATE tenant_payments
      SET status = $3, updated_at = NOW()
      WHERE tenant_id = $1
        AND id = $2
      RETURNING *
    `,
    [tenantId, paymentId, normalizedStatus]
  );

  const row = result.rows?.[0];

  if (!row) {
    throw new Error('Payment not found.');
  }

  return {
    ok: true,
    payment: mapPayment(row)
  };
}

module.exports = {
  getPaymentsConfig,
  createCardPaymentIntent,
  createPayPalOrder,
  capturePayPalOrder,
  createBankTransferPayment,
  createCashPayment,
  listPayments,
  verifyPayment
};