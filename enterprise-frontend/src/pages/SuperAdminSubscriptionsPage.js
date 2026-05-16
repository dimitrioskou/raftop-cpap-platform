import React, { useEffect, useMemo, useState } from 'react';
import {
  getDevControlsModeLabel,
  isDangerousDevControlsEnabled
} from '../config/devControls';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function statusStyle(value, allowed = true) {
  const normalized = String(value || '').toUpperCase();

  if (
    allowed === false ||
    ['EXPIRED', 'CANCELLED', 'SUSPENDED', 'LOCKED', 'LIMIT_EXCEEDED'].includes(normalized)
  ) {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    };
  }

  if (['TRIAL', 'PAST_DUE', 'WARNING', 'DEGRADED'].includes(normalized)) {
    return {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a'
    };
  }

  return {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0'
  };
}

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
          fontSize: 32,
          fontWeight: 900,
          color: '#0f172a'
        }}
      >
        {value ?? 0}
      </div>
    </div>
  );
}

function Badge({ value, allowed }) {
  return (
    <span
      style={{
        ...statusStyle(value, allowed),
        borderRadius: 999,
        padding: '5px 10px',
        fontSize: 12,
        fontWeight: 900,
        display: 'inline-block'
      }}
    >
      {value || 'UNKNOWN'}
    </span>
  );
}

function planDefaultLimits(plan) {
  const normalized = String(plan || '').toUpperCase();

  if (normalized === 'FREE') return { seats: 1, patientLimit: 25 };
  if (normalized === 'TRIAL') return { seats: 5, patientLimit: 100 };
  if (normalized === 'PRO') return { seats: 10, patientLimit: 500 };
  if (normalized === 'CLINIC') return { seats: 20, patientLimit: 2000 };
  if (normalized === 'DISTRIBUTOR') return { seats: 50, patientLimit: 10000 };
  if (normalized === 'ENTERPRISE') return { seats: 100, patientLimit: 50000 };

  return { seats: 5, patientLimit: 100 };
}

