const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function getReportsOverview() {
  const res = await fetch(`${API_BASE}/api/reports/overview`);
  if (!res.ok) {
    throw new Error('Failed to fetch reports overview');
  }
  return res.json();
}

export async function getDeviceReports() {
  const res = await fetch(`${API_BASE}/api/reports/device-list`);
  if (!res.ok) {
    throw new Error('Failed to fetch device reports');
  }
  return res.json();
}

export async function getSingleDeviceReport(id) {
  const res = await fetch(`${API_BASE}/api/reports/device/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch single device report');
  }
  return res.json();
}