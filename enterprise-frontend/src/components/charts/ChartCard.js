import React from 'react';

export default function ChartCard({ title, subtitle, children, height = 320 }) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 18,
        padding: 20,
        boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{subtitle}</div>
        ) : null}
      </div>

      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );
}