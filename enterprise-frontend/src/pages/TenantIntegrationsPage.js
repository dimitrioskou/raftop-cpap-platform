import React from 'react';
import WorkspaceShellPage from '../components/WorkspaceShellPage';

export default function TenantIntegrationsPage() {
  return (
    <WorkspaceShellPage
      title="Integrations"
      subtitle="Premium integration readiness workspace."
      endpoint="/api/tenant/integrations"
      entityLabel="tenant integrations"
      fallbackStatus="ready"
      fallbackSummary="Integration management is connected and ready for ResMed imports, manual uploads and reporting pipelines."
      fallbackMetrics={[
        { label: 'Scope', value: 'Tenant', tone: 'blue' },
        { label: 'External Sync', value: 'Ready', tone: 'green' },
        { label: 'Last Sync', key: 'timestamp', tone: 'purple' }
      ]}
      sections={[
        {
          title: 'Integration Readiness',
          fields: [
            { label: 'ResMed CSV', value: 'Ready' },
            { label: 'Manual Import', value: 'Ready' },
            { label: 'Reporting Feed', value: 'Ready' }
          ]
        },
        {
          title: 'Connected Integrations',
          fields: [
            { label: 'Available Connectors', key: 'integrations' }
          ]
        }
      ]}
    />
  );
}