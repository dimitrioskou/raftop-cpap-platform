import React from 'react';

export default function AtlasHeatmap({ cases, onClick }) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 18,
        padding: 20,
        boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
        ATLAS Risk Heatmap
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: 10
        }}
      >
        {cases.slice(0, 40).map((c) => {
          const color =
            c.priority === 'critical'
              ? '#dc2626'
              : c.priority === 'high'
              ? '#f59e0b'
              : '#16a34a';

          return (
            <div
              key={c.id}
              onClick={() => onClick && onClick(c)}
              style={{
                height: 60,
                borderRadius: 10,
                background: color,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {c.score}
            </div>
          );
        })}
      </div>
    </div>
  );
}