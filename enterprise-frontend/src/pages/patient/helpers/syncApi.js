const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

function readToken() {
  try {
    return localStorage.getItem('raftop_auth_token') || '';
  } catch (_error) {
    return '';
  }
}

function buildUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

async function readJsonSafely(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}

async function request(path, options = {}) {
  const token = readToken();

  const response = await fetch(buildUrl(path), {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await readJsonSafely(response);

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || options.errorLabel || 'Sync request failed');
  }

  return payload?.data ?? payload;
}

export async function getPatientSyncStatus() {
  return request('/api/patient/sync/status', {
    errorLabel: 'Patient sync status request failed'
  });
}

export async function createPatientUploadJob(payload) {
  return request('/api/patient/sync/upload', {
    method: 'POST',
    body: payload,
    errorLabel: 'Patient upload request failed'
  });
}

export async function createTenantImportJob(payload) {
  return request('/api/tenant/import-center', {
    method: 'POST',
    body: payload,
    errorLabel: 'Tenant import job request failed'
  });
}

export async function getTenantImportHistory() {
  return request('/api/tenant/import-history', {
    errorLabel: 'Tenant import history request failed'
  });
}