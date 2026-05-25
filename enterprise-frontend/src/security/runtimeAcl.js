export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  DOCTOR: 'doctor',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
  PATIENT: 'patient'
};

export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_PATIENTS: 'view_patients',
  VIEW_DEVICES: 'view_devices',
  VIEW_ATLAS: 'view_atlas',
  VIEW_ACTION_CENTER: 'view_action_center',
  VIEW_CLOSED_LOOP: 'view_closed_loop',
  VIEW_PATIENT_SIGNALS: 'view_patient_signals',
VIEW_TASKS: 'view_tasks',
VIEW_FOLLOWUP: 'view_followup',
VIEW_NOTES: 'view_notes',
VIEW_REFERRALS: 'view_referrals',
VIEW_NOTIFICATIONS: 'view_notifications',
  VIEW_EXECUTIVE_METRICS: 'view_executive_metrics',
  VIEW_ROLLOUT_ROADMAP: 'view_rollout_roadmap',

  MANAGE_TASKS: 'manage_tasks',
  MANAGE_PATIENTS: 'manage_patients',
  MANAGE_USERS: 'manage_users',
  MANAGE_TENANT: 'manage_tenant',
  MANAGE_BILLING: 'manage_billing',
  PROVISION_TENANTS: 'provision_tenants',

  VIEW_SYSTEM: 'view_system',
  VIEW_SUPER_ADMIN: 'view_super_admin'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.TENANT_ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_DEVICES,
    PERMISSIONS.VIEW_ATLAS,
    PERMISSIONS.VIEW_ACTION_CENTER,
    PERMISSIONS.VIEW_CLOSED_LOOP,
    PERMISSIONS.VIEW_EXECUTIVE_METRICS,
    PERMISSIONS.VIEW_ROLLOUT_ROADMAP,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_TENANT,
PERMISSIONS.MANAGE_BILLING,
PERMISSIONS.VIEW_PATIENT_SIGNALS,
PERMISSIONS.VIEW_TASKS,
PERMISSIONS.VIEW_FOLLOWUP,
PERMISSIONS.VIEW_NOTES,
PERMISSIONS.VIEW_REFERRALS,
PERMISSIONS.VIEW_NOTIFICATIONS,
  ],

  [ROLES.DOCTOR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_DEVICES,
    PERMISSIONS.VIEW_ATLAS,
    PERMISSIONS.VIEW_ACTION_CENTER,
    PERMISSIONS.VIEW_CLOSED_LOOP,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_PATIENT_SIGNALS,
PERMISSIONS.VIEW_TASKS,
PERMISSIONS.VIEW_FOLLOWUP,
PERMISSIONS.VIEW_NOTES,
PERMISSIONS.VIEW_REFERRALS,
PERMISSIONS.VIEW_NOTIFICATIONS,
  ],

  [ROLES.OPERATOR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_DEVICES,
    PERMISSIONS.VIEW_ATLAS,
    PERMISSIONS.VIEW_ACTION_CENTER,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_PATIENT_SIGNALS,
PERMISSIONS.VIEW_TASKS,
PERMISSIONS.VIEW_FOLLOWUP,
PERMISSIONS.VIEW_NOTES,
PERMISSIONS.VIEW_REFERRALS,
PERMISSIONS.VIEW_NOTIFICATIONS,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_DEVICES
  ],

  [ROLES.PATIENT]: [
    PERMISSIONS.VIEW_DASHBOARD
  ]
};

export const FEATURE_PERMISSION_MAP = {
  atlas: PERMISSIONS.VIEW_ATLAS,
  actionCenter: PERMISSIONS.VIEW_ACTION_CENTER,
  closedLoop: PERMISSIONS.VIEW_CLOSED_LOOP,
  executiveMetrics: PERMISSIONS.VIEW_EXECUTIVE_METRICS,
  rolloutRoadmap: PERMISSIONS.VIEW_ROLLOUT_ROADMAP
};

