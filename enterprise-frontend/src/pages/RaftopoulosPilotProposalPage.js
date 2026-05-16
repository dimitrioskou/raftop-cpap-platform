import React from 'react';
import { Link } from 'react-router-dom';

export default function RaftopoulosPilotProposalPage() {
  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>RAFTOP CPAP CARE Pro / Pilot Proposal</div>

        <h1 style={title}>
          Προτεινόμενο Pilot για τη Raftopoulos
        </h1>

        <p style={subtitle}>
          Controlled pilot για την αξιολόγηση μιας enterprise πλατφόρμας
          παρακολούθησης ασθενών CPAP, προτεραιοποίησης ATLAS και οργανωμένου
          follow-up control.
        </p>

        <div style={heroActions}>
          <Link to="/sales/raftopoulos" style={primaryButton}>
            Sales Snapshot
          </Link>

          <Link to="/tenant/dashboard" style={secondaryButton}>
            Demo Dashboard
          </Link>

          <Link to="/tenant/patient-signals" style={secondaryButton}>
            Patient Signals
          </Link>

          <Link to="/tenant/atlas/action-center" style={secondaryButton}>
            Action Center
          </Link>
        </div>
      </section>

      <section style={decisionBox}>
        <div>
          <div style={decisionKicker}>Στρατηγική θέση</div>
          <h2 style={decisionTitle}>
            Δεν προτείνεται άμεσο πλήρες rollout. Προτείνεται ελεγχόμενο pilot.
          </h2>
          <p style={decisionText}>
            Η σωστή κίνηση είναι να δοκιμαστεί η πλατφόρμα σε περιορισμένο,
            πραγματικό περιβάλλον, με μετρήσιμα κριτήρια. Έτσι η εταιρεία
            αξιολογεί την αξία χωρίς μεγάλο αρχικό ρίσκο.
          </p>
        </div>

        <div style={decisionBadge}>
          PILOT-FIRST
        </div>
      </section>

      <section style={metricsGrid}>
        <Metric label="Προτεινόμενοι ασθενείς" value="50–100" />
        <Metric label="Χρήστες ομάδας" value="2–3" />
        <Metric label="Διάρκεια pilot" value="30–45 ημέρες" />
        <Metric label="Τύπος δεδομένων" value="CSV / structured import" />
        <Metric label="Στόχος" value="Operational validation" />
        <Metric label="Μετά το pilot" value="Full rollout proposal" />
      </section>

      <section style={panel}>
        <div style={sectionKicker}>Pilot Scope</div>
        <h2 style={sectionTitle}>Τι περιλαμβάνει το pilot</h2>

        <div style={scopeGrid}>
          <ScopeCard
            title="1. Επιλεγμένο χαρτοφυλάκιο ασθενών"
            text="Ξεκινάμε με 50–100 ασθενείς CPAP, ώστε η ομάδα να δει τη λειτουργική αξία χωρίς να φορτωθεί όλο το χαρτοφυλάκιο από την πρώτη ημέρα."
          />

          <ScopeCard
            title="2. Περιορισμένη ομάδα χρηστών"
            text="Ορίζονται 2–3 χρήστες που θα χρησιμοποιούν καθημερινά το σύστημα: διοίκηση, υπεύθυνος follow-up ή συντονιστής CPAP."
          />

          <ScopeCard
            title="3. Συμφωνημένο import flow"
            text="Ορίζεται πώς θα μπαίνουν τα δεδομένα: CSV export, structured import ή άλλο διαθέσιμο format. Δεν υποσχόμαστε direct API πριν επιβεβαιωθεί τεχνικά και συμβατικά."
          />

          <ScopeCard
            title="4. Βασικά follow-up σενάρια"
            text="Ορίζουμε 3–5 πρακτικά σενάρια: χαμηλή χρήση, ανάγκη επικοινωνίας, pending task, κρίσιμο follow-up και κλείσιμο ενέργειας."
          />

          <ScopeCard
            title="5. ATLAS prioritization"
            text="Η ομάδα αξιολογεί αν το ATLAS βοηθά να φαίνονται πρώτα οι ασθενείς που χρειάζονται ενέργεια."
          />

          <ScopeCard
            title="6. Closed-loop validation"
            text="Ελέγχουμε αν τα signals οδηγούν σε tasks, actions και κλείσιμο, ώστε να μειώνονται τα χαμένα follow-ups."
          />
        </div>
      </section>

      <section style={panel}>
        <div style={sectionKicker}>Success Criteria</div>
        <h2 style={sectionTitle}>Πώς κρίνεται αν το pilot πέτυχε</h2>

        <div style={criteriaGrid}>
          <Criterion
            title="Μειώθηκε η αβεβαιότητα;"
            text="Η ομάδα ξέρει πιο γρήγορα ποιοι ασθενείς χρειάζονται προσοχή."
          />

          <Criterion
            title="Μειώθηκαν τα χαμένα follow-ups;"
            text="Τα κρίσιμα περιστατικά δεν μένουν μόνο σε Excel ή προφορικές σημειώσεις."
          />

          <Criterion
            title="Βοηθά το ATLAS;"
            text="Η καθημερινή προτεραιοποίηση γίνεται πιο καθαρή και λιγότερο χειροκίνητη."
          />

          <Criterion
            title="Κλείνουν οι ενέργειες;"
            text="Το σύστημα δείχνει αν ένα signal μετατράπηκε σε task και αν τελικά έκλεισε."
          />

          <Criterion
            title="Μπορεί να το δουλέψει η ομάδα;"
            text="Οι χρήστες μπορούν να χρησιμοποιήσουν το σύστημα χωρίς τεχνική εξάρτηση."
          />

          <Criterion
            title="Υπάρχει βάση για rollout;"
            text="Μετά το pilot υπάρχει καθαρή εικόνα κόστους, οφέλους και απαραίτητων integrations."
          />
        </div>
      </section>

      <section style={timelinePanel}>
        <div style={sectionKicker}>Pilot Timeline</div>
        <h2 style={sectionTitle}>Προτεινόμενη πορεία 30–45 ημερών</h2>

        <div style={timeline}>
          <Step
            number="1"
            title="Ημέρες 1–5: Προετοιμασία"
            text="Ορισμός χρηστών, ασθενών, import format και βασικών follow-up σεναρίων."
          />

          <Step
            number="2"
            title="Ημέρες 6–10: Αρχικό setup"
            text="Φόρτωση αρχικών δεδομένων, έλεγχος tenant, ρύθμιση demo-to-pilot workflow και βασική εκπαίδευση."
          />

          <Step
            number="3"
            title="Ημέρες 11–30: Χρήση pilot"
            text="Η ομάδα χρησιμοποιεί Dashboard, Patient Signals, ATLAS, Action Center και Closed Loop για πραγματικά follow-ups."
          />

          <Step
            number="4"
            title="Ημέρες 31–45: Αξιολόγηση"
            text="Συγκεντρώνουμε feedback, προβλήματα, λειτουργικές απαιτήσεις και αποφασίζουμε full rollout scope."
          />
        </div>
      </section>

      <section style={pricingPanel}>
        <div>
          <div style={pricingKicker}>Commercial Positioning</div>
          <h2 style={pricingTitle}>Το pilot δεν πρέπει να τιμολογηθεί σαν απλή εφαρμογή.</h2>
          <p style={pricingText}>
            Η αξία βρίσκεται στη λειτουργική ενσωμάτωση: παρακολούθηση ασθενών,
            προτεραιοποίηση, follow-up control, reporting και μελλοντικό rollout.
            Άρα το τελικό μοντέλο πρέπει να είναι SaaS / enterprise license /
            support model, όχι απλή εφάπαξ πώληση μικρής εφαρμογής.
          </p>
        </div>

        <div style={pricingCards}>
          <div style={pricingCard}>
            <div style={pricingLabel}>Pilot</div>
            <div style={pricingValue}>Scope-based</div>
            <p style={pricingSmall}>
              Χρέωση ανάλογα με διάρκεια, αριθμό χρηστών, import και υποστήριξη.
            </p>
          </div>

          <div style={pricingCard}>
            <div style={pricingLabel}>Rollout</div>
            <div style={pricingValue}>Annual SaaS</div>
            <p style={pricingSmall}>
              Ετήσια άδεια χρήσης, support, updates και πιθανές επεκτάσεις.
            </p>
          </div>
        </div>
      </section>

      <section style={objectionsPanel}>
        <div style={sectionKicker}>Objection Handling</div>
        <h2 style={sectionTitle}>Απαντήσεις σε πιθανές ερωτήσεις</h2>

        <div style={qaGrid}>
          <QA
            question="Είναι έτοιμο για παραγωγή;"
            answer="Είναι έτοιμο για controlled pilot και commercial validation. Για production rollout χρειάζεται deployment, πραγματικά δεδομένα, backup policy, ρόλοι χρηστών και συμφωνημένο import workflow."
          />

          <QA
            question="Από πού παίρνει δεδομένα;"
            answer="Στο pilot ξεκινάμε με συμφωνημένο structured import, όπως CSV ή άλλο διαθέσιμο format. Direct integration εξετάζεται μόνο αν είναι τεχνικά και συμβατικά διαθέσιμη."
          />

          <QA
            question="Τι κερδίζουμε;"
            answer="Κερδίζετε έλεγχο, προτεραιοποίηση και συνέχεια. Το σύστημα δείχνει ποιοι ασθενείς χρειάζονται ενέργεια και αν η ενέργεια τελικά ολοκληρώθηκε."
          />

          <QA
            question="Γιατί να μην συνεχίσουμε με Excel;"
            answer="Το Excel καταγράφει. Δεν προτεραιοποιεί, δεν αναθέτει, δεν ελέγχει closed loop και δεν δίνει λειτουργικό control σε μεγάλο χαρτοφυλάκιο."
          />
        </div>
      </section>

      <section style={closePanel}>
        <div>
          <div style={closeKicker}>Recommended Next Step</div>
          <h2 style={closeTitle}>Συμφωνία για pilot scope</h2>
          <p style={closeText}>
            Το επόμενο βήμα είναι να συμφωνηθούν αριθμός ασθενών, χρήστες,
            διάρκεια, import format και follow-up σενάρια. Μετά το pilot
            προκύπτει τεκμηριωμένη πρόταση για πλήρες rollout.
          </p>
        </div>

        <div style={closeActions}>
          <Link to="/sales/raftopoulos" style={primaryButton}>
            Back to Snapshot
          </Link>

          <Link to="/tenant/dashboard" style={secondaryButton}>
            Open Demo
          </Link>
        </div>
      </section>

      <section style={disclaimer}>
        <strong>Εσωτερική γραμμή:</strong>{' '}
        Δεν παρουσιάζεις το σύστημα ως production-ready. Το παρουσιάζεις ως
        controlled commercial demo / pilot-ready platform. Το production rollout
        έρχεται μετά από συμφωνημένη τεχνική και επιχειρησιακή προετοιμασία.
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div style={metricCard}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
    </div>
  );
}

