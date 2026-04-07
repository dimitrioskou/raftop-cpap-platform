function normalizeBaseUrl(value) {
  const raw = String(value || '').trim();

  if (!raw) {
    return '';
  }

  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

export const API_BASE_URL = normalizeBaseUrl(
  process.env.REACT_APP_API_BASE_URL
);

export function buildApiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/')
    ? String(path)
    : `/${String(path || '')}`;

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (!API_BASE_URL) {
    return normalizedPath;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}