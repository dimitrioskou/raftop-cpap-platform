import React, { useEffect, useMemo, useState } from 'react';
import {
  completePatientLesson,
  getPatientCoachingDashboard,
  startPatientLesson
} from './helpers/coachingApi';
import {
  formatDateTime,
  priorityTone,
  statusLabel,
  statusTone
} from './helpers/coachingHelpers';

const FALLBACK_DATA = {
  patient: {
    fullName: 'Patient Demo',
    email: 'patient@raftop.local'
  },
  summary: {
    total: 3,
    recommended: 2,
    inProgress: 1,
    completed: 0,
    critical: 1
  },
  context: {
    selectedDate: '2026-04-29',
    usageHours: 3.4,
    ahi: 4.8,
    leakRate: 27.2,
    latestSymptoms: ['dryness', 'mask_discomfort']
  },
  lessons: [
    {
      id: 'mask_fit_foundation',
      title: 'Mask Fit Foundation',
      description: 'Γρήγορος οδηγός για εφαρμογή μάσκας, straps και έλεγχο seal.',
      estimatedMinutes: 6,
      theme: 'mask',
      priority: 'critical',
      triggerReason: 'Υπάρχει αυξημένο leak ή concern για mask seal.',
      whyThisLesson: 'Η σωστή εφαρμογή μάσκας μειώνει leak, dryness και discomfort.',
      status: 'assigned',
      startedAt: null,
      completedAt: null,
      lastActionAt: null,
      source: 'rules_engine'
    },
    {
      id: 'dryness_relief_protocol',
      title: 'Dryness Relief Protocol',
      description: 'Μικρό protocol για dryness, humidification και comfort optimization.',
      estimatedMinutes: 5,
      theme: 'comfort',
      priority: 'warning',
      triggerReason: 'Καταγράφηκε dryness ή elevated leak pattern.',
      whyThisLesson: 'Η dry comfort παρέμβαση βοηθά στη διατήρηση της θεραπείας.',
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      completedAt: null,
      lastActionAt: new Date().toISOString(),
      source: 'rules_engine'
    },
    {
      id: 'first_4_hours_protocol',
      title: 'First 4 Hours Protocol',
      description: 'Σχέδιο προσαρμογής για να περάσεις σταθερά το όριο των 4 ωρών.',
      estimatedMinutes: 7,
      theme: 'adherence',
      priority: 'warning',
      triggerReason: 'Η χρήση της θεραπείας είναι κάτω από το therapeutic target.',
      whyThisLesson: 'Ο στόχος είναι να σταθεροποιηθεί πρώτα η διάρκεια χρήσης.',
      status: 'assigned',
      startedAt: null,
      completedAt: null,
      lastActionAt: null,
      source: 'rules_engine'
    }
  ]
};

function badgeClass(tone) {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'success';
  return 'neutral';
}