function ScopeCard({ title, text }) {
  return (
    <article style={scopeCard}>
      <h3 style={scopeTitle}>{title}</h3>
      <p style={scopeText}>{text}</p>
    </article>
  );
}

function Criterion({ title, text }) {
  return (
    <article style={criterionCard}>
      <div style={criterionIcon}>✓</div>
      <div>
        <h3 style={criterionTitle}>{title}</h3>
        <p style={criterionText}>{text}</p>
      </div>
    </article>
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

function QA({ question, answer }) {
  return (
    <article style={qaCard}>
      <h3 style={qaQuestion}>{question}</h3>
      <p style={qaAnswer}>{answer}</p>
    </article>
  );
}

const page = {
  display: 'grid',
  gap: 20
};

const hero = {
  background: 'linear-gradient(135deg, #020617 0%, #0f766e 52%, #14b8a6 100%)',
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
  maxWidth: 1000
};

const subtitle = {
  margin: 0,
  maxWidth: 980,
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

const decisionBox = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 18,
  flexWrap: 'wrap',
  background: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: 26,
  padding: 26,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const decisionKicker = {
  color: '#92400e',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.1em',
  textTransform: 'uppercase'
};

const decisionTitle = {
  margin: '8px 0',
  color: '#0f172a',
  fontSize: 28,
  lineHeight: 1.15
};

const decisionText = {
  margin: 0,
  maxWidth: 940,
  color: '#78350f',
  fontWeight: 750,
  lineHeight: 1.55
};

const decisionBadge = {
  background: '#0f172a',
  color: '#ffffff',
  borderRadius: 999,
  padding: '14px 18px',
  fontWeight: 1000,
  letterSpacing: '0.06em'
};

const metricsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14
};

const metricCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
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
  fontSize: 26,
  fontWeight: 1000,
  lineHeight: 1.1
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

const scopeGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
  gap: 16
};

const scopeCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 20
};

