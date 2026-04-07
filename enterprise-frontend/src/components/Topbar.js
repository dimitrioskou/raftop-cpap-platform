import React from 'react';

export default function Topbar({ title, rightContent }) {
  return (
    <div
      style={{
        padding: '18px 24px',
        borderBottom: '1px solid #e5e7eb',
        background: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>
          {title}
        </div>
      </div>

      <div>{rightContent}</div>
    </div>
  );
}