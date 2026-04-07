import React from 'react';
import WorkspaceShellPage from '../components/WorkspaceShellPage';

export default function TenantModulesPage() {
  return (
    <WorkspaceShellPage
      title="Modules"
      subtitle="Premium plan and module visibility workspace."
      endpoint="/api/tenant/modules"
      entityLabel="tenant modules"
      fallbackStatus="ready"
      fallbackSummary="Module management is connected to tenant plan visibility and enabled feature coverage."
      fallbackMetrics={[
        { label: 'Total Modules', key: 'totalModules', tone: 'blue' },
        { label: 'Plan', key: 'plan', tone: 'purple' },
        { label: 'Last Sync', key: 'timestamp', tone: 'green' }
      ]}
      sections={[
        {
          title: 'Module Controls',
          fields: [
            { label: 'Plan Awareness', value: 'Enabled' },
            { label: 'Tenant Entitlements', value: 'Enabled' },
            { label: 'Workspace Mode', key: 'plan' }
          ]
        },
        {
          title: 'Enabled Modules',
          fields: [
            { label: 'Module List', key: 'enabledModules' }
          ]
        }
      ]}
    />
  );
}