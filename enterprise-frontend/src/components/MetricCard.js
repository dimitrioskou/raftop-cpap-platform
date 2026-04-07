import React from 'react';

export default function MetricCard({ label, value, hint, tone = 'blue' }) {
  const tones = {
    blue: {
      bg: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
      border: '#bfdbfe',
      value: '#1d4ed8',
      hint: '#475467'
    },
    purple: {
      bg: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
      border: '#ddd6fe',
      value: '#7c3aed',
      hint: '#475467'
    },
    green: {
      bg: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
      border: '#bbf7d0',
      value: '#15803d',
      hint: '#475467'
    },
    orange: {
      bg: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)',
      border: '#fed7aa',
      value: '#c2410c',
      hint: '#475467'
    },
    dark: {
      bg: 'linear-gradient(135deg, #172033 0%, #0f172a 100%)',
      border: '#243041',
      value: '#ffffff',
      hint: '#cbd5e1'
    }
  };

  const palette = tones[tone] || tones.blue;

  return (
    <div
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 18,
        padding: 16,
        boxShadow: '0 8px 20px rgba(16,24,40,0.08)'
      }}
    >
      <div
        style={{
          color: tone === 'dark' ? '#cbd5e1' : '#667085',
          fontSize: 13,
          marginBottom: 8,
          fontWeight: 700
        }}
      >
        {label || 'Metric'}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: palette.value,
          lineHeight: 1.05
        }}
      >
        {value ?? '—'}
      </div>

      {hint ? (
        <div
          style={{
            color: palette.hint,
            fontSize: 12,
            marginTop: 8
          }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}