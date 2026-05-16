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
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.patients)) return payload.patients;
  if (Array.isArray(payload?.devices)) return payload.devices;
  if (Array.isArray(payload?.signals)) return payload.signals;
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  if (Array.isArray(payload?.followups)) return payload.followups;
  if (Array.isArray(payload?.followUps)) return payload.followUps;

  return [];
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function euro(value) {
  const number = toNumber(value, 0);

  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(number);
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

function buildBaseOperationalStats(payloads) {
  const dashboard = payloads.dashboard || {};
  const patients = safeArray(payloads.patients, ['patients']);
  const devices = safeArray(payloads.devices, ['devices']);
  const signals = safeArray(payloads.signals, ['signals']);
  const tasks = safeArray(payloads.tasks, ['tasks', 'items']);
  const followups = safeArray(payloads.followup, ['followups', 'followUps', 'items']);

  const totalPatients =
    pickValue(dashboard, ['patientsCount', 'patients_count', 'totalPatients'], patients.length) ||
    patients.length;

  const totalDevices =
    pickValue(dashboard, ['devicesCount', 'devices_count', 'totalDevices'], devices.length) ||
    devices.length;

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

  const openTasks = tasks.filter((task) => isOpenStatus(getStatus(task))).length;
  const closedTasks = tasks.filter((task) => isClosedStatus(getStatus(task))).length;
  const taskClosureRate = percent(closedTasks, openTasks + closedTasks);

  const openFollowups = followups.filter((item) => isOpenStatus(getStatus(item))).length;
  const closedFollowups = followups.filter((item) => isClosedStatus(getStatus(item))).length;
  const followupClosureRate = percent(closedFollowups, openFollowups + closedFollowups);

  const totalOperationalOpportunities =
    openSignals +
    criticalSignals +
    criticalFollowups +
    pendingTasks +
    openFollowups +
    offlineDevices;

  return {
    totalPatients,
    totalDevices,
    openSignals,
    criticalSignals,
    mediumSignals,
    criticalFollowups,
    pendingTasks,
    offlineDevices,
    openTasks,
    closedTasks,
    taskClosureRate,
    openFollowups,
    closedFollowups,
    followupClosureRate,
    totalOperationalOpportunities
  };
}

function buildBusinessImpact(stats, assumptions) {
  const recoveryRate = toNumber(assumptions.recoveryRate, 35) / 100;
  const retainedPatientRate = toNumber(assumptions.retainedPatientRate, 50) / 100;
  const monthlyNetValuePerPatient = toNumber(assumptions.monthlyNetValuePerPatient, 12);
  const consumablesNetOpportunityPerPatient = toNumber(assumptions.consumablesNetOpportunityPerPatient, 4);
  const staffHourlyCost = toNumber(assumptions.staffHourlyCost, 9);
  const minutesSavedPerCase = toNumber(assumptions.minutesSavedPerCase, 6);
  const monthlyPlatformCost = toNumber(assumptions.monthlyPlatformCost, 0);
  const scaledPortfolioPatients = toNumber(assumptions.scaledPortfolioPatients, 7000);

  const preventableFollowups = Math.round(stats.totalOperationalOpportunities * recoveryRate);
  const retainedPatients = Math.round(preventableFollowups * retainedPatientRate);

  const protectedMonthlyPatientValue =
    retainedPatients * monthlyNetValuePerPatient;

  const consumablesOpportunity =
    retainedPatients * consumablesNetOpportunityPerPatient;

  const triageMinutesSaved =
    (stats.openSignals + stats.pendingTasks + stats.openFollowups) * minutesSavedPerCase;

  const triageHoursSaved =
    Math.round((triageMinutesSaved / 60) * 10) / 10;

  const staffTimeValue =
    triageHoursSaved * staffHourlyCost;

  const grossMonthlyImpact =
    protectedMonthlyPatientValue +
    consumablesOpportunity +
    staffTimeValue;

  const netMonthlyImpact =
    grossMonthlyImpact - monthlyPlatformCost;

  const annualizedNetImpact =
    netMonthlyImpact * 12;

  const roiPercent =
    monthlyPlatformCost > 0
      ? Math.round(((grossMonthlyImpact - monthlyPlatformCost) / monthlyPlatformCost) * 100)
      : null;

  const portfolioMultiplier =
    stats.totalPatients > 0
      ? scaledPortfolioPatients / stats.totalPatients
      : 1;

  const scaledGrossMonthlyImpact =
    grossMonthlyImpact * portfolioMultiplier;

  const scaledNetAnnualImpact =
    (scaledGrossMonthlyImpact - monthlyPlatformCost) * 12;

  return {
    preventableFollowups,
    retainedPatients,
    protectedMonthlyPatientValue,
    consumablesOpportunity,
    triageMinutesSaved,
    triageHoursSaved,
    staffTimeValue,
    grossMonthlyImpact,
    netMonthlyImpact,
    annualizedNetImpact,
    roiPercent,
    portfolioMultiplier,
    scaledGrossMonthlyImpact,
    scaledNetAnnualImpact
  };
}

export default function TenantBusinessImpactPage() {
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
      ['followup', '/api/tenant/followup']
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

  const operationalStats = useMemo(() => {
    return buildBaseOperationalStats(payloads);
  }, [payloads]);

  const impact = useMemo(() => {
    return buildBusinessImpact(operationalStats, assumptions);
  }, [operationalStats, assumptions]);

  function updateAssumption(key, value) {
    setAssumptions((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>RAFTOP CPAP CARE Pro / Business Impact</div>

        <h1 style={title}>
          Στατιστικά κέρδους και επιχειρησιακής αξίας
        </h1>

        <p style={subtitle}>
          Το οικονομικό όφελος δεν προκύπτει από “ένα ωραίο dashboard”.
          Προκύπτει από λιγότερα χαμένα follow-ups, καλύτερη διατήρηση ασθενών,
          λιγότερο χειροκίνητο triage και καλύτερο έλεγχο του CPAP χαρτοφυλακίου.
        </p>

        <div style={heroActions}>
          <button type="button" style={primaryButton} onClick={load}>
            {loading ? 'Φόρτωση...' : 'Refresh Business Impact'}
          </button>

          <Link to="/tenant/statistics" style={secondaryButton}>
            Statistics
          </Link>

          <Link to="/tenant/statistics/report" style={secondaryButton}>
            Executive Report
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
          <strong>Some business impact sources failed.</strong>
          <div style={errorList}>
            {errors.map((error) => (
              <div key={error.endpoint}>
                {error.endpoint}: {error.message}
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={warningPanel}>
        <strong>Σημαντικό:</strong>{' '}
        Αυτά δεν είναι λογιστικά κέρδη. Είναι παραμετρική εκτίμηση επιχειρησιακής
        επίδρασης. Για πραγματικό ROI χρειάζονται τα πραγματικά margins,
        κόστος προσωπικού, αξία ενεργού ασθενή και κόστος πλατφόρμας.
      </section>

      <section style={assumptionPanel}>
        <div>
          <div style={sectionKicker}>Assumptions</div>
          <h2 style={sectionTitle}>Ρυθμιζόμενες οικονομικές παραδοχές</h2>
          <p style={sectionText}>
            Αυτό είναι το δυνατό σημείο μπροστά στη Raftopoulos: δεν πουλάμε
            φανταστικό ROI. Δίνουμε μοντέλο που προσαρμόζεται στα δικά τους
            πραγματικά οικονομικά.
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
            label="Net αξία / ενεργό ασθενή / μήνα (€)"
            value={assumptions.monthlyNetValuePerPatient}
            onChange={(value) => updateAssumption('monthlyNetValuePerPatient', value)}
          />

          <AssumptionInput
            label="Consumables net opportunity / μήνα (€)"
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
            label="Χαρτοφυλάκιο scaling ασθενών"
            value={assumptions.scaledPortfolioPatients}
            onChange={(value) => updateAssumption('scaledPortfolioPatients', value)}
          />
        </div>
      </section>

      <section style={metricsGrid}>
        <MetricCard
          label="Operational opportunities"
          value={operationalStats.totalOperationalOpportunities}
          description="Σύνολο signals, tasks, follow-ups και device issues που μπορούν να παράγουν αξία αν διαχειριστούν σωστά."
          tone="warning"
        />

        <MetricCard
          label="Preventable lost follow-ups"
          value={impact.preventableFollowups}
          description="Εκτίμηση follow-ups που μπορούν να σωθούν μέσω ATLAS, tasks και closed-loop."
          tone="success"
        />

        <MetricCard
          label="Estimated retained patients"
          value={impact.retainedPatients}
          description="Ασθενείς που πιθανώς διατηρούνται ενεργοί επειδή η ομάδα παρεμβαίνει νωρίτερα."
          tone="success"
        />

        <MetricCard
          label="Triage time saved"
          value={`${impact.triageHoursSaved}h`}
          description="Χρόνος που δεν χάνεται σε Excel, τηλεφωνικές λίστες και χειροκίνητο ψάξιμο."
          tone="success"
        />
      </section>

      <section style={moneyGrid}>
        <MoneyCard
          label="Protected patient value / month"
          value={impact.protectedMonthlyPatientValue}
          description="Εκτίμηση αξίας από ασθενείς που παραμένουν ενεργοί λόγω καλύτερου follow-up."
        />

        <MoneyCard
          label="Consumables opportunity / month"
          value={impact.consumablesOpportunity}
          description="Πιθανή πρόσθετη καθαρή αξία από καλύτερη συνέχιση χρήσης, service και consumables."
        />

        <MoneyCard
          label="Staff time value / month"
          value={impact.staffTimeValue}
          description="Αξία χρόνου προσωπικού που εξοικονομείται από λιγότερο χειροκίνητο triage."
        />

        <MoneyCard
          label="Gross monthly impact"
          value={impact.grossMonthlyImpact}
          description="Συνολική μηνιαία εκτίμηση πριν αφαιρεθεί κόστος πλατφόρμας."
          highlight
        />

        <MoneyCard
          label="Net monthly impact"
          value={impact.netMonthlyImpact}
          description="Εκτίμηση μετά το μηνιαίο κόστος πλατφόρμας."
          highlight
          tone={impact.netMonthlyImpact >= 0 ? 'success' : 'danger'}
        />

        <MoneyCard
          label="Annualized net impact"
          value={impact.annualizedNetImpact}
          description="Ετήσια προβολή με βάση το τρέχον μοντέλο παραδοχών."
          highlight
          tone={impact.annualizedNetImpact >= 0 ? 'success' : 'danger'}
        />
      </section>

      <section style={roiPanel}>
        <div>
          <div style={roiKicker}>Where the profit comes from</div>
          <h2 style={roiTitle}>Πού βρίσκεται πραγματικά το κέρδος</h2>

          <p style={roiText}>
            Το κέρδος δεν έρχεται επειδή απλώς “υπάρχει εφαρμογή”.
            Έρχεται όταν η εφαρμογή αλλάζει την καθημερινή λειτουργία:
            εντοπίζει νωρίτερα περιστατικά, μειώνει χαμένα follow-ups,
            βελτιώνει retention και δίνει στη διοίκηση έλεγχο.
          </p>
        </div>

        <div style={profitSourceGrid}>
          <ProfitSource
            title="1. Retention ασθενών"
            text="Αν ο ασθενής δεν χαθεί από τη θεραπεία, διατηρείται η μελλοντική αξία του χαρτοφυλακίου."
          />

          <ProfitSource
            title="2. Λιγότερα χαμένα follow-ups"
            text="Τα critical follow-ups εμφανίζονται νωρίτερα και δεν μένουν σε Excel ή προφορικές σημειώσεις."
          />

          <ProfitSource
            title="3. Χρόνος προσωπικού"
            text="Η ομάδα ξοδεύει λιγότερο χρόνο στο να ψάχνει και περισσότερο στο να δρα."
          />

          <ProfitSource
            title="4. Consumables / service"
            text="Καλύτερη συνέχεια χρήσης σημαίνει καλύτερη πιθανότητα σωστής υποστήριξης, service και αναλωσίμων."
          />
        </div>
      </section>

      <section style={scenarioPanel}>
        <div style={sectionKicker}>Portfolio scaling</div>
        <h2 style={sectionTitle}>Τι γίνεται αν το μοντέλο κλιμακωθεί στο χαρτοφυλάκιο</h2>

        <div style={scenarioGrid}>
          <ScenarioCard
            label="Current demo / pilot basis"
            value={euro(impact.grossMonthlyImpact)}
            description="Μηνιαία εκτίμηση με βάση τα τρέχοντα φορτωμένα δεδομένα."
          />

          <ScenarioCard
            label={`Scaled to ${assumptions.scaledPortfolioPatients} patients`}
            value={euro(impact.scaledGrossMonthlyImpact)}
            description="Ενδεικτική κλιμάκωση με βάση το δηλωμένο χαρτοφυλάκιο ασθενών."
          />

          <ScenarioCard
            label="Scaled annual net impact"
            value={euro(impact.scaledNetAnnualImpact)}
            description="Ετήσια projection μετά το δηλωμένο μηνιαίο κόστος πλατφόρμας."
          />

          <ScenarioCard
            label="ROI"
            value={impact.roiPercent === null ? 'Set platform cost' : `${impact.roiPercent}%`}
            description="Υπολογίζεται μόνο όταν υπάρχει μηνιαίο κόστος πλατφόρμας."
          />
        </div>
      </section>

      <section style={formulaPanel}>
        <div style={sectionKicker}>Formula logic</div>
        <h2 style={sectionTitle}>Η φόρμουλα που πρέπει να καταλάβει η Raftopoulos</h2>

        <div style={formulaBox}>
          <strong>Business Impact</strong>
          <span>=</span>
          <span>Retained Patient Value</span>
          <span>+</span>
          <span>Staff Time Saved</span>
          <span>+</span>
          <span>Consumables Opportunity</span>
          <span>-</span>
          <span>Platform Cost</span>
        </div>

        <p style={formulaText}>
          Αυτή είναι η σωστή εμπορική γλώσσα. Όχι “το app έχει στατιστικά”.
          Αλλά: “η πλατφόρμα δείχνει και προστατεύει οικονομική αξία που σήμερα
          χάνεται μέσα στη χειροκίνητη λειτουργία”.
        </p>
      </section>

      <section style={salesMessagePanel}>
        <div style={sectionKicker}>Sales message</div>
        <h2 style={sectionTitle}>Η φράση που πρέπει να πεις</h2>

        <div style={quoteBox}>
          Το κέρδος δεν είναι μόνο άμεσο έσοδο. Είναι προστατευμένη αξία:
          λιγότερα χαμένα follow-ups, καλύτερο retention ασθενών, λιγότερος
          χρόνος προσωπικού και καλύτερη αξιοποίηση του CPAP χαρτοφυλακίου.
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

function MetricCard({ label, value, description, tone = 'default' }) {
  return (
    <article style={{ ...metricCard, ...toneStyle(tone) }}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
      <p style={metricDescription}>{description}</p>
    </article>
  );
}

function MoneyCard({ label, value, description, highlight = false, tone = 'default' }) {
  return (
    <article
      style={{
        ...moneyCard,
        ...(highlight ? moneyHighlight : {}),
        ...toneStyle(tone)
      }}
    >
      <div style={moneyLabel}>{label}</div>
      <div style={moneyValue}>{euro(value)}</div>
      <p style={moneyDescription}>{description}</p>
    </article>
  );
}

function ProfitSource({ title, text }) {
  return (
    <article style={profitSource}>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function ScenarioCard({ label, value, description }) {
  return (
    <article style={scenarioCard}>
      <div style={scenarioLabel}>{label}</div>
      <div style={scenarioValue}>{value}</div>
      <p style={scenarioDescription}>{description}</p>
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
  background: 'linear-gradient(135deg, #020617 0%, #064e3b 48%, #0f766e 100%)',
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

const warningPanel = {
  background: '#fffbeb',
  border: '1px solid #fde68a',
  color: '#92400e',
  borderRadius: 20,
  padding: 18,
  fontWeight: 850,
  lineHeight: 1.55
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

const sectionKicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
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

const moneyGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16
};

const moneyCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)'
};

const moneyHighlight = {
  borderColor: '#86efac',
  background: '#f0fdf4'
};

const moneyLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const moneyValue = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 34,
  fontWeight: 1000,
  lineHeight: 1.05
};

const moneyDescription = {
  margin: '10px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.45
};

const roiPanel = {
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(320px, 1.1fr)',
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

const profitSourceGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const profitSource = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 20,
  padding: 18,
  color: '#ffffff'
};

const scenarioPanel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const scenarioGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: 14
};

const scenarioCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 18
};

const scenarioLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const scenarioValue = {
  marginTop: 9,
  color: '#0f172a',
  fontSize: 28,
  fontWeight: 1000
};

const scenarioDescription = {
  margin: '8px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.45
};

const formulaPanel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const formulaBox = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 18,
  color: '#0f172a',
  fontWeight: 1000,
  lineHeight: 1.5
};

const formulaText = {
  margin: '14px 0 0',
  color: '#475569',
  fontWeight: 750,
  lineHeight: 1.55
};

const salesMessagePanel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
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