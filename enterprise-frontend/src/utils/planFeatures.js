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

function coerceBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const raw = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'enabled', 'active', 'on'].includes(raw)) return true;
    if (['false', '0', 'no', 'disabled', 'inactive', 'off'].includes(raw)) return false;
  }
  return fallback;
}

export function formatLimitValue(value) {
  if (value == null) return 'Unlimited';
  if (value === Infinity) return 'Unlimited';

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric.toLocaleString('en-US');
  }

  return String(value);
}

export function resolvePlanEntitlements(input = {}) {
  const source = input || {};
  const defaultEnabled = true;

  const features = Object.values(FEATURE_KEYS).reduce((acc, key) => {
    acc[key] = defaultEnabled;
    return acc;
  }, {});

  const incomingFeatures =
    source.features ||
    source.featureFlags ||
    source.modules ||
    source.entitlements ||
    source ||
    {};

  Object.entries(incomingFeatures).forEach(([key, value]) => {
    features[key] = coerceBoolean(value, defaultEnabled);
  });

  const limits = {
    patients:
      source.patientLimit ??
      source.patientsLimit ??
      source.limits?.patients ??
      null,
    doctors:
      source.doctorLimit ??
      source.doctorsLimit ??
      source.limits?.doctors ??
      null,
    devices:
      source.deviceLimit ??
      source.devicesLimit ??
      source.limits?.devices ??
      null,
    seats:
      source.seatLimit ??
      source.seatsLimit ??
      source.limits?.seats ??
      null,
    modules:
      source.moduleLimit ??
      source.modulesLimit ??
      source.limits?.modules ??
      null
  };

  return {
    plan: source.plan || 'premium',
    features,
    limits
  };
}

export function hasFeatureInEntitlements(entitlements, featureKey) {
  if (!featureKey) return true;

  const resolved = resolvePlanEntitlements(entitlements);
  if (!resolved?.features) return true;

  if (!Object.prototype.hasOwnProperty.call(resolved.features, featureKey)) {
    return true;
  }

  return coerceBoolean(resolved.features[featureKey], true);
}