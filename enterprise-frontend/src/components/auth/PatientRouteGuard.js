import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

export default function PatientRouteGuard({ children }) {
  const location = useLocation();
  const { token, user, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background:
            'radial-gradient(circle at top left, rgba(6,182,212,0.10) 0%, transparent 18%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)'
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 18px 34px rgba(0,0,0,0.10)',
            fontWeight: 800,
            color: '#101828'
          }}
        >
          Loading patient workspace...
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (normalizeRole(user.role) !== 'patient') {
    return <Navigate to="/tenant/dashboard" replace />;
  }

  return children;
}