import React from 'react';

import { useTenantRuntime } from '../context/TenantRuntimeContext';
import {
  getCurrentRuntimeRole,
  getRolePermissions
} from './runtimeAcl';

export default function RuntimeAclStatusPanel() {
  const runtime = useTenantRuntime();
  const role = getCurrentRuntimeRole();
  const permissions = getRolePermissions(role);

  return (
    <section style={shell}>
      <div style={header}>
        <div>
          <div style={kicker}>RUNTIME ACCESS CONTROL</div>
          <h2 style={title}>ACL Status Panel</h2>
        </div>

        <span style={badge}>{role}</span>
      </div>

      <div style={grid}>
        <Info label="Tenant" value={runtime.tenantId} />
        <Info label="Plan" value={runtime.plan?.code || 'unknown'} />
        <Info label="Access" value={runtime.access?.state || 'unknown'} />
        <Info label="Runtime" value={runtime.fallback ? 'Fallback' : 'PostgreSQL'} />
      </div>

      <div style={section}>
        <div style={sectionTitle}>Enabled modules</div>
        <div style={chips}>
          {Object.entries(runtime.modules || {}).map(([key, value]) => (
            <span key={key} style={value ? chipOn : chipOff}>
              {key}: {value ? 'ON' : 'OFF'}
            </span>
          ))}
        </div>
      </div>

      <div style={section}>
        <div style={sectionTitle}>Role permissions</div>
        <div style={chips}>
          {permissions.map((permission) => (
            <span key={permission} style={chipOn}>
              {permission}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div style={infoCard}>
      <div style={infoLabel}>{label}</div>
      <div style={infoValue}>{String(value || '-')}</div>
    </div>
  );
}

const shell = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 18,
  marginBottom: 14,
  boxShadow: '0 12px 28px rgba(15,23,42,0.06)'
};

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  marginBottom: 14
};

const kicker = {
  color: '#7c3aed',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.14em'
};

const title = {
  margin: '5px 0 0',
  color: '#0f172a',
  fontSize: 20
};

const badge = {
  background: '#ede9fe',
  color: '#5b21b6',
  border: '1px solid #ddd6fe',
  borderRadius: 999,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 1000
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 10
};

const infoCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 12
};

const infoLabel = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const infoValue = {
  marginTop: 6,
  color: '#0f172a',
  fontWeight: 900,
  wordBreak: 'break-word'
};

const section = {
  marginTop: 14
};

const sectionTitle = {
  color: '#334155',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 8
};

const chips = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8
};

const chipOn = {
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 900
};

const chipOff = {
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 900
};