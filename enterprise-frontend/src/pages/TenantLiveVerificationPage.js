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
      payload?.message || options.errorLabel || 'Live verification request failed'
    );
  }

  return payload?.data ?? payload;
}

const FALLBACK_DATA = {
  summary: {
    totalChecks: 4,
    passed: 2,
    failed: 2
  },
  checks: [
    {
      key: 'atlas_action_center',
      ok: true,
      durationMs: 18,
      message: 'ok',
      details: {
        summaryTotal: 3,
        itemsCount: 3
      }
    },
    {
      key: 'patient_orchestrator',
      ok: true,
      durationMs: 22,
      message: 'ok',
      details: {
        patientEmail: 'patient@raftop.local',
        tasksCount: 2,
        signalsCount: 2,
        coachingCount: 1,
        timelineCount: 4
      }
    },
    {
      key: 'patient_task_board',
      ok: false,
      durationMs: 9,
      message: 'tasks table not found',
      details: {}
    },
    {
      key: 'production_audit',
      ok: true,
      durationMs: 7,
      message: 'ok',
      details: {
        totalModules: 8,
        live: 3,
        partial: 4,
        missing: 1
      }
    }
  ],
  generatedAt: new Date().toISOString(),
  demoPatientRef: 'patient@raftop.local'
};

function badgeClass(ok) {
  return ok ? 'success' : 'danger';
}

function openTenantRouteByCheckKey(key) {
  const map = {
    atlas_action_center: '/tenant/atlas/action-center',
    patient_orchestrator: '/tenant/patient-orchestrator/patient@raftop.local',
    patient_task_board: '/tenant/patient-tasks/patient@raftop.local',
    production_audit: '/tenant/production-audit'
  };

  window.location.href = map[key] || '/tenant/dashboard';
}

export default function TenantLiveVerificationPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  async function loadVerification() {
    setLoading(true);

    try {
      const payload = await apiRequest('/api/tenant/live-verification', {
        errorLabel: 'Live verification request failed'
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
    loadVerification();
  }, []);

  const failedChecks = useMemo(() => {
    return (data.checks || []).filter((item) => !item.ok);
  }, [data.checks]);

  if (loading) {
    return (
      <div className="tenant-live-verification-page">
        <style>{pageStyles}</style>
        <div className="page-card">Running live verification...</div>
      </div>
    );
  }

  return (
    <div className="tenant-live-verification-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">LIVE VERIFICATION CENTER</div>
          <h1>Runtime Health Checks</h1>
          <p>
            Πραγματικά service checks για τα βασικά operational modules.
          </p>
        </div>

        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={loadVerification}>
            Run Again
          </button>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Live verification σε fallback mode. Εμφανίζονται demo αποτελέσματα.
        </div>
      ) : null}

      <section className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Checks</div>
          <div className="summary-value">{data.summary?.totalChecks ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Passed</div>
          <div className="summary-value">{data.summary?.passed ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Failed</div>
          <div className="summary-value">{data.summary?.failed ?? 0}</div>
        </div>
      </section>

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">Checks</div>

          <div className="check-list">
            {(data.checks || []).map((item) => (
              <div key={item.key} className="check-card">
                <div className="check-head">
                  <div className="check-title">{item.key}</div>
                  <span className={`badge ${badgeClass(item.ok)}`}>
                    {item.ok ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                <div className="check-meta">
                  duration: {item.durationMs ?? 0} ms
                </div>

                <div className="check-message">{item.message || '—'}</div>

                <pre className="details-box">
                  {JSON.stringify(item.details || {}, null, 2)}
                </pre>

                <div className="check-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => openTenantRouteByCheckKey(item.key)}
                  >
                    Open Module
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Failures First</div>

          {(failedChecks || []).length ? (
            <div className="failure-list">
              {failedChecks.map((item) => (
                <div key={item.key} className="failure-card">
                  <div className="failure-title">{item.key}</div>
                  <div className="failure-message">{item.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="success-box">
              Όλα τα checks πέρασαν.
            </div>
          )}

          <div className="section-title spaced">Generated At</div>
          <div className="plain-box">{data.generatedAt || '—'}</div>

          <div className="section-title spaced">Demo Patient Ref</div>
          <div className="plain-box">{data.demoPatientRef || '—'}</div>
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-live-verification-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .summary-card,
  .check-card,
  .failure-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.35fr 220px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(16,185,129,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(236,253,245,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #059669;
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
    align-items: center;
    justify-content: center;
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
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
    grid-template-columns: 1.2fr 0.8fr;
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

  .check-list,
  .failure-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .check-card,
  .failure-card {
    padding: 16px;
  }

  .check-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .check-title,
  .failure-title {
    font-weight: 900;
    color: #0f172a;
  }

  .check-meta,
  .check-message,
  .failure-message {
    margin-top: 8px;
    font-size: 13px;
    color: #64748b;
  }

  .details-box {
    margin-top: 10px;
    padding: 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #0f172a;
    font-size: 12px;
    overflow: auto;
  }

  .check-actions {
    margin-top: 12px;
  }

  .success-box,
  .plain-box {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
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

  .badge.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .badge.danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

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