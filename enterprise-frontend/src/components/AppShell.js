import React from 'react';
import Topbar from './Topbar';

export default function AppShell({ sidebar, title, children, rightContent }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      {sidebar}
      <div style={{ flex: 1 }}>
        <Topbar title={title} rightContent={rightContent} />
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}