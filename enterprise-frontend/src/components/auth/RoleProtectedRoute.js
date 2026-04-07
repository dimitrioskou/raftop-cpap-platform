import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDefaultHomeForRole, hasRoleAccess, normalizeRole } from '../../utils/roleAccess';

export default function RoleProtectedRoute({
  children,
  featureKey,
  roles = []
}) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = normalizeRole(user?.role);

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to={getDefaultHomeForRole(role)} replace />;
  }

  if (featureKey && !hasRoleAccess(role, featureKey)) {
    return <Navigate to={getDefaultHomeForRole(role)} replace />;
  }

  return children;
}