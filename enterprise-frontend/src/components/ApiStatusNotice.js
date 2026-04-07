import React from 'react';

function getPalette(status) {
  if (status === 'error') {
    return {
      background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      border: '#fda4af',
      title: '#b42318',
      text: '#7a271a'
    };
  }

  if (status === 'success') {
    return {
      background: 'linear-gradient(135deg, #ecfdf3 0%, #dcfce7 100%)',
      border: '#86efac',
      title: '#027a48',
      text: '#05603a'
    };
  }

  return {
    background: 'linear-gradient(135deg, #fffaeb 0%, #fef3c7 100%)',
    border: '#fcd34d',
    title: '#b54708',
    text: '#7a2e0e'
  };
}

export default function ApiStatusNotice({
  status = 'warning',
  title,
  message,
  details,
  compact = false,
  style = {}
}) {
  const palette = getPalette(status);

  return (
    <div
      style={{
        background: palette.background,
        border: `1px solid ${palette.border}`,
        borderRadius: 16,
        padding: compact ? '12px 14px' : '16px 18px',
        boxShadow: '0 8px 20px rgba(16,24,40,0.05)',
        ...style
      }}
    >
      <div
        style={{
          color: palette.title,
          fontWeight: 900,
          fontSize: compact ? 14 : 15,
          marginBottom: 6
        }}
      >
        {title || 'Notice'}
      </div>

      {message ? (
        <div
          style={{
            color: palette.text,
            fontSize: 14,
            lineHeight: 1.5
          }}
        >
          {message}
        </div>
      ) : null}

      {details ? (
        <div
          style={{
            color: palette.text,
            fontSize: 12,
            lineHeight: 1.55,
            marginTop: 8,
            wordBreak: 'break-word',
            opacity: 0.96
          }}
        >
          {details}
        </div>
      ) : null}
    </div>
  );
}