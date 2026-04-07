import React from 'react';
import WorkspaceShellPage from '../components/WorkspaceShellPage';

export default function TenantBrandingPage() {
  return (
    <WorkspaceShellPage
      title="Branding"
      subtitle="Premium white-label identity workspace."
      endpoint="/api/tenant/branding"
      entityLabel="tenant branding"
      fallbackStatus="ready"
      fallbackSummary="Branding controls are connected for tenant identity, theme selection and white-label configuration."
      fallbackMetrics={[
        { label: 'Brand Name', key: 'brandName', tone: 'blue' },
        { label: 'Theme', key: 'theme', tone: 'orange' },
        { label: 'White-label Ready', key: 'whiteLabelReady', tone: 'green' }
      ]}
      sections={[
        {
          title: 'Brand Controls',
          fields: [
            { label: 'Tenant Identity', key: 'brandName' },
            { label: 'White-label Mode', key: 'whiteLabelReady' },
            { label: 'Theme Layer', key: 'theme' }
          ]
        },
        {
          title: 'Presentation',
          fields: [
            { label: 'Sidebar Branding', value: 'Active' },
            { label: 'Header Identity', value: 'Active' },
            { label: 'Premium Visual Mode', value: 'Active' }
          ]
        }
      ]}
    />
  );
}