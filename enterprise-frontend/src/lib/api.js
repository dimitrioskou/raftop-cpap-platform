import { buildApiUrl } from './config';

const TOKEN_KEY = 'raftop_auth_token';
const USER_KEY = 'raftop_auth_user';

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch (_error) {
    return '';
  }
}

function clearStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authUser');
    localStorage.removeItem('raftop_token');
    localStorage.removeItem('raftop_user');

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('authUser');
  } catch (_error) {
    // ignore storage cleanup issues
  }
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {
      ok: false,
      message: text
    };
  }
}

function buildHeaders(customHeaders = {}, hasBody = false) {
  const token = getStoredToken();

  const headers = {
    Accept: 'application/json',
    ...customHeaders
  };

  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function handleUnauthorized() {
  clearStoredAuth();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raftop:unauthorized'));

    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  }
}

export async function apiFetch(path, options = {}) {
  const method = options.method || 'GET';
  const hasBody = typeof options.body !== 'undefined' && options.body !== null;

  const response = await fetch(buildApiUrl(path), {
    method,
    credentials: 'include',
    headers: buildHeaders(options.headers || {}, hasBody),
    body:
      hasBody && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body
  });

  const payload = await parseResponse(response);

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error(payload?.message || 'Unauthorized');
  }

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return payload;
}

export function apiGet(path, options = {}) {
  return apiFetch(path, {
    ...options,
    method: 'GET'
  });
}

export function apiPost(path, body, options = {}) {
  return apiFetch(path, {
    ...options,
    method: 'POST',
    body
  });
}

export function apiPut(path, body, options = {}) {
  return apiFetch(path, {
    ...options,
    method: 'PUT',
    body
  });
}

export function apiPatch(path, body, options = {}) {
  return apiFetch(path, {
    ...options,
    method: 'PATCH',
    body
  });
}

export function apiDelete(path, options = {}) {
  return apiFetch(path, {
    ...options,
    method: 'DELETE'
  });
}

export function getAuthToken() {
  return getStoredToken();
}

export function clearAuthStorage() {
  clearStoredAuth();
}