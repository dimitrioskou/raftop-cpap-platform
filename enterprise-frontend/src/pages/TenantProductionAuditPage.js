import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

function buildUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

function readToken() {
  try {
    return (
      localStorage.getItem('raftop_auth_token') ||
      localStorage.getItem('token') ||
      ''
    );
  } catch (_error) {
    return '';
  }
}

async function readJsonSafely(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}

async function apiRequest(path, options = {}) {
  const token = readToken();

  const response = await fetch(buildUrl(path), {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    credentials: 'include'
  });

  const payload = await readJsonSafely(response);

  if (!response.ok || payload?.ok === false) {
    throw new Error(
      payload?.message || options.errorLabel || 'Production audit request failed'
    );
  }

  return payload?.data ?? payload;
}

const FALLBACK_DATA = {
  summary: {
    totalModules: 8,
    live: 3,
    partial: 4,
    missing: 1
  },
  modules: [
    {
      key: 'atlas_action_center',
      title: 'ATLAS Action Center',
      href: '/tenant/atlas/action-center',
      status: 'partial',
      statusLabel: 'PARTIAL',
      routeOk: true,
      secondaryRouteOk: true,
      tables: [
        { name: 'tasks', exists: true, columnCount: 12 },
        { name: 'patient_signals', exists: true, columnCount: 10 },
        { name: 'coaching_assignments', exists: false, columnCount: 0 },
        { name: 'import_jobs', exists: false, columnCount: 0 }
      ],
      notes: ['Demo fallback data shown.']
    },
    {
      key: 'patient_orchestrator',
      title: 'Patient Orchestrator',
      href: '/tenant/patient-orchestrator/patient@raftop.local',
      status: 'partial',
      statusLabel: 'PARTIAL',
      routeOk: true,
      secondaryRouteOk: true,
      tables: [
        { name: 'patients', exists: true, columnCount: 8 },
        { name: 'tasks', exists: true, columnCount: 12 }
      ],
      notes: ['Route exists but some data sources may still be partial.']
    },
    {
      key: 'patient_tasks',
      title: 'Patient Task Board',
      href: '/tenant/patient-tasks/patient@raftop.local',
      status: 'live',
      statusLabel: 'LIVE',
      routeOk: true,
      secondaryRouteOk: true,
      tables: [{ name: 'tasks', exists: true, columnCount: 12 }],
      notes: ['Task table detected.']
    }
  ],
  discoveredTables: [
    { name: 'patients', exists: true, columnCount: 8 },
    { name: 'patient_signals', exists: true, columnCount: 10 },
    { name: 'tasks', exists: true, columnCount: 12 },
    { name: 'not_found', exists: false, columnCount: 0 },
    { name: 'not_found', exists: false, columnCount: 0 }
  ],
  generatedAt: new Date().toISOString()
};

function badgeClass(status = '') {
  const v = String(status || '').toLowerCase();
  if (v === 'live') return 'success';
  if (v === 'partial') return 'warning';
  return 'danger';
}

function openTenantRoute(path) {
  window.location.href = path;
}

