import React from 'react';

function tableStyle() {
  return {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 900
  };
}

function thtd() {
  return {
    padding: 14,
    borderTop: '1px solid #e5e7eb',
    textAlign: 'left'
  };
}

function badge(status) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 700
  };

  if (status === 'active') return { ...base, background: '#dcfce7', color: '#166534' };
  if (status === 'trialing') return { ...base, background: '#dbeafe', color: '#1d4ed8' };
  if (status === 'past_due') return { ...base, background: '#fef3c7', color: '#92400e' };
  if (status === 'canceled') return { ...base, background: '#fee2e2', color: '#991b1b' };
  return { ...base, background: '#e5e7eb', color: '#374151' };
}

export default function SubscriptionManager({ users = [], onManage, onCheckout }) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
        Subscription Manager
      </div>

      {users.length === 0 ? (
        <div style={{ color: '#64748b' }}>No subscriptions found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle()}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thtd()}>User</th>
                <th style={thtd()}>Plan</th>
                <th style={thtd()}>Status</th>
                <th style={thtd()}>MRR</th>
                <th style={thtd()}>Renewal</th>
                <th style={thtd()}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <td style={thtd()}>
                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td style={thtd()}>{u.plan}</td>
                  <td style={thtd()}>
                    <span style={badge(u.status)}>{u.status}</span>
                  </td>
                  <td style={thtd()}>€{u.mrr}</td>
                  <td style={thtd()}>{u.expires || '-'}</td>
                  <td style={thtd()}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => onManage && onManage(u)}
                        style={{
                          border: 'none',
                          borderRadius: 10,
                          padding: '8px 12px',
                          background: '#e2e8f0',
                          color: '#0f172a',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        Manage
                      </button>

                      <button
                        type="button"
                        onClick={() => onCheckout && onCheckout(u)}
                        style={{
                          border: 'none',
                          borderRadius: 10,
                          padding: '8px 12px',
                          background: '#2563eb',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        Checkout
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}