import React from 'react';
import { Navigate } from 'react-router-dom';
import RuntimeModuleRouteGuard from '../components/RuntimeModuleRouteGuard';

export function TechnicalRouteGuard({ children }) {
  const tenantId =
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'raftopoulos-live';

  const commercialDemoMode =
    tenantId === 'raftopoulos-live' ||
    localStorage.getItem('commercial_demo_mode') === 'true';

  const technicalUnlocked =
    localStorage.getItem('show_technical_demo_routes') === 'true';

  if (commercialDemoMode && !technicalUnlocked) {
    return <Navigate to="/sales/raftopoulos/executive-demo-home" replace />;
  }

  return children;
}

export function ModuleRouteGuard({ feature, title, children }) {
  return (
    <RuntimeModuleRouteGuard feature={feature} title={title}>
      {children}
    </RuntimeModuleRouteGuard>
  );
}