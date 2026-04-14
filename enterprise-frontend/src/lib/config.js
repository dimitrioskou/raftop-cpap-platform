function normalizeBaseUrl(value) {
  const raw = String(value || '').trim();

  if (!raw) {
    return '';
  }

  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

export const API_BASE_URL = normalizeBaseUrl(
  process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    'https://raftop-enterprise-backend.onrender.com'
);

export function buildApiUrl(path) {
  const rawPath = String(path || '').trim();

  if (!rawPath) {
    return API_BASE_URL;
  }

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return `${API_BASE_URL}${normalizedPath}`;
}