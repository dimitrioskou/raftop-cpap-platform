const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  DOCTOR: 'doctor',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
  PATIENT: 'patient'
};

const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_PATIENTS: 'view_patients',
  VIEW_DEVICES: 'view_devices',
  VIEW_PATIENT_SIGNALS: 'view_patient_signals',
  VIEW_ATLAS: 'view_atlas',
  VIEW_ACTION_CENTER: 'view_action_center',
  VIEW_CLOSED_LOOP: 'view_closed_loop',
  VIEW_EXECUTIVE_METRICS: 'view_executive_metrics',
  VIEW_ROLLOUT_ROADMAP: 'view_rollout_roadmap',

  VIEW_TASKS: 'view_tasks',
  VIEW_FOLLOWUP: 'view_followup',
  VIEW_NOTES: 'view_notes',
  VIEW_REFERRALS: 'view_referrals',
  VIEW_NOTIFICATIONS: 'view_notifications',

  MANAGE_TASKS: 'manage_tasks',
  MANAGE_PATIENTS: 'manage_patients',
  MANAGE_USERS: 'manage_users',
  MANAGE_TENANT: 'manage_tenant',
  MANAGE_BILLING: 'manage_billing',
  PROVISION_TENANTS: 'provision_tenants',

  VIEW_SYSTEM: 'view_system',
  VIEW_SUPER_ADMIN: 'view_super_admin'
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.TENANT_ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_DEVICES,
    PERMISSIONS.VIEW_PATIENT_SIGNALS,
    PERMISSIONS.VIEW_ATLAS,
    PERMISSIONS.VIEW_ACTION_CENTER,
    PERMISSIONS.VIEW_CLOSED_LOOP,
    PERMISSIONS.VIEW_EXECUTIVE_METRICS,
    PERMISSIONS.VIEW_ROLLOUT_ROADMAP,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_FOLLOWUP,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.VIEW_REFERRALS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_TENANT,
    PERMISSIONS.MANAGE_BILLING
  ],

  [ROLES.DOCTOR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_DEVICES,
    PERMISSIONS.VIEW_PATIENT_SIGNALS,
    PERMISSIONS.VIEW_ATLAS,
    PERMISSIONS.VIEW_ACTION_CENTER,
    PERMISSIONS.VIEW_CLOSED_LOOP,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_FOLLOWUP,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.VIEW_REFERRALS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_TASKS
  ],

  [ROLES.OPERATOR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.VIEW_DEVICES,
    PERMISSIONS.VIEW_PATIENT_SIGNALS,
    PERMISSIONS.VIEW_ATLAS,
    PERMISSIONS.VIEW_ACTION_CENTER,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_FOLLOWUP,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.VIEW_REFERRALS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_TASKS
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

const API_PERMISSION_RULES = [
  { startsWith: '/api/tenant/dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
  { startsWith: '/api/tenant/patients', permission: PERMISSIONS.VIEW_PATIENTS },
  { startsWith: '/api/tenant/devices', permission: PERMISSIONS.VIEW_DEVICES },
  { startsWith: '/api/tenant/patient-signals', permission: PERMISSIONS.VIEW_PATIENT_SIGNALS },
  { startsWith: '/api/tenant/atlas/action-center', permission: PERMISSIONS.VIEW_ACTION_CENTER },
  { startsWith: '/api/tenant/atlas', permission: PERMISSIONS.VIEW_ATLAS },
  { startsWith: '/api/tenant/closed-loop', permission: PERMISSIONS.VIEW_CLOSED_LOOP },
  { startsWith: '/api/tenant/tasks', permission: PERMISSIONS.VIEW_TASKS },
  { startsWith: '/api/tenant/tasks-unified', permission: PERMISSIONS.VIEW_TASKS },
  { startsWith: '/api/tenant/followup', permission: PERMISSIONS.VIEW_FOLLOWUP },
  { startsWith: '/api/tenant/notes', permission: PERMISSIONS.VIEW_NOTES },
  { startsWith: '/api/tenant/referrals', permission: PERMISSIONS.VIEW_REFERRALS },
  { startsWith: '/api/tenant/notifications', permission: PERMISSIONS.VIEW_NOTIFICATIONS },
  { startsWith: '/api/system', permission: PERMISSIONS.VIEW_SYSTEM },
  { startsWith: '/api/super-admin', permission: PERMISSIONS.VIEW_SUPER_ADMIN }
];

function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();

  if (Object.values(ROLES).includes(value)) {
    return value;
  }

  return ROLES.TENANT_ADMIN;
}

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[normalizeRole(role)] || [];
}

function hasPermission(role, permission) {
  return getRolePermissions(role).includes(permission);
}

function getApiRule(pathname) {
  const cleanPath = String(pathname || '');

  return API_PERMISSION_RULES.find((rule) =>
    cleanPath.startsWith(rule.startsWith)
  );
}

function canAccessApi({ role, pathname }) {
  const normalizedRole = normalizeRole(role);
  const rule = getApiRule(pathname);

  if (!rule) {
    return {
      allowed: true,
      role: normalizedRole,
      permission: null,
      reason: null
    };
  }

  if (!hasPermission(normalizedRole, rule.permission)) {
    return {
      allowed: false,
      role: normalizedRole,
      permission: rule.permission,
      reason: `Role ${normalizedRole} does not have permission ${rule.permission}.`
    };
  }

  return {
    allowed: true,
    role: normalizedRole,
    permission: rule.permission,
    reason: null
  };
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  API_PERMISSION_RULES,
  normalizeRole,
  getRolePermissions,
  hasPermission,
  getApiRule,
  canAccessApi
};