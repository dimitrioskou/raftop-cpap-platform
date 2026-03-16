const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function getDoctors(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/doctors${query ? `?${query}` : ''}`);

  if (!res.ok) {
    throw new Error('Failed to fetch doctors');
  }

  return res.json();
}

export async function getDoctorById(id) {
  const res = await fetch(`${API_BASE}/api/doctors/${id}`);

  if (!res.ok) {
    throw new Error('Failed to fetch doctor');
  }

  return res.json();
}

export async function createDoctor(payload) {
  const res = await fetch(`${API_BASE}/api/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('Failed to create doctor');
  }

  return res.json();
}

export async function updateDoctor(id, payload) {
  const res = await fetch(`${API_BASE}/api/doctors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('Failed to update doctor');
  }

  return res.json();
}

export async function deleteDoctor(id) {
  const res = await fetch(`${API_BASE}/api/doctors/${id}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    throw new Error('Failed to delete doctor');
  }

  return res.json();
}

export async function linkPatientToDoctor(doctorId, payload) {
  const res = await fetch(`${API_BASE}/api/doctors/${doctorId}/link-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('Failed to link patient to doctor');
  }

  return res.json();
}
