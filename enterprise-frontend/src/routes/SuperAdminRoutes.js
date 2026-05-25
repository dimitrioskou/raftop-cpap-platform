import React from 'react';
import { Route } from 'react-router-dom';

import { TechnicalRouteGuard } from './RouteGuards';
import SuperAdminTenantProvisioningPage from '../pages/SuperAdminTenantProvisioningPage';

export default function SuperAdminRoutes({ GenericEndpointPage }) {
  return (
    <>
      <Route
        path="/super-admin/subscriptions"
        element={
          <TechnicalRouteGuard>
            <GenericEndpointPage
              title="Subscriptions"
              subtitle="Super admin subscriptions."
              endpoint="/api/super-admin/subscriptions"
              admin
            />
          </TechnicalRouteGuard>
        }
      />

      <Route
        path="/super-admin/tenant-profiles"
        element={
          <TechnicalRouteGuard>
            <GenericEndpointPage
              title="Tenant Profiles"
              subtitle="Super admin tenant profiles."
              endpoint="/api/super-admin/tenant-profiles"
              admin
            />
          </TechnicalRouteGuard>
        }
      />

      <Route
        path="/super-admin/tenant-provisioning"
        element={
          <TechnicalRouteGuard>
            <SuperAdminTenantProvisioningPage />
          </TechnicalRouteGuard>
        }
      />
    </>
  );
}