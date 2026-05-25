import React from 'react';
import { Route } from 'react-router-dom';

import { TechnicalRouteGuard } from './RouteGuards';

export default function SystemRoutes({
  ReleaseCandidatePage,
  GenericEndpointPage
}) {
  return (
    <>
      <Route
        path="/system/release-candidate"
        element={
          <TechnicalRouteGuard>
            <ReleaseCandidatePage />
          </TechnicalRouteGuard>
        }
      />

      <Route
        path="/system/route-stability"
        element={
          <TechnicalRouteGuard>
            <GenericEndpointPage title="Route Stability Audit" subtitle="Tenant-aware route stability audit." endpoint="/api/system/route-stability-audit" admin />
          </TechnicalRouteGuard>
        }
      />

      <Route
        path="/system/saas-stability"
        element={
          <TechnicalRouteGuard>
            <GenericEndpointPage title="SaaS Stability Audit" subtitle="SaaS stability audit." endpoint="/api/system/saas-stability-audit" admin />
          </TechnicalRouteGuard>
        }
      />

      <Route
        path="/system/production-readiness"
        element={
          <TechnicalRouteGuard>
            <GenericEndpointPage title="Production Readiness" subtitle="Production readiness audit." endpoint="/api/system/production-readiness-audit" admin />
          </TechnicalRouteGuard>
        }
      />

      <Route
        path="/system/tenant-cleanup"
        element={
          <TechnicalRouteGuard>
            <GenericEndpointPage title="Tenant Cleanup" subtitle="Tenant cleanup audit." endpoint="/api/system/tenant-cleanup-audit" admin />
          </TechnicalRouteGuard>
        }
      />

      <Route
        path="/system/security-exposure"
        element={
          <TechnicalRouteGuard>
            <GenericEndpointPage title="Security Exposure" subtitle="Security exposure audit." endpoint="/api/system/security-exposure-audit" admin />
          </TechnicalRouteGuard>
        }
      />

      <Route
        path="/system/backend-config"
        element={
          <TechnicalRouteGuard>
            <GenericEndpointPage title="Backend Config" subtitle="Backend config audit." endpoint="/api/system/backend-production-config-audit" admin />
          </TechnicalRouteGuard>
        }
      />

      <Route
        path="/system/database-backup"
        element={
          <TechnicalRouteGuard>
            <GenericEndpointPage title="Database Backup Safety" subtitle="Database backup safety audit." endpoint="/api/system/database-backup-safety-audit" admin />
          </TechnicalRouteGuard>
        }
      />

      <Route
        path="/system/alerts"
        element={
          <TechnicalRouteGuard>
            <GenericEndpointPage title="System Alerts" subtitle="System alerts." endpoint="/api/system/alerts" admin />
          </TechnicalRouteGuard>
        }
      />
    </>
  );
}