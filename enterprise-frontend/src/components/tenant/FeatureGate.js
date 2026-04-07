import React from 'react';
import ApiStatusNotice from '../ApiStatusNotice';
import { hasFeatureInEntitlements } from '../../utils/planFeatures';
import { useTenant } from '../../context/TenantContext';

export default function FeatureGate({
  feature,
  children,
  fallback = null,
  failOpen = true,
  showNoticeWhenBlocked = true
}) {
  const tenantContext = typeof useTenant === 'function' ? useTenant() : {};
  const tenant = tenantContext?.tenant || {};

  const entitlements =
    tenant?.entitlements ||
    tenant?.planEntitlements ||
    tenant?.features ||
    {};

  let allowed = true;

  try {
    allowed = hasFeatureInEntitlements(entitlements, feature);
  } catch (error) {
    allowed = true;
  }

  if (failOpen && (feature == null || entitlements == null || typeof entitlements !== 'object')) {
    return children;
  }

  if (allowed) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (!showNoticeWhenBlocked) {
    return null;
  }

  return (
    <div style={{ padding: 20 }}>
      <ApiStatusNotice
        status="warning"
        title="Feature locked"
        message="This module is not enabled for the current entitlement set."
      />
    </div>
  );
}