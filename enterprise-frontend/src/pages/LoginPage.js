import React, { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

function buttonStyle(disabled) {
  return {
    width: '100%',
    border: '1px solid #1d4ed8',
    borderRadius: 14,
    padding: '14px 16px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
    color: '#fff',
    fontWeight: 900,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: '0 10px 20px rgba(37,99,235,0.20)',
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

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, isAuthenticated, bootstrapping } = useAuth();

  const [email, setEmail] = useState('admin@raftop.local');
const [password, setPassword] = useState('admin123!');
  const [error, setError] = useState('');

  const redirectTo = useMemo(() => {
    return location.state?.from || '/tenant/dashboard';
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

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const result = await login(email, password);

      if (result?.ok) {
        navigate(redirectTo, { replace: true });
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
          maxWidth: 460,
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
          Premium CPAP operations workspace access.
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

          <button type="submit" disabled={loading} style={buttonStyle(loading)}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

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