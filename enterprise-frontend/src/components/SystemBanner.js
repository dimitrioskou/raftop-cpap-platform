import React from 'react';

export function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        background: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fecaca',
        borderRadius: 12,
        padding: 14
      }}
    >
      {message}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        background: '#ecfdf5',
        color: '#166534',
        border: '1px solid #bbf7d0',
        borderRadius: 12,
        padding: 14
      }}
    >
      {message}
    </div>
  );
}