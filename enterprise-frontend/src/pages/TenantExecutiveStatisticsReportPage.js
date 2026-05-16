import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function getTenantId() {
  return (
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'raftopoulos-live'
  );
}

function getSuperAdminKey() {
  return (
    localStorage.getItem('super_admin_api_key') ||
    localStorage.getItem('superAdminApiKey') ||
    process.env.REACT_APP_SUPER_ADMIN_API_KEY ||
    ''
  );
}

async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': getTenantId(),
      'x-super-admin-key': getSuperAdminKey()
    }
  });

  const text = await response.text();

  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Backend returned non-JSON response from ${endpoint}`);
  }

  if (!response.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${response.status} at ${endpoint}`);
  }

  return json;
}

function safeArray(payload, keys = []) {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.patients)) return payload.patients;
  if (Array.isArray(payload?.devices)) return payload.devices;
  if (Array.isArray(payload?.signals)) return payload.signals;
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  if (Array.isArray(payload?.followups)) return payload.followups;
  if (Array.isArray(payload?.followUps)) return payload.followUps;
  if (Array.isArray(payload?.nextBestActions)) return payload.nextBestActions;
  if (Array.isArray(payload?.blockers)) return payload.blockers;

  return [];
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function isOpenStatus(value) {
  const text = normalizeText(value);

  if (!text) return true;

  return (
    text.includes('open') ||
    text.includes('pending') ||
    text.includes('active') ||
    text.includes('new') ||
    text.includes('needs') ||
    text.includes('attention') ||
    text.includes('todo') ||
    text.includes('in_progress')
  );
}

function isClosedStatus(value) {
  const text = normalizeText(value);

  return (
    text.includes('done') ||
    text.includes('closed') ||
    text.includes('complete') ||
    text.includes('completed') ||
    text.includes('resolved') ||
    text.includes('sent')
  );
}

function isCritical(value) {
  const text = normalizeText(value);

  return (
    text.includes('critical') ||
    text.includes('high') ||
    text.includes('urgent') ||
    text.includes('blocked') ||
    text.includes('red')
  );
}

function isMedium(value) {
  const text = normalizeText(value);

  return (
    text.includes('medium') ||
    text.includes('warn') ||
    text.includes('attention') ||
    text.includes('yellow')
  );
}

function getStatus(record) {
  return (
    record?.status ||
    record?.state ||
    record?.taskStatus ||
    record?.followupStatus ||
    record?.follow_up_status ||
    ''
  );
}

function getSeverity(record) {
  return (
    record?.severity ||
    record?.priority ||
    record?.risk ||
    record?.riskLevel ||
    record?.risk_level ||
    ''
  );
}

function getPatientKey(record) {
  return (
    record?.patientId ||
    record?.patient_id ||
    record?.patientName ||
    record?.patient_name ||
    record?.name ||
    record?.id ||
    ''
  );
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean).map((value) => String(value))).size;
}

function percent(part, total) {
  const p = toNumber(part);
  const t = toNumber(total);

  if (t <= 0) return 0;

  return Math.round((p / t) * 100);
}

function pickValue(payload, keys, fallback = 0) {
  for (const key of keys) {
    if (payload?.[key] !== undefined && payload?.[key] !== null) {
      return toNumber(payload[key], fallback);
    }

    if (payload?.summary?.[key] !== undefined && payload?.summary?.[key] !== null) {
      return toNumber(payload.summary[key], fallback);
    }

    if (payload?.metrics?.[key] !== undefined && payload?.metrics?.[key] !== null) {
      return toNumber(payload.metrics[key], fallback);
    }
  }

  return fallback;
}

