// enterprise-frontend/src/components/RuntimeFeatureGate.js
// RAFTOP CPAP CARE Pro
// Safe runtime feature gate component
// Purpose: prevents production build failure when App.js imports ./components/RuntimeFeatureGate
//
// Default behavior:
// - Allows rendering by default.
// - Blocks only when enabled={false}, disabled={true}, or a feature flag is explicitly false.
// - Supports both default import and named import.

import React from "react";

function safeGetLocalStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

function parseBoolean(value, fallback = null) {
  if (value === true) return true;
  if (value === false) return false;

  const normalized = String(value || "").trim().toLowerCase();

  if (["true", "1", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["false", "0", "no", "off", "disabled"].includes(normalized)) return false;

  return fallback;
}

function getRuntimeFlag(flagKey) {
  if (!flagKey) {
    return null;
  }

  const localValue =
    safeGetLocalStorage(flagKey) ||
    safeGetLocalStorage(`raftop_feature_${flagKey}`) ||
    safeGetLocalStorage(`feature_${flagKey}`);

  const parsedLocal = parseBoolean(localValue, null);

  if (parsedLocal !== null) {
    return parsedLocal;
  }

  const envKey = `REACT_APP_FEATURE_${String(flagKey)
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toUpperCase()}`;

  const envValue = process.env[envKey];
  const parsedEnv = parseBoolean(envValue, null);

  if (parsedEnv !== null) {
    return parsedEnv;
  }

  return null;
}

function getUser() {
  const raw =
    safeGetLocalStorage("raftop_auth_user") ||
    safeGetLocalStorage("user") ||
    "";

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function userHasRole(allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const user = getUser();
  const role = String(user?.role || user?.user_role || "").toLowerCase();

  if (!role) {
    return false;
  }

  return allowedRoles.map((item) => String(item).toLowerCase()).includes(role);
}

export function isRuntimeFeatureEnabled({
  enabled,
  disabled,
  feature,
  flagKey,
  requiredRole,
  allowedRoles
} = {}) {
  if (disabled === true) {
    return false;
  }

  if (enabled === false) {
    return false;
  }

  const key = flagKey || feature;
  const runtimeFlag = getRuntimeFlag(key);

  if (runtimeFlag === false) {
    return false;
  }

  const roles = [];

  if (requiredRole) {
    roles.push(requiredRole);
  }

  if (Array.isArray(allowedRoles)) {
    roles.push(...allowedRoles);
  }

  if (!userHasRole(roles)) {
    return false;
  }

  return true;
}

export function RuntimeFeatureGate({
  children,
  fallback = null,
  enabled,
  disabled,
  feature,
  flagKey,
  requiredRole,
  allowedRoles
}) {
  const allowed = isRuntimeFeatureEnabled({
    enabled,
    disabled,
    feature,
    flagKey,
    requiredRole,
    allowedRoles
  });

  if (!allowed) {
    return fallback;
  }

  return <>{children}</>;
}

export default RuntimeFeatureGate;