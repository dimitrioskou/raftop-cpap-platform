const API_BASE =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, value);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getPatients(params = {}) {
  const query = buildQuery(params);
  return request(`/patients${query}`);
}

export async function getPatientById(patientId) {
  if (!patientId) {
    throw new Error('patientId is required');
  }

  return request(`/patients/${patientId}`);
}

export async function createPatient(payload = {}) {
  return request('/patients', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updatePatient(patientId, payload = {}) {
  if (!patientId) {
    throw new Error('patientId is required');
  }

  return request(`/patients/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deletePatient(patientId) {
  if (!patientId) {
    throw new Error('patientId is required');
  }

  return request(`/patients/${patientId}`, {
    method: 'DELETE'
  });
}