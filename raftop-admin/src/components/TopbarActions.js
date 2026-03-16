import React from 'react';
import { useNavigate } from 'react-router-dom';

const buttonStyle = {
  padding: '9px 12px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#111827',
  fontWeight: 600,
  cursor: 'pointer'
};

const dangerStyle = {
  ...buttonStyle,
  background: '#111827',
  color: '#ffffff',
  border: '1px solid #111827'
};

export default function TopbarActions() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('raftop_auth');
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => navigate('/search')}
      >
        Search
      </button>

      <button
        type="button"
        style={dangerStyle}
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
}