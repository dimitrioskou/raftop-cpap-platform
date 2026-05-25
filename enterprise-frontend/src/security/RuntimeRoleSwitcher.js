import React, { useState } from 'react';

import {
  ROLES,
  getCurrentRuntimeRole,
  setCurrentRuntimeRole
} from './runtimeAcl';

export default function RuntimeRoleSwitcher() {
  const [role, setRole] = useState(getCurrentRuntimeRole());

  function changeRole(nextRole) {
    const saved = setCurrentRuntimeRole(nextRole);
    setRole(saved);
    window.location.reload();
  }

  return (
    <section style={shell}>
      <div>
        <div style={kicker}>RUNTIME ACL</div>
        <div style={title}>Role Switcher</div>
      </div>

      <select
        value={role}
        onChange={(event) => changeRole(event.target.value)}
        style={select}
      >
        {Object.values(ROLES).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </section>
  );
}

const shell = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 14,
  marginBottom: 14,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  boxShadow: '0 10px 24px rgba(15,23,42,0.05)'
};

const kicker = {
  color: '#7c3aed',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.12em'
};

const title = {
  marginTop: 4,
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 1000
};

const select = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '10px 12px',
  fontWeight: 900,
  color: '#0f172a',
  background: '#ffffff'
};