export default function SuperAdminSubscriptionsPage() {
  const dangerousDevControlsEnabled = isDangerousDevControlsEnabled();

  const [state, setState] = useState({
    loading: true,
    actionLoading: '',
    error: '',
    success: '',
    payload: null
  });

  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [showCreate, setShowCreate] = useState(true);

  const [form, setForm] = useState({
    plan: 'TRIAL',
    status: 'TRIAL',
    seats: 5,
    patientLimit: 100,
    billingEmail: ''
  });

  const [createForm, setCreateForm] = useState({
    tenantId: '',
    plan: 'TRIAL',
    status: 'TRIAL',
    seats: 5,
    patientLimit: 100,
    billingEmail: '',
    trialDays: 14,
    periodDays: 30
  });

  async function loadSubscriptions() {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: '',
        success: ''
      }));

      const response = await fetch(`${API_BASE}/api/super-admin/subscriptions`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
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
        error: error.message || 'Failed to load super admin subscriptions.',
        success: '',
        payload: null
      });
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const subscriptions = Array.isArray(state.payload?.subscriptions)
    ? state.payload.subscriptions
    : [];

  const stats = state.payload?.stats || {};

  const selectedSubscription = subscriptions.find(
    (item) => item.tenantId === selectedTenantId
  );

  useEffect(() => {
    if (!selectedSubscription) return;

    setForm({
      plan: selectedSubscription.plan || 'TRIAL',
      status: selectedSubscription.status || 'TRIAL',
      seats: selectedSubscription.seats || 5,
      patientLimit: selectedSubscription.patientLimit || 100,
      billingEmail: selectedSubscription.billingEmail || ''
    });
  }, [selectedTenantId, selectedSubscription]);

  const visibleSubscriptions = useMemo(() => {
    return subscriptions.filter((item) => {
      const matchesSearch =
        !search ||
        String(item.tenantId || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.billingEmail || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.plan || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.status || '').toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'ALL') return true;
      if (filter === 'LOCKED') return item.access?.isAllowed === false;
      if (filter === 'LIMIT_EXCEEDED') return item.limits?.usageState === 'LIMIT_EXCEEDED';
      if (filter === 'WARNING') return item.limits?.usageState === 'WARNING';

      return String(item.status || '').toUpperCase() === filter;
    });
  }, [subscriptions, search, filter]);

  function selectTenant(subscription) {
    setSelectedTenantId(subscription.tenantId);
  }

  function updateCreatePlan(nextPlan) {
    const defaults = planDefaultLimits(nextPlan);

    setCreateForm((prev) => ({
      ...prev,
      plan: nextPlan,
      seats: defaults.seats,
      patientLimit: defaults.patientLimit
    }));
  }

  async function createTenant() {
    try {
      if (!createForm.tenantId.trim()) {
        setState((prev) => ({
          ...prev,
          error: 'Tenant ID is required.',
          success: ''
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        actionLoading: 'create-tenant',
        error: '',
        success: ''
      }));

      const response = await fetch(`${API_BASE}/api/super-admin/subscriptions`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId: createForm.tenantId,
          plan: createForm.plan,
          status: createForm.status,
          seats: Number(createForm.seats || 0),
          patientLimit: Number(createForm.patientLimit || 0),
          billingEmail: createForm.billingEmail || null,
          trialDays: Number(createForm.trialDays || 14),
          periodDays: Number(createForm.periodDays || 30)
        })
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setSelectedTenantId(json.tenantId);
      setCreateForm({
        tenantId: '',
        plan: 'TRIAL',
        status: 'TRIAL',
        seats: 5,
        patientLimit: 100,
        billingEmail: '',
        trialDays: 14,
        periodDays: 30
      });

      await loadSubscriptions();

      setState((prev) => ({
        ...prev,
        actionLoading: '',
        error: '',
        success: `Tenant ${json.tenantId} created successfully.`
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        actionLoading: '',
        error: error.message || 'Failed to create tenant subscription.',
        success: ''
      }));
    }
  }

  async function forceStatus(tenantId, action) {
    if (!dangerousDevControlsEnabled) {
      setState((prev) => ({
        ...prev,
        error: 'Dangerous super-admin force controls are disabled.',
        success: ''
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        actionLoading: `${tenantId}-${action}`,
        error: '',
        success: ''
      }));

      const response = await fetch(
        `${API_BASE}/api/super-admin/subscriptions/${encodeURIComponent(tenantId)}/${action}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json'
          }
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      await loadSubscriptions();
      setSelectedTenantId(tenantId);

      setState((prev) => ({
        ...prev,
        actionLoading: '',
        error: '',
        success: `Tenant ${tenantId} updated.`
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        actionLoading: '',
        error: error.message || 'Super admin action failed.',
        success: ''
      }));
    }
  }

  async function saveSelectedTenant() {
    if (!selectedTenantId) return;

    try {
      setState((prev) => ({
        ...prev,
        actionLoading: `save-${selectedTenantId}`,
        error: '',
        success: ''
      }));

      const response = await fetch(
        `${API_BASE}/api/super-admin/subscriptions/${encodeURIComponent(selectedTenantId)}`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan: form.plan,
            status: form.status,
            seats: Number(form.seats || 0),
            patientLimit: Number(form.patientLimit || 0),
            billingEmail: form.billingEmail || null
          })
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      await loadSubscriptions();
      setSelectedTenantId(selectedTenantId);

      setState((prev) => ({
        ...prev,
        actionLoading: '',
        error: '',
        success: `Tenant ${selectedTenantId} saved.`
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        actionLoading: '',
        error: error.message || 'Failed to save tenant subscription.',
        success: ''
      }));
    }
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
            background: 'linear-gradient(135deg, #111827 0%, #1d4ed8 55%, #7c3aed 100%)',
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
            RAFTOP CPAP CARE Pro / Super Admin
          </div>

          <h1 style={{ margin: '14px 0 8px', fontSize: 38, lineHeight: 1.1 }}>
            Tenant Subscription Console
          </h1>

          <p style={{ maxWidth: 960, fontSize: 15, opacity: 0.9 }}>
            Central console for SaaS tenant provisioning, subscriptions, limits, usage and controlled administrative operations.
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
            <button onClick={loadSubscriptions} disabled={state.loading} style={headerButton}>
              Refresh
            </button>

            <button onClick={() => setShowCreate(!showCreate)} style={headerButton}>
              {showCreate ? 'Hide Create Tenant' : 'Create Tenant'}
            </button>

            <button
              onClick={() => {
                window.location.href = '/super-admin/tenant-profiles';
              }}
              style={headerButton}
            >
              Tenant Profiles
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
              placeholder="Search tenant, email, plan, status..."
              style={headerInput}
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              style={headerSelect}
            >
              <option style={{ color: '#0f172a' }} value="ALL">All</option>
              <option style={{ color: '#0f172a' }} value="ACTIVE">Active</option>
              <option style={{ color: '#0f172a' }} value="TRIAL">Trial</option>
              <option style={{ color: '#0f172a' }} value="PAST_DUE">Past Due</option>
              <option style={{ color: '#0f172a' }} value="EXPIRED">Expired</option>
              <option style={{ color: '#0f172a' }} value="SUSPENDED">Suspended</option>
              <option style={{ color: '#0f172a' }} value="LOCKED">Locked</option>
              <option style={{ color: '#0f172a' }} value="LIMIT_EXCEEDED">Limit Exceeded</option>
              <option style={{ color: '#0f172a' }} value="WARNING">Usage Warning</option>
            </select>

            <span
              style={{
                borderRadius: 999,
                padding: '10px 16px',
                fontWeight: 900,
                fontSize: 13,
                background: dangerousDevControlsEnabled ? '#fee2e2' : '#dcfce7',
                color: dangerousDevControlsEnabled ? '#991b1b' : '#166534',
                border: dangerousDevControlsEnabled ? '1px solid #fecaca' : '1px solid #bbf7d0'
              }}
            >
              {getDevControlsModeLabel()}
            </span>
          </div>
        </section>

        {state.error && (
          <div style={errorBox}>
            <strong>Super Admin Subscription Error</strong>
            <div style={{ marginTop: 8 }}>{state.error}</div>
          </div>
        )}

        {state.success && (
          <div style={successBox}>
            <strong>Success</strong>
            <div style={{ marginTop: 8 }}>{state.success}</div>
          </div>
        )}

        {showCreate && (
          <section style={panelStyleWithMargin}>
            <h2 style={{ margin: 0, fontSize: 24 }}>Create New Tenant</h2>

            <p style={{ color: '#64748b', marginTop: 8 }}>
              Provision a new SaaS tenant subscription. This creates the subscription record and makes the tenant manageable from the console.
            </p>

            <div
              style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14
              }}
            >
              <label style={inputLabel}>
                Tenant ID
                <input
                  value={createForm.tenantId}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      tenantId: event.target.value
                    }))
                  }
                  placeholder="e.g. raftopoulos-demo"
                  style={inputStyle}
                />
              </label>

              <label style={inputLabel}>
                Plan
                <select
                  value={createForm.plan}
                  onChange={(event) => updateCreatePlan(event.target.value)}
                  style={inputStyle}
                >
                  <option value="FREE">FREE</option>
                  <option value="TRIAL">TRIAL</option>
                  <option value="PRO">PRO</option>
                  <option value="CLINIC">CLINIC</option>
                  <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </label>

              <label style={inputLabel}>
                Status
                <select
                  value={createForm.status}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: event.target.value
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="TRIAL">TRIAL</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAST_DUE">PAST_DUE</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </label>

              <label style={inputLabel}>
                Seats
                <input
                  type="number"
                  min="0"
                  value={createForm.seats}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      seats: Number(event.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </label>

              <label style={inputLabel}>
                Patient Limit
                <input
                  type="number"
                  min="0"
                  value={createForm.patientLimit}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      patientLimit: Number(event.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </label>

              <label style={inputLabel}>
                Billing Email
                <input
                  type="email"
                  value={createForm.billingEmail}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      billingEmail: event.target.value
                    }))
                  }
                  placeholder="billing@example.com"
                  style={inputStyle}
                />
              </label>

              <label style={inputLabel}>
                Trial Days
                <input
                  type="number"
                  min="0"
                  value={createForm.trialDays}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      trialDays: Number(event.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </label>

              <label style={inputLabel}>
                Period Days
                <input
                  type="number"
                  min="1"
                  value={createForm.periodDays}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      periodDays: Number(event.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </label>
            </div>

            <button
              onClick={createTenant}
              disabled={state.actionLoading === 'create-tenant'}
              style={greenButton}
            >
              {state.actionLoading === 'create-tenant' ? 'Creating...' : 'Create Tenant'}
            </button>
          </section>
        )}

        {state.loading && (
          <div style={loadingBox}>
            Loading tenant subscriptions...
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
              <MetricCard label="Active" value={stats.active} tone="success" />
              <MetricCard label="Trial" value={stats.trial} tone="warning" />
              <MetricCard label="Past Due" value={stats.pastDue} tone="warning" />
              <MetricCard label="Expired" value={stats.expired} tone={stats.expired > 0 ? 'danger' : 'success'} />
              <MetricCard label="Suspended" value={stats.suspended} tone={stats.suspended > 0 ? 'danger' : 'success'} />
              <MetricCard label="Locked" value={stats.locked} tone={stats.locked > 0 ? 'danger' : 'success'} />
              <MetricCard label="Limit Exceeded" value={stats.limitExceeded} tone={stats.limitExceeded > 0 ? 'danger' : 'success'} />
              <MetricCard label="Warnings" value={stats.warning} tone={stats.warning > 0 ? 'warning' : 'success'} />
            </section>

            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: selectedTenantId ? 'minmax(0, 1.4fr) minmax(360px, 0.8fr)' : '1fr',
                gap: 20,
                alignItems: 'start'
              }}
            >
              <div style={panelStyle}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Tenant Subscriptions</h2>

                <p style={{ color: '#64748b', marginTop: 8 }}>
                  Showing {visibleSubscriptions.length} of {subscriptions.length} subscription(s).
                </p>

                <div
                  style={{
                    marginTop: 14,
                    background: dangerousDevControlsEnabled ? '#fff1f2' : '#f0fdf4',
                    border: dangerousDevControlsEnabled ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                    color: dangerousDevControlsEnabled ? '#991b1b' : '#166534',
                    borderRadius: 16,
                    padding: 14,
                    fontWeight: 900
                  }}
                >
                  {dangerousDevControlsEnabled
                    ? 'Emergency force buttons are visible because dangerous dev controls are ON.'
                    : 'Emergency force buttons are hidden. Change status through the edit form and Save Changes.'}
                </div>

                <div style={{ marginTop: 16, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={th}>Tenant</th>
                        <th style={th}>Plan</th>
                        <th style={th}>Status</th>
                        <th style={th}>Access</th>
                        <th style={th}>Patients</th>
                        <th style={th}>Seats</th>
                        <th style={th}>Usage</th>
                        <th style={th}>Period Ends</th>
                        <th style={th}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={td}>
                            No subscriptions match this filter.
                          </td>
                        </tr>
                      ) : (
                        visibleSubscriptions.map((item) => (
                          <tr
                            key={item.tenantId}
                            style={{
                              background:
                                item.tenantId === selectedTenantId ? '#eff6ff' : '#ffffff'
                            }}
                          >
                            <td style={{ ...td, fontWeight: 900 }}>
                              <button
                                onClick={() => selectTenant(item)}
                                style={{
                                  border: 0,
                                  background: 'transparent',
                                  color: '#2563eb',
                                  fontWeight: 900,
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                {item.tenantId}
                              </button>
                            </td>
                            <td style={td}>{item.plan}</td>
                            <td style={td}>
                              <Badge value={item.status} allowed={item.access?.isAllowed} />
                            </td>
                            <td style={td}>
                              <Badge
                                value={item.access?.accessState}
                                allowed={item.access?.isAllowed}
                              />
                            </td>
                            <td style={td}>
                              {item.limits?.patientLimit?.used ?? 0} / {item.limits?.patientLimit?.limit ?? 0}
                            </td>
                            <td style={td}>
                              {item.limits?.seatLimit?.used ?? 0} / {item.limits?.seatLimit?.limit ?? 0}
                            </td>
                            <td style={td}>
                              <Badge
                                value={item.limits?.usageState}
                                allowed={item.limits?.usageState !== 'LIMIT_EXCEEDED'}
                              />
                            </td>
                            <td style={td}>{formatDate(item.currentPeriodEndsAt)}</td>
                            <td style={td}>
                              {dangerousDevControlsEnabled ? (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => forceStatus(item.tenantId, 'force-active')}
                                    disabled={Boolean(state.actionLoading)}
                                    style={smallGreenButton}
                                  >
                                    Active
                                  </button>
                                  <button
                                    onClick={() => forceStatus(item.tenantId, 'force-expired')}
                                    disabled={Boolean(state.actionLoading)}
                                    style={smallOrangeButton}
                                  >
                                    Expire
                                  </button>
                                  <button
                                    onClick={() => forceStatus(item.tenantId, 'force-suspended')}
                                    disabled={Boolean(state.actionLoading)}
                                    style={smallRedButton}
                                  >
                                    Suspend
                                  </button>
                                </div>
                              ) : (
                                <span
                                  style={{
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 999,
                                    padding: '6px 10px',
                                    fontSize: 12,
                                    fontWeight: 900
                                  }}
                                >
                                  Force hidden
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedTenantId && selectedSubscription && (
                <div style={panelStyle}>
                  <h2 style={{ margin: 0, fontSize: 24 }}>Edit Tenant</h2>

                  <p style={{ color: '#64748b', marginTop: 8 }}>
                    Tenant: <strong>{selectedTenantId}</strong>
                  </p>

                  <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
                    <label style={inputLabel}>
                      Plan
                      <select
                        value={form.plan}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, plan: event.target.value }))
                        }
                        style={inputStyle}
                      >
                        <option value="FREE">FREE</option>
                        <option value="TRIAL">TRIAL</option>
                        <option value="PRO">PRO</option>
                        <option value="CLINIC">CLINIC</option>
                        <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </label>

                    <label style={inputLabel}>
                      Status
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, status: event.target.value }))
                        }
                        style={inputStyle}
                      >
                        <option value="TRIAL">TRIAL</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PAST_DUE">PAST_DUE</option>
                        <option value="EXPIRED">EXPIRED</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </label>

                    <label style={inputLabel}>
                      Seats
                      <input
                        type="number"
                        min="0"
                        value={form.seats}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, seats: Number(event.target.value) }))
                        }
                        style={inputStyle}
                      />
                    </label>

                    <label style={inputLabel}>
                      Patient Limit
                      <input
                        type="number"
                        min="0"
                        value={form.patientLimit}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            patientLimit: Number(event.target.value)
                          }))
                        }
                        style={inputStyle}
                      />
                    </label>

                    <label style={inputLabel}>
                      Billing Email
                      <input
                        type="email"
                        value={form.billingEmail}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, billingEmail: event.target.value }))
                        }
                        style={inputStyle}
                      />
                    </label>

                    <button
                      onClick={saveSelectedTenant}
                      disabled={Boolean(state.actionLoading)}
                      style={darkButton}
                    >
                      {state.actionLoading === `save-${selectedTenantId}` ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 20,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 18,
                      padding: 16,
                      display: 'grid',
                      gap: 8,
                      color: '#475569',
                      fontSize: 13
                    }}
                  >
                    <span>Patients source: {selectedSubscription.usage?.patients?.source || '-'}</span>
                    <span>Users source: {selectedSubscription.usage?.users?.source || '-'}</span>
                    <span>Access reason: {selectedSubscription.access?.reason || '-'}</span>
                    <span>Locked reason: {selectedSubscription.lockedReason || '-'}</span>
                    <span>Updated: {formatDate(selectedSubscription.updatedAt)}</span>
                  </div>
                </div>
              )}
            </section>

            <section style={panelStyleWithMargin}>
              <h2 style={{ margin: 0, fontSize: 24 }}>Debug Payload</h2>

              <button onClick={() => setShowRaw(!showRaw)} style={jsonButton}>
                {showRaw ? 'Hide JSON' : 'Show JSON'}
              </button>

              {showRaw && (
                <pre style={jsonPre}>
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
  minWidth: 260,
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.14)',
  color: '#ffffff',
  padding: '10px 14px',
  borderRadius: 14,
  fontWeight: 800,
  outline: 'none'
};

const headerSelect = {
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.14)',
  color: '#ffffff',
  padding: '10px 14px',
  borderRadius: 14,
  fontWeight: 900
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

const baseSmallButton = {
  border: 0,
  color: '#ffffff',
  padding: '7px 10px',
  borderRadius: 10,
  fontWeight: 900,
  cursor: 'pointer',
  fontSize: 12
};

const smallGreenButton = {
  ...baseSmallButton,
  background: '#047857'
};

const smallOrangeButton = {
  ...baseSmallButton,
  background: '#ea580c'
};

const smallRedButton = {
  ...baseSmallButton,
  background: '#b91c1c'
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

const greenButton = {
  marginTop: 18,
  border: 0,
  background: '#047857',
  color: '#ffffff',
  padding: '12px 18px',
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer'
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

const jsonButton = {
  marginTop: 14,
  background: '#0f172a',
  color: '#ffffff',
  border: 0,
  padding: '10px 16px',
  borderRadius: 12,
  fontWeight: 900,
  cursor: 'pointer'
};

const jsonPre = {
  marginTop: 16,
  background: '#020617',
  color: '#e2e8f0',
  padding: 18,
  borderRadius: 16,
  overflow: 'auto',
  maxHeight: 520,
  fontSize: 12
};