function buildExecutiveStats(payloads) {
  const dashboard = payloads.dashboard || {};
  const patients = safeArray(payloads.patients, ['patients']);
  const devices = safeArray(payloads.devices, ['devices']);
  const signals = safeArray(payloads.signals, ['signals']);
  const tasks = safeArray(payloads.tasks, ['tasks', 'items']);
  const followups = safeArray(payloads.followup, ['followups', 'followUps', 'items']);
  const closedLoop = payloads.closedLoop || {};

  const totalPatients =
    pickValue(dashboard, ['patientsCount', 'patients_count', 'totalPatients'], patients.length) ||
    patients.length;

  const totalDevices =
    pickValue(dashboard, ['devicesCount', 'devices_count', 'totalDevices'], devices.length) ||
    devices.length;

  const totalDoctors =
    pickValue(dashboard, ['doctorsCount', 'doctors_count', 'totalDoctors'], 0);

  const criticalFollowups =
    pickValue(dashboard, ['criticalFollowups', 'critical_followups'], 0) ||
    followups.filter((item) => isCritical(getSeverity(item)) || isCritical(getStatus(item))).length;

  const pendingTasks =
    pickValue(dashboard, ['pendingTasks', 'pending_tasks'], 0) ||
    tasks.filter((task) => isOpenStatus(getStatus(task))).length;

  const offlineDevices =
    pickValue(dashboard, ['offlineDevices', 'offline_devices'], 0) ||
    devices.filter((device) => {
      const status = normalizeText(getStatus(device));
      return (
        status.includes('offline') ||
        status.includes('inactive') ||
        status.includes('disconnected') ||
        status.includes('no_sync') ||
        status.includes('not_sync')
      );
    }).length;

  const openSignals = signals.filter((signal) => isOpenStatus(getStatus(signal))).length || signals.length;
  const criticalSignals = signals.filter((signal) => isCritical(getSeverity(signal)) || isCritical(getStatus(signal))).length;
  const mediumSignals = signals.filter((signal) => isMedium(getSeverity(signal)) || isMedium(getStatus(signal))).length;

  const patientsWithSignals = uniqueCount(signals.map(getPatientKey));

  const patientsAtRisk = Math.max(
    patientsWithSignals,
    uniqueCount(
      signals
        .filter((signal) => {
          return (
            isCritical(getSeverity(signal)) ||
            isMedium(getSeverity(signal)) ||
            isOpenStatus(getStatus(signal))
          );
        })
        .map(getPatientKey)
    )
  );

  const openTasks = tasks.filter((task) => isOpenStatus(getStatus(task))).length;
  const closedTasks = tasks.filter((task) => isClosedStatus(getStatus(task))).length;
  const taskClosureRate = percent(closedTasks, openTasks + closedTasks);

  const openFollowups = followups.filter((item) => isOpenStatus(getStatus(item))).length;
  const closedFollowups = followups.filter((item) => isClosedStatus(getStatus(item))).length;
  const followupClosureRate = percent(closedFollowups, openFollowups + closedFollowups);

  const closedLoopMetrics = closedLoop.metrics || {};
  const totalVerifications = toNumber(closedLoopMetrics.totalVerifications, 0);
  const passedVerifications = toNumber(closedLoopMetrics.passedVerifications, 0);
  const failedVerifications = toNumber(closedLoopMetrics.failedVerifications, 0);
  const openRemediations = toNumber(closedLoopMetrics.openRemediations, 0);
  const resolvedRemediations = toNumber(closedLoopMetrics.resolvedRemediations, 0);
  const closedLoopPassRate = percent(passedVerifications, totalVerifications);

  const nextBestActions = safeArray(closedLoop, ['nextBestActions']);
  const blockers = safeArray(closedLoop, ['blockers']);

  const attentionLoad =
    openSignals +
    criticalSignals +
    pendingTasks +
    criticalFollowups +
    offlineDevices +
    openRemediations +
    blockers.length;

  const operationalControlScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        criticalSignals * 8 -
        criticalFollowups * 7 -
        offlineDevices * 5 -
        blockers.length * 12 -
        failedVerifications * 10
    )
  );

  const followupPressure = Math.max(
    0,
    Math.min(
      100,
      criticalFollowups * 18 +
        openFollowups * 6 +
        pendingTasks * 5 +
        criticalSignals * 12
    )
  );

  const atlasSignalValue = Math.max(
    0,
    Math.min(
      100,
      openSignals * 10 +
        patientsAtRisk * 8 +
        nextBestActions.length * 12
    )
  );

  const estimatedPreventedLostFollowups = Math.max(
    0,
    Math.round((criticalSignals + criticalFollowups + pendingTasks) * 0.35)
  );

  const estimatedTriageHoursSaved = Math.max(
    0,
    Math.round(((openSignals + pendingTasks + openFollowups) * 6 / 60) * 10) / 10
  );

  const recommendedActions = [];

  if (criticalFollowups > 0) {
    recommendedActions.push({
      priority: 'HIGH',
      title: 'Κλείσιμο critical follow-ups',
      text: 'Η ομάδα πρέπει να ξεκινήσει από τα critical follow-ups πριν κοιτάξει χαμηλότερης προτεραιότητας λίστες.'
    });
  }

  if (criticalSignals > 0) {
    recommendedActions.push({
      priority: 'HIGH',
      title: 'Άμεσο review critical ATLAS signals',
      text: 'Τα critical signals δείχνουν περιστατικά που μπορούν να χαθούν αν δεν υπάρξει γρήγορη ενέργεια.'
    });
  }

  if (pendingTasks > 0) {
    recommendedActions.push({
      priority: 'MEDIUM',
      title: 'Καθαρισμός pending tasks',
      text: 'Τα pending tasks πρέπει να αποκτήσουν owner, deadline και τελικό status.'
    });
  }

  if (offlineDevices > 0) {
    recommendedActions.push({
      priority: 'MEDIUM',
      title: 'Έλεγχος offline συσκευών',
      text: 'Οι offline ή inactive συσκευές μειώνουν την ορατότητα της θεραπείας και δυσκολεύουν το follow-up.'
    });
  }

  if (blockers.length > 0) {
    recommendedActions.push({
      priority: 'HIGH',
      title: 'Άρση closed-loop blockers',
      text: 'Τα blockers δείχνουν ότι υπάρχει λειτουργική εκκρεμότητα που εμποδίζει πλήρη έλεγχο.'
    });
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push({
      priority: 'LOW',
      title: 'Συνέχιση controlled monitoring',
      text: 'Δεν εμφανίζεται άμεσο operational blocker. Η αξία βρίσκεται στη συνεχή παρακολούθηση και στη διατήρηση του closed-loop.'
    });
  }

  return {
    totalPatients,
    totalDoctors,
    totalDevices,
    criticalFollowups,
    pendingTasks,
    offlineDevices,
    openSignals,
    criticalSignals,
    mediumSignals,
    patientsWithSignals,
    patientsAtRisk,
    openTasks,
    closedTasks,
    taskClosureRate,
    openFollowups,
    closedFollowups,
    followupClosureRate,
    totalVerifications,
    passedVerifications,
    failedVerifications,
    closedLoopPassRate,
    openRemediations,
    resolvedRemediations,
    nextBestActions: nextBestActions.length,
    blockers: blockers.length,
    attentionLoad,
    operationalControlScore,
    followupPressure,
    atlasSignalValue,
    estimatedPreventedLostFollowups,
    estimatedTriageHoursSaved,
    recommendedActions
  };
}

