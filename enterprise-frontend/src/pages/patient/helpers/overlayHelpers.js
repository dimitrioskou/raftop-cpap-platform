export function toneFromStatus(status = '') {
  const value = String(status || '').toLowerCase();

  if (value === 'connected') return 'success';
  if (value === 'fallback') return 'warning';
  if (value === 'missing') return 'danger';
  return 'neutral';
}

export function toneFromCorrelationType(type = '') {
  const value = String(type || '').toLowerCase();

  if (value === 'positive' || value === 'success') return 'success';
  if (value === 'warning') return 'warning';
  if (value === 'danger' || value === 'negative') return 'danger';
  return 'neutral';
}

export function formatDateLabel(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium'
  }).format(date);
}

export function symptomLabel(value = '') {
  const key = String(value || '').toLowerCase();

  const map = {
    dryness: 'Dryness',
    mask_discomfort: 'Mask Discomfort',
    frequent_awakenings: 'Frequent Awakenings',
    felt_ok: 'Felt OK',
    congestion: 'Congestion',
    headache: 'Headache'
  };

  return map[key] || value;
}