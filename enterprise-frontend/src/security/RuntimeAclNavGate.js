import React from 'react';

import { useTenantRuntime } from '../context/TenantRuntimeContext';
import {
  canAccessFeature,
  hasPermission,
  getCurrentRuntimeRole
} from './runtimeAcl';

export default function RuntimeAclNavGate({
  permission = null,
  feature = null,
  children,
  fallback = null
}) {
  const runtime = useTenantRuntime();
  const role = getCurrentRuntimeRole();

  if (permission && !hasPermission(role, permission)) {
    return fallback;
  }

  if (feature) {
    const allowed = canAccessFeature({
      runtime,
      role,
      feature
    });

    if (!allowed) {
      return fallback;
    }
  }

  return <>{children}</>;
}