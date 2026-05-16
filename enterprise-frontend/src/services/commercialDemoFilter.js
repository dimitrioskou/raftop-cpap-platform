// enterprise-frontend/src/services/commercialDemoFilter.js

const DEFAULT_DEMO_WORDS = [
  'demo',
  'test',
  'example',
  'sample',
  'localhost',
  'patient.local',
  'raftop.local'
];

export function getCurrentTenantId() {
  return (
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'demo-tenant'
  );
}

export function isCommercialDemoTenant(tenantId = getCurrentTenantId()) {
  const value = String(tenantId || '').toLowerCase();

  return (
    value === 'raftopoulos-live' ||
    value === 'raftopoulos-demo-live' ||
    localStorage.getItem('commercial_demo_mode') === 'true'
  );
}

export function enableCommercialDemoMode() {
  localStorage.setItem('commercial_demo_mode', 'true');
}

export function disableCommercialDemoMode() {
  localStorage.removeItem('commercial_demo_mode');
}

export function normalizeSearchText(value) {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).toLowerCase();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeSearchText).join(' ');
  }

  if (typeof value === 'object') {
    try {
      return Object.values(value).map(normalizeSearchText).join(' ');
    } catch (error) {
      return '';
    }
  }

  return '';
}

export function isDemoLikeRecord(record, extraWords = []) {
  const words = [...DEFAULT_DEMO_WORDS, ...extraWords].map((item) =>
    String(item || '').toLowerCase()
  );

  const text = normalizeSearchText(record);

  return words.some((word) => word && text.includes(word));
}

export function isAllowedInCommercialDemo(record, options = {}) {
  const tenantId =
    record?.tenantId ||
    record?.tenant_id ||
    record?.tenant ||
    record?.organizationTenantId ||
    '';

  const currentTenantId = getCurrentTenantId();

  if (!isCommercialDemoTenant(currentTenantId)) {
    return true;
  }

  if (String(tenantId || '').toLowerCase() === 'raftopoulos-live') {
    return true;
  }

  if (options.allowCurrentTenantOnly === true && tenantId) {
    return String(tenantId || '').toLowerCase() === String(currentTenantId || '').toLowerCase();
  }

  if (isDemoLikeRecord(record, options.extraWords || [])) {
    return false;
  }

  return true;
}

export function filterCommercialDemoRecords(records, options = {}) {
  if (!Array.isArray(records)) return [];

  if (!isCommercialDemoTenant()) {
    return records;
  }

  return records.filter((record) => isAllowedInCommercialDemo(record, options));
}

export function commercialDemoLabel() {
  if (!isCommercialDemoTenant()) return null;

  return {
    title: 'Commercial Demo Mode',
    tenant: getCurrentTenantId(),
    message:
      'Demo/test/example records are hidden from client-facing views. No database records are deleted.'
  };
}