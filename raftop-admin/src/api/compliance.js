const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function getComplianceOverview() {
  const res = await fetch(`${API_BASE}/api/compliance/overview`);

  if (!res.ok) {
    throw new Error('Failed to fetch compliance overview');
  }

  return res.json();
}

export async function getCompliancePatients(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/compliance/patients${query ? `?${query}` : ''}`);

  if (!res.ok) {
    throw new Error('Failed to fetch compliance patients');
  }

  return res.json();
}

export async function createComplianceRecord(payload) {
  const res = await fetch(`${API_BASE}/api/compliance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('Failed to create compliance record');
  }

  return res.json();
}

export async function updateComplianceRecord(id, payload) {
  const res = await fetch(`${API_BASE}/api/compliance/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('Failed to update compliance record');
  }

  return res.json();
}

export async function deleteComplianceRecord(id) {
  const res = await fetch(`${API_BASE}/api/compliance/${id}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    throw new Error('Failed to delete compliance record');
  }

  return res.json();
}
