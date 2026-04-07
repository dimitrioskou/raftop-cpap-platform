import React from 'react';
import { buttonStyle } from '../utils/uiStyles';

export default function PageStateCard({
  title,
  message,
  actionLabel,
  onAction
}) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e5e7eb',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 10px 24px rgba(16,24,40,0.06)'
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: '#101828',
          marginBottom: 8
        }}
      >
        {title || 'State'}
      </div>

      <div
        style={{
          color: '#667085',
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: actionLabel ? 16 : 0,
          maxWidth: 720
        }}
      >
        {message || 'No additional details available.'}
      </div>

      {actionLabel && typeof onAction === 'function' ? (
        <button
          type="button"
          onClick={onAction}
          style={buttonStyle('primary')}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}