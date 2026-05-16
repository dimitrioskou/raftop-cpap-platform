import React, { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

function apiUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

function inputStyle() {
  return {
    width: '100%',
    border: '1px solid #d0d5dd',
    borderRadius: 14,
    padding: '14px 16px',
    outline: 'none',
    fontSize: 14,
    boxSizing: 'border-box'
  };
}

function buttonStyle(disabled, tone = 'blue') {
  const gradients = {
    blue: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
    teal: 'linear-gradient(135deg, #0891b2 0%, #155e75 100%)',
    neutral: '#ffffff'
  };

  return {
    width: '100%',
    border: tone === 'neutral' ? '1px solid #d0d5dd' : '1px solid transparent',
    borderRadius: 14,
    padding: '14px 16px',
    background: gradients[tone],
    color: tone === 'neutral' ? '#344054' : '#fff',
    fontWeight: 900,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow:
      tone === 'neutral'
        ? '0 2px 8px rgba(16,24,40,0.06)'
        : '0 10px 20px rgba(37,99,235,0.20)',
    opacity: disabled ? 0.7 : 1
  };
}

const DEMO_USERS = [
  {
    label: 'Tenant Admin',
    email: 'admin@raftop.local',
    password: 'admin123!'
  }
];

async function readJsonSafely(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}

function getDefaultRedirectForUser(user, fallbackPath) {
  const role = String(user?.role || '').toLowerCase();

  if (fallbackPath && fallbackPath !== '/login') {
    return fallbackPath;
  }

  if (role === 'patient') {
    return '/patient/dashboard';
  }

  return '/tenant/dashboard';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    loginWithPayload,
    loading,
    isAuthenticated,
    bootstrapping,
    user
  } = useAuth();

  const [email, setEmail] = useState('admin@raftop.local');
  const [password, setPassword] = useState('admin123!');
  const [error, setError] = useState('');
  const [patientLoading, setPatientLoading] = useState(false);

  const redirectTo = useMemo(() => {
    return location.state?.from || '';
  }, [location.state]);

  if (bootstrapping) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 20,
          background:
            'radial-gradient(circle at top left, rgba(29,78,216,0.10) 0%, transparent 18%), radial-gradient(circle at top right, rgba(124,58,237,0.10) 0%, transparent 16%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)'
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 24,
            padding: 28,
            boxShadow: '0 18px 34px rgba(0,0,0,0.10)',
            fontWeight: 800,
            color: '#101828'
          }}
        >
          Restoring session...
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRedirectForUser(user, redirectTo)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const result = await login(email, password);

      if (result?.ok && result?.user) {
        navigate(getDefaultRedirectForUser(result.user, redirectTo), { replace: true });
        return;
      }

      setError('Login failed');
    } catch (err) {
      setError(err?.message || 'Login failed');
    }
  };

  const handleFillDemo = (demoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    setError('');
  };

  const handlePatientDemoLogin = async () => {
    setPatientLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/auth/dev-patient-login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        credentials: 'include'
      });

      const payload = await readJsonSafely(response);

      if (!response.ok || !payload?.ok || !payload?.token || !payload?.user) {
        throw new Error(payload?.message || 'Dev patient login failed');
      }

      const result = await loginWithPayload(payload);

      navigate(getDefaultRedirectForUser(result.user, redirectTo), { replace: true });
    } catch (err) {
      setError(err?.message || 'Dev patient login failed');
    } finally {
      setPatientLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background:
          'radial-gradient(circle at top left, rgba(29,78,216,0.10) 0%, transparent 18%), radial-gradient(circle at top right, rgba(124,58,237,0.10) 0%, transparent 16%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 18px 34px rgba(0,0,0,0.10)'
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 900, color: '#1d4ed8', letterSpacing: 0.6 }}>
          RAFTOP ENTERPRISE
        </div>

        <h1 style={{ margin: '8px 0 6px', fontSize: 30, fontWeight: 900, color: '#101828' }}>
          Sign in
        </h1>

        <div style={{ color: '#667085', marginBottom: 18 }}>
          Provider and patient access inside the same ecosystem.
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#667085', marginBottom: 6 }}>Email</div>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle()}
              placeholder="admin@raftop.local"
              autoComplete="username"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#667085', marginBottom: 6 }}>Password</div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle()}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div
              style={{
                marginBottom: 14,
                padding: '10px 12px',
                borderRadius: 12,
                background: '#fff1f2',
                border: '1px solid #fda4af',
                color: '#b42318',
                fontSize: 14,
                fontWeight: 700
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || patientLoading}
            style={buttonStyle(loading || patientLoading)}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            disabled={loading || patientLoading}
            onClick={handlePatientDemoLogin}
            style={buttonStyle(loading || patientLoading, 'teal')}
          >
            {patientLoading ? 'Opening patient workspace...' : 'Continue as Patient Demo'}
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 14,
            background: '#f8fafc',
            border: '1px solid #e5e7eb',
            color: '#475467',
            fontSize: 13,
            lineHeight: 1.7
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Demo accounts</div>

          {DEMO_USERS.map((demoUser) => (
            <div
              key={demoUser.email}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '8px 0',
                borderTop: '1px solid #eaecf0'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#101828' }}>{demoUser.label}</div>
                <div>{demoUser.email}</div>
                <div>{demoUser.password}</div>
              </div>

              <button
                type="button"
                onClick={() => handleFillDemo(demoUser)}
                style={{
                  border: '1px solid #d0d5dd',
                  background: '#fff',
                  borderRadius: 10,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}
              >
                Use
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}