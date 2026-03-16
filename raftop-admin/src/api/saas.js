const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function getSaasOverview() {
  const res = await fetch(`${API_BASE}/api/saas/overview`);
  if (!res.ok) throw new Error('Failed to fetch SaaS overview');
  return res.json();
}

export async function getOrganizations() {
  const res = await fetch(`${API_BASE}/api/saas/organizations`);
  if (!res.ok) throw new Error('Failed to fetch organizations');
  return res.json();
}

export async function getClinics() {
  const res = await fetch(`${API_BASE}/api/saas/clinics`);
  if (!res.ok) throw new Error('Failed to fetch clinics');
  return res.json();
}

export async function getPlatformUsers() {
  const res = await fetch(`${API_BASE}/api/saas/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}