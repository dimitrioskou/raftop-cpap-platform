import React from 'react';
import Sidebar from '../components/Sidebar';
import TopbarActions from '../components/TopbarActions';

const layoutStyle = {
  minHeight: '100vh',
  display: 'flex',
  background: '#f9fafb'
};

const mainStyle = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column'
};

const topbarStyle = {
  height: 64,
  background: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px',
  boxSizing: 'border-box'
};

const contentStyle = {
  flex: 1,
  padding: 0,
  boxSizing: 'border-box'
};

export default function AdminLayout({ children, title = 'RAFTOP Admin' }) {
  return (
    <div style={layoutStyle}>
      <Sidebar />

      <div style={mainStyle}>
        <header style={topbarStyle}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              CPAP monitoring, compliance and follow-up workspace
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                background: '#ecfdf5',
                color: '#166534',
                border: '1px solid #a7f3d0',
                fontSize: 12,
                fontWeight: 700
              }}
            >
              System Ready
            </div>

            <TopbarActions />
          </div>
        </header>

        <main style={contentStyle}>{children}</main>
      </div>
    </div>
  );
}