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
  const tenantId = getTenantId();
  const superAdminKey = getSuperAdminKey();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': tenantId,
      'x-super-admin-key': superAdminKey
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
  if (Array.isArray(payload?.results)) return payload.results;
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

  if (Number.isFinite(number)) return number;

  return fallback;
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

function isLow(value) {
  const text = normalizeText(value);

  return (
    text.includes('low') ||
    text.includes('normal') ||
    text.includes('green') ||
    text.includes('info')
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

function pickDashboardValue(payload, keys, fallback = 0) {
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

function buildStats(payloads) {
  const dashboard = payloads.dashboard || {};
  const patients = safeArray(payloads.patients, ['patients']);
  const devices = safeArray(payloads.devices, ['devices']);
  const signals = safeArray(payloads.signals, ['signals']);
  const tasks = safeArray(payloads.tasks, ['tasks', 'items']);
  const followups = safeArray(payloads.followup, ['followups', 'followUps', 'items']);
  const closedLoop = payloads.closedLoop || {};

  const totalPatients =
    pickDashboardValue(dashboard, ['patientsCount', 'patients_count', 'totalPatients'], patients.length) ||
    patients.length;

  const totalDoctors =
    pickDashboardValue(dashboard, ['doctorsCount', 'doctors_count', 'totalDoctors'], 0);

  const totalDevices =
    pickDashboardValue(dashboard, ['devicesCount', 'devices_count', 'totalDevices'], devices.length) ||
    devices.length;

  const criticalFollowups =
    pickDashboardValue(dashboard, ['criticalFollowups', 'critical_followups'], 0) ||
    followups.filter((item) => isCritical(getSeverity(item)) || isCritical(getStatus(item))).length;

  const pendingTasks =
    pickDashboardValue(dashboard, ['pendingTasks', 'pending_tasks'], 0) ||
    tasks.filter((task) => isOpenStatus(getStatus(task))).length;

  const offlineDevices =
    pickDashboardValue(dashboard, ['offlineDevices', 'offline_devices'], 0) ||
    devices.filter((device) => {
      const status = normalizeText(getStatus(device));
      return (
        status.includes('offline') ||
        status.includes('inactive') ||
        status.includes('disconnected') ||
        status.includes('not_sync') ||
        status.includes('no_sync')
      );
    }).length;

  const openSignals = signals.filter((signal) => isOpenStatus(getStatus(signal))).length || signals.length;
  const criticalSignals = signals.filter((signal) => isCritical(getSeverity(signal)) || isCritical(getStatus(signal))).length;
  const mediumSignals = signals.filter((signal) => isMedium(getSeverity(signal)) || isMedium(getStatus(signal))).length;
  const lowSignals = Math.max(0, signals.length - criticalSignals - mediumSignals);

  const openTasks = tasks.filter((task) => isOpenStatus(getStatus(task))).length;
  const closedTasks = tasks.filter((task) => isClosedStatus(getStatus(task))).length;
  const taskClosureRate = percent(closedTasks, openTasks + closedTasks);

  const openFollowups = followups.filter((item) => isOpenStatus(getStatus(item))).length;
  const closedFollowups = followups.filter((item) => isClosedStatus(getStatus(item))).length;
  const followupClosureRate = percent(closedFollowups, openFollowups + closedFollowups);

  const patientsWithSignals = uniqueCount(signals.map(getPatientKey));
  const patientsAtOperationalRisk = Math.max(
    patientsWithSignals,
    uniqueCount(
      signals
        .filter((signal) => isCritical(getSeverity(signal)) || isMedium(getSeverity(signal)) || isOpenStatus(getStatus(signal)))
        .map(getPatientKey)
    )
  );

  const closedLoopMetrics = closedLoop.metrics || {};
  const totalVerifications = toNumber(closedLoopMetrics.totalVerifications, 0);
  const passedVerifications = toNumber(closedLoopMetrics.passedVerifications, 0);
  const failedVerifications = toNumber(closedLoopMetrics.failedVerifications, 0);
  const resolvedRemediations = toNumber(closedLoopMetrics.resolvedRemediations, 0);
  const openRemediations = toNumber(closedLoopMetrics.openRemediations, 0);
  const closedLoopPassRate = percent(passedVerifications, totalVerifications);
  const nextBestActions = safeArray(closedLoop, ['nextBestActions']).length;
  const blockers = safeArray(closedLoop, ['blockers']).length;

  const attentionLoad =
    openSignals +
    criticalSignals +
    pendingTasks +
    criticalFollowups +
    offlineDevices +
    openRemediations +
    blockers;

  const operationalControlScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        criticalSignals * 8 -
        criticalFollowups * 7 -
        offlineDevices * 5 -
        blockers * 12 -
        failedVerifications * 10
    )
  );

  const followupPressureScore = Math.max(
    0,
    Math.min(
      100,
      criticalFollowups * 18 +
        openFollowups * 6 +
        pendingTasks * 5 +
        criticalSignals * 12
    )
  );

  const atlasSignalValueScore = Math.max(
    0,
    Math.min(
      100,
      openSignals * 10 +
        patientsAtOperationalRisk * 8 +
        nextBestActions * 12
    )
  );

  const estimatedPreventedLostFollowups = Math.max(
    0,
    Math.round((criticalSignals + criticalFollowups + pendingTasks) * 0.35)
  );

  const estimatedTriageMinutesSaved = Math.max(
    0,
    Math.round((openSignals + pendingTasks + openFollowups) * 6)
  );

  const estimatedTriageHoursSaved =
    estimatedTriageMinutesSaved > 0
      ? Math.round((estimatedTriageMinutesSaved / 60) * 10) / 10
      : 0;

  return {
    totalPatients,
    totalDoctors,
    totalDevices,
    criticalFollowups,
    pendingTasks,
    offlineDevices,
    signalsTotal: signals.length,
    openSignals,
    criticalSignals,
    mediumSignals,
    lowSignals,
    openTasks,
    closedTasks,
    taskClosureRate,
    openFollowups,
    closedFollowups,
    followupClosureRate,
    patientsWithSignals,
    patientsAtOperationalRisk,
    totalVerifications,
    passedVerifications,
    failedVerifications,
    resolvedRemediations,
    openRemediations,
    closedLoopPassRate,
    nextBestActions,
    blockers,
    attentionLoad,
    operationalControlScore,
    followupPressureScore,
    atlasSignalValueScore,
    estimatedPreventedLostFollowups,
    estimatedTriageHoursSaved,
    raw: {
      dashboard,
      patients,
      devices,
      signals,
      tasks,
      followups,
      closedLoop
    }
  };
}

export default function TenantStatisticsPage() {
  const [payloads, setPayloads] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loadedAt, setLoadedAt] = useState(null);

  const tenantId = getTenantId();

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

  const stats = useMemo(() => buildStats(payloads), [payloads]);

  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>RAFTOP CPAP CARE Pro / Statistics</div>

        <h1 style={title}>
          Στατιστικά επιχειρησιακού ελέγχου CPAP
        </h1>

        <p style={subtitle}>
          Όχι τυχαία γραφήματα. Στατιστικά που δείχνουν ποιοι ασθενείς χρειάζονται
          ενέργεια, πόσα follow-ups κινδυνεύουν να χαθούν, τι φορτίο έχει η ομάδα
          και τι αξία παράγει η χρήση της πλατφόρμας.
        </p>

        <div style={heroActions}>
          <button type="button" style={primaryButton} onClick={load}>
            {loading ? 'Φόρτωση...' : 'Refresh Statistics'}
          </button>

          <Link to="/sales/raftopoulos" style={secondaryButton}>
            Sales Snapshot
          </Link>

          <Link to="/sales/raftopoulos/pilot" style={secondaryButton}>
            Pilot Proposal
          </Link>

          <Link to="/tenant/dashboard" style={secondaryButton}>
            Dashboard
          </Link>
        </div>
      </section>

      <section style={contextStrip}>
        <div style={contextItem}>
          <span>Tenant</span>
          <strong>{tenantId}</strong>
        </div>

        <div style={contextItem}>
          <span>Backend</span>
          <strong>{API_BASE}</strong>
        </div>

        <div style={contextItem}>
          <span>Loaded</span>
          <strong>{loadedAt || 'Loading...'}</strong>
        </div>

        <div style={contextItem}>
          <span>Endpoint Errors</span>
          <strong>{errors.length}</strong>
        </div>
      </section>

      {errors.length > 0 && (
        <section style={errorPanel}>
          <strong>Some statistics sources failed.</strong>
          <div style={errorList}>
            {errors.map((error) => (
              <div key={error.endpoint}>
                {error.endpoint}: {error.message}
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={metricsGrid}>
        <MetricCard
          label="Σύνολο ασθενών"
          value={stats.totalPatients}
          description="Μέγεθος χαρτοφυλακίου CPAP που πρέπει να ελέγχεται."
          tone="success"
        />

        <MetricCard
          label="Συσκευές CPAP"
          value={stats.totalDevices}
          description="Συσκευές που συνδέονται με ασθενείς και follow-up λειτουργία."
        />

        <MetricCard
          label="Ασθενείς με signals"
          value={stats.patientsWithSignals}
          description="Ασθενείς που έχουν τουλάχιστον ένα operational signal."
          tone={stats.patientsWithSignals > 0 ? 'warning' : 'success'}
        />

        <MetricCard
          label="Ασθενείς σε λειτουργικό ρίσκο"
          value={stats.patientsAtOperationalRisk}
          description="Ασθενείς που πρέπει να μπουν στο ραντάρ της ομάδας."
          tone={stats.patientsAtOperationalRisk > 0 ? 'warning' : 'success'}
        />

        <MetricCard
          label="Critical follow-ups"
          value={stats.criticalFollowups}
          description="Περιστατικά που δεν πρέπει να χαθούν."
          tone={stats.criticalFollowups > 0 ? 'danger' : 'success'}
        />

        <MetricCard
          label="Pending tasks"
          value={stats.pendingTasks}
          description="Εκκρεμείς ενέργειες που πρέπει να ανατεθούν ή να κλείσουν."
          tone={stats.pendingTasks > 0 ? 'warning' : 'success'}
        />
      </section>

      <section style={valueGrid}>
        <ScoreCard
          title="Operational Control Score"
          value={stats.operationalControlScore}
          description="Δείχνει πόσο ελεγχόμενη είναι η συνολική λειτουργία. Όσο πιο κοντά στο 100, τόσο λιγότερα σοβαρά blockers."
          tone={stats.operationalControlScore >= 80 ? 'success' : stats.operationalControlScore >= 55 ? 'warning' : 'danger'}
        />

        <ScoreCard
          title="Follow-up Pressure"
          value={stats.followupPressureScore}
          description="Δείχνει την πίεση της ομάδας από pending tasks, critical follow-ups και signals."
          inverse
          tone={stats.followupPressureScore <= 35 ? 'success' : stats.followupPressureScore <= 65 ? 'warning' : 'danger'}
        />

        <ScoreCard
          title="ATLAS Signal Value"
          value={stats.atlasSignalValueScore}
          description="Δείχνει πόση λειτουργική αξία παράγουν τα signals και τα next-best-actions."
          tone={stats.atlasSignalValueScore > 0 ? 'success' : 'warning'}
        />
      </section>

      <section style={panel}>
        <div style={sectionKicker}>ATLAS workload</div>
        <h2 style={sectionTitle}>Πού πρέπει να κοιτάξει η ομάδα σήμερα</h2>

        <div style={barGrid}>
          <BarStat
            label="Open signals"
            value={stats.openSignals}
            max={Math.max(1, stats.signalsTotal)}
            tone="warning"
            explanation="Signals που χρειάζονται έλεγχο ή follow-up."
          />

          <BarStat
            label="Critical signals"
            value={stats.criticalSignals}
            max={Math.max(1, stats.signalsTotal)}
            tone="danger"
            explanation="Τα πιο επικίνδυνα signals για απώλεια συμμόρφωσης ή χαμένο follow-up."
          />

          <BarStat
            label="Medium signals"
            value={stats.mediumSignals}
            max={Math.max(1, stats.signalsTotal)}
            tone="warning"
            explanation="Σήματα που πρέπει να μπουν σε προτεραιότητα πριν γίνουν critical."
          />

          <BarStat
            label="Low / normal signals"
            value={stats.lowSignals}
            max={Math.max(1, stats.signalsTotal)}
            tone="success"
            explanation="Χαμηλής προτεραιότητας ή σταθερά signals."
          />
        </div>
      </section>

      <section style={twoColumn}>
        <section style={panel}>
          <div style={sectionKicker}>Follow-up performance</div>
          <h2 style={sectionTitle}>Από signal σε ενέργεια</h2>

          <div style={miniMetrics}>
            <MiniMetric label="Open follow-ups" value={stats.openFollowups} tone="warning" />
            <MiniMetric label="Closed follow-ups" value={stats.closedFollowups} tone="success" />
            <MiniMetric label="Closure rate" value={`${stats.followupClosureRate}%`} tone={stats.followupClosureRate >= 70 ? 'success' : 'warning'} />
            <MiniMetric label="Critical follow-ups" value={stats.criticalFollowups} tone={stats.criticalFollowups > 0 ? 'danger' : 'success'} />
          </div>

          <ProgressLine
            label="Follow-up closure"
            value={stats.followupClosureRate}
            tone={stats.followupClosureRate >= 70 ? 'success' : 'warning'}
          />

          <InsightBox
            title="Τι σημαίνει αυτό;"
            text="Η Raftopoulos δεν χρειάζεται μόνο να βλέπει ποιοι ασθενείς έχουν θέμα. Χρειάζεται να βλέπει αν η ομάδα έκανε την ενέργεια και αν το περιστατικό έκλεισε."
          />
        </section>

        <section style={panel}>
          <div style={sectionKicker}>Task execution</div>
          <h2 style={sectionTitle}>Από εκκρεμότητα σε closure</h2>

          <div style={miniMetrics}>
            <MiniMetric label="Open tasks" value={stats.openTasks || stats.pendingTasks} tone="warning" />
            <MiniMetric label="Closed tasks" value={stats.closedTasks} tone="success" />
            <MiniMetric label="Task closure" value={`${stats.taskClosureRate}%`} tone={stats.taskClosureRate >= 70 ? 'success' : 'warning'} />
            <MiniMetric label="Attention load" value={stats.attentionLoad} tone={stats.attentionLoad > 0 ? 'warning' : 'success'} />
          </div>

          <ProgressLine
            label="Task closure"
            value={stats.taskClosureRate}
            tone={stats.taskClosureRate >= 70 ? 'success' : 'warning'}
          />

          <InsightBox
            title="Ποια είναι η λύση;"
            text="Το Action Center δεν πρέπει να είναι απλή λίστα. Πρέπει να γίνεται το σημείο όπου η ομάδα βλέπει τι πρέπει να γίνει, τι έγινε και τι καθυστέρησε."
          />
        </section>
      </section>

      <section style={panel}>
        <div style={sectionKicker}>Closed-loop control</div>
        <h2 style={sectionTitle}>Έλεγχος ότι τα προβλήματα κλείνουν</h2>

        <div style={closedLoopGrid}>
          <MiniMetric label="Total verifications" value={stats.totalVerifications} />
          <MiniMetric label="Passed verifications" value={stats.passedVerifications} tone="success" />
          <MiniMetric label="Failed verifications" value={stats.failedVerifications} tone={stats.failedVerifications > 0 ? 'danger' : 'success'} />
          <MiniMetric label="Closed-loop pass rate" value={`${stats.closedLoopPassRate}%`} tone={stats.closedLoopPassRate >= 80 ? 'success' : 'warning'} />
          <MiniMetric label="Open remediations" value={stats.openRemediations} tone={stats.openRemediations > 0 ? 'warning' : 'success'} />
          <MiniMetric label="Resolved remediations" value={stats.resolvedRemediations} tone="success" />
          <MiniMetric label="Next-best-actions" value={stats.nextBestActions} tone={stats.nextBestActions > 0 ? 'warning' : 'success'} />
          <MiniMetric label="Blockers" value={stats.blockers} tone={stats.blockers > 0 ? 'danger' : 'success'} />
        </div>

        <InsightBox
          title="Γιατί είναι σημαντικό για τη Raftopoulos;"
          text="Η πραγματική αξία δεν είναι να βγει ένα alert. Η αξία είναι να υπάρχει κλειστός κύκλος: signal → task → action → verification → closure."
        />
      </section>

      <section style={roiPanel}>
        <div>
          <div style={roiKicker}>Pilot / ROI estimate</div>
          <h2 style={roiTitle}>Τι αξία μπορεί να αποδείξει το pilot</h2>

          <p style={roiText}>
            Οι παρακάτω αριθμοί είναι συντηρητική λειτουργική εκτίμηση για pilot.
            Δεν είναι λογιστική υπόσχεση. Είναι τρόπος να δείξεις ότι η πλατφόρμα
            μετράει πράγματα που σήμερα χάνονται σε Excel, τηλέφωνα και άτυπα follow-ups.
          </p>
        </div>

        <div style={roiCards}>
          <div style={roiCard}>
            <div style={roiLabel}>Estimated prevented lost follow-ups</div>
            <div style={roiValue}>{stats.estimatedPreventedLostFollowups}</div>
            <p style={roiSmall}>
              Follow-ups που πιθανώς θα εντοπιστούν νωρίτερα μέσω signals, tasks και ATLAS.
            </p>
          </div>

          <div style={roiCard}>
            <div style={roiLabel}>Estimated triage time saved</div>
            <div style={roiValue}>{stats.estimatedTriageHoursSaved}h</div>
            <p style={roiSmall}>
              Εκτίμηση χρόνου που δεν σπαταλιέται σε χειροκίνητο ψάξιμο περιστατικών.
            </p>
          </div>

          <div style={roiCard}>
            <div style={roiLabel}>Operational attention load</div>
            <div style={roiValue}>{stats.attentionLoad}</div>
            <p style={roiSmall}>
              Συνολική πίεση από signals, tasks, critical follow-ups, offline devices και blockers.
            </p>
          </div>
        </div>
      </section>

      <section style={salesMessagePanel}>
        <div style={sectionKicker}>Sales message</div>
        <h2 style={sectionTitle}>Η σωστή φράση προς τη Raftopoulos</h2>

        <div style={quoteBox}>
          Δεν σας δίνουμε απλώς ένα dashboard. Σας δίνουμε στατιστικό και
          επιχειρησιακό έλεγχο: ποιοι ασθενείς χρειάζονται ενέργεια, ποια
          follow-ups κινδυνεύουν, τι έκανε η ομάδα και ποια περιστατικά έκλεισαν.
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, description, tone = 'default' }) {
  return (
    <article style={{ ...metricCard, ...toneStyle(tone) }}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
      <p style={metricDescription}>{description}</p>
    </article>
  );
}

function ScoreCard({ title, value, description, tone = 'default', inverse = false }) {
  const displayValue = Math.max(0, Math.min(100, toNumber(value)));

  return (
    <article style={{ ...scoreCard, ...toneStyle(tone) }}>
      <div style={scoreTop}>
        <div>
          <div style={scoreLabel}>{title}</div>
          <div style={scoreValue}>{displayValue}/100</div>
        </div>

        <div style={scoreBadge}>
          {inverse ? 'Lower is better' : 'Higher is better'}
        </div>
      </div>

      <div style={scoreTrack}>
        <div
          style={{
            ...scoreFill,
            width: `${displayValue}%`,
            background:
              tone === 'danger'
                ? '#dc2626'
                : tone === 'warning'
                  ? '#d97706'
                  : '#0f766e'
          }}
        />
      </div>

      <p style={scoreDescription}>{description}</p>
    </article>
  );
}

function BarStat({ label, value, max, tone = 'default', explanation }) {
  const width = percent(value, max);

  return (
    <article style={barStat}>
      <div style={barHeader}>
        <strong>{label}</strong>
        <span>{value}</span>
      </div>

      <div style={barTrack}>
        <div
          style={{
            ...barFill,
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

      <p style={barExplanation}>{explanation}</p>
    </article>
  );
}

function MiniMetric({ label, value, tone = 'default' }) {
  return (
    <div style={{ ...miniMetric, ...toneStyle(tone) }}>
      <div style={miniLabel}>{label}</div>
      <div style={miniValue}>{value}</div>
    </div>
  );
}

function ProgressLine({ label, value, tone = 'default' }) {
  const width = Math.max(0, Math.min(100, toNumber(value)));

  return (
    <div style={progressWrapper}>
      <div style={progressHeader}>
        <strong>{label}</strong>
        <span>{width}%</span>
      </div>

      <div style={progressTrack}>
        <div
          style={{
            ...progressFill,
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
    </div>
  );
}

function InsightBox({ title, text }) {
  return (
    <div style={insightBox}>
      <strong>{title}</strong>
      <p>{text}</p>
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

const page = {
  display: 'grid',
  gap: 20
};

const hero = {
  background: 'linear-gradient(135deg, #020617 0%, #0f766e 50%, #14b8a6 100%)',
  color: '#ffffff',
  borderRadius: 34,
  padding: 44,
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.18)'
};

const kicker = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.18em',
  opacity: 0.9,
  textTransform: 'uppercase'
};

const title = {
  margin: '14px 0 12px',
  fontSize: 52,
  lineHeight: 1.03,
  letterSpacing: '-0.04em',
  maxWidth: 1080
};

const subtitle = {
  margin: 0,
  maxWidth: 1040,
  color: 'rgba(255,255,255,0.9)',
  fontWeight: 750,
  fontSize: 20,
  lineHeight: 1.5
};

const heroActions = {
  marginTop: 28,
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap'
};

const primaryButton = {
  display: 'inline-block',
  border: '1px solid rgba(255,255,255,0.55)',
  background: '#ffffff',
  color: '#0f172a',
  borderRadius: 16,
  padding: '13px 17px',
  fontWeight: 1000,
  cursor: 'pointer',
  textDecoration: 'none'
};

const secondaryButton = {
  display: 'inline-block',
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.12)',
  color: '#ffffff',
  borderRadius: 16,
  padding: '13px 17px',
  fontWeight: 1000,
  textDecoration: 'none'
};

const contextStrip = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const contextItem = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16,
  display: 'grid',
  gap: 6,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)'
};

const errorPanel = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 20,
  padding: 18,
  fontWeight: 800,
  lineHeight: 1.5
};

const errorList = {
  marginTop: 10,
  display: 'grid',
  gap: 6
};

const metricsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: 16
};

const metricCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)'
};

const metricLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const metricValue = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 34,
  fontWeight: 1000,
  lineHeight: 1
};

