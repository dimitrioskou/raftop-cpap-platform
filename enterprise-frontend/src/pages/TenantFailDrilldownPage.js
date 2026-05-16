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
      payload?.message || options.errorLabel || 'Fail drilldown request failed'
    );
  }

  return payload?.data ?? payload;
}

const FALLBACK_DATA = {
  summary: {
    total: 5,
    healthy: 3,
    degraded: 1,
    routeOnly: 1,
    missing: 0
  },
  modules: [
    {
      key: 'atlas_action_center',
      title: 'ATLAS Action Center',
      routeOk: true,
      status: 'healthy',
      expectedPath: '/tenant/atlas/action-center',
      nextFix: 'Optional enrichment gap: import_jobs, coaching_assignments. Core flow is not blocked.',
      dependencies: [
        { tableName: 'tasks', exists: true, missingColumns: [], required: true },
        { tableName: 'patient_signals', exists: true, missingColumns: [], required: true },
        { tableName: 'coaching_assignments', exists: false, missingColumns: ['status'], required: false },
        { tableName: 'import_jobs', exists: false, missingColumns: ['status'], required: false }
      ]
    }
  ],
  generatedAt: new Date().toISOString()
};

function statusBadgeClass(status = '') {
  const v = String(status || '').toLowerCase();
  if (v === 'healthy') return 'success';
  if (v === 'degraded') return 'warning';
  if (v === 'route_only') return 'neutral';
  return 'danger';
}

function depBadgeClass(dep) {
  if (dep.exists && !(dep.missingColumns || []).length) return 'success';
  return dep.required ? 'danger' : 'warning';
}

function depBadgeText(dep) {
  if (dep.exists && !(dep.missingColumns || []).length) return 'exists';
  return dep.required ? 'required gap' : 'optional gap';
}

function openTenantRoute(path) {
  window.location.href = path;
}

export default function TenantFailDrilldownPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  async function loadData() {
    setLoading(true);

    try {
      const payload = await apiRequest('/api/tenant/fail-drilldown', {
        errorLabel: 'Fail drilldown request failed'
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
    loadData();
  }, []);

  const filteredModules = useMemo(() => {
    if (!statusFilter) return data.modules || [];
    return (data.modules || []).filter((item) => item.status === statusFilter);
  }, [data.modules, statusFilter]);

  if (loading) {
    return (
      <div className="tenant-fail-drilldown-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading fail drilldown...</div>
      </div>
    );
  }

  return (
    <div className="tenant-fail-drilldown-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">FAIL DRILLDOWN CONSOLE</div>
          <h1>Dependency Diagnosis</h1>
          <p>
            Δείχνει ποια dependencies είναι core blockers και ποια είναι μόνο optional enrichment gaps.
          </p>
        </div>

        <div className="hero-actions">
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="healthy">healthy</option>
            <option value="degraded">degraded</option>
            <option value="route_only">route_only</option>
            <option value="missing">missing</option>
          </select>

          <button type="button" className="primary-btn" onClick={loadData}>
            Refresh
          </button>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Fail drilldown σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      <section className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Total</div>
          <div className="summary-value">{data.summary?.total ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Healthy</div>
          <div className="summary-value">{data.summary?.healthy ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Degraded</div>
          <div className="summary-value">{data.summary?.degraded ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Route Only</div>
          <div className="summary-value">{data.summary?.routeOnly ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Missing</div>
          <div className="summary-value">{data.summary?.missing ?? 0}</div>
        </div>
      </section>

      <section className="module-list">
        {filteredModules.map((item) => (
          <div key={item.key} className="module-card">
            <div className="module-head">
              <div>
                <div className="module-title">{item.title}</div>
                <div className="module-subtitle">{item.key}</div>
              </div>

              <span className={`badge ${statusBadgeClass(item.status)}`}>
                {item.status}
              </span>
            </div>

            <div className="route-row">
              <span>route</span>
              <span>{item.routeOk ? 'ok' : 'missing'}</span>
            </div>

            <div className="route-row">
              <span>expected path</span>
              <span>{item.expectedPath || '—'}</span>
            </div>

            <div className="section-title small">Dependencies</div>

            <div className="dependency-list">
              {(item.dependencies || []).map((dep, index) => (
                <div key={`${item.key}-${dep.tableName || 'table'}-${index}`} className="dependency-card">
                  <div className="dependency-head">
                    <div>
                      <span className="dependency-name">{dep.tableName || 'not_found'}</span>
                      <span className={`dep-type ${dep.required ? 'required' : 'optional'}`}>
                        {dep.required ? 'required' : 'optional'}
                      </span>
                    </div>
                    <span className={`mini-badge ${depBadgeClass(dep)}`}>
                      {depBadgeText(dep)}
                    </span>
                  </div>

                  <div className="dependency-meta">
                    missing columns:{' '}
                    {(dep.missingColumns || []).length
                      ? dep.missingColumns.join(', ')
                      : 'none'}
                  </div>
                </div>
              ))}
            </div>

            <div className={`next-fix-box ${item.status === 'healthy' ? 'soft' : 'hard'}`}>
              {item.nextFix}
            </div>

            <div className="module-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => openTenantRoute(item.expectedPath)}
              >
                Open Module
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-fail-drilldown-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .summary-card,
  .module-card,
  .dependency-card,
  .page-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.35fr 280px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(239,68,68,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(254,242,242,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #dc2626;
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
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
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
    grid-template-columns: repeat(5, minmax(0, 1fr));
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

  .module-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .module-card {
    padding: 18px;
  }

  .module-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .module-title {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
  }

  .module-subtitle {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .route-row {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
  }

  .section-title.small {
    margin-top: 14px;
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .dependency-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .dependency-card {
    padding: 12px;
  }

  .dependency-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .dependency-name {
    font-weight: 900;
    color: #0f172a;
  }

  .dep-type {
    margin-left: 8px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .dep-type.required {
    color: #b91c1c;
  }

  .dep-type.optional {
    color: #c2410c;
  }

  .dependency-meta {
    margin-top: 8px;
    color: #64748b;
    font-size: 13px;
  }

  .next-fix-box {
    margin-top: 14px;
    padding: 14px;
    border-radius: 16px;
    font-weight: 700;
  }

  .next-fix-box.hard {
    background: #fff7ed;
    border: 1px solid #fdba74;
    color: #9a3412;
  }

  .next-fix-box.soft {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
  }

  .module-actions {
    margin-top: 14px;
  }

  .badge,
  .mini-badge {
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

  .badge.success,
  .mini-badge.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .badge.warning,
  .mini-badge.warning {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .badge.neutral {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .badge.danger,
  .mini-badge.danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  @media (max-width: 1100px) {
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 980px) {
    .hero-card {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
`;