export default function PatientCoachingPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const [selectedId, setSelectedId] = useState('');

  async function loadDashboard(preferredId = '') {
    setLoading(true);

    try {
      const payload = await getPatientCoachingDashboard();
      setData(payload || FALLBACK_DATA);
      setFallbackMode(false);
      setFlashMessage('');
      setSelectedId(preferredId || selectedId || payload?.lessons?.[0]?.id || '');
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
      setSelectedId(preferredId || selectedId || FALLBACK_DATA.lessons[0]?.id || '');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const selectedLesson = useMemo(() => {
    return data.lessons?.find((item) => item.id === selectedId) || data.lessons?.[0] || null;
  }, [data.lessons, selectedId]);

  async function handleStartLesson(lessonId) {
    setBusyId(`start-${lessonId}`);
    setFlashMessage('');

    try {
      await startPatientLesson(lessonId);
      setFlashMessage('Το lesson ξεκίνησε.');
      await loadDashboard(lessonId);
    } catch (error) {
      setFlashMessage(error?.message || 'Αποτυχία έναρξης lesson');
    } finally {
      setBusyId('');
    }
  }

  async function handleCompleteLesson(lessonId) {
    setBusyId(`complete-${lessonId}`);
    setFlashMessage('');

    try {
      await completePatientLesson(lessonId);
      setFlashMessage('Το lesson ολοκληρώθηκε.');
      await loadDashboard(lessonId);
    } catch (error) {
      setFlashMessage(error?.message || 'Αποτυχία ολοκλήρωσης lesson');
    } finally {
      setBusyId('');
    }
  }

  if (loading) {
    return (
      <div className="patient-coaching-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading coaching dashboard...</div>
      </div>
    );
  }

  return (
    <div className="patient-coaching-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">COACHING ENGINE</div>
          <h1>Triggered Coaching Lessons</h1>
          <p>
            Στοχευμένα micro-lessons με βάση nightly analysis, overlay και symptoms.
          </p>

          <div className="hero-meta">
            <span className="hero-chip">{data.context?.selectedDate || '—'}</span>
            <span className="hero-chip">Usage {data.context?.usageHours ?? 0}h</span>
            <span className="hero-chip">Leak {data.context?.leakRate ?? 0}</span>
            <span className="hero-chip">AHI {data.context?.ahi ?? 0}</span>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">Total <strong>{data.summary?.total ?? 0}</strong></div>
          <div className="summary-pill">Assigned <strong>{data.summary?.recommended ?? 0}</strong></div>
          <div className="summary-pill">In Progress <strong>{data.summary?.inProgress ?? 0}</strong></div>
          <div className="summary-pill">Completed <strong>{data.summary?.completed ?? 0}</strong></div>
          <div className="summary-pill">Critical <strong>{data.summary?.critical ?? 0}</strong></div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Coaching engine σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {flashMessage ? (
        <div className="banner info">{flashMessage}</div>
      ) : null}

      <section className="layout-grid">
        <div className="page-card left-col">
          <div className="section-title">Lessons</div>

          <div className="lesson-list">
            {(data.lessons || []).map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                className={`lesson-row ${selectedLesson?.id === lesson.id ? 'active' : ''}`}
                onClick={() => setSelectedId(lesson.id)}
              >
                <div className="lesson-row-top">
                  <span className="lesson-title">{lesson.title}</span>
                  <span className={`badge ${badgeClass(priorityTone(lesson.priority))}`}>
                    {lesson.priority}
                  </span>
                </div>

                <div className="lesson-meta">{lesson.estimatedMinutes} min • {lesson.theme}</div>
                <div className="lesson-meta">{lesson.triggerReason}</div>

                <div className="lesson-inline-badges">
                  <span className={`mini-badge ${badgeClass(statusTone(lesson.status))}`}>
                    {statusLabel(lesson.status)}
                  </span>
                  <span className="mini-badge neutral">{lesson.source}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="page-card right-col">
          <div className="section-title">Lesson Detail</div>

          {selectedLesson ? (
            <div className="detail-wrap">
              <div className="detail-title">{selectedLesson.title}</div>

              <div className="detail-badges">
                <span className={`badge ${badgeClass(priorityTone(selectedLesson.priority))}`}>
                  {selectedLesson.priority}
                </span>
                <span className={`badge ${badgeClass(statusTone(selectedLesson.status))}`}>
                  {statusLabel(selectedLesson.status)}
                </span>
                <span className="badge neutral">
                  {selectedLesson.estimatedMinutes} min
                </span>
              </div>

              <div className="detail-description">
                {selectedLesson.description}
              </div>

              <div className="detail-row">
                <span className="label">Trigger Reason</span>
                <span>{selectedLesson.triggerReason || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Why This Lesson</span>
                <span>{selectedLesson.whyThisLesson || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Started At</span>
                <span>{formatDateTime(selectedLesson.startedAt)}</span>
              </div>

              <div className="detail-row">
                <span className="label">Completed At</span>
                <span>{formatDateTime(selectedLesson.completedAt)}</span>
              </div>

              <div className="detail-row">
                <span className="label">Last Action</span>
                <span>{formatDateTime(selectedLesson.lastActionAt)}</span>
              </div>

              <div className="detail-actions">
                {selectedLesson.status === 'assigned' ? (
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={busyId === `start-${selectedLesson.id}`}
                    onClick={() => handleStartLesson(selectedLesson.id)}
                  >
                    {busyId === `start-${selectedLesson.id}` ? 'Starting...' : 'Start Lesson'}
                  </button>
                ) : null}

                {selectedLesson.status === 'in_progress' ? (
                  <button
                    type="button"
                    className="success-btn"
                    disabled={busyId === `complete-${selectedLesson.id}`}
                    onClick={() => handleCompleteLesson(selectedLesson.id)}
                  >
                    {busyId === `complete-${selectedLesson.id}` ? 'Completing...' : 'Mark Complete'}
                  </button>
                ) : null}

                {selectedLesson.status === 'completed' ? (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => handleStartLesson(selectedLesson.id)}
                  >
                    Reopen Lesson
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="muted-inline">No lesson selected.</div>
          )}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-coaching-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card {
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

  .hero-meta {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
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

  .banner.info {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
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

  .lesson-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .lesson-row {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
  }

  .lesson-row.active {
    background: #ecfdf5;
    border-color: #86efac;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
  }

  .lesson-row-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }

  .lesson-title {
    font-weight: 900;
    color: #0f172a;
  }

  .lesson-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .lesson-inline-badges,
  .detail-badges,
  .detail-actions {
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

  .detail-description {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    line-height: 1.7;
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

  .primary-btn,
  .success-btn,
  .ghost-btn {
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .primary-btn {
    border: 0;
    background: linear-gradient(135deg, #0891b2 0%, #155e75 100%);
    color: #fff;
  }

  .success-btn {
    border: 0;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    color: #fff;
  }

  .ghost-btn {
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
  }
`;