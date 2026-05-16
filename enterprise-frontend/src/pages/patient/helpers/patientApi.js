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
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include'
  });

  const payload = await readJsonSafely(response);

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `${options.errorLabel || 'Patient request'} failed`);
  }

  return payload?.data ?? payload;
}

export async function getPatientDashboard() {
  return patientRequest('/api/patient/dashboard', {
    errorLabel: 'Dashboard request'
  });
}

export async function getPatientTherapy() {
  return patientRequest('/api/patient/therapy', {
    errorLabel: 'Therapy request'
  });
}

export async function getPatientActions() {
  return patientRequest('/api/patient/actions', {
    errorLabel: 'Actions request'
  });
}

export async function getPatientActionCenter() {
  return patientRequest('/api/patient/action-center', {
    errorLabel: 'Action center request'
  });
}

export async function getPatientInsights() {
  return patientRequest('/api/patient/insights', {
    errorLabel: 'Insights request'
  });
}

export async function getPatientNotifications() {
  return patientRequest('/api/patient/notifications', {
    errorLabel: 'Notifications request'
  });
}

export async function markPatientNotificationRead(notificationId) {
  return patientRequest(`/api/patient/notifications/${notificationId}/read`, {
    method: 'POST',
    errorLabel: 'Notification read request'
  });
}

export async function archivePatientNotification(notificationId) {
  return patientRequest(`/api/patient/notifications/${notificationId}/archive`, {
    method: 'POST',
    errorLabel: 'Notification archive request'
  });
}

export async function getPatientGoals() {
  return patientRequest('/api/patient/goals', {
    errorLabel: 'Goals request'
  });
}

export async function getPatientMessages() {
  return patientRequest('/api/patient/messages', {
    errorLabel: 'Messages request'
  });
}

export async function markPatientMessageRead(messageId) {
  return patientRequest(`/api/patient/messages/${messageId}/read`, {
    method: 'POST',
    errorLabel: 'Message read request'
  });
}

export async function replyPatientMessage(body) {
  return patientRequest('/api/patient/messages/reply', {
    method: 'POST',
    body,
    errorLabel: 'Reply request'
  });
}

export async function replyPatientMessageTo(messageId, body) {
  return patientRequest(`/api/patient/messages/${messageId}/reply`, {
    method: 'POST',
    body,
    errorLabel: 'Reply request'
  });
}

export async function submitPatientCallback(body) {
  return patientRequest('/api/patient/actions/request-callback', {
    method: 'POST',
    body,
    errorLabel: 'Callback submit'
  });
}

export async function submitPatientIssue(body) {
  return patientRequest('/api/patient/actions/report-issue', {
    method: 'POST',
    body,
    errorLabel: 'Issue submit'
  });
}

export async function submitTherapyAcknowledgement(body) {
  return patientRequest('/api/patient/actions/acknowledge-therapy', {
    method: 'POST',
    body,
    errorLabel: 'Acknowledgement submit'
  });
}