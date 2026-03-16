import React from 'react';
import { Navigate } from 'react-router-dom';

export default function HomeRedirect() {
  const auth = localStorage.getItem('raftop_auth');
  const isAuthenticated = !!auth;

  return <Navigate to={isAuthenticated ? '/' : '/login'} replace />;
}