const scopeTitle = {
  margin: '0 0 10px',
  color: '#0f172a',
  fontSize: 19,
  lineHeight: 1.2
};

const scopeText = {
  margin: 0,
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.6
};

const criteriaGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 14
};

const criterionCard = {
  display: 'grid',
  gridTemplateColumns: '42px 1fr',
  gap: 14,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 20,
  padding: 18
};

const criterionIcon = {
  width: 42,
  height: 42,
  borderRadius: 999,
  background: '#0f766e',
  color: '#ffffff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 1000
};

const criterionTitle = {
  margin: 0,
  color: '#0f172a',
  fontSize: 18
};

const criterionText = {
  margin: '6px 0 0',
  color: '#047857',
  fontWeight: 750,
  lineHeight: 1.5
};

const timelinePanel = {
  ...panel
};

const timeline = {
  display: 'grid',
  gap: 14
};

const step = {
  display: 'grid',
  gridTemplateColumns: '50px 1fr',
  gap: 14,
  alignItems: 'start',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 18
};

const stepNumber = {
  width: 50,
  height: 50,
  borderRadius: 999,
  background: '#1d4ed8',
  color: '#ffffff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 1000,
  fontSize: 18
};

const stepTitle = {
  margin: 0,
  color: '#0f172a',
  fontSize: 19
};

