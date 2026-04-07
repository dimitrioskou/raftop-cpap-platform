export function buttonStyle(variant = 'primary') {
  const base = {
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 700,
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
      boxShadow: '0 1px 2px rgba(16,24,40,0.04)'
    };
  }

  if (variant === 'success') {
    return {
      ...base,
      border: '1px solid #12b76a',
      background: '#12b76a',
      color: '#ffffff',
      boxShadow: '0 4px 10px rgba(18,183,106,0.18)'
    };
  }

  if (variant === 'danger') {
    return {
      ...base,
      border: '1px solid #d92d20',
      background: '#d92d20',
      color: '#ffffff',
      boxShadow: '0 4px 10px rgba(217,45,32,0.18)'
    };
  }

  return {
    ...base,
    border: '1px solid #175cd3',
    background: '#175cd3',
    color: '#ffffff',
    boxShadow: '0 4px 10px rgba(23,92,211,0.18)'
  };
}

export function quickActionCardStyle(accent = 'blue') {
  const accents = {
    blue: {
      border: '#b2ddff',
      bg: '#f5faff'
    },
    green: {
      border: '#abefc6',
      bg: '#f6fef9'
    },
    orange: {
      border: '#fedf89',
      bg: '#fffcf5'
    },
    red: {
      border: '#fecdca',
      bg: '#fff7f6'
    }
  };

  const palette = accents[accent] || accents.blue;

  return {
    display: 'block',
    textDecoration: 'none',
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: 14,
    padding: 16,
    color: '#101828',
    boxShadow: '0 1px 2px rgba(16,24,40,0.04)'
  };
}