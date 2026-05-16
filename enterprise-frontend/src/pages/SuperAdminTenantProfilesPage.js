import React, { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
}

function MetricCard({ label, value, tone }) {
  const style =
    tone === 'danger'
      ? { background: '#fff1f2', border: '1px solid #fecdd3' }
      : tone === 'warning'
        ? { background: '#fffbeb', border: '1px solid #fde68a' }
        : tone === 'success'
          ? { background: '#f0fdf4', border: '1px solid #bbf7d0' }
          : { background: '#ffffff', border: '1px solid #e2e8f0' };

  return (
    <div
      style={{
        ...style,
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#64748b',
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 30,
          fontWeight: 900,
          color: '#0f172a'
        }}
      >
        {value ?? 0}
      </div>
    </div>
  );
}

function Badge({ value, color }) {
  return (
    <span
      style={{
        background: color || '#f1f5f9',
        color: color ? '#ffffff' : '#334155',
        border: color ? `1px solid ${color}` : '1px solid #cbd5e1',
        borderRadius: 999,
        padding: '5px 10px',
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: 'nowrap'
      }}
    >
      {value || '-'}
    </span>
  );
}

function getStoredSuperAdminKey() {
  return (
    localStorage.getItem('super_admin_api_key') ||
    localStorage.getItem('superAdminApiKey') ||
    process.env.REACT_APP_SUPER_ADMIN_API_KEY ||
    ''
  );
}

const emptyForm = {
  tenantId: '',
  displayName: '',
  legalName: '',
  brandName: '',
  contactName: '',
  contactEmail: '',
  supportEmail: '',
  billingEmail: '',
  phone: '',
  country: 'Greece',
  city: '',
  website: '',
  logoUrl: '',
  primaryColor: '#1d4ed8',
  secondaryColor: '#0f172a',
  resellerType: 'DIRECT',
  isDistributor: false,
  notes: ''
};

