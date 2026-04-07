import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const auth = useAuth();

  const token = auth?.token || localStorage.getItem('token');
  const role =
    auth?.user?.role ||
    localStorage.getItem('userRole') ||
    'tenant_admin';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;