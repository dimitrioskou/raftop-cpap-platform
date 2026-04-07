import React from 'react';
import Sidebar from '../components/Sidebar';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminLayout({ title, children }) {
  const { logout, authUser } = useAuth();

  const sections = [
    {
      title: 'Overview',
      items: [
        { to: '/super-admin', label: 'Dashboard', end: true }
      ]
    },
    {
      title: 'Platform Control',
      items: [
        { to: '/super-admin/organizations', label: 'Organizations' },
        { to: '/super-admin/licenses', label: 'Licenses' },
        { to: '/super-admin/modules', label: 'Modules' }
      ]
    },
    {
      title: 'ATLAS Intelligence',
      items: [
        { to: '/tenant/atlas', label: 'ATLAS Dashboard' },
        { to: '/tenant/atlas/queue', label: 'ATLAS Queue' },
        { to: '/tenant/my-atlas/dashboard', label: 'My ATLAS Dashboard' },
        { to: '/tenant/my-atlas', label: 'My ATLAS Queue' }
      ]
    }
  ];

  return (
    <AppShell
      sidebar={<Sidebar title="Super Admin" sections={sections} />}
      title={title}
      rightContent={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: '#4b5563' }}>
            {authUser?.first_name} {authUser?.last_name}
          </span>
          <button
            type="button"
            onClick={logout}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}