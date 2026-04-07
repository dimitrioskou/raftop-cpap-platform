export const ROLE_KEYS = {
  TENANT_ADMIN: 'tenant_admin',
  OPERATOR: 'operator',
  BILLING_ADMIN: 'billing_admin',
  DOCTOR_USER: 'doctor_user'
};

export const FEATURE_KEYS = {
  dashboard: 'dashboard',
  patients: 'patients',
  patientProfile: 'patient_profile',
  devices: 'devices',
  deviceProfile: 'device_profile',
  compliance: 'compliance',
  followup: 'followup',
  tasks: 'tasks',
  notes: 'notes',
  referrals: 'referrals',
  notifications: 'notifications',
  atlasSummary: 'atlas_summary',
  atlasQueue: 'atlas_queue',
  atlasDaily: 'atlas_daily',
  atlasTasks: 'atlas_tasks',
  atlasAlerts: 'atlas_alerts',
  atlasAutoActions: 'atlas_auto_actions',
  predictiveAi: 'predictive_ai',
  doctorBilling: 'doctor_billing',
  revenue: 'revenue',
  paymentsCheckout: 'payments_checkout',
  paymentsAdmin: 'payments_admin',
  users: 'users',
  modules: 'modules',
  integrations: 'integrations',
  branding: 'branding',
  systemStatus: 'system_status'
};

const ACCESS_MAP = {
  [ROLE_KEYS.TENANT_ADMIN]: ['*'],

  [ROLE_KEYS.OPERATOR]: [
    FEATURE_KEYS.dashboard,
    FEATURE_KEYS.patients,
    FEATURE_KEYS.patientProfile,
    FEATURE_KEYS.devices,
    FEATURE_KEYS.deviceProfile,
    FEATURE_KEYS.compliance,
    FEATURE_KEYS.followup,
    FEATURE_KEYS.tasks,
    FEATURE_KEYS.notes,
    FEATURE_KEYS.referrals,
    FEATURE_KEYS.notifications,
    FEATURE_KEYS.atlasSummary,
    FEATURE_KEYS.atlasQueue,
    FEATURE_KEYS.atlasDaily,
    FEATURE_KEYS.atlasTasks,
    FEATURE_KEYS.atlasAlerts,
    FEATURE_KEYS.atlasAutoActions,
    FEATURE_KEYS.systemStatus
  ],

  [ROLE_KEYS.BILLING_ADMIN]: [
    FEATURE_KEYS.dashboard,
    FEATURE_KEYS.patients,
    FEATURE_KEYS.patientProfile,
    FEATURE_KEYS.devices,
    FEATURE_KEYS.deviceProfile,
    FEATURE_KEYS.notes,
    FEATURE_KEYS.notifications,
    FEATURE_KEYS.doctorBilling,
    FEATURE_KEYS.revenue,
    FEATURE_KEYS.paymentsCheckout,
    FEATURE_KEYS.paymentsAdmin,
    FEATURE_KEYS.systemStatus
  ],

  [ROLE_KEYS.DOCTOR_USER]: [
    FEATURE_KEYS.dashboard,
    FEATURE_KEYS.patients,
    FEATURE_KEYS.patientProfile,
    FEATURE_KEYS.devices,
    FEATURE_KEYS.deviceProfile,
    FEATURE_KEYS.compliance,
    FEATURE_KEYS.notes,
    FEATURE_KEYS.notifications
  ]
};

export function normalizeRole(role) {
  const raw = String(role || '').trim().toLowerCase();

  if (!raw) return ROLE_KEYS.TENANT_ADMIN;
  if (ACCESS_MAP[raw]) return raw;

  return ROLE_KEYS.TENANT_ADMIN;
}

export function hasRoleAccess(role, featureKey) {
  if (!featureKey) return true;

  const normalizedRole = normalizeRole(role);
  const allowed = ACCESS_MAP[normalizedRole] || [];

  if (allowed.includes('*')) return true;

  return allowed.includes(featureKey);
}

export function getDefaultHomeForRole(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === ROLE_KEYS.BILLING_ADMIN) {
    return '/tenant/revenue';
  }

  if (normalizedRole === ROLE_KEYS.DOCTOR_USER) {
    return '/tenant/patients';
  }

  return '/tenant/dashboard';
}

export function getRoleLabel(role) {
  const normalizedRole = normalizeRole(role);

  const labels = {
    [ROLE_KEYS.TENANT_ADMIN]: 'Tenant Admin',
    [ROLE_KEYS.OPERATOR]: 'Operator',
    [ROLE_KEYS.BILLING_ADMIN]: 'Billing Admin',
    [ROLE_KEYS.DOCTOR_USER]: 'Doctor User'
  };

  return labels[normalizedRole] || 'User';
}