export function priorityTone(priority = '') {
  const value = String(priority || '').toLowerCase();

  if (value === 'critical') return 'danger';
  if (value === 'warning') return 'warning';
  if (value === 'success') return 'success';
  return 'neutral';
}

export function statusTone(status = '') {
  const value = String(status || '').toLowerCase();

  if (value === 'completed') return 'success';
  if (value === 'in_progress') return 'warning';
  if (value === 'assigned') return 'neutral';
  return 'neutral';
}

export function statusLabel(status = '') {
  const value = String(status || '').toLowerCase();

  if (value === 'completed') return 'Completed';
  if (value === 'in_progress') return 'In Progress';
  if (value === 'assigned') return 'Assigned';
  return status || 'Unknown';
}

export function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}