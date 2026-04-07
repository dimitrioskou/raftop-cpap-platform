export async function fetchJson(url, options = {}) {
  const token = localStorage.getItem('raftop_auth_token') || '';

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    signal: options.signal
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  let payload;
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }
  } else {
    try {
      payload = await response.text();
    } catch (error) {
      payload = null;
    }
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    if (payload && typeof payload === 'object') {
      message =
        payload.message ||
        payload.error ||
        payload.debug ||
        message;
    } else if (typeof payload === 'string' && payload.trim()) {
      message = payload.trim();
    }

    throw new Error(message);
  }

  return payload;
}

export function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  try {
    return new Intl.DateTimeFormat('el-GR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    return date.toLocaleString();
  }
}

export function resolveBasePath(pathname = '') {
  if (!pathname) return '';

  const clean = String(pathname).split('?')[0].split('#')[0];

  if (clean === '/tenant/patients') return '/tenant/patients';
  if (clean.startsWith('/tenant/patients/')) return '/tenant/patients';

  if (clean === '/tenant/devices') return '/tenant/devices';
  if (clean.startsWith('/tenant/devices/')) return '/tenant/devices';

  return clean;
}

export function buildApiNotice({ apiError, usingFallback, entityLabel }) {
  if (!apiError && !usingFallback) return null;

  if (usingFallback && apiError) {
    return {
      status: 'warning',
      title: 'Fallback mode enabled',
      message: apiError || `Showing fallback ${entityLabel || 'data'}.`
    };
  }

  if (apiError) {
    return {
      status: 'error',
      title: 'API error',
      message: apiError
    };
  }

  if (usingFallback) {
    return {
      status: 'warning',
      title: 'Fallback mode enabled',
      message: `Showing fallback ${entityLabel || 'data'}.`
    };
  }

  return null;
}