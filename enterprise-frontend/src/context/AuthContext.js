import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'raftop_auth_token';
const USER_KEY = 'raftop_auth_user';

const LEGACY_KEYS = [
  'token',
  'authToken',
  'accessToken',
  'user',
  'authUser',
  'userRole',
  'raftop_token',
  'raftop_user'
];

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

function buildUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

function safeJsonParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

function normalizeRole(value) {
  return String(value || 'guest').trim().toLowerCase();
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const id = user.id ?? user.userId ?? user.user_id ?? null;
  const tenantId =
    user.tenantId ??
    user.tenant_id ??
    user.organizationId ??
    user.organization_id ??
    null;

  const fullName =
    user.fullName ??
    user.full_name ??
    user.name ??
    user.display_name ??
    null;

  return {
    id,
    userId: user.userId ?? user.id ?? user.user_id ?? null,
    email: user.email ?? user.userEmail ?? user.user_email ?? null,
    role: normalizeRole(user.role ?? user.userRole ?? user.user_role ?? 'guest'),
    tenantId,
    organizationId: user.organizationId ?? user.organization_id ?? tenantId,
    fullName,
    name: fullName
  };
}

function normalizeAuthPayload(payload) {
  const token = payload?.token || payload?.accessToken || '';
  const user = normalizeUser(payload?.user || null);

  return {
    ok: Boolean(payload?.ok && token && user),
    token,
    user
  };
}

async function readJsonSafely(response) {
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

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch (_error) {
    return '';
  }
}

function readStoredUser() {
  try {
    return normalizeUser(safeJsonParse(localStorage.getItem(USER_KEY)));
  } catch (_error) {
    return null;
  }
}

function clearLegacyAuthKeys() {
  try {
    LEGACY_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch (_error) {
    // ignore storage cleanup issues
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredToken());
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  const bootstrapRef = useRef(false);

  const persistAuth = useCallback((nextToken, nextUser) => {
    const normalizedUser = normalizeUser(nextUser);

    try {
      if (nextToken) {
        localStorage.setItem(TOKEN_KEY, nextToken);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }

      if (normalizedUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (_error) {
      // ignore storage issues
    }

    setToken(nextToken || '');
    setUser(normalizedUser || null);
  }, []);

  const clearAuth = useCallback(() => {
    clearLegacyAuthKeys();
    persistAuth('', null);
  }, [persistAuth]);

  const refreshMe = useCallback(async () => {
    const existingToken = readStoredToken();

    if (!existingToken) {
      clearAuth();
      return {
        ok: false,
        message: 'No stored token'
      };
    }

    try {
      const response = await fetch(buildUrl('/api/auth/me'), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${existingToken}`
        },
        credentials: 'include'
      });

      const payload = await readJsonSafely(response);

      if (!response.ok || !payload?.ok) {
        clearAuth();
        return {
          ok: false,
          message: payload?.message || 'Session restore failed'
        };
      }

      const normalizedUser = normalizeUser(payload?.user);

      if (!normalizedUser) {
        clearAuth();
        return {
          ok: false,
          message: 'Invalid user payload'
        };
      }

      persistAuth(existingToken, normalizedUser);

      return {
        ok: true,
        token: existingToken,
        user: normalizedUser
      };
    } catch (error) {
      clearAuth();
      return {
        ok: false,
        message: error?.message || 'Session restore failed'
      };
    }
  }, [clearAuth, persistAuth]);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);

      try {
        const response = await fetch(buildUrl('/api/auth/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            email: String(email || '').trim(),
            password: String(password || '')
          })
        });

        const payload = await readJsonSafely(response);
        const normalized = normalizeAuthPayload(payload);

        if (!response.ok || !normalized.ok) {
          throw new Error(payload?.message || 'Login failed');
        }

        clearLegacyAuthKeys();
        persistAuth(normalized.token, normalized.user);

        return {
          ok: true,
          token: normalized.token,
          user: normalized.user
        };
      } finally {
        setLoading(false);
      }
    },
    [persistAuth]
  );

  const loginWithPayload = useCallback(
    async (payload) => {
      const normalized = normalizeAuthPayload(payload);

      if (!normalized.ok) {
        throw new Error(payload?.message || 'Manual login payload is invalid');
      }

      clearLegacyAuthKeys();
      persistAuth(normalized.token, normalized.user);

      return {
        ok: true,
        token: normalized.token,
        user: normalized.user
      };
    },
    [persistAuth]
  );

  const logout = useCallback(async () => {
    try {
      const existingToken = readStoredToken();

      await fetch(buildUrl('/api/auth/logout'), {
        method: 'POST',
        headers: existingToken
          ? {
              Authorization: `Bearer ${existingToken}`
            }
          : {},
        credentials: 'include'
      });
    } catch (_error) {
      // ignore remote logout failure
    }

    clearAuth();
  }, [clearAuth]);

  useEffect(() => {
    if (bootstrapRef.current) {
      return;
    }

    bootstrapRef.current = true;

    (async () => {
      setBootstrapping(true);
      await refreshMe();
      setBootstrapping(false);
    })();
  }, [refreshMe]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      bootstrapping,
      isAuthenticated: Boolean(token && user),
      login,
      loginWithPayload,
      logout,
      refreshMe,
      clearAuth
    }),
    [token, user, loading, bootstrapping, login, loginWithPayload, logout, refreshMe, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}