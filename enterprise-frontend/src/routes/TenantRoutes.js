import React from 'react';
import { Route } from 'react-router-dom';

import RuntimeAclRouteGuard from '../security/RuntimeAclRouteGuard';
import TenantAclAuditPage from '../pages/TenantAclAuditPage';
import TenantSecurityOverviewPage from '../pages/TenantSecurityOverviewPage';
import TenantSubscriptionStatusPage from '../pages/TenantSubscriptionStatusPage';
import TenantUserActivityAuditPage from '../pages/TenantUserActivityAuditPage';
import TenantFailedLoginAuditPage from '../pages/TenantFailedLoginAuditPage';
export default function TenantRoutes({
  DashboardPage,
  TenantStatisticsPage,
  TenantExecutiveStatisticsReportPage,
  TenantBusinessImpactPage,
  PatientsPage,
  DevicesPage,
  PatientSignalsPage,
  AtlasPage,
  AtlasActionCenterPage,
  ClosedLoopPage,
  GenericEndpointPage
}) {
  return (
    <>
      <Route path="/tenant/dashboard" element={<DashboardPage />} />

      <Route path="/tenant/statistics" element={<TenantStatisticsPage />} />

      <Route
        path="/tenant/statistics/report"
        element={<TenantExecutiveStatisticsReportPage />}
      />

      <Route
        path="/tenant/business-impact"
        element={<TenantBusinessImpactPage />}
      />

      <Route path="/tenant/patients" element={<PatientsPage />} />

      <Route path="/tenant/devices" element={<DevicesPage />} />

      <Route
        path="/tenant/patient-signals"
        element={
          <RuntimeAclRouteGuard>
            <PatientSignalsPage />
          </RuntimeAclRouteGuard>
        }
      />

      <Route
        path="/tenant/atlas"
        element={
          <RuntimeAclRouteGuard>
            <AtlasPage />
          </RuntimeAclRouteGuard>
        }
      />

      <Route
        path="/tenant/atlas/action-center"
        element={
          <RuntimeAclRouteGuard>
            <AtlasActionCenterPage />
          </RuntimeAclRouteGuard>
        }
      />

      <Route
        path="/tenant/closed-loop"
        element={
          <RuntimeAclRouteGuard>
            <ClosedLoopPage />
          </RuntimeAclRouteGuard>
        }
      />

      <Route
        path="/tenant/closed-loop/control-hub"
        element={
          <RuntimeAclRouteGuard>
            <ClosedLoopPage />
          </RuntimeAclRouteGuard>
        }
      />

      <Route
        path="/tenant/tasks"
        element={
          <RuntimeAclRouteGuard>
            <GenericEndpointPage
              title="Tasks"
              subtitle="Unified task board."
              endpoint="/api/tenant/tasks-unified"
            />
          </RuntimeAclRouteGuard>
        }
      />

      <Route
        path="/tenant/followup"
        element={
          <RuntimeAclRouteGuard>
            <GenericEndpointPage
              title="Follow-up"
              subtitle="Follow-up center."
              endpoint="/api/tenant/followup"
            />
          </RuntimeAclRouteGuard>
        }
      />

      <Route
        path="/tenant/notes"
        element={
          <RuntimeAclRouteGuard>
            <GenericEndpointPage
              title="Notes"
              subtitle="Tenant notes."
              endpoint="/api/tenant/notes"
            />
          </RuntimeAclRouteGuard>
        }
      />

      <Route
        path="/tenant/referrals"
        element={
          <RuntimeAclRouteGuard>
            <GenericEndpointPage
              title="Referrals"
              subtitle="Referral management."
              endpoint="/api/tenant/referrals"
            />
          </RuntimeAclRouteGuard>
        }
      />

      <Route
        path="/tenant/notifications"
        element={
          <RuntimeAclRouteGuard>
            <GenericEndpointPage
              title="Notifications"
              subtitle="Notification queue."
              endpoint="/api/tenant/notifications"
            />
          </RuntimeAclRouteGuard>
        }
      />

      <Route
        path="/tenant/security/acl-audit"
        element={
          <RuntimeAclRouteGuard>
            <TenantAclAuditPage />
          </RuntimeAclRouteGuard>
        }
      />
      <Route
  path="/tenant/security"
  element={
    <RuntimeAclRouteGuard>
      <TenantSecurityOverviewPage />
    </RuntimeAclRouteGuard>
  }
/>
<Route
  path="/tenant/subscription"
  element={
    <RuntimeAclRouteGuard>
      <TenantSubscriptionStatusPage />
    </RuntimeAclRouteGuard>
  }
/>

<Route
  path="/tenant/security/user-activity"
  element={
    <RuntimeAclRouteGuard>
      <TenantUserActivityAuditPage />
    </RuntimeAclRouteGuard>
  }
/>
<Route
  path="/tenant/security/failed-logins"
  element={
    <RuntimeAclRouteGuard>
      <TenantFailedLoginAuditPage />
    </RuntimeAclRouteGuard>
  }
/>
    </>
  );
}