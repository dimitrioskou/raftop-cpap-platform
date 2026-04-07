import React from 'react';
import OperationsWorkspaceTablePage from '../components/OperationsWorkspaceTablePage';
import { statusBadgeStyle } from '../utils/uiStyles';

function formatCurrency(value) {
  const num = Number(value || 0);
  return `€${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeRow(item, index) {
  return {
    id: String(item.id || `checkout-plan-${index + 1}`),
    planLabel: item.label || 'Plan',
    planKey: item.plan_key || 'starter',
    billingCycle: item.billing_cycle || 'annual',
    annualPrice: Number(item.annual_price || 0),
    monthlyEquivalent: Number(item.monthly_equivalent || 0),
    recommendedFor: item.recommended_for || '—'
  };
}

export default function TenantPaymentsCheckoutPage() {
  return (
    <OperationsWorkspaceTablePage
      title="Payments Checkout"
      subtitle="Premium checkout workspace for doctor subscription plans."
      entityLabel="checkout plan rows"
      endpointGroups={['/api/tenant/payments']}
      responseKeys={['checkoutPlans']}
      fallbackRows={[]}
      normalizeRow={normalizeRow}
      metricsBuilder={(rows) => [
        { label: 'Plans', value: rows.length, tone: 'blue' },
        {
          label: 'Lowest Annual',
          value: rows.length ? formatCurrency(Math.min(...rows.map((row) => Number(row.annualPrice || 0)))) : '€0.00',
          tone: 'green'
        },
        {
          label: 'Highest Annual',
          value: rows.length ? formatCurrency(Math.max(...rows.map((row) => Number(row.annualPrice || 0)))) : '€0.00',
          tone: 'purple'
        },
        { label: 'Provider', value: 'Stripe-ready', tone: 'orange' }
      ]}
      searchPlaceholder="Search by plan or recommendation..."
      getSearchText={(row) => `${row.planLabel} ${row.planKey} ${row.recommendedFor}`}
      columns={[
        {
          label: 'Plan',
          render: (row) => (
            <div>
              <div style={{ fontWeight: 900 }}>{row.planLabel}</div>
              <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>{row.planKey}</div>
            </div>
          )
        },
        { label: 'Billing Cycle', render: (row) => row.billingCycle },
        { label: 'Annual Price', render: (row) => formatCurrency(row.annualPrice) },
        { label: 'Monthly Eq.', render: (row) => formatCurrency(row.monthlyEquivalent) },
        { label: 'Recommended For', render: (row) => row.recommendedFor },
        { label: 'Status', render: () => <span style={statusBadgeStyle('success')}>ready</span> }
      ]}
    />
  );
}