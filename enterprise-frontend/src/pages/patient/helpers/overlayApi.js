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
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include'
  });

  const payload = await readJsonSafely(response);

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || options.errorLabel || 'Overlay request failed');
  }

  return payload?.data ?? payload;
}

export async function getPatientOverlay(date = '') {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return patientRequest(`/api/patient/overlay${query}`, {
    errorLabel: 'Overlay request failed'
  });
}

export async function getPatientJournal(limit = 20) {
  return patientRequest(`/api/patient/overlay/journal?limit=${encodeURIComponent(limit)}`, {
    errorLabel: 'Journal request failed'
  });
}

export async function createPatientJournalEntry(payload) {
  return patientRequest('/api/patient/overlay/journal', {
    method: 'POST',
    body: payload,
    errorLabel: 'Save journal entry request failed'
  });
}