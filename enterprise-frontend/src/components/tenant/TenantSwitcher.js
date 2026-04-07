import React from 'react';
import { useTenant } from '../../context/TenantContext';

export default function TenantSwitcher() {
  const {
    tenants = [],
    currentTenantId = 'demo-tenant',
    setCurrentTenantId = () => {}
  } = useTenant();

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.56)',
          marginBottom: 8
        }}
      >
        Tenant switcher
      </div>

      <select
        value={currentTenantId}
        onChange={(e) => setCurrentTenantId(e.target.value)}
        style={{
          width: '100%',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          color: '#ffffff',
          padding: '11px 12px',
          fontSize: 14,
          outline: 'none'
        }}
      >
        {tenants.map((tenant) => (
          <option
            key={tenant.id}
            value={tenant.id}
            style={{ color: '#0f172a' }}
          >
            {tenant.displayName || tenant.name}
          </option>
        ))}
      </select>
    </div>
  );
}