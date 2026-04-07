import React from 'react';

const styles = {
  critical: {
    background: '#fee2e2',
    color: '#b91c1c'
  },
  high: {
    background: '#ffedd5',
    color: '#c2410c'
  },
  medium: {
    background: '#fef3c7',
    color: '#a16207'
  },
  low: {
    background: '#dcfce7',
    color: '#166534'
  }
};

export default function PriorityBadge({ priority }) {
  const key = (priority || 'low').toLowerCase();
  const style = styles[key] || styles.low;

  return (
    <span
      style={{
        ...style,
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        display: 'inline-block'
      }}
    >
      {key}
    </span>
  );
}