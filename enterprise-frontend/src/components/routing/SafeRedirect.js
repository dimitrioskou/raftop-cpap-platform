import React, { useEffect } from 'react';

function toHashPath(path) {
  const raw = String(path || '/').trim();

  if (!raw) return '#/';
  if (raw.startsWith('#')) return raw;
  if (raw.startsWith('/')) return `#${raw}`;
  return `#/${raw}`;
}

export default function SafeRedirect({ to = '/' }) {
  useEffect(() => {
    const targetHash = toHashPath(to);

    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }, [to]);

  return null;
}