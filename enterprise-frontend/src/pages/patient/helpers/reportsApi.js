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
    throw new Error(payload?.message || options.errorLabel || 'Reports request failed');
  }

  return payload?.data ?? payload;
}

export async function getPatientReportsDashboard() {
  return request('/api/patient/reports', {
    errorLabel: 'Patient reports request failed'
  });
}

export async function generatePatientReport() {
  return request('/api/patient/reports/generate', {
    method: 'POST',
    errorLabel: 'Generate patient report request failed'
  });
}

export async function getTenantPatientReport(patientRef) {
  return request(`/api/tenant/reports/patient/${encodeURIComponent(patientRef)}`, {
    errorLabel: 'Tenant patient report request failed'
  });
}

export async function generateTenantPatientReport(patientRef) {
  return request(`/api/tenant/reports/patient/${encodeURIComponent(patientRef)}/generate`, {
    method: 'POST',
    errorLabel: 'Generate clinician report request failed'
  });
}