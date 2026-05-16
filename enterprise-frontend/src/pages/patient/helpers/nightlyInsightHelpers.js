export function badgeToneFromInsightType(type) {
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

export function buildFlagCards(flags = {}) {
  return [
    {
      key: 'lowUsage',
      label: 'Low Usage',
      active: Boolean(flags.lowUsage),
      tone: flags.lowUsage ? 'warning' : 'success'
    },
    {
      key: 'highLeak',
      label: 'High Leak',
      active: Boolean(flags.highLeak),
      tone: flags.highLeak ? 'warning' : 'success'
    },
    {
      key: 'residualAhiRisk',
      label: 'Residual AHI',
      active: Boolean(flags.residualAhiRisk),
      tone: flags.residualAhiRisk ? 'warning' : 'success'
    },
    {
      key: 'fragmentedSleep',
      label: 'Fragmented',
      active: Boolean(flags.fragmentedSleep),
      tone: flags.fragmentedSleep ? 'warning' : 'success'
    },
    {
      key: 'maskSealConcern',
      label: 'Mask Seal',
      active: Boolean(flags.maskSealConcern),
      tone: flags.maskSealConcern ? 'warning' : 'success'
    }
  ];
}

export function compareToneFromDelta(deltaText = '', preferLower = false) {
  const raw = String(deltaText || '').trim();
  const value = Number(raw.replace(/[^\d.-]/g, ''));

  if (!Number.isFinite(value)) return 'neutral';
  if (value === 0) return 'neutral';

  if (preferLower) {
    return value < 0 ? 'success' : 'warning';
  }

  return value > 0 ? 'success' : 'warning';
}