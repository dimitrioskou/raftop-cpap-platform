const SUPER_ADMIN_FETCH_PATCH_FLAG = '__RAFTOP_SUPER_ADMIN_FETCH_PATCHED__';

function getSuperAdminKey() {
  try {
    return (
      localStorage.getItem('super_admin_api_key') ||
      localStorage.getItem('superAdminApiKey') ||
      process.env.REACT_APP_SUPER_ADMIN_API_KEY ||
      ''
    );
  } catch (error) {
    return process.env.REACT_APP_SUPER_ADMIN_API_KEY || '';
  }
}

function isSuperAdminUrl(input) {
  try {
    if (typeof input === 'string') {
      return input.includes('/api/super-admin/');
    }

    if (input instanceof URL) {
      return input.href.includes('/api/super-admin/');
    }

    if (input && typeof input.url === 'string') {
      return input.url.includes('/api/super-admin/');
    }

    return false;
  } catch (error) {
    return false;
  }
}

function getExistingHeaders(input, init) {
  if (init && init.headers) {
    return new Headers(init.headers);
  }

  if (input && input.headers) {
    return new Headers(input.headers);
  }

  return new Headers();
}

(function patchSuperAdminFetch() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!window.fetch) {
    return;
  }

  if (window[SUPER_ADMIN_FETCH_PATCH_FLAG]) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = function raftopFetch(input, init = {}) {
    if (!isSuperAdminUrl(input)) {
      return originalFetch(input, init);
    }

    const headers = getExistingHeaders(input, init);
    const key = getSuperAdminKey();

    if (key && !headers.has('x-super-admin-key')) {
      headers.set('x-super-admin-key', key);
    }

    return originalFetch(input, {
      ...init,
      headers
    });
  };

  window[SUPER_ADMIN_FETCH_PATCH_FLAG] = true;
})();