const metricDescription = {
  margin: '10px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.45
};

const valueGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 16
};

const scoreCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)'
};

const scoreTop = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'flex-start'
};

const scoreLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const scoreValue = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 32,
  fontWeight: 1000
};

const scoreBadge = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 999,
  padding: '7px 10px',
  color: '#475569',
  fontSize: 12,
  fontWeight: 900
};

const scoreTrack = {
  marginTop: 16,
  height: 12,
  background: '#e2e8f0',
  borderRadius: 999,
  overflow: 'hidden'
};

const scoreFill = {
  height: '100%',
  borderRadius: 999
};

const scoreDescription = {
  margin: '12px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.5
};

const panel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const sectionKicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const sectionTitle = {
  margin: '8px 0 18px',
  color: '#0f172a',
  fontSize: 32,
  lineHeight: 1.12
};

const barGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14
};

const barStat = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 18
};

const barHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  color: '#0f172a',
  fontSize: 15
};

const barTrack = {
  marginTop: 12,
  height: 12,
  background: '#e2e8f0',
  borderRadius: 999,
  overflow: 'hidden'
};

const barFill = {
  height: '100%',
  borderRadius: 999
};

const barExplanation = {
  margin: '10px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.45
};

const twoColumn = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 18
};

const miniMetrics = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 12
};