export default function TenantProductionAuditPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  async function loadAudit() {
    setLoading(true);

    try {
      const payload = await apiRequest('/api/tenant/production-audit', {
        errorLabel: 'Production audit request failed'
      });

      setData(payload || FALLBACK_DATA);
      setFallbackMode(false);
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAudit();
  }, []);

  const filteredModules = useMemo(() => {
    if (!statusFilter) return data.modules || [];
    return (data.modules || []).filter((item) => item.status === statusFilter);
  }, [data.modules, statusFilter]);

  if (loading) {
    return (
      <div className="tenant-production-audit-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading production audit...</div>
      </div>
    );
  }

  return (
    <div className="tenant-production-audit-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">PRODUCTION CLEANUP AUDIT</div>
          <h1>Module Readiness Dashboard</h1>
          <p>
            Ενιαία εικόνα για το ποια modules είναι live, partial ή missing,
            με route/table audit.
          </p>
        </div>

        <div className="hero-actions">
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="live">live</option>
            <option value="partial">partial</option>
            <option value="missing">missing</option>
          </select>

          <button type="button" className="primary-btn" onClick={loadAudit}>
            Refresh Audit
          </button>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Production audit σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      <section className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Modules</div>
          <div className="summary-value">{data.summary?.totalModules ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Live</div>
          <div className="summary-value">{data.summary?.live ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Partial</div>
          <div className="summary-value">{data.summary?.partial ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Missing</div>
          <div className="summary-value">{data.summary?.missing ?? 0}</div>
        </div>
      </section>

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">Modules</div>

          <div className="module-list">
            {filteredModules.map((item) => (
              <div key={item.key} className="module-card">
                <div className="module-head">
                  <div className="module-title">{item.title}</div>
                  <span className={`badge ${badgeClass(item.status)}`}>
                    {item.statusLabel}
                  </span>
                </div>

                <div className="module-meta">
                  route: {item.routeOk ? 'ok' : 'missing'}
                  {typeof item.secondaryRouteOk === 'boolean'
                    ? ` • secondary: ${item.secondaryRouteOk ? 'ok' : 'missing'}`
                    : ''}
                </div>

                <div className="table-list">
                  {(item.tables || []).map((table, index) => (
                    <div key={`${table.name}-${index}`} className="table-row">
                      <span>{table.name}</span>
                      <span>{table.exists ? `${table.columnCount} cols` : 'missing'}</span>
                    </div>
                  ))}
                </div>

                <div className="notes-list">
                  {(item.notes || []).map((note, index) => (
                    <div key={`${item.key}-note-${index}`} className="note-row">
                      {note}
                    </div>
                  ))}
                </div>

                <div className="module-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => openTenantRoute(item.href)}
                  >
                    Open Module
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Discovered Tables</div>

          <div className="table-audit-list">
            {(data.discoveredTables || []).map((table, index) => (
              <div key={`${table.name}-${index}`} className="audit-table-row">
                <div className="audit-table-name">{table.name}</div>
                <div className="audit-table-meta">
                  {table.exists ? `exists • ${table.columnCount} columns` : 'missing'}
                </div>
              </div>
            ))}
          </div>

          <div className="section-title spaced">Interpretation</div>

          <div className="explain-box">
            <div>LIVE = route και βασικά tables βρέθηκαν.</div>
            <div>PARTIAL = route υπάρχει αλλά λείπει data layer ή secondary dependency.</div>
            <div>MISSING = το module δεν έχει ουσιαστικά ολοκληρωθεί σε route/data επίπεδο.</div>
          </div>
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-production-audit-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .summary-card,
  .module-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.35fr 320px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(245,158,11,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,251,235,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #d97706;
    margin-bottom: 8px;
  }

  h1 {
    margin: 0;
    font-size: 30px;
    color: #0f172a;
  }

  p {
    color: #475569;
    line-height: 1.7;
  }

  .hero-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    justify-content: center;
  }

  .input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d0d5dd;
    border-radius: 14px;
    padding: 12px 14px;
    background: #fff;
    color: #101828;
    font-size: 14px;
    outline: none;
  }

  .primary-btn,
  .ghost-btn {
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .primary-btn {
    border: 0;
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    color: #fff;
  }

  .ghost-btn {
    border: 1px solid #d0d5dd;
    background: #fff;
    color: #344054;
  }

  .banner {
    border-radius: 18px;
    padding: 14px 16px;
    font-size: 14px;
    font-weight: 600;
  }

  .banner.warning {
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #fdba74;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-card {
    padding: 16px;
  }

  .summary-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .summary-value {
    margin-top: 8px;
    font-size: 26px;
    font-weight: 900;
    color: #0f172a;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: 1.2fr 0.9fr;
    gap: 18px;
  }

  .page-card {
    padding: 20px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .section-title.spaced {
    margin-top: 18px;
  }

  .module-list,
  .table-audit-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .module-card {
    padding: 16px;
  }

  .module-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .module-title,
  .audit-table-name {
    font-weight: 900;
    color: #0f172a;
  }

  .module-meta,
  .audit-table-meta,
  .note-row {
    margin-top: 8px;
    font-size: 13px;
    color: #64748b;
  }

  .table-list {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .table-row,
  .audit-table-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .notes-list {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .module-actions {
    margin-top: 12px;
  }

  .explain-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    border-radius: 16px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #78350f;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .badge.success { background: #ecfdf5; color: #047857; border: 1px solid #86efac; }
  .badge.warning { background: #fff7ed; color: #c2410c; border: 1px solid #fdba74; }
  .badge.danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

  @media (max-width: 980px) {
    .hero-card,
    .layout-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
`;