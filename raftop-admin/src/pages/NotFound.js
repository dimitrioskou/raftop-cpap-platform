import React from 'react';
import { Link } from 'react-router-dom';

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f9fafb',
  padding: 24,
  boxSizing: 'border-box'
};

const cardStyle = {
  width: '100%',
  maxWidth: 520,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  padding: 28,
  boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  textAlign: 'center'
};

const linkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid #111827',
  background: '#111827',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 700
};

export default function NotFound() {
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1,
            color: '#111827',
            marginBottom: 12
          }}
        >
          404
        </div>

        <h1 style={{ marginTop: 0, marginBottom: 10 }}>Page Not Found</h1>

        <p style={{ color: '#6b7280', marginBottom: 22 }}>
          Η σελίδα που ζήτησες δεν βρέθηκε στο RAFTOP Admin.
        </p>

        <Link to="/" style={linkStyle}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}