export default function TenantExecutiveStatisticsReportPage() {
  const [payloads, setPayloads] = useState({});
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState(null);

  const tenantId = getTenantId();

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'raftop-executive-report-print-style';
    style.innerHTML = `
      @media print {
        body {
          background: #ffffff !important;
        }

        button,
        nav,
        .no-print,
        body > div > section:first-child {
          display: none !important;
        }

        main {
          padding: 0 !important;
        }

        .print-page {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          max-width: 100% !important;
        }

        .print-break {
          page-break-before: always;
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById('raftop-executive-report-print-style');
      if (existing) existing.remove();
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErrors([]);

    const endpoints = [
      ['dashboard', '/api/tenant/dashboard'],
      ['patients', '/api/tenant/patients'],
      ['devices', '/api/tenant/devices'],
      ['signals', '/api/tenant/patient-signals'],
      ['tasks', '/api/tenant/tasks-unified'],
      ['followup', '/api/tenant/followup'],
      ['closedLoop', '/api/tenant/closed-loop/control-summary']
    ];

    const nextPayloads = {};
    const nextErrors = [];

    for (const [key, endpoint] of endpoints) {
      try {
        nextPayloads[key] = await apiGet(endpoint);
      } catch (error) {
        nextPayloads[key] = null;
        nextErrors.push({
          key,
          endpoint,
          message: error.message || 'Request failed'
        });
      }
    }

    setPayloads(nextPayloads);
    setErrors(nextErrors);
    setLoadedAt(new Date().toLocaleString());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => buildExecutiveStats(payloads), [payloads]);

  const status = getExecutiveStatus(stats);

  return (
    <main style={page}>
      <section className="no-print" style={toolbar}>
        <div>
          <strong>Executive Statistics Report</strong>
          <div style={toolbarSubtext}>
            Printable one-page report for Raftopoulos commercial discussion.
          </div>
        </div>

        <div style={toolbarActions}>
          <button type="button" style={darkButton} onClick={load}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          <button type="button" style={printButton} onClick={() => window.print()}>
            Print / Save PDF
          </button>

          <Link to="/tenant/statistics" style={linkButton}>
            Full Statistics
          </Link>

          <Link to="/sales/raftopoulos/pilot" style={linkButton}>
            Pilot Proposal
          </Link>
        </div>
      </section>

      <section className="print-page" style={reportSheet}>
        <header style={reportHeader}>
          <div>
            <div style={kicker}>RAFTOP CPAP CARE Pro</div>
            <h1 style={title}>Executive Statistics Report</h1>
            <p style={subtitle}>
              Στατιστική αποτύπωση λειτουργικού ελέγχου CPAP για τη Raftopoulos:
              ασθενείς σε ρίσκο, follow-up pressure, ATLAS value και next actions.
            </p>
          </div>

          <div style={headerMeta}>
            <div style={metaLabel}>Tenant</div>
            <div style={metaValue}>{tenantId}</div>

            <div style={metaLabel}>Generated</div>
            <div style={metaValue}>{loadedAt || 'Loading...'}</div>

            <div style={metaLabel}>Demo status</div>
            <div style={statusPill(status.tone)}>{status.label}</div>
          </div>
        </header>

        {errors.length > 0 && (
          <section style={errorPanel}>
            <strong>Report generated with source warnings.</strong>
            <div style={{ marginTop: 8 }}>
              {errors.map((error) => (
                <div key={error.endpoint}>
                  {error.endpoint}: {error.message}
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={summaryBand}>
          <div>
            <div style={summaryKicker}>Executive reading</div>
            <h2 style={summaryTitle}>{status.title}</h2>
            <p style={summaryText}>{status.text}</p>
          </div>

          <div style={scoreSeal(status.tone)}>
            <span>{stats.operationalControlScore}</span>
            <small>Control Score</small>
          </div>
        </section>

        <section style={kpiGrid}>
          <Kpi label="Σύνολο ασθενών" value={stats.totalPatients} />
          <Kpi label="Συσκευές CPAP" value={stats.totalDevices} />
          <Kpi label="Ασθενείς σε ρίσκο" value={stats.patientsAtRisk} tone={stats.patientsAtRisk > 0 ? 'warning' : 'success'} />
          <Kpi label="Critical follow-ups" value={stats.criticalFollowups} tone={stats.criticalFollowups > 0 ? 'danger' : 'success'} />
          <Kpi label="Pending tasks" value={stats.pendingTasks} tone={stats.pendingTasks > 0 ? 'warning' : 'success'} />
          <Kpi label="Offline devices" value={stats.offlineDevices} tone={stats.offlineDevices > 0 ? 'warning' : 'success'} />
        </section>

        <section style={scoreGrid}>
          <ScoreLine
            label="Operational Control Score"
            value={stats.operationalControlScore}
            description="Όσο πιο ψηλά, τόσο πιο ελεγχόμενη είναι η λειτουργία."
            tone={stats.operationalControlScore >= 80 ? 'success' : stats.operationalControlScore >= 55 ? 'warning' : 'danger'}
          />

          <ScoreLine
            label="Follow-up Pressure"
            value={stats.followupPressure}
            description="Όσο πιο ψηλά, τόσο μεγαλύτερη πίεση έχει η ομάδα από follow-ups και tasks."
            tone={stats.followupPressure <= 35 ? 'success' : stats.followupPressure <= 65 ? 'warning' : 'danger'}
          />

          <ScoreLine
            label="ATLAS Signal Value"
            value={stats.atlasSignalValue}
            description="Δείχνει αν το ATLAS παράγει λειτουργική αξία μέσω signals και next actions."
            tone={stats.atlasSignalValue > 0 ? 'success' : 'warning'}
          />
        </section>

        <section style={twoColumn}>
          <article style={sectionCard}>
            <div style={sectionKicker}>Follow-up control</div>
            <h3 style={sectionTitle}>Από εκκρεμότητα σε closure</h3>

            <MiniGrid>
              <MiniStat label="Open follow-ups" value={stats.openFollowups} tone="warning" />
              <MiniStat label="Closed follow-ups" value={stats.closedFollowups} tone="success" />
              <MiniStat label="Closure rate" value={`${stats.followupClosureRate}%`} tone={stats.followupClosureRate >= 70 ? 'success' : 'warning'} />
              <MiniStat label="Critical" value={stats.criticalFollowups} tone={stats.criticalFollowups > 0 ? 'danger' : 'success'} />
            </MiniGrid>

            <p style={insight}>
              Το ζητούμενο δεν είναι απλώς να εντοπίζονται ασθενείς. Το ζητούμενο είναι
              να γίνεται follow-up και να κλείνει η ενέργεια.
            </p>
          </article>

          <article style={sectionCard}>
            <div style={sectionKicker}>Closed loop</div>
            <h3 style={sectionTitle}>Έλεγχος ολοκλήρωσης ενεργειών</h3>

            <MiniGrid>
              <MiniStat label="Verifications" value={stats.totalVerifications} />
              <MiniStat label="Pass rate" value={`${stats.closedLoopPassRate}%`} tone={stats.closedLoopPassRate >= 80 ? 'success' : 'warning'} />
              <MiniStat label="Open remediations" value={stats.openRemediations} tone={stats.openRemediations > 0 ? 'warning' : 'success'} />
              <MiniStat label="Blockers" value={stats.blockers} tone={stats.blockers > 0 ? 'danger' : 'success'} />
            </MiniGrid>

            <p style={insight}>
              Το closed-loop δείχνει αν ένα signal έγινε task, αν έγινε action και αν
              τελικά έκλεισε. Αυτό είναι ο πυρήνας του operational control.
            </p>
          </article>
        </section>

        <section style={roiPanel}>
          <div>
            <div style={sectionKicker}>Pilot / ROI estimate</div>
            <h3 style={sectionTitle}>Μετρήσιμη αξία για pilot</h3>
            <p style={roiText}>
              Οι αριθμοί είναι συντηρητική λειτουργική εκτίμηση. Στο pilot θα
              αντικατασταθούν από πραγματικά δεδομένα 50–100 ασθενών.
            </p>
          </div>

          <div style={roiGrid}>
            <Kpi
              label="Prevented lost follow-ups"
              value={stats.estimatedPreventedLostFollowups}
              dark
            />

            <Kpi
              label="Estimated triage time saved"
              value={`${stats.estimatedTriageHoursSaved}h`}
              dark
            />

            <Kpi
              label="Attention load"
              value={stats.attentionLoad}
              dark
            />
          </div>
        </section>

        <section style={actionsPanel}>
          <div style={sectionKicker}>Recommended next actions</div>
          <h3 style={sectionTitle}>Τι πρέπει να κάνει η ομάδα</h3>

          <div style={actionsList}>
            {stats.recommendedActions.map((action, index) => (
              <div key={`${action.title}-${index}`} style={actionRow(action.priority)}>
                <div style={priorityBadge(action.priority)}>{action.priority}</div>
                <div>
                  <strong>{action.title}</strong>
                  <p>{action.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer style={footer}>
          <strong>Commercial framing:</strong>{' '}
          Η πλατφόρμα δεν δείχνει απλώς δεδομένα. Δείχνει πού πρέπει να δράσει η ομάδα σήμερα,
          ποια follow-ups κινδυνεύουν και αν οι ενέργειες τελικά κλείνουν.
        </footer>
      </section>
    </main>
  );
}

function getExecutiveStatus(stats) {
  if (
    stats.blockers > 0 ||
    stats.criticalFollowups > 0 ||
    stats.criticalSignals > 0 ||
    stats.operationalControlScore < 55
  ) {
    return {
      label: 'NEEDS ATTENTION',
      tone: 'danger',
      title: 'Υπάρχει άμεση ανάγκη επιχειρησιακής προτεραιοποίησης.',
      text:
        'Το σύστημα δείχνει ότι υπάρχουν critical signals, critical follow-ups ή blockers που πρέπει να μπουν πρώτα στη λίστα της ομάδας.'
    };
  }

  if (
    stats.pendingTasks > 0 ||
    stats.patientsAtRisk > 0 ||
    stats.followupPressure > 35 ||
    stats.openRemediations > 0
  ) {
    return {
      label: 'CONTROLLED WITH WATCHLIST',
      tone: 'warning',
      title: 'Η λειτουργία είναι ελεγχόμενη, αλλά υπάρχει watchlist.',
      text:
        'Υπάρχουν εκκρεμότητες που χρειάζονται παρακολούθηση. Η αξία της πλατφόρμας είναι ότι τις εμφανίζει πριν χαθούν.'
    };
  }

  return {
    label: 'CONTROLLED',
    tone: 'success',
    title: 'Η λειτουργία φαίνεται υπό έλεγχο.',
    text:
      'Δεν εμφανίζεται σοβαρό operational blocker. Η προτεραιότητα είναι η διατήρηση του closed-loop monitoring.'
  };
}

function Kpi({ label, value, tone = 'default', dark = false }) {
  const style = dark ? darkKpi : { ...kpi, ...toneStyle(tone) };

  return (
    <div style={style}>
      <div style={dark ? darkKpiLabel : kpiLabel}>{label}</div>
      <div style={dark ? darkKpiValue : kpiValue}>{value}</div>
    </div>
  );
}

function ScoreLine({ label, value, description, tone }) {
  const width = Math.max(0, Math.min(100, toNumber(value)));

  return (
    <article style={scoreLine}>
      <div style={scoreLineHeader}>
        <strong>{label}</strong>
        <span>{width}/100</span>
      </div>

      <div style={track}>
        <div
          style={{
            ...fill,
            width: `${width}%`,
            background:
              tone === 'danger'
                ? '#dc2626'
                : tone === 'warning'
                  ? '#d97706'
                  : '#0f766e'
          }}
        />
      </div>

      <p>{description}</p>
    </article>
  );
}

function MiniGrid({ children }) {
  return <div style={miniGrid}>{children}</div>;
}

function MiniStat({ label, value, tone = 'default' }) {
  return (
    <div style={{ ...miniStat, ...toneStyle(tone) }}>
      <div style={miniLabel}>{label}</div>
      <div style={miniValue}>{value}</div>
    </div>
  );
}

function toneStyle(tone) {
  if (tone === 'success') {
    return {
      background: '#f0fdf4',
      borderColor: '#bbf7d0'
    };
  }

  if (tone === 'warning') {
    return {
      background: '#fffbeb',
      borderColor: '#fde68a'
    };
  }

  if (tone === 'danger') {
    return {
      background: '#fef2f2',
      borderColor: '#fecaca'
    };
  }

  return {};
}

function statusPill(tone) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '7px 10px',
    fontWeight: 1000,
    fontSize: 12,
    background:
      tone === 'danger'
        ? '#fee2e2'
        : tone === 'warning'
          ? '#fef3c7'
          : '#dcfce7',
    color:
      tone === 'danger'
        ? '#991b1b'
        : tone === 'warning'
          ? '#92400e'
          : '#166534',
    border:
      tone === 'danger'
        ? '1px solid #fecaca'
        : tone === 'warning'
          ? '1px solid #fde68a'
          : '1px solid #bbf7d0'
  };
}

function scoreSeal(tone) {
  return {
    width: 150,
    height: 150,
    borderRadius: 999,
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    flexShrink: 0,
    background:
      tone === 'danger'
        ? '#fee2e2'
        : tone === 'warning'
          ? '#fef3c7'
          : '#dcfce7',
    color:
      tone === 'danger'
        ? '#991b1b'
        : tone === 'warning'
          ? '#92400e'
          : '#166534',
    border:
      tone === 'danger'
        ? '1px solid #fecaca'
        : tone === 'warning'
          ? '1px solid #fde68a'
          : '1px solid #bbf7d0',
    fontWeight: 1000
  };
}

function actionRow(priority) {
  return {
    display: 'grid',
    gridTemplateColumns: '86px 1fr',
    gap: 12,
    alignItems: 'start',
    borderRadius: 16,
    padding: 14,
    background: priority === 'HIGH' ? '#fef2f2' : priority === 'MEDIUM' ? '#fffbeb' : '#f8fafc',
    border: priority === 'HIGH' ? '1px solid #fecaca' : priority === 'MEDIUM' ? '1px solid #fde68a' : '1px solid #e2e8f0',
    color: '#0f172a'
  };
}

function priorityBadge(priority) {
  return {
    borderRadius: 999,
    padding: '7px 9px',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 1000,
    color: '#ffffff',
    background: priority === 'HIGH' ? '#dc2626' : priority === 'MEDIUM' ? '#d97706' : '#334155'
  };
}

const page = {
  display: 'grid',
  gap: 20
};

const toolbar = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)'
};

const toolbarSubtext = {
  marginTop: 4,
  color: '#64748b',
  fontWeight: 750,
  fontSize: 13
};

const toolbarActions = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const darkButton = {
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  borderRadius: 12,
  padding: '10px 13px',
  fontWeight: 900,
  cursor: 'pointer'
};

const printButton = {
  border: 0,
  background: '#0f766e',
  color: '#ffffff',
  borderRadius: 12,
  padding: '10px 13px',
  fontWeight: 900,
  cursor: 'pointer'
};

const linkButton = {
  display: 'inline-block',
  background: '#334155',
  color: '#ffffff',
  borderRadius: 12,
  padding: '10px 13px',
  fontWeight: 900,
  textDecoration: 'none'
};

const reportSheet = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 34,
  boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
  display: 'grid',
  gap: 20
};

const reportHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 24,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  borderBottom: '1px solid #e2e8f0',
  paddingBottom: 20
};

const kicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.14em'
};

const title = {
  margin: '10px 0',
  color: '#0f172a',
  fontSize: 42,
  lineHeight: 1.05,
  letterSpacing: '-0.04em'
};

const subtitle = {
  margin: 0,
  maxWidth: 860,
  color: '#475569',
  fontWeight: 750,
  fontSize: 17,
  lineHeight: 1.5
};

const headerMeta = {
  minWidth: 210,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16,
  display: 'grid',
  gap: 8
};

const metaLabel = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const metaValue = {
  color: '#0f172a',
  fontWeight: 900
};

const errorPanel = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 18,
  padding: 16,
  fontWeight: 800,
  lineHeight: 1.5
};

const summaryBand = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 22
};

const summaryKicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const summaryTitle = {
  margin: '8px 0',
  color: '#0f172a',
  fontSize: 28,
  lineHeight: 1.15
};

const summaryText = {
  margin: 0,
  color: '#475569',
  fontWeight: 750,
  lineHeight: 1.55,
  maxWidth: 920
};

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12
};

const kpi = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16
};

const kpiLabel = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.07em'
};

const kpiValue = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 28,
  fontWeight: 1000
};

const scoreGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14
};

const scoreLine = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16
};

const scoreLineHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  color: '#0f172a',
  gap: 12
};

const track = {
  marginTop: 12,
  height: 10,
  background: '#e2e8f0',
  borderRadius: 999,
  overflow: 'hidden'
};

const fill = {
  height: '100%',
  borderRadius: 999
};

const twoColumn = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
  gap: 16
};

const sectionCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 20
};

const sectionKicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const sectionTitle = {
  margin: '8px 0 14px',
  color: '#0f172a',
  fontSize: 22,
  lineHeight: 1.15
};

const miniGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: 10
};

const miniStat = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 15,
  padding: 13
};

const miniLabel = {
  color: '#64748b',
  fontSize: 10,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.07em'
};

const miniValue = {
  marginTop: 7,
  color: '#0f172a',
  fontSize: 22,
  fontWeight: 1000
};

const insight = {
  margin: '14px 0 0',
  color: '#475569',
  fontWeight: 750,
  lineHeight: 1.5
};

const roiPanel = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)',
  gap: 18,
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
  color: '#ffffff',
  borderRadius: 24,
  padding: 24
};

const roiText = {
  margin: 0,
  color: 'rgba(255,255,255,0.86)',
  fontWeight: 700,
  lineHeight: 1.55
};

const roiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10
};

const darkKpi = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 18,
  padding: 16
};

const darkKpiLabel = {
  color: '#bfdbfe',
  fontSize: 11,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.07em'
};

const darkKpiValue = {
  marginTop: 8,
  color: '#ffffff',
  fontSize: 28,
  fontWeight: 1000
};

const actionsPanel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 22
};

const actionsList = {
  display: 'grid',
  gap: 10
};

const footer = {
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#065f46',
  borderRadius: 18,
  padding: 18,
  fontWeight: 850,
  lineHeight: 1.55
};