export const ROUTE_PERMISSION_RULES = [
  {
    startsWith: '/tenant/dashboard',
    permission: PERMISSIONS.VIEW_DASHBOARD
  },
  {
    startsWith: '/tenant/patients',
    permission: PERMISSIONS.VIEW_PATIENTS
  },
  {
    startsWith: '/tenant/devices',
    permission: PERMISSIONS.VIEW_DEVICES
  },
  {
    startsWith: '/tenant/atlas/action-center',
    permission: PERMISSIONS.VIEW_ACTION_CENTER,
    feature: 'actionCenter'
  },
  {
    startsWith: '/tenant/atlas',
    permission: PERMISSIONS.VIEW_ATLAS,
    feature: 'atlas'
  },
  {
    startsWith: '/tenant/closed-loop',
    permission: PERMISSIONS.VIEW_CLOSED_LOOP,
    feature: 'closedLoop'
  },
  {
    startsWith: '/sales/raftopoulos/executive-pilot-close',
    permission: PERMISSIONS.VIEW_EXECUTIVE_METRICS,
    feature: 'executiveMetrics'
  },
  {
    startsWith: '/sales/raftopoulos/rollout-roadmap',
    permission: PERMISSIONS.VIEW_ROLLOUT_ROADMAP,
    feature: 'rolloutRoadmap'
  },
  {
    startsWith: '/system',
    permission: PERMISSIONS.VIEW_SYSTEM,
    technicalOnly: true
  },
  {
    startsWith: '/super-admin',
    permission: PERMISSIONS.VIEW_SUPER_ADMIN,
    technicalOnly: true
  }
];

export function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();

  if (Object.values(ROLES).includes(value)) {
    return value;
  }

  return ROLES.TENANT_ADMIN;
}

export function getCurrentRuntimeRole() {
  return normalizeRole(
    localStorage.getItem('runtime_role') ||
      localStorage.getItem('userRole') ||
      localStorage.getItem('role') ||
      ROLES.TENANT_ADMIN
  );
}

export function setCurrentRuntimeRole(role) {
  const normalized = normalizeRole(role);
  localStorage.setItem('runtime_role', normalized);
  localStorage.setItem('userRole', normalized);
  localStorage.setItem('role', normalized);
  return normalized;
}

export function getRolePermissions(role) {
  const normalized = normalizeRole(role);
  return ROLE_PERMISSIONS[normalized] || [];
}

export function hasPermission(role, permission) {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

export function isFeatureEnabled(runtime, feature) {
  if (!feature) return true;

  const modules = runtime?.modules || {};
  const entitlements = runtime?.entitlements || {};

  const entitlementMap = {
    atlas: entitlements.canUseAtlas,
    actionCenter: entitlements.canUseActionCenter,
    closedLoop: entitlements.canUseClosedLoop,
    executiveMetrics: entitlements.canUseExecutiveMetrics,
    rolloutRoadmap: entitlements.canUseRolloutRoadmap
  };

  return (
    modules[feature] !== false &&
    entitlementMap[feature] !== false
  );
}

export function canAccessFeature({ runtime, role, feature }) {
  const permission = FEATURE_PERMISSION_MAP[feature];

  if (permission && !hasPermission(role, permission)) {
    return false;
  }

  return isFeatureEnabled(runtime, feature);
}

export function getRouteRule(pathname) {
  const cleanPath = String(pathname || '');

  return ROUTE_PERMISSION_RULES.find((rule) =>
    cleanPath.startsWith(rule.startsWith)
  );
}

export function canAccessRoute({ runtime, role, pathname }) {
  const rule = getRouteRule(pathname);

  if (!rule) {
    return {
      allowed: true,
      reason: null,
      rule: null
    };
  }

  if (rule.permission && !hasPermission(role, rule.permission)) {
    return {
      allowed: false,
      reason: `Role ${role} does not have permission ${rule.permission}.`,
      rule
    };
  }

  if (rule.feature && !isFeatureEnabled(runtime, rule.feature)) {
    return {
      allowed: false,
      reason: `Feature ${rule.feature} is not enabled for this tenant.`,
      rule
    };
  }

  if (runtime?.access?.allowed === false) {
    return {
      allowed: false,
      reason: runtime?.access?.reason || 'Tenant access is blocked.',
      rule
    };
  }

  return {
    allowed: true,
    reason: null,
    rule
  };
}