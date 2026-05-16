import React, { useEffect, useMemo, useState } from 'react';
import {
  createPatientUploadJob,
  getPatientSyncStatus
} from './helpers/syncApi';

const FALLBACK_DATA = {
  patient: {
    fullName: 'Patient Demo',
    email: 'patient@raftop.local'
  },
  source: {
    deviceType: 'CPAP',
    sourceName: 'Manual / Demo Sync',
    lastSyncAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
  },
  status: 'synced',
  syncHealth: {
    state: 'healthy',
    staleThresholdHours: 24,
    missingThresholdHours: 72,
    hoursSinceLastSync: 18
  },
  counters: {
    importedNights: 12,
    missingNights: 0,
    failedImports: 0
  },
  alerts: [],
  latestJob: {
    id: 'import_demo_1',
    status: 'completed',
    sourceType: 'manual_upload',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 17.8 * 60 * 60 * 1000).toISOString(),
    importedRows: 12,
    errorMessage: null
  }
};

function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function toneFromHealthState(state = '') {
  const value = String(state || '').toLowerCase();

  if (value === 'healthy' || value === 'synced') return 'success';
  if (value === 'stale') return 'warning';
  if (value === 'missing') return 'danger';
  return 'neutral';
}

function badgeClass(tone) {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  return 'neutral';
}

