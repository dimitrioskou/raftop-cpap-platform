const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function getNavCounts() {
  const [tasksRes, referralsRes, devicesRes] = await Promise.all([
    fetch(`${API_BASE}/api/tasks/overview`),
    fetch(`${API_BASE}/api/referrals?status=new`),
    fetch(`${API_BASE}/api/devices?status=offline`)
  ]);

  if (!tasksRes.ok || !referralsRes.ok || !devicesRes.ok) {
    throw new Error('Failed to fetch nav counts');
  }

  const tasksData = await tasksRes.json();
  const referralsData = await referralsRes.json();
  const devicesData = await devicesRes.json();

  return {
    pendingTasks: tasksData?.pending || 0,
    newReferrals: Array.isArray(referralsData) ? referralsData.length : 0,
    offlineDevices: Array.isArray(devicesData) ? devicesData.length : 0
  };
}
