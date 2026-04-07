const express = require('express');
const router = express.Router();

function euro(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? Number(num.toFixed(2)) : 0;
}

function buildCheckoutPlans() {
  return [
    {
      id: 'plan-starter',
      plan_key: 'starter',
      label: 'Starter',
      billing_cycle: 'annual',
      annual_price: 500,
      monthly_equivalent: euro(500 / 12),
      recommended_for: '1-3 doctors'
    },
    {
      id: 'plan-premium',
      plan_key: 'premium',
      label: 'Premium',
      billing_cycle: 'annual',
      annual_price: 800,
      monthly_equivalent: euro(800 / 12),
      recommended_for: '4-7 doctors'
    },
    {
      id: 'plan-enterprise',
      plan_key: 'enterprise',
      label: 'Enterprise',
      billing_cycle: 'annual',
      annual_price: 1200,
      monthly_equivalent: euro(1200 / 12),
      recommended_for: '8+ doctors'
    }
  ];
}

function buildTransactions() {
  return [
    {
      id: 'txn-1001',
      reference: 'RAFTOP-INV-1001',
      doctor_name: 'Dr. Ελένη Περράκη',
      plan_label: 'Starter',
      amount: 500,
      currency: 'EUR',
      status: 'paid',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    },
    {
      id: 'txn-1002',
      reference: 'RAFTOP-INV-1002',
      doctor_name: 'Dr. Νίκος Ανδρεάδης',
      plan_label: 'Premium',
      amount: 800,
      currency: 'EUR',
      status: 'paid',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      id: 'txn-1003',
      reference: 'RAFTOP-INV-1003',
      doctor_name: 'Dr. Μαρία Λάμπρου',
      plan_label: 'Enterprise',
      amount: 1200,
      currency: 'EUR',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];
}

router.get('/', async (req, res) => {
  const checkoutPlans = buildCheckoutPlans();
  const transactions = buildTransactions();

  const paidTransactions = transactions.filter((row) => row.status === 'paid');
  const pendingTransactions = transactions.filter((row) => row.status === 'pending');

  return res.json({
    ok: true,
    provider: 'Stripe-ready',
    checkoutStatus: 'ready',
    adminStatus: 'ready',
    supportedCurrencies: ['EUR'],
    checkoutPlans,
    transactions,
    totalTransactions: transactions.length,
    paidTransactions: paidTransactions.length,
    pendingTransactions: pendingTransactions.length,
    totalCollected: euro(
      paidTransactions.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    ),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;