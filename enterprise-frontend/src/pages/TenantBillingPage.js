import React, { useMemo, useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { ErrorBanner, SuccessBanner } from '../components/SystemBanner';
import RevenueBarChart from '../components/charts/RevenueBarChart';
import SubscriptionManager from '../components/billing/SubscriptionManager';
import PlanMatrix from '../components/billing/PlanMatrix';

function cardStyle() {
  return {
    background: '#ffffff',
    padding: 20,
    borderRadius: 18,
    boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
  };
}

const demoSubscriptions = [
  {
    id: 1,
    name: 'Dr A',
    email: 'dra@example.com',
    plan: 'Pro',
    status: 'active',
    mrr: 99,
    expires: '2026-04-30'
  },
  {
    id: 2,
    name: 'Dr B',
    email: 'drb@example.com',
    plan: 'Enterprise',
    status: 'trialing',
    mrr: 199,
    expires: '2026-05-10'
  },
  {
    id: 3,
    name: 'Clinic C',
    email: 'clinicc@example.com',
    plan: 'Starter',
    status: 'past_due',
    mrr: 49,
    expires: '2026-04-05'
  }
];

export default function TenantBillingPage() {
  const { activeTenant } = useTenant();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const overview = useMemo(
    () => ({
      mrr: 12450,
      arr: 149400,
      activeSubscriptions: 312,
      trialingSubscriptions: 24,
      churnRate: 3.2
    }),
    []
  );

  const revenueData = [
    { label: 'MRR', value: overview.mrr },
    { label: 'ARR', value: overview.arr },
    { label: 'Projected ARR', value: Math.round(overview.arr * 1.2) }
  ];

  function handleManage(user) {
    setError('');
    setSuccess(`Billing portal prepared for ${user.name}.`);
  }

  function handleCheckout(user) {
    setError('');
    setSuccess(`Checkout session prepared for ${user.name}.`);
  }

  function handleUpgrade(plan) {
    setError('');
    setSuccess(`Upgrade flow initialized for plan: ${plan.name}.`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle()}>
        <h1 style={{ margin: 0 }}>SaaS Billing Dashboard</h1>
        <p style={{ color: '#64748b' }}>
          Multi-tenant monetization, subscription control, and plan-based feature access.
        </p>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16
        }}
      >
        <div style={{ ...cardStyle(), background: '#ecfdf5' }}>
          <div style={{ color: '#64748b' }}>Monthly Recurring Revenue</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>€{overview.mrr}</div>
        </div>

        <div style={{ ...cardStyle(), background: '#eff6ff' }}>
          <div style={{ color: '#64748b' }}>Annual Recurring Revenue</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>€{overview.arr}</div>
        </div>

        <div style={{ ...cardStyle(), background: '#fef3c7' }}>
          <div style={{ color: '#64748b' }}>Active Subscriptions</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{overview.activeSubscriptions}</div>
        </div>

        <div style={{ ...cardStyle(), background: '#fee2e2' }}>
          <div style={{ color: '#64748b' }}>Current Tenant Plan</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{activeTenant.plan}</div>
        </div>
      </div>

      <RevenueBarChart
        data={revenueData}
        title="Recurring Revenue Overview"
        subtitle="MRR / ARR / projected ARR"
      />

      <PlanMatrix activePlan={activeTenant.plan} onUpgrade={handleUpgrade} />

      <SubscriptionManager
        users={demoSubscriptions}
        onManage={handleManage}
        onCheckout={handleCheckout}
      />
    </div>
  );
}