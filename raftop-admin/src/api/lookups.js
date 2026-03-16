const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function getPatientsLookup() {
  const res = await fetch(`${API_BASE}/api/patients`);

  if (!res.ok) {
    throw new Error('Failed to fetch patients');
  }

  return res.json();
}

export async function getDoctorsLookup() {
  const res = await fetch(`${API_BASE}/api/doctors`);

  if (!res.ok) {
    throw new Error('Failed to fetch doctors');
  }

  return res.json();
}

export async function getClinicsLookup() {
  const res = await fetch(`${API_BASE}/api/saas/clinics`);

  if (!res.ok) {
    throw new Error('Failed to fetch clinics');
  }

  return res.json();
}

export async function getOrganizationsLookup() {
  const res = await fetch(`${API_BASE}/api/saas/organizations`);

  if (!res.ok) {
    throw new Error('Failed to fetch organizations');
  }

  return res.json();
}