const stepText = {
  margin: '6px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.55
};

const pricingPanel = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 1.4fr) minmax(260px, 0.8fr)',
  gap: 20,
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
  color: '#ffffff',
  borderRadius: 30,
  padding: 30,
  boxShadow: '0 16px 50px rgba(15, 23, 42, 0.15)'
};

const pricingKicker = {
  color: '#93c5fd',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const pricingTitle = {
  margin: '8px 0',
  fontSize: 30,
  lineHeight: 1.12
};

const pricingText = {
  margin: 0,
  color: 'rgba(255,255,255,0.86)',
  fontWeight: 700,
  lineHeight: 1.6
};

const pricingCards = {
  display: 'grid',
  gap: 12
};

const pricingCard = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 20,
  padding: 18
};

const pricingLabel = {
  color: '#bfdbfe',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const pricingValue = {
  marginTop: 8,
  fontSize: 26,
  fontWeight: 1000
};

const pricingSmall = {
  margin: '8px 0 0',
  color: 'rgba(255,255,255,0.8)',
  fontWeight: 650,
  lineHeight: 1.45
};

const objectionsPanel = {
  ...panel
};

const qaGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16
};

const qaCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 20,
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)'
};

const qaQuestion = {
  margin: 0,
  color: '#0f172a',
  fontSize: 19
};

const qaAnswer = {
  margin: '10px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.6
};

const closePanel = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 20,
  background: 'linear-gradient(135deg, #064e3b 0%, #0f766e 100%)',
  color: '#ffffff',
  borderRadius: 30,
  padding: 30,
  boxShadow: '0 16px 50px rgba(15, 23, 42, 0.15)'
};

const closeKicker = {
  color: '#a7f3d0',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const closeTitle = {
  margin: '8px 0',
  fontSize: 30,
  lineHeight: 1.1
};

const closeText = {
  margin: 0,
  maxWidth: 820,
  color: 'rgba(255,255,255,0.88)',
  fontWeight: 700,
  lineHeight: 1.55
};

const closeActions = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const disclaimer = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 20,
  padding: 18,
  fontWeight: 850,
  lineHeight: 1.5
};