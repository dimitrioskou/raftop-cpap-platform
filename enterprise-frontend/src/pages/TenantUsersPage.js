import React from 'react';
import WorkspaceShellPage from '../components/WorkspaceShellPage';

export default function TenantUsersPage() {
  return (
    <WorkspaceShellPage
      title="Users"
      subtitle="Premium tenant user administration workspace."
      endpoint="/api/tenant/users"
      entityLabel="tenant users"
      fallbackStatus="ready"
      fallbackSummary="User administration is available with tenant-level role management, access control and production-safe visibility."
      fallbackMetrics={[
        { label: 'Total Users', key: 'totalUsers', tone: 'blue' },
        { label: 'Active Users', key: 'activeUsers', tone: 'green' },
        { label: 'Access Model', key: 'accessModel', tone: 'purple' }
      ]}
      sections={[
        {
          title: 'Workspace Capabilities',
          fields: [
            { label: 'User Administration', value: 'Enabled' },
            { label: 'Role Management', value: 'Enabled' },
            { label: 'Tenant Scope', value: 'Production-safe' }
          ]
        },
        {
          title: 'Standard Roles',
          fields: [
            { label: 'Super Admin', value: 'Available' },
            { label: 'Tenant Admin', value: 'Available' },
            { label: 'Doctor User', value: 'Available' },
            { label: 'Operator', value: 'Available' }
          ]
        }
      ]}
    />
  );
}