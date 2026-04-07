import React from 'react';

const toneMap = {
  loading: {
    background: '#eff6ff',
    border: '#bfdbfe',
    color: '#1d4ed8',
    title: 'Loading'
  },
  fallback: {
    background: '#fff7ed',
    border: '#fdba74',
    color: '#9a3412',
    title: 'Using fallback data'
  },
  error: {
    background: '#fef2f2',
    border: '#fca5a5',
    color: '#b91c1c',
    title: 'Error'
  },
  success: {
    background: '#f0fdf4',
    border: '#86efac',
    color: '#166534',
    title: 'Success'
  }
};

export default function ApiStatusNotice({
  state = 'loading',
  message = ''
}) {
  if (!message) {
    return null;
  }

  const tone = toneMap[state] || toneMap.loading;

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${tone.border}`,
        background: tone.background,
        color: tone.color,
        padding: 16
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 6
        }}
      >
        {tone.title}
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          fontWeight: 700
        }}
      >
        {message}
      </div>
    </div>
  );
}