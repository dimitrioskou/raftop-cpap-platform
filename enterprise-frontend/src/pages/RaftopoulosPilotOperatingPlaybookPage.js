import React from 'react';
import { Link } from 'react-router-dom';

export default function RaftopoulosPilotOperatingPlaybookPage() {
  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>RAFTOP CPAP CARE Pro / Pilot Operating Playbook</div>

        <h1 style={title}>
          Πώς θα δουλέψει πρακτικά το pilot
        </h1>

        <p style={subtitle}>
          Το pilot δεν πρέπει να είναι “μπείτε και δείτε την εφαρμογή”.
          Πρέπει να έχει καθημερινή λειτουργία, συγκεκριμένους ρόλους,
          συγκεκριμένο rhythm, escalation rules και εβδομαδιαία διοικητική εικόνα.
        </p>

        <div style={heroActions}>
          <Link to="/sales/raftopoulos/decision-room" style={primaryButton}>
            Decision Room
          </Link>

          <Link to="/sales/raftopoulos/pilot-success" style={secondaryButton}>
            Pilot Success
          </Link>

          <Link to="/sales/raftopoulos/objections" style={secondaryButton}>
            Objections
          </Link>

          <Link to="/sales/raftopoulos/pilot" style={secondaryButton}>
            Pilot Proposal
          </Link>
        </div>
      </section>

      <section style={positionPanel}>
        <div>
          <div style={sectionKicker}>Operating principle</div>

          <h2 style={positionTitle}>
            Η εφαρμογή πρέπει να γίνει καθημερινός πίνακας ελέγχου, όχι απλή βάση δεδομένων.
          </h2>

          <p style={positionText}>
            Αν η ομάδα μπαίνει μία φορά την εβδομάδα, το pilot θα αποτύχει.
            Αν όμως κάθε μέρα κοιτάει ATLAS signals, tasks, critical follow-ups
            και closed-loop status, τότε το pilot μπορεί να αποδείξει πραγματική
            λειτουργική αξία.
          </p>
        </div>

        <div style={badge}>
          DAILY USE
        </div>
      </section>

      <section style={scopeGrid}>
        <ScopeCard
          label="Pilot users"
          value="2–3"
          description="Ένας operational user, ένας supervisor και προαιρετικά ένας decision-maker viewer."
          tone="success"
        />

        <ScopeCard
          label="Patient cohort"
          value="50–100"
          description="Αρχικός πληθυσμός CPAP ασθενών για controlled evaluation."
          tone="success"
        />

        <ScopeCard
          label="Daily check"
          value="15–20 min"
          description="Σύντομο καθημερινό review signals, tasks και follow-ups."
          tone="success"
        />

        <ScopeCard
          label="Weekly review"
          value="30 min"
          description="Εβδομαδιαία ανασκόπηση KPIs, blockers και business impact."
          tone="warning"
        />
      </section>

      <section style={panel}>
        <div style={sectionKicker}>Roles</div>
        <h2 style={sectionTitle}>Ποιος κάνει τι στο pilot</h2>

        <div style={roleGrid}>
          <RoleCard
            role="Operational User"
            owner="Υπάλληλος / χειριστής follow-up"
            responsibilities={[
              'Ελέγχει καθημερινά Patient Signals',
              'Μετατρέπει σημαντικά signals σε tasks',
              'Ενημερώνει follow-up status',
              'Καταγράφει notes μετά από επικοινωνία',
              'Κλείνει tasks όταν ολοκληρωθεί η ενέργεια'
            ]}
          />

          <RoleCard
            role="Supervisor"
            owner="Υπεύθυνος ομάδας / manager"
            responsibilities={[
              'Ελέγχει critical follow-ups',
              'Βλέπει αν υπάρχουν καθυστερημένα tasks',
              'Κάνει escalation όπου χρειάζεται',
              'Ελέγχει το Weekly Executive Report',
              'Αξιολογεί αν το pilot παράγει αξία'
            ]}
          />

          <RoleCard
            role="Decision Viewer"
            owner="Διοίκηση / Raftopoulos decision-maker"
            responsibilities={[
              'Δεν δουλεύει καθημερινά tasks',
              'Βλέπει Decision Room',
              'Βλέπει Business Impact',
              'Βλέπει Pilot Success KPIs',
              'Αποφασίζει rollout / extension / stop'
            ]}
          />
        </div>
      </section>

      <section style={dailyPanel}>
        <div>
          <div style={sectionKickerLight}>Daily operating rhythm</div>
          <h2 style={dailyTitle}>Η καθημερινή ροή εργασίας</h2>

          <p style={dailyText}>
            Αυτό είναι το πιο σημαντικό κομμάτι. Αν η Raftopoulos θέλει αποτέλεσμα,
            η ομάδα πρέπει να χρησιμοποιεί την πλατφόρμα με συγκεκριμένη καθημερινή σειρά.
          </p>
        </div>

        <div style={dailySteps}>
          <FlowStep
            number="1"
            title="Άνοιγμα ATLAS / Patient Signals"
            text="Η ομάδα ξεκινάει από τα signals και όχι από γενική λίστα ασθενών."
          />

          <FlowStep
            number="2"
            title="Έλεγχος critical / high priority"
            text="Πρώτα εξετάζονται τα περιστατικά με υψηλό ρίσκο ή critical follow-up."
          />

          <FlowStep
            number="3"
            title="Δημιουργία task"
            text="Κάθε σημαντικό signal πρέπει να γίνεται task με owner και status."
          />

          <FlowStep
            number="4"
            title="Επικοινωνία / ενέργεια"
            text="Η ομάδα κάνει την ενέργεια: τηλεφώνημα, έλεγχο, note ή follow-up."
          />

          <FlowStep
            number="5"
            title="Closure"
            text="Το task δεν μένει ανοιχτό. Παίρνει τελικό status ή escalation."
          />
        </div>
      </section>

      <section style={twoColumn}>
        <section style={panel}>
          <div style={sectionKicker}>Escalation rules</div>
          <h2 style={sectionTitle}>Πότε ανεβαίνει ένα περιστατικό</h2>

          <div style={ruleList}>
            <RuleItem
              level="HIGH"
              title="Critical follow-up ανοιχτό πάνω από 24 ώρες"
              text="Πηγαίνει στον supervisor για άμεσο review."
            />

            <RuleItem
              level="HIGH"
              title="High-risk signal χωρίς task"
              text="Αν ένα σημαντικό signal δεν έχει task, θεωρείται operational gap."
            />

            <RuleItem
              level="MEDIUM"
              title="Task ανοιχτό πάνω από 48 ώρες"
              text="Χρειάζεται owner confirmation ή escalation."
            />

            <RuleItem
              level="MEDIUM"
              title="Offline / inactive device"
              text="Μπαίνει σε λίστα ελέγχου γιατί μειώνει την ορατότητα της θεραπείας."
            />

            <RuleItem
              level="LOW"
              title="Low priority signal"
              text="Παρακολουθείται, αλλά δεν προηγείται των critical cases."
            />
          </div>
        </section>

        <section style={panel}>
          <div style={sectionKicker}>Data input rules</div>
          <h2 style={sectionTitle}>Τι δεδομένα χρειάζονται</h2>

          <div style={checkList}>
            <CheckItem text="Λίστα pilot ασθενών με καθαρό patient identifier." />
            <CheckItem text="Συσχέτιση ασθενή με CPAP συσκευή όπου υπάρχει." />
            <CheckItem text="Βασικά usage / compliance στοιχεία από διαθέσιμο αρχείο." />
            <CheckItem text="Follow-up status ή ιστορικό όπου υπάρχει." />
            <CheckItem text="Υπεύθυνος χρήστης για κάθε task / follow-up." />
            <CheckItem text="Συμφωνημένο import format πριν ξεκινήσει το pilot." />
          </div>
        </section>
      </section>

      <section style={panel}>
        <div style={sectionKicker}>Weekly management review</div>
        <h2 style={sectionTitle}>Τι βλέπει η διοίκηση κάθε εβδομάδα</h2>

        <div style={managementGrid}>
          <ManagementCard
            title="Operational Control Score"
            text="Δείχνει αν η συνολική λειτουργία είναι υπό έλεγχο ή αν αυξάνονται blockers."
          />

          <ManagementCard
            title="Follow-up Pressure"
            text="Δείχνει πόση πίεση έχει η ομάδα από ανοιχτά follow-ups και tasks."
          />

          <ManagementCard
            title="ATLAS Signal Value"
            text="Δείχνει αν το ATLAS παράγει πραγματική προτεραιοποίηση."
          />

          <ManagementCard
            title="Critical Follow-ups"
            text="Δείχνει ποια περιστατικά δεν πρέπει να χαθούν."
          />

          <ManagementCard
            title="Task Closure Rate"
            text="Δείχνει αν η ομάδα απλώς βλέπει προβλήματα ή τα κλείνει."
          />

          <ManagementCard
            title="Business Impact"
            text="Δείχνει πού δημιουργείται οικονομική ή λειτουργική αξία."
          />
        </div>
      </section>

      <section style={timelinePanel}>
        <div style={sectionKicker}>45-day operating plan</div>
        <h2 style={sectionTitle}>Πρακτικό πλάνο 45 ημερών</h2>

        <div style={timeline}>
          <TimelineStep
            day="Days 1–5"
            title="Setup"
            text="Επιλέγονται ασθενείς, χρήστες, import format, basic workflows και access rules."
          />

          <TimelineStep
            day="Days 6–10"
            title="First use"
            text="Η ομάδα μαθαίνει τη ροή: signals → tasks → follow-up → closure."
          />

          <TimelineStep
            day="Days 11–20"
            title="Operational stabilization"
            text="Μετράμε αν τα signals γίνονται tasks και αν τα tasks κλείνουν."
          />

          <TimelineStep
            day="Days 21–30"
            title="Performance review"
            text="Βλέπουμε bottlenecks, καθυστερήσεις, user adoption και missing workflow points."
          />

          <TimelineStep
            day="Days 31–40"
            title="Business impact review"
            text="Εξετάζουμε potential profit, time saved, prevented lost follow-ups και retention logic."
          />

          <TimelineStep
            day="Days 41–45"
            title="Decision meeting"
            text="Απόφαση: rollout, extension ή redesign. Όχι αόριστη αναβολή."
          />
        </div>
      </section>

      <section style={riskPanel}>
        <div style={sectionKickerDanger}>Pilot risks</div>
        <h2 style={riskTitle}>Τι μπορεί να χαλάσει το pilot</h2>

        <div style={riskGrid}>
          <RiskCard
            title="Κακή χρήση από την ομάδα"
            text="Αν οι χρήστες δεν μπαίνουν καθημερινά, δεν θα φανεί αξία."
          />

          <RiskCard
            title="Κακά δεδομένα εισαγωγής"
            text="Αν το import είναι ασυνεπές, το σύστημα θα δείχνει ατελή εικόνα."
          />

          <RiskCard
            title="Χωρίς owner στα tasks"
            text="Task χωρίς υπεύθυνο είναι απλώς υπενθύμιση, όχι λειτουργική ενέργεια."
          />

          <RiskCard
            title="Χωρίς decision meeting"
            text="Αν δεν οριστεί τελική ημερομηνία απόφασης, το pilot θα τραβήξει χωρίς αποτέλεσμα."
          />
        </div>
      </section>

      <section style={closingPanel}>
        <div>
          <div style={closingKicker}>Operating close</div>

          <h2 style={closingTitle}>
            Το pilot πρέπει να δουλέψει σαν μικρή παραγωγή
          </h2>

          <p style={closingText}>
            Η σωστή τοποθέτηση είναι απλή: δεν ζητάμε από τη Raftopoulos να
            αλλάξει όλη τη λειτουργία της σε μία μέρα. Ζητάμε να βάλει 50–100
            ασθενείς σε ελεγχόμενο operational flow και να δει αν η πλατφόρμα
            μειώνει χαμένα follow-ups, βελτιώνει visibility και προστατεύει αξία.
          </p>
        </div>

        <div style={closingActions}>
          <Link to="/sales/raftopoulos/pilot-success" style={primaryButton}>
            Pilot Success
          </Link>

          <Link to="/sales/raftopoulos/pilot" style={secondaryButton}>
            Pilot Proposal
          </Link>
        </div>
      </section>
    </main>
  );
}

