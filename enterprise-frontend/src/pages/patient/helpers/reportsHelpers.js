export function toneFromRiskLevel(riskLevel = '') {
  const value = String(riskLevel || '').toLowerCase();

  if (value === 'high') return 'danger';
  if (value === 'medium') return 'warning';
  if (value === 'low') return 'success';
  return 'neutral';
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

export function labelFromReportType(reportType = '') {
  const value = String(reportType || '').toLowerCase();

  if (value === 'patient_safe') return 'Patient Safe';
  if (value === 'clinician') return 'Clinician';
  return reportType || 'Report';
}