export function buttonStyle(variant = 'primary') {
  const base = {
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: 14
  };

  if (variant === 'secondary') {
    return {
      ...base,
      border: '1px solid #d0d5dd',
      background: '#ffffff',
      color: '#344054',
      boxShadow: '0 2px 8px rgba(16,24,40,0.06)'
    };
  }

  if (variant === 'success') {
    return {
      ...base,
      border: '1px solid #16a34a',
      background: 'linear-gradient(135deg, #22c55e 0%, #166534 100%)',
      color: '#ffffff',
      boxShadow: '0 8px 18px rgba(22,163,74,0.20)'
    };
  }

  if (variant === 'danger') {
    return {
      ...base,
      border: '1px solid #d92d20',
      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
      color: '#ffffff',
      boxShadow: '0 8px 18px rgba(217,45,32,0.20)'
    };
  }

  return {
    ...base,
    border: '1px solid #1d4ed8',
    background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
    color: '#ffffff',
    boxShadow: '0 8px 18px rgba(37,99,235,0.20)'
  };
}

export function quickActionCardStyle(accent = 'blue') {
  const accents = {
    blue: {
      border: '#93c5fd',
      bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
    },
    green: {
      border: '#86efac',
      bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
    },
    orange: {
      border: '#fdba74',
      bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
    },
    red: {
      border: '#fda4af',
      bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)'
    },
    dark: {
      border: '#243041',
      bg: 'linear-gradient(135deg, #172033 0%, #0f172a 100%)'
    }
  };

  const palette = accents[accent] || accents.blue;

  return {
    display: 'block',
    textDecoration: 'none',
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: 16,
    padding: 18,
    color: accent === 'dark' ? '#ffffff' : '#101828',
    boxShadow: '0 8px 20px rgba(16,24,40,0.08)'
  };
}

export function panelStyle(dark = false) {
  return {
    background: dark
      ? 'linear-gradient(135deg, #172033 0%, #0f172a 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    border: dark ? '1px solid #243041' : '1px solid #e5e7eb',
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 12px 24px rgba(16,24,40,0.08)'
  };
}

export function softFieldCardStyle() {
  return {
    border: '1px solid #eaecf0',
    borderRadius: 14,
    padding: 12,
    background: 'linear-gradient(135deg, #ffffff 0%, #fcfcfd 100%)'
  };
}

export function toolbarCardStyle() {
  return {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 16,
    boxShadow: '0 8px 20px rgba(16,24,40,0.05)'
  };
}

export function tableContainerStyle() {
  return {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 10px 24px rgba(16,24,40,0.07)'
  };
}

export function statusBadgeStyle(kind = 'info') {
  const palettes = {
    success: {
      bg: '#ecfdf3',
      color: '#027a48',
      border: '#abefc6'
    },
    warning: {
      bg: '#fffaeb',
      color: '#b54708',
      border: '#fedf89'
    },
    danger: {
      bg: '#fff1f2',
      color: '#b42318',
      border: '#fecdca'
    },
    dark: {
      bg: '#172033',
      color: '#e2e8f0',
      border: '#243041'
    },
    info: {
      bg: '#eff6ff',
      color: '#175cd3',
      border: '#bfdbfe'
    }
  };

  const palette = palettes[kind] || palettes.info;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: `1px solid ${palette.border}`,
    background: palette.bg,
    color: palette.color
  };
}