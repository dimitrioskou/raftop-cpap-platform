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
  'raftop_token',
  'raftop_user'
];

function safeJsonParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
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
    return safeJsonParse(localStorage.getItem(USER_KEY));
  } catch (_error) {
    return null;
  }
}

function clearLegacyAuthKeys() {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('authUser');
  } catch (_error) {
    // ignore storage cleanup issues
  }
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  return {
    id: user.id ?? user.userId ?? user.user_id ?? null,
    userId: user.userId ?? user.id ?? user.user_id ?? null,
    email: user.email ?? user.userEmail ?? user.user_email ?? null,
    name: user.name ?? user.full_name ?? user.fullName ?? null,
    role: String(user.role ?? user.userRole ?? user.user_role ?? 'guest').toLowerCase(),
    tenantId:
      user.tenantId ??
      user.tenant_id ??
      user.organizationId ??
      user.organization_id ??
      null,
    organizationId:
      user.organizationId ??
      user.organization_id ??
      user.tenantId ??
      user.tenant_id ??
      null
  };
}

function normalizeAuthPayload(payload) {
  const token = payload?.token || payload?.accessToken || '';
  const user = normalizeUser(payload?.user || null);

  return {
    ok: Boolean(payload?.ok && token),
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

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredToken());
  const [user, setUser] = useState(() => normalizeUser(readStoredUser()));
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const didBootstrapRef = useRef(false);

  const persistAuth = useCallback((nextToken, nextUser) => {
    try {
      if (nextToken) {
        localStorage.setItem(TOKEN_KEY, nextToken);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }

      if (nextUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (_error) {
      // ignore storage issues
    }

    setToken(nextToken || '');
    setUser(nextUser || null);
  }, []);

  const clearAuth = useCallback(() => {
    clearLegacyAuthKeys();
    persistAuth('', null);
  }, [persistAuth]);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);

      try {
        const response = await fetch('/api/auth/login', {
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

  const logout = useCallback(async () => {
    try {
      const existingToken = readStoredToken();

      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: existingToken
          ? {
              Authorization: `Bearer ${existingToken}`
            }
          : {},
        credentials: 'include'
      });
    } catch (_error) {
      // ignore logout request failures
    }

    clearAuth();
  }, [clearAuth]);

  const refreshMe = useCallback(async () => {
    const existingToken = readStoredToken();

    if (!existingToken) {
      clearAuth();
      return {
        ok: false
      };
    }

    try {
      const response = await fetch('/api/auth/me', {
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

      const normalizedUser = normalizeUser(payload?.user || null);
      persistAuth(existingToken, normalizedUser);

      return {
        ok: true,
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

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }

    didBootstrapRef.current = true;

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
      logout,
      refreshMe,
      clearAuth
    }),
    [token, user, loading, bootstrapping, login, logout, refreshMe, clearAuth]
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