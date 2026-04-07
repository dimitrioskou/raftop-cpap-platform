function normalizeBaseUrl(rawBaseUrl = '') {
  if (!rawBaseUrl) {
    return '';
  }

  return String(rawBaseUrl).replace(/\/+$/, '');
}

function normalizePath(path = '') {
  if (!path) {
    return '';
  }

  const normalized = String(path).startsWith('/') ? String(path) : `/${path}`;
  return normalized;
}

function joinBaseAndPath(baseUrl, path) {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const normalizedPath = normalizePath(path);

  if (!normalizedBase) {
    return normalizedPath;
  }

  const baseEndsWithApi = normalizedBase.endsWith('/api');
  const pathStartsWithApi = normalizedPath.startsWith('/api/');

  if (baseEndsWithApi && pathStartsWithApi) {
    return `${normalizedBase}${normalizedPath.replace(/^\/api/, '')}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

function buildUrl(path, query = {}) {
  const baseUrl = process.env.REACT_APP_API_URL || '';
  const finalPath = joinBaseAndPath(baseUrl, path);
  const url = new URL(finalPath, window.location.origin);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function request(method, path, { tenantId, query, body } = {}) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return payload;
}

const apiClient = {
  get(path, { tenantId, query } = {}) {
    return request('GET', path, { tenantId, query });
  },

  post(path, body = {}, { tenantId, query } = {}) {
    return request('POST', path, { tenantId, query, body });
  }
};

export default apiClient;