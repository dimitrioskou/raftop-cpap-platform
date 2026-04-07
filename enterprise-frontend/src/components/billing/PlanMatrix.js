import React from 'react';

const plans = [
  {
    key: 'starter',
    name: 'Starter',
    price: '€49/mo',
    features: ['Dashboard', 'Doctor Profiles', 'Basic Operations']
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '€149/mo',
    features: ['ATLAS', 'Billing', 'AI Follow-up', 'Patient AI']
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '€399/mo',
    features: ['Multi-tenant', 'White-label', 'Advanced Analytics', 'Subscription Engine']
  }
];

export default function PlanMatrix({ activePlan, onUpgrade }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}
    >
      {plans.map((plan) => {
        const isActive = plan.key === activePlan;

        return (
          <div
            key={plan.key}
            style={{
              background: '#ffffff',
              borderRadius: 18,
              padding: 20,
              border: isActive ? '2px solid #2563eb' : '1px solid #e5e7eb',
              boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800 }}>{plan.name}</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{plan.price}</div>

            <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
              {plan.features.map((feature) => (
                <div key={feature} style={{ color: '#475569' }}>
                  • {feature}
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={isActive}
              onClick={() => onUpgrade && onUpgrade(plan)}
              style={{
                marginTop: 18,
                width: '100%',
                border: 'none',
                borderRadius: 10,
                padding: '10px 14px',
                background: isActive ? '#e2e8f0' : '#2563eb',
                color: isActive ? '#334155' : '#ffffff',
                cursor: isActive ? 'default' : 'pointer',
                fontWeight: 700
              }}
            >
              {isActive ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        );
      })}
    </div>
  );
}