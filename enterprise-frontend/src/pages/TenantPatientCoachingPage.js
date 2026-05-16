import React, { useEffect, useMemo, useState } from 'react';
import { getTenantPatientCoachingOverview } from './patient/helpers/coachingApi';
import {
  formatDateTime,
  priorityTone,
  statusLabel,
  statusTone
} from './patient/helpers/coachingHelpers';

const FALLBACK_DATA = {
  summary: {
    total: 3,
    assigned: 2,
    inProgress: 1,
    completed: 0,
    critical: 1
  },
  items: [
    {
      id: 'mask_fit_foundation-patient1',
      lessonId: 'mask_fit_foundation',
      title: 'Mask Fit Foundation',
      patientEmail: 'patient1@raftop.local',
      status: 'assigned',
      priority: 'critical',
      triggerReason: 'Issue reported: mask discomfort',
      whyThisLesson: 'Η σωστή εφαρμογή μάσκας μειώνει leak, dryness και discomfort.',
      estimatedMinutes: 6,
      lastActionAt: new Date().toISOString()
    },
    {
      id: 'dryness_relief_protocol-patient2',
      lessonId: 'dryness_relief_protocol',
      title: 'Dryness Relief Protocol',
      patientEmail: 'patient2@raftop.local',
      status: 'in_progress',
      priority: 'warning',
      triggerReason: 'Dryness pattern observed',
      whyThisLesson: 'Dry comfort intervention may improve adherence.',
      estimatedMinutes: 5,
      lastActionAt: new Date().toISOString()
    }
  ]
};

function badgeClass(tone) {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'success';
  return 'neutral';
}

export default function TenantPatientCoachingPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  async function loadOverview(preferredId = '') {
    setLoading(true);

    try {
      const payload = await getTenantPatientCoachingOverview();
      setData(payload || FALLBACK_DATA);
      setFallbackMode(false);
      setSelectedId(preferredId || selectedId || payload?.items?.[0]?.id || '');
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
      setSelectedId(preferredId || selectedId || FALLBACK_DATA.items[0]?.id || '');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const filteredItems = useMemo(() => {
    let items = [...(data.items || [])];

    if (statusFilter) {
      items = items.filter((item) => String(item.status || '') === statusFilter);
    }

    if (priorityFilter) {
      items = items.filter((item) => String(item.priority || '') === priorityFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      items = items.filter((item) => {
        const haystack = [
          item.title,
          item.patientEmail,
          item.triggerReason,
          item.whyThisLesson,
          item.lessonId
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return items;
  }, [data.items, statusFilter, priorityFilter, searchTerm]);

  const selectedItem = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedId) || filteredItems[0] || null;
  }, [filteredItems, selectedId]);

  if (loading) {
    return (
      <div className="tenant-patient-coaching-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading tenant coaching overview...</div>
      </div>
    );
  }

  return (
    <div className="tenant-patient-coaching-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">PATIENT COACHING</div>
          <h1>Provider Coaching Visibility</h1>
          <p>
            Visibility σε triggered lessons, progress state και reason-for-assignment ανά patient.
          </p>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">Total <strong>{data.summary?.total ?? 0}</strong></div>
          <div className="summary-pill">Assigned <strong>{data.summary?.assigned ?? 0}</strong></div>
          <div className="summary-pill">In Progress <strong>{data.summary?.inProgress ?? 0}</strong></div>
          <div className="summary-pill">Completed <strong>{data.summary?.completed ?? 0}</strong></div>
          <div className="summary-pill">Critical <strong>{data.summary?.critical ?? 0}</strong></div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Tenant coaching overview σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      <section className="toolbar-card">
        <div className="toolbar-group">
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="assigned">assigned</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
          </select>

          <select className="input" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All priorities</option>
            <option value="critical">critical</option>
            <option value="warning">warning</option>
            <option value="normal">normal</option>
          </select>
        </div>

        <div className="toolbar-group">
          <input
            className="input search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, lesson, reason..."
          />

          <button type="button" className="ghost-btn" onClick={() => loadOverview(selectedItem?.id || '')}>
            Refresh
          </button>
        </div>
      </section>

      <section className="layout-grid">
        <div className="page-card left-col">
          <div className="section-title">Assignments</div>

          <div className="assignment-list">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`assignment-row ${selectedItem?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="assignment-row-top">
                    <span className="assignment-title">{item.title}</span>
                    <span className={`badge ${badgeClass(priorityTone(item.priority))}`}>
                      {item.priority}
                    </span>
                  </div>

                  <div className="assignment-meta">{item.patientEmail}</div>
                  <div className="assignment-meta">{item.triggerReason}</div>

                  <div className="assignment-inline-badges">
                    <span className={`mini-badge ${badgeClass(statusTone(item.status))}`}>
                      {statusLabel(item.status)}
                    </span>
                    <span className="mini-badge neutral">{item.estimatedMinutes} min</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="muted-inline">No coaching assignments for this filter.</div>
            )}
          </div>
        </div>

        <div className="page-card right-col">
          <div className="section-title">Assignment Detail</div>

          {selectedItem ? (
            <div className="detail-wrap">
              <div className="detail-title">{selectedItem.title}</div>

              <div className="detail-badges">
                <span className={`badge ${badgeClass(priorityTone(selectedItem.priority))}`}>
                  {selectedItem.priority}
                </span>
                <span className={`badge ${badgeClass(statusTone(selectedItem.status))}`}>
                  {statusLabel(selectedItem.status)}
                </span>
                <span className="badge neutral">{selectedItem.estimatedMinutes} min</span>
              </div>

              <div className="detail-row">
                <span className="label">Patient Email</span>
                <span>{selectedItem.patientEmail || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Lesson ID</span>
                <span>{selectedItem.lessonId || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Trigger Reason</span>
                <span>{selectedItem.triggerReason || '—'}</span>
              </div>

              <div className="detail-description">
                {selectedItem.whyThisLesson || '—'}
              </div>

              <div className="detail-row">
                <span className="label">Last Action</span>
                <span>{formatDateTime(selectedItem.lastActionAt)}</span>
              </div>
            </div>
          ) : (
            <div className="muted-inline">No assignment selected.</div>
          )}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-patient-coaching-page {
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
    display: grid;
    grid-template-columns: 1.35fr 360px;
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

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    align-self: start;
  }

  .summary-pill {
    padding: 14px 16px;
    border-radius: 16px;
    background: #ecfdf5;
    border: 1px solid #86efac;
    color: #047857;
    font-weight: 800;
    display: flex;
    justify-content: space-between;
  }

  .summary-pill strong {
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

  .assignment-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .assignment-row {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
  }

  .assignment-row.active {
    background: #ecfdf5;
    border-color: #86efac;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
  }

  .assignment-row-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }

  .assignment-title {
    font-weight: 900;
    color: #0f172a;
  }

  .assignment-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .assignment-inline-badges,
  .detail-badges {
    margin-top: 10px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

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

  .detail-description {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    line-height: 1.7;
  }

  .label {
    color: #475569;
    font-weight: 800;
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

  .mini-badge {
    padding: 6px 8px;
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

  .badge.danger,
  .mini-badge.danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .badge.neutral,
  .mini-badge.neutral {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
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

  .muted-inline {
    color: #64748b;
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

    .input.search {
      min-width: 170px;
    }
  }
`;