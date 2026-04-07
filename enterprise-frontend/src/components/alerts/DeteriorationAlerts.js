import React from 'react';

export default function DeteriorationAlerts({ patients }) {
  const alerts = patients.filter(
    (p) =>
      p.usage_hours_month < 40 ||
      p.ahi > 30 ||
      p.leak > 40
  );

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
      }}
    >
      <h3 style={{ marginBottom: 12 }}>⚠️ Deterioration Alerts</h3>

      {alerts.length === 0 ? (
        <div style={{ color: '#16a34a' }}>No critical patients</div>
      ) : (
        alerts.slice(0, 5).map((p) => (
          <div
            key={p.id}
            style={{
              padding: 10,
              marginBottom: 8,
              borderRadius: 10,
              background: '#fee2e2'
            }}
          >
            {p.full_name} → Risk detected
          </div>
        ))
      )}
    </div>
  );
}