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

function euro(value) {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(toNumber(value, 0));
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
    text.includes('progress')
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

function buildDecisionStats(payloads, assumptions) {
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
  const nextBestActions = safeArray(closedLoop, ['nextBestActions']).length;
  const blockers = safeArray(closedLoop, ['blockers']).length;

  const attentionLoad =
    openSignals +
    criticalSignals +
    criticalFollowups +
    pendingTasks +
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

  const atlasValue = Math.max(
    0,
    Math.min(
      100,
      openSignals * 10 +
        patientsAtRisk * 8 +
        nextBestActions * 12
    )
  );

  const recoveryRate = toNumber(assumptions.recoveryRate, 35) / 100;
  const retainedPatientRate = toNumber(assumptions.retainedPatientRate, 50) / 100;
  const monthlyNetValuePerPatient = toNumber(assumptions.monthlyNetValuePerPatient, 12);
  const staffHourlyCost = toNumber(assumptions.staffHourlyCost, 9);
  const minutesSavedPerCase = toNumber(assumptions.minutesSavedPerCase, 6);
  const consumablesNetOpportunityPerPatient = toNumber(assumptions.consumablesNetOpportunityPerPatient, 4);
  const monthlyPlatformCost = toNumber(assumptions.monthlyPlatformCost, 0);
  const scaledPortfolioPatients = toNumber(assumptions.scaledPortfolioPatients, 7000);

  const preventableFollowups = Math.round(attentionLoad * recoveryRate);
  const retainedPatients = Math.round(preventableFollowups * retainedPatientRate);
  const protectedPatientValue = retainedPatients * monthlyNetValuePerPatient;
  const consumablesOpportunity = retainedPatients * consumablesNetOpportunityPerPatient;

  const triageMinutesSaved =
    (openSignals + pendingTasks + openFollowups) * minutesSavedPerCase;

  const triageHoursSaved =
    Math.round((triageMinutesSaved / 60) * 10) / 10;

  const staffTimeValue = triageHoursSaved * staffHourlyCost;

  const grossMonthlyImpact =
    protectedPatientValue +
    consumablesOpportunity +
    staffTimeValue;

  const netMonthlyImpact = grossMonthlyImpact - monthlyPlatformCost;
  const annualizedNetImpact = netMonthlyImpact * 12;

  const portfolioMultiplier =
    totalPatients > 0
      ? scaledPortfolioPatients / totalPatients
      : 1;

  const scaledAnnualImpact =
    (grossMonthlyImpact * portfolioMultiplier - monthlyPlatformCost) * 12;

  return {
    totalPatients,
    totalDevices,
    totalDoctors,
    criticalFollowups,
    pendingTasks,
    offlineDevices,
    openSignals,
    criticalSignals,
    mediumSignals,
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
    nextBestActions,
    blockers,
    attentionLoad,
    operationalControlScore,
    followupPressure,
    atlasValue,
    preventableFollowups,
    retainedPatients,
    protectedPatientValue,
    consumablesOpportunity,
    triageHoursSaved,
    staffTimeValue,
    grossMonthlyImpact,
    netMonthlyImpact,
    annualizedNetImpact,
    scaledAnnualImpact
  };
}

export default function RaftopoulosDecisionRoomPage() {
  const [payloads, setPayloads] = useState({});
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState(null);

  const [assumptions, setAssumptions] = useState({
    recoveryRate: 35,
    retainedPatientRate: 50,
    monthlyNetValuePerPatient: 12,
    consumablesNetOpportunityPerPatient: 4,
    staffHourlyCost: 9,
    minutesSavedPerCase: 6,
    monthlyPlatformCost: 0,
    scaledPortfolioPatients: 7000
  });

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

  const stats = useMemo(() => {
    return buildDecisionStats(payloads, assumptions);
  }, [payloads, assumptions]);

  function updateAssumption(key, value) {
    setAssumptions((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>RAFTOP CPAP CARE Pro / Decision Room</div>

        <h1 style={title}>
          Η σελίδα απόφασης για τη Raftopoulos
        </h1>

        <p style={subtitle}>
          Εδώ φαίνεται η συνολική λογική: ποιο πρόβλημα λύνει η πλατφόρμα,
          ποιο operational risk εντοπίζει, πού δημιουργεί οικονομική αξία
          και γιατί το σωστό επόμενο βήμα είναι controlled pilot.
        </p>

        <div style={heroActions}>
          <button type="button" style={primaryButton} onClick={load}>
            {loading ? 'Φόρτωση...' : 'Refresh Decision Room'}
          </button>

          <Link to="/sales/raftopoulos" style={secondaryButton}>
            Sales Snapshot
          </Link>

          <Link to="/tenant/statistics" style={secondaryButton}>
            Statistics
          </Link>

          <Link to="/tenant/business-impact" style={secondaryButton}>
            Business Impact
          </Link>

          <Link to="/sales/raftopoulos/pilot" style={secondaryButton}>
            Pilot Proposal
          </Link>
        </div>
      </section>

      <section style={contextStrip}>
        <ContextItem label="Tenant" value={tenantId} />
        <ContextItem label="Backend" value={API_BASE} />
        <ContextItem label="Loaded" value={loadedAt || 'Loading...'} />
        <ContextItem label="Endpoint errors" value={errors.length} />
      </section>

      {errors.length > 0 && (
        <section style={errorPanel}>
          <strong>Some data sources failed.</strong>
          <div style={errorList}>
            {errors.map((error) => (
              <div key={error.endpoint}>
                {error.endpoint}: {error.message}
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={decisionBand}>
        <div>
          <div style={sectionKicker}>Core decision</div>
          <h2 style={decisionTitle}>
            Δεν πουλάς “άλλη μία εφαρμογή”. Πουλάς operational control.
          </h2>
          <p style={decisionText}>
            Η Raftopoulos δεν χρειάζεται απλώς καταγραφή CPAP ασθενών.
            Χρειάζεται σύστημα που να δείχνει ποιοι ασθενείς χρειάζονται
            ενέργεια σήμερα, ποια follow-ups κινδυνεύουν, τι έκανε η ομάδα
            και ποια περιστατικά έκλεισαν.
          </p>
        </div>

        <div style={decisionSeal}>
          <span>{stats.operationalControlScore}</span>
          <small>Control Score</small>
        </div>
      </section>

      <section style={threeColumns}>
        <ValuePillar
          number="1"
          title="Operational Risk"
          text="Πού υπάρχουν ασθενείς, follow-ups, tasks ή συσκευές που χρειάζονται προσοχή."
        />

        <ValuePillar
          number="2"
          title="Action Control"
          text="Αν τα signals μετατρέπονται σε tasks, ενέργειες, επαλήθευση και closure."
        />

        <ValuePillar
          number="3"
          title="Business Impact"
          text="Πού δημιουργείται κέρδος: retention, λιγότερα χαμένα follow-ups και λιγότερος χαμένος χρόνος."
        />
      </section>

      <section style={kpiGrid}>
        <Kpi label="Ασθενείς" value={stats.totalPatients} tone="success" />
        <Kpi label="Συσκευές CPAP" value={stats.totalDevices} />
        <Kpi label="Patients at risk" value={stats.patientsAtRisk} tone={stats.patientsAtRisk > 0 ? 'warning' : 'success'} />
        <Kpi label="Critical follow-ups" value={stats.criticalFollowups} tone={stats.criticalFollowups > 0 ? 'danger' : 'success'} />
        <Kpi label="Pending tasks" value={stats.pendingTasks} tone={stats.pendingTasks > 0 ? 'warning' : 'success'} />
        <Kpi label="Offline devices" value={stats.offlineDevices} tone={stats.offlineDevices > 0 ? 'warning' : 'success'} />
      </section>

      <section style={scoreGrid}>
        <ScoreCard
          title="Operational Control Score"
          value={stats.operationalControlScore}
          description="Δείχνει πόσο ελεγχόμενη είναι η συνολική λειτουργία."
          tone={stats.operationalControlScore >= 80 ? 'success' : stats.operationalControlScore >= 55 ? 'warning' : 'danger'}
        />

        <ScoreCard
          title="Follow-up Pressure"
          value={stats.followupPressure}
          description="Δείχνει πόση πίεση έχει η ομάδα από follow-ups, tasks και critical signals."
          inverse
          tone={stats.followupPressure <= 35 ? 'success' : stats.followupPressure <= 65 ? 'warning' : 'danger'}
        />

        <ScoreCard
          title="ATLAS Signal Value"
          value={stats.atlasValue}
          description="Δείχνει αν το ATLAS παράγει πραγματική λειτουργική αξία."
          tone={stats.atlasValue > 0 ? 'success' : 'warning'}
        />
      </section>

      <section style={moneyPanel}>
        <div>
          <div style={sectionKickerLight}>Business impact</div>
          <h2 style={moneyTitle}>Πού βρίσκεται το πιθανό κέρδος</h2>
          <p style={moneyText}>
            Το κέρδος δεν είναι “μαγικό”. Προκύπτει από προστατευμένη αξία:
            λιγότερα χαμένα follow-ups, καλύτερο retention, λιγότερο χειροκίνητο
            triage και καλύτερη αξιοποίηση του CPAP χαρτοφυλακίου.
          </p>
        </div>

        <div style={moneyGrid}>
          <MoneyCard label="Protected patient value / month" value={stats.protectedPatientValue} />
          <MoneyCard label="Consumables opportunity / month" value={stats.consumablesOpportunity} />
          <MoneyCard label="Staff time value / month" value={stats.staffTimeValue} />
          <MoneyCard label="Gross monthly impact" value={stats.grossMonthlyImpact} highlight />
          <MoneyCard label="Net monthly impact" value={stats.netMonthlyImpact} highlight />
          <MoneyCard label="Annualized net impact" value={stats.annualizedNetImpact} highlight />
        </div>
      </section>

      <section style={assumptionPanel}>
        <div>
          <div style={sectionKicker}>Adjustable assumptions</div>
          <h2 style={sectionTitle}>Το ROI μοντέλο δεν είναι υπόσχεση. Είναι calculator.</h2>
          <p style={sectionText}>
            Το δυνατό σημείο είναι ότι η Raftopoulos μπορεί να βάλει τις δικές της
            πραγματικές παραδοχές: αξία ενεργού ασθενή, κόστος προσωπικού,
            consumables opportunity και κόστος πλατφόρμας.
          </p>
        </div>

        <div style={assumptionGrid}>
          <AssumptionInput
            label="Recovery rate χαμένων follow-ups (%)"
            value={assumptions.recoveryRate}
            onChange={(value) => updateAssumption('recoveryRate', value)}
          />

          <AssumptionInput
            label="Retained patient rate (%)"
            value={assumptions.retainedPatientRate}
            onChange={(value) => updateAssumption('retainedPatientRate', value)}
          />

          <AssumptionInput
            label="Net αξία / ασθενή / μήνα (€)"
            value={assumptions.monthlyNetValuePerPatient}
            onChange={(value) => updateAssumption('monthlyNetValuePerPatient', value)}
          />

          <AssumptionInput
            label="Consumables net opportunity (€)"
            value={assumptions.consumablesNetOpportunityPerPatient}
            onChange={(value) => updateAssumption('consumablesNetOpportunityPerPatient', value)}
          />

          <AssumptionInput
            label="Κόστος προσωπικού / ώρα (€)"
            value={assumptions.staffHourlyCost}
            onChange={(value) => updateAssumption('staffHourlyCost', value)}
          />

          <AssumptionInput
            label="Λεπτά που γλιτώνει κάθε case"
            value={assumptions.minutesSavedPerCase}
            onChange={(value) => updateAssumption('minutesSavedPerCase', value)}
          />

          <AssumptionInput
            label="Μηνιαίο κόστος πλατφόρμας (€)"
            value={assumptions.monthlyPlatformCost}
            onChange={(value) => updateAssumption('monthlyPlatformCost', value)}
          />

          <AssumptionInput
            label="Scaling χαρτοφυλακίου ασθενών"
            value={assumptions.scaledPortfolioPatients}
            onChange={(value) => updateAssumption('scaledPortfolioPatients', value)}
          />
        </div>
      </section>

      <section style={pilotPanel}>
        <div>
          <div style={sectionKicker}>Recommended next step</div>
          <h2 style={sectionTitle}>Το σωστό κλείσιμο είναι controlled pilot</h2>
          <p style={sectionText}>
            Δεν ζητάς άμεσο πλήρες rollout. Ζητάς pilot 50–100 ασθενών,
            2–3 χρήστες, συγκεκριμένα follow-up σενάρια και μετρήσιμα KPIs.
          </p>
        </div>

        <div style={pilotSteps}>
          <Step
            number="1"
            title="50–100 ασθενείς"
            text="Επιλεγμένο αρχικό χαρτοφυλάκιο για να αποδειχθεί λειτουργική αξία."
          />

          <Step
            number="2"
            title="2–3 χρήστες ομάδας"
            text="Χρήστες που θα δουλεύουν καθημερινά follow-up, signals και tasks."
          />

          <Step
            number="3"
            title="30–45 ημέρες"
            text="Αρκετός χρόνος για να φανεί αν μειώνονται χαμένα follow-ups."
          />

          <Step
            number="4"
            title="Rollout decision"
            text="Μετά το pilot βγαίνει τεκμηριωμένη πρόταση πλήρους εφαρμογής."
          />
        </div>
      </section>

      <section style={closingPanel}>
        <div style={sectionKicker}>Closing statement</div>
        <h2 style={closingTitle}>Η φράση που πρέπει να μείνει στη Raftopoulos</h2>

        <div style={quoteBox}>
          Η πλατφόρμα δεν σας δείχνει απλώς δεδομένα. Σας δείχνει πού πρέπει
          να δράσει η ομάδα σήμερα, ποια follow-ups κινδυνεύουν, τι οικονομική
          αξία προστατεύεται και αν οι ενέργειες τελικά κλείνουν.
        </div>
      </section>
    </main>
  );
}

function ContextItem({ label, value }) {
  return (
    <div style={contextItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ValuePillar({ number, title, text }) {
  return (
    <article style={pillar}>
      <div style={pillarNumber}>{number}</div>
      <h3 style={pillarTitle}>{title}</h3>
      <p style={pillarText}>{text}</p>
    </article>
  );
}

function Kpi({ label, value, tone = 'default' }) {
  return (
    <article style={{ ...kpiCard, ...toneStyle(tone) }}>
      <div style={kpiLabel}>{label}</div>
      <div style={kpiValue}>{value}</div>
    </article>
  );
}

function ScoreCard({ title, value, description, tone = 'default', inverse = false }) {
  const width = Math.max(0, Math.min(100, toNumber(value)));

  return (
    <article style={{ ...scoreCard, ...toneStyle(tone) }}>
      <div style={scoreTop}>
        <div>
          <div style={scoreLabel}>{title}</div>
          <div style={scoreValue}>{width}/100</div>
        </div>
        <div style={scoreBadge}>{inverse ? 'Lower is better' : 'Higher is better'}</div>
      </div>

      <div style={scoreTrack}>
        <div
          style={{
            ...scoreFill,
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

      <p style={scoreDescription}>{description}</p>
    </article>
  );
}

function MoneyCard({ label, value, highlight = false }) {
  return (
    <article style={highlight ? moneyCardHighlight : moneyCard}>
      <div style={moneyLabel}>{label}</div>
      <div style={moneyValue}>{euro(value)}</div>
    </article>
  );
}

function AssumptionInput({ label, value, onChange }) {
  return (
    <label style={assumptionInput}>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={input}
      />
    </label>
  );
}

function Step({ number, title, text }) {
  return (
    <article style={step}>
      <div style={stepNumber}>{number}</div>
      <div>
        <h3 style={stepTitle}>{title}</h3>
        <p style={stepText}>{text}</p>
      </div>
    </article>
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
  background: 'linear-gradient(135deg, #020617 0%, #064e3b 46%, #0f766e 100%)',
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
  maxWidth: 1100
};

const subtitle = {
  margin: 0,
  maxWidth: 1080,
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

const decisionBand = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 28,
  padding: 28,
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)'
};

const sectionKicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const sectionKickerLight = {
  color: '#93c5fd',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const decisionTitle = {
  margin: '8px 0',
  color: '#0f172a',
  fontSize: 32,
  lineHeight: 1.1
};

const decisionText = {
  margin: 0,
  maxWidth: 900,
  color: '#475569',
  fontWeight: 750,
  lineHeight: 1.6
};

const decisionSeal = {
  width: 150,
  height: 150,
  borderRadius: 999,
  background: '#dcfce7',
  border: '1px solid #bbf7d0',
  color: '#166534',
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  flexShrink: 0,
  fontWeight: 1000
};

const threeColumns = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16
};

const pillar = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)'
};

const pillarNumber = {
  width: 42,
  height: 42,
  borderRadius: 999,
  background: '#0f766e',
  color: '#ffffff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 1000
};

const pillarTitle = {
  margin: '14px 0 8px',
  color: '#0f172a',
  fontSize: 22
};

const pillarText = {
  margin: 0,
  color: '#475569',
  fontWeight: 750,
  lineHeight: 1.55
};

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 14
};

const kpiCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 20,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)'
};

const kpiLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const kpiValue = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 32,
  fontWeight: 1000
};

const scoreGrid = {
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
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
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

const moneyPanel = {
  display: 'grid',
  gridTemplateColumns: 'minmax(300px, 0.8fr) minmax(320px, 1.2fr)',
  gap: 24,
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
  color: '#ffffff',
  borderRadius: 30,
  padding: 32,
  boxShadow: '0 16px 50px rgba(15, 23, 42, 0.15)'
};

const moneyTitle = {
  margin: '8px 0',
  fontSize: 32,
  lineHeight: 1.12
};

const moneyText = {
  margin: 0,
  color: 'rgba(255,255,255,0.86)',
  fontWeight: 700,
  lineHeight: 1.6
};

const moneyGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: 12
};

const moneyCard = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 20,
  padding: 18
};

const moneyCardHighlight = {
  ...moneyCard,
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0'
};

const moneyLabel = {
  fontSize: 11,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.9
};

const moneyValue = {
  marginTop: 9,
  fontSize: 26,
  fontWeight: 1000
};

const assumptionPanel = {
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 0.8fr) minmax(320px, 1.2fr)',
  gap: 20,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const sectionTitle = {
  margin: '8px 0 12px',
  color: '#0f172a',
  fontSize: 32,
  lineHeight: 1.12
};

const sectionText = {
  margin: 0,
  color: '#475569',
  fontWeight: 750,
  lineHeight: 1.55
};

const assumptionGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const assumptionInput = {
  display: 'grid',
  gap: 7,
  color: '#334155',
  fontWeight: 850,
  fontSize: 13
};

const input = {
  border: '1px solid #cbd5e1',
  borderRadius: 13,
  padding: '11px 12px',
  fontWeight: 900,
  color: '#0f172a',
  outline: 'none'
};

const pilotPanel = {
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 0.75fr) minmax(320px, 1.25fr)',
  gap: 20,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const pilotSteps = {
  display: 'grid',
  gap: 12
};

const step = {
  display: 'grid',
  gridTemplateColumns: '46px 1fr',
  gap: 14,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16
};

const stepNumber = {
  width: 46,
  height: 46,
  borderRadius: 999,
  background: '#0f766e',
  color: '#ffffff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 1000
};

const stepTitle = {
  margin: 0,
  color: '#0f172a',
  fontSize: 18
};

const stepText = {
  margin: '6px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.5
};

const closingPanel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const closingTitle = {
  margin: '8px 0 16px',
  color: '#0f172a',
  fontSize: 32,
  lineHeight: 1.12
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