function ScopeCard({ label, value, description, tone = 'default' }) {
  return (
    <article style={{ ...scopeCard, ...toneStyle(tone) }}>
      <div style={scopeLabel}>{label}</div>
      <div style={scopeValue}>{value}</div>
      <p style={scopeDescription}>{description}</p>
    </article>
  );
}

function RoleCard({ role, owner, responsibilities }) {
  return (
    <article style={roleCard}>
      <div style={roleLabel}>{role}</div>
      <h3 style={roleOwner}>{owner}</h3>

      <ul style={roleList}>
        {responsibilities.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function FlowStep({ number, title, text }) {
  return (
    <article style={flowStep}>
      <div style={flowNumber}>{number}</div>
      <div>
        <h3 style={flowTitle}>{title}</h3>
        <p style={flowText}>{text}</p>
      </div>
    </article>
  );
}

function RuleItem({ level, title, text }) {
  return (
    <article style={ruleItem(level)}>
      <div style={ruleLevel(level)}>{level}</div>
      <div>
        <h3 style={ruleTitle}>{title}</h3>
        <p style={ruleText}>{text}</p>
      </div>
    </article>
  );
}

function CheckItem({ text }) {
  return (
    <div style={checkItem}>
      <span>✓</span>
      <strong>{text}</strong>
    </div>
  );
}

function ManagementCard({ title, text }) {
  return (
    <article style={managementCard}>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function TimelineStep({ day, title, text }) {
  return (
    <article style={timelineStep}>
      <div style={timelineDay}>{day}</div>
      <div>
        <h3 style={timelineTitle}>{title}</h3>
        <p style={timelineText}>{text}</p>
      </div>
    </article>
  );
}

function RiskCard({ title, text }) {
  return (
    <article style={riskCard}>
      <h3>{title}</h3>
      <p>{text}</p>
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

function ruleItem(level) {
  return {
    display: 'grid',
    gridTemplateColumns: '82px 1fr',
    gap: 12,
    alignItems: 'start',
    background: level === 'HIGH' ? '#fef2f2' : level === 'MEDIUM' ? '#fffbeb' : '#f8fafc',
    border: level === 'HIGH' ? '1px solid #fecaca' : level === 'MEDIUM' ? '1px solid #fde68a' : '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 16
  };
}

function ruleLevel(level) {
  return {
    background: level === 'HIGH' ? '#dc2626' : level === 'MEDIUM' ? '#d97706' : '#334155',
    color: '#ffffff',
    borderRadius: 999,
    padding: '8px 10px',
    textAlign: 'center',
    fontWeight: 1000,
    fontSize: 12
  };
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
  maxWidth: 1100
};

const subtitle = {
  margin: 0,
  maxWidth: 1060,
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

const positionPanel = {
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
  color: '#bfdbfe',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const sectionKickerDanger = {
  color: '#dc2626',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const positionTitle = {
  margin: '8px 0',
  color: '#0f172a',
  fontSize: 30,
  lineHeight: 1.12,
  maxWidth: 980
};

const positionText = {
  margin: 0,
  color: '#475569',
  fontWeight: 750,
  lineHeight: 1.55,
  maxWidth: 980
};

const badge = {
  background: '#0f766e',
  color: '#ffffff',
  borderRadius: 999,
  padding: '16px 20px',
  fontWeight: 1000,
  letterSpacing: '0.06em'
};

const scopeGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14
};

const scopeCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 20,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)'
};

const scopeLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const scopeValue = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 28,
  fontWeight: 1000
};

const scopeDescription = {
  margin: '10px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.45
};

const panel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const sectionTitle = {
  margin: '8px 0 18px',
  color: '#0f172a',
  fontSize: 32,
  lineHeight: 1.12
};

const roleGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
  gap: 16
};

const roleCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 22
};

const roleLabel = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const roleOwner = {
  margin: '8px 0 12px',
  color: '#0f172a',
  fontSize: 22
};

const roleList = {
  margin: 0,
  paddingLeft: 20,
  color: '#334155',
  fontWeight: 750,
  lineHeight: 1.7
};

const dailyPanel = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(320px, 1.2fr)',
  gap: 24,
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
  color: '#ffffff',
  borderRadius: 30,
  padding: 32,
  boxShadow: '0 16px 50px rgba(15, 23, 42, 0.15)'
};

const dailyTitle = {
  margin: '8px 0',
  fontSize: 32,
  lineHeight: 1.12
};

const dailyText = {
  margin: 0,
  color: 'rgba(255,255,255,0.86)',
  fontWeight: 700,
  lineHeight: 1.6
};

const dailySteps = {
  display: 'grid',
  gap: 12
};

const flowStep = {
  display: 'grid',
  gridTemplateColumns: '44px 1fr',
  gap: 12,
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 18,
  padding: 16
};

const flowNumber = {
  width: 44,
  height: 44,
  borderRadius: 999,
  background: '#ffffff',
  color: '#0f172a',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 1000
};

const flowTitle = {
  margin: 0,
  color: '#ffffff',
  fontSize: 18
};

const flowText = {
  margin: '6px 0 0',
  color: 'rgba(255,255,255,0.82)',
  fontWeight: 700,
  lineHeight: 1.45
};

const twoColumn = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 18
};

const ruleList = {
  display: 'grid',
  gap: 10
};

const ruleTitle = {
  margin: 0,
  color: '#0f172a',
  fontSize: 17
};

const ruleText = {
  margin: '6px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.45
};

const checkList = {
  display: 'grid',
  gap: 10
};

const checkItem = {
  display: 'grid',
  gridTemplateColumns: '34px 1fr',
  gap: 10,
  alignItems: 'center',
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  color: '#166534',
  borderRadius: 16,
  padding: 14
};

const managementGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14
};

const managementCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 18,
  color: '#0f172a'
};

