import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f3f4f6',
  padding: 24,
  boxSizing: 'border-box'
};

const cardStyle = {
  width: '100%',
  maxWidth: 420,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  padding: 24,
  boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 14,
  boxSizing: 'border-box'
};

const buttonStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #111827',
  background: '#111827',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer'
};

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password.trim()) {
      setError('Συμπλήρωσε email και password.');
      return;
    }

    try {
      setLoading(true);

      localStorage.setItem(
        'raftop_auth',
        JSON.stringify({
          isAuthenticated: true,
          email: form.email.trim(),
          loginAt: new Date().toISOString()
        })
      );

      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Αποτυχία login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, marginBottom: 8 }}>RAFTOP Admin Login</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Είσοδος στο control center της εφαρμογής.
          </p>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 10,
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca'
            }}
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                style={inputStyle}
                placeholder="admin@raftop.local"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}