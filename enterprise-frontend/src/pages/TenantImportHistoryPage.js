import React, { useEffect, useMemo, useState } from 'react';
import { getTenantImportHistory } from './patient/helpers/syncApi';

const FALLBACK_ITEMS = [
  {
    id: 'import_demo_1',
    patientEmail: 'patient@raftop.local',
    status: 'completed',
    sourceType: 'manual_upload',
    sourceName: 'Manual / Demo Sync',
    deviceType: 'CPAP',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 17.8 * 60 * 60 * 1000).toISOString(),
    importedRows: 12,
    errorMessage: null
  },
  {
    id: 'import_demo_2',
    patientEmail: 'patient2@raftop.local',
    status: 'failed',
    sourceType: 'csv_import',
    sourceName: 'AirView CSV',
    deviceType: 'CPAP',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 47.5 * 60 * 60 * 1000).toISOString(),
    importedRows: 0,
    errorMessage: 'Malformed CSV header'
  }
];

function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function badgeClass(status = '') {
  const value = String(status || '').toLowerCase();
  if (value === 'completed') return 'success';
  if (value === 'failed') return 'danger';
  if (value === 'processing' || value === 'pending') return 'warning';
  return 'neutral';
}

export default function TenantImportHistoryPage() {
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  async function loadHistory(preferredId = '') {
    setLoading(true);

    try {
      const payload = await getTenantImportHistory();
      const nextItems = payload?.items || [];
      setItems(nextItems);
      setFallbackMode(false);
      setSelectedId(preferredId || nextItems[0]?.id || '');
    } catch (_error) {
      setItems(FALLBACK_ITEMS);
      setFallbackMode(true);
      setSelectedId(preferredId || FALLBACK_ITEMS[0]?.id || '');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredItems = useMemo(() => {
    let nextItems = [...items];

    if (statusFilter) {
      nextItems = nextItems.filter((item) => String(item.status || '') === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      nextItems = nextItems.filter((item) => {
        const haystack = [
          item.patientEmail,
          item.sourceType,
          item.sourceName,
          item.deviceType,
          item.errorMessage
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return nextItems;
  }, [items, statusFilter, searchTerm]);

  const selectedItem = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedId) || filteredItems[0] || null;
  }, [filteredItems, selectedId]);

  if (loading) {
    return (
      <div className="tenant-import-history-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading import history...</div>
      </div>
    );
  }

  return (
    <div className="tenant-import-history-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">IMPORT HISTORY</div>
          <h1>Tenant Import History</h1>
          <p>
            Παρακολούθηση import jobs, failures, stale recovery και manual upload history.
          </p>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Import history σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      <section className="toolbar-card">
        <div className="toolbar-group">
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
            <option value="processing">processing</option>
            <option value="pending">pending</option>
          </select>
        </div>

        <div className="toolbar-group">
          <input
            className="input search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, source, error..."
          />
          <button type="button" className="ghost-btn" onClick={() => loadHistory(selectedItem?.id || '')}>
            Refresh
          </button>
        </div>
      </section>

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">Jobs</div>

          <div className="job-list">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`job-row ${selectedItem?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="job-row-top">
                    <span className="job-title">{item.patientEmail}</span>
                    <span className={`badge ${badgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="job-meta">{item.sourceName} • {item.sourceType}</div>
                  <div className="job-meta">{formatDateTime(item.createdAt)}</div>
                </button>
              ))
            ) : (
              <div className="muted-inline">No import jobs for this filter.</div>
            )}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Job Detail</div>

          {selectedItem ? (
            <div className="detail-wrap">
              <div className="detail-title">{selectedItem.patientEmail}</div>

              <div className="detail-row">
                <span className="label">Job ID</span>
                <span>{selectedItem.id}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status</span>
                <span>{selectedItem.status}</span>
              </div>
              <div className="detail-row">
                <span className="label">Source Type</span>
                <span>{selectedItem.sourceType}</span>
              </div>
              <div className="detail-row">
                <span className="label">Source Name</span>
                <span>{selectedItem.sourceName}</span>
              </div>
              <div className="detail-row">
                <span className="label">Device Type</span>
                <span>{selectedItem.deviceType}</span>
              </div>
              <div className="detail-row">
                <span className="label">Created At</span>
                <span>{formatDateTime(selectedItem.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Finished At</span>
                <span>{formatDateTime(selectedItem.finishedAt)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Imported Rows</span>
                <span>{selectedItem.importedRows ?? 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">Error</span>
                <span>{selectedItem.errorMessage || '—'}</span>
              </div>
            </div>
          ) : (
            <div className="muted-inline">No job selected.</div>
          )}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-import-history-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .toolbar-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
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

  .banner.warning {
    border-radius: 18px;
    padding: 14px 16px;
    font-size: 14px;
    font-weight: 600;
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #fdba74;
  }

  .toolbar-card {
    padding: 16px 18px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .toolbar-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .input {
    min-width: 170px;
    border: 1px solid #d0d5dd;
    border-radius: 14px;
    padding: 12px 14px;
    background: #fff;
    color: #101828;
    font-size: 14px;
    outline: none;
  }

  .input.search {
    min-width: 280px;
  }

  .ghost-btn {
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 900;
    cursor: pointer;
    border: 1px solid #d0d5dd;
    background: #fff;
    color: #344054;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: 420px 1fr;
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

  .job-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .job-row {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
  }

  .job-row.active {
    background: #ecfdf5;
    border-color: #86efac;
    box-shadow: 0 0 0 3px rgba(22,163,74,0.08);
  }

  .job-row-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }

  .job-title {
    font-weight: 900;
    color: #0f172a;
  }

  .job-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
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

  .detail-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-title {
    font-size: 24px;
    font-weight: 900;
    color: #0f172a;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .label {
    color: #475569;
    font-weight: 800;
  }

  .muted-inline {
    color: #64748b;
  }

  @media (max-width: 980px) {
    .layout-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .input.search {
      min-width: 170px;
    }
  }
`;