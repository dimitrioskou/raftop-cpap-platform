const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

function readToken() {
  try {
    return localStorage.getItem('raftop_auth_token') || '';
  } catch (_error) {
    return '';
  }
}

function buildUrl(path) {
  if (!API_BASE) {
    return path;
  }
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

async function patientRequest(path, options = {}) {
  const token = readToken();

  const response = await fetch(buildUrl(path), {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    credentials: 'include'
  });

  const payload = await readJsonSafely(response);

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || options.errorLabel || 'Nightly analysis request failed');
  }

  return payload?.data ?? payload;
}

export async function getPatientNightlyAnalysis(date = '') {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return patientRequest(`/api/patient/nightly-analysis${query}`, {
    errorLabel: 'Nightly analysis request failed'
  });
}

export async function getPatientNightComparison(date, otherDate) {
  return patientRequest(
    `/api/patient/nightly-analysis/${encodeURIComponent(date)}/compare/${encodeURIComponent(otherDate)}`,
    {
      errorLabel: 'Night comparison request failed'
    }
  );
}