export default function PatientDataSyncPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [sourceType, setSourceType] = useState('manual_upload');
  const [sourceName, setSourceName] = useState('Patient Manual Upload');
  const [deviceType, setDeviceType] = useState('CPAP');
  const [importedRows, setImportedRows] = useState('7');

  async function loadStatus() {
    setLoading(true);

    try {
      const payload = await getPatientSyncStatus();
      setData(payload || FALLBACK_DATA);
      setFallbackMode(false);
      setFlashMessage('');
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const statusTone = useMemo(
    () => toneFromHealthState(data.syncHealth?.state || data.status),
    [data]
  );

  async function handleCreateUpload(event) {
    event.preventDefault();
    setBusy(true);
    setFlashMessage('');

    try {
      await createPatientUploadJob({
        sourceType,
        sourceName,
        deviceType,
        importedRows: Number(importedRows || 0)
      });

      setFlashMessage('Το upload job δημιουργήθηκε επιτυχώς.');
      await loadStatus();
    } catch (error) {
      setFlashMessage(error?.message || 'Αποτυχία δημιουργίας upload job');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="patient-data-sync-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading sync status...</div>
      </div>
    );
  }

  return (
    <div className="patient-data-sync-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">DATA SYNC</div>
          <h1>Patient Data Sync</h1>
          <p>
            Παρακολούθηση sync health, missing/stale κατάσταση και manual recovery μέσω upload job.
          </p>

          <div className="hero-meta">
            <span className="hero-chip">{data.patient?.fullName || 'Patient'}</span>
            <span className="hero-chip">{data.patient?.email || '—'}</span>
            <span className={`badge ${badgeClass(statusTone)}`}>
              {data.syncHealth?.state || data.status}
            </span>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-stat">
            <div className="hero-stat-label">Hours Since Last Sync</div>
            <div className="hero-stat-value">{data.syncHealth?.hoursSinceLastSync ?? 0}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Imported Nights</div>
            <div className="hero-stat-value">{data.counters?.importedNights ?? 0}</div>
          </div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Data sync page σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {flashMessage ? <div className="banner info">{flashMessage}</div> : null}

      <section className="status-grid">
        <div className="status-card">
          <div className="status-label">Source</div>
          <div className="status-value">{data.source?.sourceName || '—'}</div>
          <div className="status-subtitle">{data.source?.deviceType || 'CPAP'}</div>
        </div>

        <div className="status-card">
          <div className="status-label">Last Sync</div>
          <div className="status-value small">{formatDateTime(data.source?.lastSyncAt)}</div>
          <div className="status-subtitle">Latest import execution</div>
        </div>

        <div className="status-card">
          <div className="status-label">Missing Nights</div>
          <div className="status-value">{data.counters?.missingNights ?? 0}</div>
          <div className="status-subtitle">Estimated gap window</div>
        </div>

        <div className="status-card">
          <div className="status-label">Failed Imports</div>
          <div className="status-value">{data.counters?.failedImports ?? 0}</div>
          <div className="status-subtitle">Recovery may be needed</div>
        </div>
      </section>

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">Sync Alerts</div>

          <div className="alert-list">
            {(data.alerts || []).length ? (
              data.alerts.map((alert, index) => (
                <div key={`${alert.title}-${index}`} className={`alert-card ${badgeClass(alert.level)}`}>
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-text">{alert.description}</div>
                </div>
              ))
            ) : (
              <div className="alert-card success">
                <div className="alert-title">No active sync alert</div>
                <div className="alert-text">Το sync φαίνεται λειτουργικό για τον patient.</div>
              </div>
            )}
          </div>

          <div className="section-title spaced">Latest Job</div>

          <div className="detail-row">
            <span className="label">Job ID</span>
            <span>{data.latestJob?.id || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Status</span>
            <span>{data.latestJob?.status || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Source Type</span>
            <span>{data.latestJob?.sourceType || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Imported Rows</span>
            <span>{data.latestJob?.importedRows ?? 0}</span>
          </div>
          <div className="detail-row">
            <span className="label">Finished At</span>
            <span>{formatDateTime(data.latestJob?.finishedAt)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Error</span>
            <span>{data.latestJob?.errorMessage || '—'}</span>
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Manual Upload Recovery</div>

          <form onSubmit={handleCreateUpload} className="form-wrap">
            <div className="field">
              <label className="field-label">Source Type</label>
              <select className="input" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                <option value="manual_upload">manual_upload</option>
                <option value="csv_import">csv_import</option>
                <option value="integration_sync">integration_sync</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label">Source Name</label>
              <input
                className="input"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Patient Manual Upload"
              />
            </div>

            <div className="field">
              <label className="field-label">Device Type</label>
              <input
                className="input"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                placeholder="CPAP"
              />
            </div>

            <div className="field">
              <label className="field-label">Imported Rows</label>
              <input
                className="input"
                type="number"
                min="1"
                value={importedRows}
                onChange={(e) => setImportedRows(e.target.value)}
              />
            </div>

            <button type="submit" className="primary-btn" disabled={busy}>
              {busy ? 'Creating...' : 'Create Upload Job'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-data-sync-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .status-card {
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
      radial-gradient(circle at top right, rgba(34,197,94,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,244,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #16a34a;
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

  .hero-meta {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .hero-chip {
    display: inline-flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 999px;
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
    font-size: 12px;
    font-weight: 800;
  }

  .hero-side {
    display: flex;
    flex-direction: column;
    gap: 12px;
    justify-content: center;
  }

  .hero-stat {
    padding: 14px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid #dcfce7;
  }

  .hero-stat-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .hero-stat-value {
    margin-top: 8px;
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
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

  .banner.info {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
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
  .badge.neutral { background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .status-card {
    padding: 16px;
  }

  .status-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .status-value {
    margin-top: 8px;
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
  }

  .status-value.small {
    font-size: 18px;
  }

  .status-subtitle {
    margin-top: 8px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: 1fr 0.95fr;
    gap: 18px;
  }

  .page-card {
    padding: 20px;
  }

  .section-title,
  .field-label {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .section-title.spaced {
    margin-top: 16px;
  }

  .alert-list,
  .form-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .alert-card {
    padding: 14px;
    border-radius: 16px;
    border: 1px solid transparent;
  }

  .alert-card.success {
    background: #ecfdf5;
    border-color: #86efac;
    color: #047857;
  }

  .alert-card.warning {
    background: #fff7ed;
    border-color: #fdba74;
    color: #c2410c;
  }

  .alert-card.danger {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }

  .alert-title {
    font-size: 14px;
    font-weight: 900;
  }

  .alert-text {
    margin-top: 6px;
    line-height: 1.6;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    margin-top: 10px;
  }

  .label {
    color: #475569;
    font-weight: 800;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
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

  .primary-btn {
    border: 0;
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 900;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    color: #fff;
    cursor: pointer;
  }

  @media (max-width: 1100px) {
    .status-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .layout-grid,
    .hero-card {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .status-grid {
      grid-template-columns: 1fr;
    }
  }
`;