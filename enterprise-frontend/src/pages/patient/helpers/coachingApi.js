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
    throw new Error(payload?.message || options.errorLabel || 'Coaching request failed');
  }

  return payload?.data ?? payload;
}

export async function getPatientCoachingDashboard() {
  return request('/api/patient/coaching', {
    errorLabel: 'Patient coaching request failed'
  });
}

export async function startPatientLesson(lessonId) {
  return request(`/api/patient/coaching/lessons/${encodeURIComponent(lessonId)}/start`, {
    method: 'POST',
    errorLabel: 'Start lesson request failed'
  });
}

export async function completePatientLesson(lessonId) {
  return request(`/api/patient/coaching/lessons/${encodeURIComponent(lessonId)}/complete`, {
    method: 'POST',
    errorLabel: 'Complete lesson request failed'
  });
}

export async function getTenantPatientCoachingOverview() {
  return request('/api/tenant/patient-coaching', {
    errorLabel: 'Tenant patient coaching request failed'
  });
}