const timelinePanel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const timeline = {
  display: 'grid',
  gap: 12
};

const timelineStep = {
  display: 'grid',
  gridTemplateColumns: '130px 1fr',
  gap: 16,
  alignItems: 'start',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18
};

const timelineDay = {
  background: '#0f766e',
  color: '#ffffff',
  borderRadius: 999,
  padding: '9px 12px',
  textAlign: 'center',
  fontWeight: 1000
};

const timelineTitle = {
  margin: 0,
  color: '#0f172a',
  fontSize: 20
};

const timelineText = {
  margin: '6px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.5
};

const riskPanel = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const riskTitle = {
  margin: '8px 0 18px',
  color: '#991b1b',
  fontSize: 32,
  lineHeight: 1.12
};

const riskGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14
};

const riskCard = {
  background: '#ffffff',
  border: '1px solid #fecaca',
  borderRadius: 20,
  padding: 18,
  color: '#991b1b'
};

const closingPanel = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap',
  background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 100%)',
  color: '#ffffff',
  borderRadius: 30,
  padding: 32,
  boxShadow: '0 16px 50px rgba(15, 23, 42, 0.15)'
};

const closingKicker = {
  color: '#a7f3d0',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const closingTitle = {
  margin: '8px 0',
  fontSize: 32,
  lineHeight: 1.12
};

const closingText = {
  margin: 0,
  maxWidth: 920,
  color: 'rgba(255,255,255,0.86)',
  fontWeight: 750,
  lineHeight: 1.6
};

const closingActions = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};