const miniMetric = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16
};

const miniLabel = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.07em',
  textTransform: 'uppercase'
};

const miniValue = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 26,
  fontWeight: 1000
};

const progressWrapper = {
  marginTop: 18
};

const progressHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  color: '#334155',
  fontWeight: 900
};

const progressTrack = {
  marginTop: 10,
  height: 12,
  background: '#e2e8f0',
  borderRadius: 999,
  overflow: 'hidden'
};

const progressFill = {
  height: '100%',
  borderRadius: 999
};

const insightBox = {
  marginTop: 18,
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#065f46',
  borderRadius: 18,
  padding: 16,
  fontWeight: 800,
  lineHeight: 1.5
};

const closedLoopGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12
};

const roiPanel = {
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(320px, 1fr)',
  gap: 22,
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
  color: '#ffffff',
  borderRadius: 30,
  padding: 32,
  boxShadow: '0 16px 50px rgba(15, 23, 42, 0.15)'
};

const roiKicker = {
  color: '#93c5fd',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const roiTitle = {
  margin: '8px 0',
  fontSize: 32,
  lineHeight: 1.12
};

const roiText = {
  margin: 0,
  color: 'rgba(255,255,255,0.86)',
  fontWeight: 700,
  lineHeight: 1.6
};

const roiCards = {
  display: 'grid',
  gap: 12
};

const roiCard = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 20,
  padding: 18
};

const roiLabel = {
  color: '#bfdbfe',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const roiValue = {
  marginTop: 8,
  fontSize: 32,
  fontWeight: 1000
};

const roiSmall = {
  margin: '8px 0 0',
  color: 'rgba(255,255,255,0.8)',
  fontWeight: 650,
  lineHeight: 1.45
};

const salesMessagePanel = {
  ...panel
};

const quoteBox = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  color: '#065f46',
  borderRadius: 20,
  padding: 22,
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1.6
};