export default function SuperAdminTenantProfilesPage() {
  const [state, setState] = useState({
    loading: true,
    actionLoading: '',
    error: '',
    success: '',
    payload: null
  });

  const [search, setSearch] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showRaw, setShowRaw] = useState(false);

  async function loadProfiles() {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: '',
        success: ''
      }));

      const response = await fetch(`${API_BASE}/api/super-admin/tenant-profiles`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-super-admin-key': getStoredSuperAdminKey()
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState({
        loading: false,
        actionLoading: '',
        error: '',
        success: '',
        payload: json
      });
    } catch (error) {
      setState({
        loading: false,
        actionLoading: '',
        error: error.message || 'Failed to load tenant profiles.',
        success: '',
        payload: null
      });
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  const profiles = Array.isArray(state.payload?.profiles)
    ? state.payload.profiles
    : [];

  const stats = state.payload?.stats || {};

  const visibleProfiles = useMemo(() => {
    if (!search.trim()) return profiles;

    const q = search.toLowerCase();

    return profiles.filter((item) => {
      return (
        String(item.tenantId || '').toLowerCase().includes(q) ||
        String(item.displayName || '').toLowerCase().includes(q) ||
        String(item.legalName || '').toLowerCase().includes(q) ||
        String(item.brandName || '').toLowerCase().includes(q) ||
        String(item.contactEmail || '').toLowerCase().includes(q) ||
        String(item.supportEmail || '').toLowerCase().includes(q) ||
        String(item.resellerType || '').toLowerCase().includes(q)
      );
    });
  }, [profiles, search]);

  const selectedProfile = profiles.find((item) => item.tenantId === selectedTenantId);

  function selectProfile(profile) {
    setSelectedTenantId(profile.tenantId);

    setForm({
      tenantId: profile.tenantId || '',
      displayName: profile.displayName || '',
      legalName: profile.legalName || '',
      brandName: profile.brandName || '',
      contactName: profile.contactName || '',
      contactEmail: profile.contactEmail || '',
      supportEmail: profile.supportEmail || '',
      billingEmail: profile.billingEmail || '',
      phone: profile.phone || '',
      country: profile.country || 'Greece',
      city: profile.city || '',
      website: profile.website || '',
      logoUrl: profile.logoUrl || '',
      primaryColor: profile.primaryColor || '#1d4ed8',
      secondaryColor: profile.secondaryColor || '#0f172a',
      resellerType: profile.resellerType || 'DIRECT',
      isDistributor: profile.isDistributor === true,
      notes: profile.notes || ''
    });
  }

  function newProfile() {
    setSelectedTenantId('');
    setForm(emptyForm);
  }

  function updateForm(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  async function saveProfile() {
    try {
      const tenantId = String(form.tenantId || '').trim();

      if (!tenantId) {
        setState((prev) => ({
          ...prev,
          error: 'Tenant ID is required.',
          success: ''
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        actionLoading: 'save-profile',
        error: '',
        success: ''
      }));

      const method = selectedTenantId ? 'PATCH' : 'POST';
      const url = selectedTenantId
        ? `${API_BASE}/api/super-admin/tenant-profiles/${encodeURIComponent(selectedTenantId)}`
        : `${API_BASE}/api/super-admin/tenant-profiles`;

      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-super-admin-key': getStoredSuperAdminKey(),
          'x-super-admin-actor': 'frontend-super-admin'
        },
        body: JSON.stringify(form)
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      await loadProfiles();

      setSelectedTenantId(json.tenantId);
      setState((prev) => ({
        ...prev,
        actionLoading: '',
        error: '',
        success: `Tenant profile ${json.tenantId} saved.`
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        actionLoading: '',
        error: error.message || 'Failed to save tenant profile.',
        success: ''
      }));
    }
  }

  function openTenantSubscription(profile) {
    localStorage.setItem('tenant_id', profile.tenantId);
    localStorage.setItem('tenantId', profile.tenantId);
    window.location.href = '/tenant/subscription';
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: 32,
        fontFamily: 'Arial, sans-serif',
        color: '#0f172a'
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <section
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #06b6d4 100%)',
            color: '#ffffff',
            borderRadius: 28,
            padding: 32,
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.20)'
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.2em',
              opacity: 0.9
            }}
          >
            RAFTOP CPAP CARE Pro / Tenant Metadata
          </div>

          <h1 style={{ margin: '14px 0 8px', fontSize: 38, lineHeight: 1.1 }}>
            Tenant Profiles
          </h1>

          <p style={{ maxWidth: 980, fontSize: 15, opacity: 0.9 }}>
            Organization identity, white-label metadata, contact details and reseller/distributor profile for each SaaS tenant.
          </p>

          <div
            style={{
              marginTop: 22,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >
            <button onClick={loadProfiles} disabled={state.loading} style={headerButton}>
              {state.loading ? 'Loading...' : 'Refresh'}
            </button>

            <button onClick={newProfile} style={headerButton}>
              New Profile
            </button>

            <button
              onClick={() => {
                window.location.href = '/super-admin/subscriptions';
              }}
              style={headerButton}
            >
              Subscription Console
            </button>

            <button
              onClick={() => {
                window.location.href = '/super-admin/audit-logs';
              }}
              style={headerButton}
            >
              Audit Logs
            </button>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tenant, brand, email, reseller..."
              style={headerInput}
            />
          </div>
        </section>

        {state.error && (
          <div style={errorBox}>
            <strong>Tenant Profile Error</strong>
            <div style={{ marginTop: 8 }}>{state.error}</div>
          </div>
        )}

        {state.success && (
          <div style={successBox}>
            <strong>Success</strong>
            <div style={{ marginTop: 8 }}>{state.success}</div>
          </div>
        )}

        {state.loading && (
          <div style={loadingBox}>
            Loading tenant profiles...
          </div>
        )}

        {!state.loading && state.payload && (
          <>
            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: 16
              }}
            >
              <MetricCard label="Total" value={stats.total} />
              <MetricCard label="Distributors" value={stats.distributors} tone="success" />
              <MetricCard label="Direct" value={stats.direct} />
              <MetricCard label="Reseller" value={stats.reseller} tone="warning" />
              <MetricCard label="White Label" value={stats.whiteLabel} tone="warning" />
              <MetricCard label="Enterprise" value={stats.enterprise} tone="success" />
            </section>

            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(420px, 0.8fr)',
                gap: 20,
                alignItems: 'start'
              }}
            >
              <div style={panelStyle}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Profile List</h2>

                <p style={{ color: '#64748b', marginTop: 8 }}>
                  Showing {visibleProfiles.length} of {profiles.length} profile(s).
                </p>

                <div style={{ marginTop: 16, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={th}>Tenant</th>
                        <th style={th}>Display</th>
                        <th style={th}>Brand</th>
                        <th style={th}>Contact</th>
                        <th style={th}>Support</th>
                        <th style={th}>Type</th>
                        <th style={th}>Colors</th>
                        <th style={th}>Updated</th>
                        <th style={th}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleProfiles.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={td}>
                            No tenant profiles found.
                          </td>
                        </tr>
                      ) : (
                        visibleProfiles.map((profile) => (
                          <tr
                            key={profile.tenantId}
                            style={{
                              background:
                                selectedTenantId === profile.tenantId ? '#eff6ff' : '#ffffff'
                            }}
                          >
                            <td style={{ ...td, fontWeight: 900 }}>
                              <button
                                onClick={() => selectProfile(profile)}
                                style={{
                                  border: 0,
                                  background: 'transparent',
                                  color: '#2563eb',
                                  fontWeight: 900,
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                {profile.tenantId}
                              </button>
                            </td>
                            <td style={td}>{profile.displayName || '-'}</td>
                            <td style={td}>{profile.brandName || '-'}</td>
                            <td style={td}>{profile.contactEmail || '-'}</td>
                            <td style={td}>{profile.supportEmail || '-'}</td>
                            <td style={td}>
                              <Badge
                                value={profile.resellerType}
                                color={profile.isDistributor ? '#047857' : null}
                              />
                            </td>
                            <td style={td}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={colorDot(profile.primaryColor)} />
                                <span style={colorDot(profile.secondaryColor)} />
                              </div>
                            </td>
                            <td style={td}>{formatDate(profile.updatedAt)}</td>
                            <td style={td}>
                              <button
                                onClick={() => openTenantSubscription(profile)}
                                style={smallBlueButton}
                              >
                                Open Tenant
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={panelStyle}>
                <h2 style={{ margin: 0, fontSize: 24 }}>
                  {selectedTenantId ? 'Edit Tenant Profile' : 'Create Tenant Profile'}
                </h2>

                <p style={{ color: '#64748b', marginTop: 8 }}>
                  This metadata drives future white-label, branding and reseller experience.
                </p>

                <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
                  <label style={inputLabel}>
                    Tenant ID
                    <input
                      value={form.tenantId}
                      onChange={(event) => updateForm('tenantId', event.target.value)}
                      disabled={Boolean(selectedTenantId)}
                      placeholder="demo-tenant"
                      style={{
                        ...inputStyle,
                        background: selectedTenantId ? '#f1f5f9' : '#ffffff'
                      }}
                    />
                  </label>

                  <label style={inputLabel}>
                    Display Name
                    <input
                      value={form.displayName}
                      onChange={(event) => updateForm('displayName', event.target.value)}
                      placeholder="RAFTOP CPAP CARE Demo"
                      style={inputStyle}
                    />
                  </label>

                  <label style={inputLabel}>
                    Legal Name
                    <input
                      value={form.legalName}
                      onChange={(event) => updateForm('legalName', event.target.value)}
                      placeholder="Legal organization name"
                      style={inputStyle}
                    />
                  </label>

                  <label style={inputLabel}>
                    Brand Name
                    <input
                      value={form.brandName}
                      onChange={(event) => updateForm('brandName', event.target.value)}
                      placeholder="Brand shown to patients/providers"
                      style={inputStyle}
                    />
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={inputLabel}>
                      Contact Name
                      <input
                        value={form.contactName}
                        onChange={(event) => updateForm('contactName', event.target.value)}
                        style={inputStyle}
                      />
                    </label>

                    <label style={inputLabel}>
                      Contact Email
                      <input
                        type="email"
                        value={form.contactEmail}
                        onChange={(event) => updateForm('contactEmail', event.target.value)}
                        style={inputStyle}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={inputLabel}>
                      Support Email
                      <input
                        type="email"
                        value={form.supportEmail}
                        onChange={(event) => updateForm('supportEmail', event.target.value)}
                        style={inputStyle}
                      />
                    </label>

                    <label style={inputLabel}>
                      Billing Email
                      <input
                        type="email"
                        value={form.billingEmail}
                        onChange={(event) => updateForm('billingEmail', event.target.value)}
                        style={inputStyle}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={inputLabel}>
                      Phone
                      <input
                        value={form.phone}
                        onChange={(event) => updateForm('phone', event.target.value)}
                        style={inputStyle}
                      />
                    </label>

                    <label style={inputLabel}>
                      Website
                      <input
                        value={form.website}
                        onChange={(event) => updateForm('website', event.target.value)}
                        style={inputStyle}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={inputLabel}>
                      Country
                      <input
                        value={form.country}
                        onChange={(event) => updateForm('country', event.target.value)}
                        style={inputStyle}
                      />
                    </label>

                    <label style={inputLabel}>
                      City
                      <input
                        value={form.city}
                        onChange={(event) => updateForm('city', event.target.value)}
                        style={inputStyle}
                      />
                    </label>
                  </div>

                  <label style={inputLabel}>
                    Logo URL
                    <input
                      value={form.logoUrl}
                      onChange={(event) => updateForm('logoUrl', event.target.value)}
                      placeholder="https://..."
                      style={inputStyle}
                    />
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={inputLabel}>
                      Primary Color
                      <input
                        type="color"
                        value={form.primaryColor}
                        onChange={(event) => updateForm('primaryColor', event.target.value)}
                        style={colorInputStyle}
                      />
                    </label>

                    <label style={inputLabel}>
                      Secondary Color
                      <input
                        type="color"
                        value={form.secondaryColor}
                        onChange={(event) => updateForm('secondaryColor', event.target.value)}
                        style={colorInputStyle}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={inputLabel}>
                      Reseller Type
                      <select
                        value={form.resellerType}
                        onChange={(event) => updateForm('resellerType', event.target.value)}
                        style={inputStyle}
                      >
                        <option value="DIRECT">DIRECT</option>
                        <option value="RESELLER">RESELLER</option>
                        <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                        <option value="WHITE_LABEL">WHITE_LABEL</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </label>

                    <label
                      style={{
                        ...inputLabel,
                        alignContent: 'end'
                      }}
                    >
                      Distributor Flag
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          border: '1px solid #cbd5e1',
                          borderRadius: 12,
                          padding: '11px 12px',
                          fontWeight: 900
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.isDistributor}
                          onChange={(event) => updateForm('isDistributor', event.target.checked)}
                        />
                        Is distributor
                      </label>
                    </label>
                  </div>

                  <label style={inputLabel}>
                    Notes
                    <textarea
                      value={form.notes}
                      onChange={(event) => updateForm('notes', event.target.value)}
                      rows={4}
                      style={{
                        ...inputStyle,
                        resize: 'vertical'
                      }}
                    />
                  </label>

                  <div
                    style={{
                      background: form.primaryColor,
                      color: '#ffffff',
                      borderRadius: 18,
                      padding: 18,
                      boxShadow: '0 14px 30px rgba(15,23,42,0.18)'
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.12em' }}>
                      BRAND PREVIEW
                    </div>
                    <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900 }}>
                      {form.brandName || form.displayName || form.tenantId || 'Tenant Brand'}
                    </div>
                    <div style={{ marginTop: 8, opacity: 0.9 }}>
                      {form.supportEmail || 'support@example.com'}
                    </div>
                  </div>

                  <button
                    onClick={saveProfile}
                    disabled={state.actionLoading === 'save-profile'}
                    style={darkButton}
                  >
                    {state.actionLoading === 'save-profile' ? 'Saving...' : 'Save Tenant Profile'}
                  </button>
                </div>
              </div>
            </section>

            <section style={panelStyleWithMargin}>
              <h2 style={{ margin: 0, fontSize: 24 }}>Debug Payload</h2>

              <button
                onClick={() => setShowRaw(!showRaw)}
                style={{
                  marginTop: 14,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 0,
                  padding: '10px 16px',
                  borderRadius: 12,
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                {showRaw ? 'Hide JSON' : 'Show JSON'}
              </button>

              {showRaw && (
                <pre
                  style={{
                    marginTop: 16,
                    background: '#020617',
                    color: '#e2e8f0',
                    padding: 18,
                    borderRadius: 16,
                    overflow: 'auto',
                    maxHeight: 520,
                    fontSize: 12
                  }}
                >
                  {JSON.stringify(state.payload, null, 2)}
                </pre>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const headerButton = {
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.14)',
  color: '#ffffff',
  padding: '10px 16px',
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer'
};

const headerInput = {
  minWidth: 300,
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.14)',
  color: '#ffffff',
  padding: '10px 14px',
  borderRadius: 14,
  fontWeight: 800,
  outline: 'none'
};

const panelStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const panelStyleWithMargin = {
  ...panelStyle,
  marginTop: 24
};

const loadingBox = {
  marginTop: 24,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 24
};

const errorBox = {
  marginTop: 24,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 20,
  padding: 24
};

const successBox = {
  marginTop: 24,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  color: '#166534',
  borderRadius: 20,
  padding: 24
};

const th = {
  textAlign: 'left',
  padding: 12,
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap'
};

const td = {
  padding: 12,
  borderBottom: '1px solid #e2e8f0',
  color: '#334155',
  verticalAlign: 'top'
};

const inputLabel = {
  display: 'grid',
  gap: 8,
  fontSize: 13,
  fontWeight: 900,
  color: '#334155'
};

const inputStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '11px 12px',
  fontSize: 15,
  fontWeight: 800,
  color: '#0f172a',
  background: '#ffffff'
};

const colorInputStyle = {
  ...inputStyle,
  height: 48,
  padding: 6
};

const darkButton = {
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  padding: '12px 18px',
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer'
};

const smallBlueButton = {
  border: 0,
  background: '#2563eb',
  color: '#ffffff',
  padding: '8px 12px',
  borderRadius: 10,
  fontWeight: 900,
  cursor: 'pointer',
  fontSize: 12
};

function colorDot(color) {
  return {
    width: 18,
    height: 18,
    display: 'inline-block',
    borderRadius: 999,
    background: color || '#cbd5e1',
    border: '1px solid #cbd5e1'
  };
}