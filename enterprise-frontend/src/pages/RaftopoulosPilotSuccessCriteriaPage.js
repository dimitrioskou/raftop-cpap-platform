import React from 'react';
import { Link } from 'react-router-dom';

export default function RaftopoulosPilotSuccessCriteriaPage() {
  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>RAFTOP CPAP CARE Pro / Pilot Success Criteria</div>

        <h1 style={title}>
          Πώς θα κριθεί αν το pilot πέτυχε
        </h1>

        <p style={subtitle}>
          Το pilot δεν πρέπει να είναι “δοκιμάζουμε την εφαρμογή”.
          Πρέπει να είναι ελεγχόμενη επιχειρησιακή δοκιμή με συγκεκριμένα KPIs,
          συγκεκριμένη διάρκεια, συγκεκριμένους χρήστες και καθαρή απόφαση στο τέλος.
        </p>

        <div style={heroActions}>
          <Link to="/sales/raftopoulos/decision-room" style={primaryButton}>
            Decision Room
          </Link>

          <Link to="/sales/raftopoulos/objections" style={secondaryButton}>
            Objections
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

      <section style={positionPanel}>
        <div>
          <div style={sectionKicker}>Pilot thesis</div>

          <h2 style={positionTitle}>
            Το pilot πρέπει να αποδείξει operational control, όχι απλώς λειτουργία οθονών.
          </h2>

          <p style={positionText}>
            Η επιτυχία δεν είναι να ανοίγει το dashboard. Η επιτυχία είναι να φαίνεται
            ότι η ομάδα μπορεί να εντοπίζει γρηγορότερα ασθενείς σε ρίσκο, να μετατρέπει
            signals σε tasks, να κλείνει follow-ups και να έχει διοικητική εικόνα για
            το τι συμβαίνει στο CPAP χαρτοφυλάκιο.
          </p>
        </div>

        <div style={pilotBadge}>
          30–45 DAYS
        </div>
      </section>

      <section style={pilotScopeGrid}>
        <ScopeCard
          label="Pilot patients"
          value="50–100"
          description="Επιλεγμένοι CPAP ασθενείς με πραγματική ανάγκη παρακολούθησης."
          tone="success"
        />

        <ScopeCard
          label="Internal users"
          value="2–3"
          description="Χρήστες της ομάδας που θα δουλεύουν signals, tasks και follow-ups."
          tone="success"
        />

        <ScopeCard
          label="Pilot duration"
          value="30–45 days"
          description="Αρκετό διάστημα για να φανεί αν το σύστημα παράγει αξία."
          tone="success"
        />

        <ScopeCard
          label="Decision output"
          value="Rollout / No rollout"
          description="Στο τέλος πρέπει να υπάρχει καθαρή απόφαση, όχι αόριστη συζήτηση."
          tone="warning"
        />
      </section>

      <section style={panel}>
        <div style={sectionKicker}>Success KPIs</div>
        <h2 style={sectionTitle}>Τα KPIs που πρέπει να πετύχει το pilot</h2>

        <div style={kpiGrid}>
          <KpiCard
            number="1"
            title="Signal detection"
            target="≥ 90% των επιλεγμένων signals να εμφανίζονται σωστά"
            why="Αποδεικνύει ότι η πλατφόρμα εντοπίζει περιστατικά που χρειάζονται προσοχή."
          />

          <KpiCard
            number="2"
            title="Task conversion"
            target="≥ 70% των σημαντικών signals να μετατρέπονται σε task"
            why="Αποδεικνύει ότι το σύστημα δεν δείχνει απλώς alerts, αλλά οδηγεί σε ενέργεια."
          />

          <KpiCard
            number="3"
            title="Follow-up closure"
            target="≥ 60% των opened follow-ups να κλείνουν με τελικό status"
            why="Αποδεικνύει ότι η ομάδα δεν αφήνει εκκρεμότητες χωρίς κατάληξη."
          />

          <KpiCard
            number="4"
            title="Critical case visibility"
            target="100% των critical cases να εμφανίζονται στο ATLAS / Action Center"
            why="Αποδεικνύει ότι τα σοβαρά περιστατικά δεν χάνονται μέσα σε Excel ή άτυπες σημειώσεις."
          />

          <KpiCard
            number="5"
            title="Time-to-triage"
            target="Μείωση χρόνου εντοπισμού προβληματικών περιστατικών"
            why="Αποδεικνύει ότι η ομάδα κερδίζει χρόνο και δεν ψάχνει χειροκίνητα."
          />

          <KpiCard
            number="6"
            title="Management visibility"
            target="Weekly executive report με καθαρά KPIs"
            why="Αποδεικνύει ότι η διοίκηση έχει εικόνα χωρίς να ζητάει χειροκίνητες αναφορές."
          />
        </div>
      </section>

      <section style={scorePanel}>
        <div>
          <div style={sectionKickerLight}>Pilot scoring model</div>
          <h2 style={scoreTitle}>Πώς βαθμολογείται το αποτέλεσμα</h2>

          <p style={scoreText}>
            Δεν πρέπει να αφήσεις το αποτέλεσμα του pilot να κριθεί υποκειμενικά.
            Βάζεις scoring model με green / yellow / red. Έτσι η απόφαση γίνεται
            πιο αντικειμενική.
          </p>
        </div>

        <div style={scoreCards}>
          <ScoreCard
            status="GREEN"
            title="Proceed to rollout"
            text="Τα βασικά KPIs πέτυχαν. Η πλατφόρμα έδειξε λειτουργική αξία και μπορεί να σχεδιαστεί rollout."
            tone="success"
          />

          <ScoreCard
            status="YELLOW"
            title="Extend pilot / fix gaps"
            text="Υπάρχει αξία, αλλά χρειάζονται διορθώσεις σε workflow, data import ή χρήστες πριν το rollout."
            tone="warning"
          />

          <ScoreCard
            status="RED"
            title="Do not rollout yet"
            text="Δεν αποδείχθηκε αξία ή το workflow δεν χρησιμοποιήθηκε επαρκώς. Χρειάζεται επανασχεδιασμός."
            tone="danger"
          />
        </div>
      </section>

      <section style={twoColumn}>
        <section style={panel}>
          <div style={sectionKicker}>Minimum acceptance criteria</div>
          <h2 style={sectionTitle}>Ελάχιστα κριτήρια επιτυχίας</h2>

          <div style={checkList}>
            <CheckItem text="Να φορτωθούν σωστά οι επιλεγμένοι CPAP ασθενείς." />
            <CheckItem text="Να εμφανίζονται signals για ασθενείς που χρειάζονται ενέργεια." />
            <CheckItem text="Να δημιουργούνται tasks από σημαντικά signals." />
            <CheckItem text="Να υπάρχει follow-up status για κάθε σημαντική ενέργεια." />
            <CheckItem text="Να υπάρχει εβδομαδιαίο executive report." />
            <CheckItem text="Να μπορεί η ομάδα να εξηγήσει τι κέρδισε από τη χρήση." />
          </div>
        </section>

        <section style={panel}>
          <div style={sectionKicker}>Failure criteria</div>
          <h2 style={sectionTitle}>Πότε το pilot θεωρείται ανεπαρκές</h2>

          <div style={dangerList}>
            <DangerItem text="Αν οι χρήστες δεν το χρησιμοποιούν καθημερινά." />
            <DangerItem text="Αν τα δεδομένα εισαγωγής είναι ασυνεπή ή άχρηστα." />
            <DangerItem text="Αν τα signals δεν οδηγούν σε ενέργειες." />
            <DangerItem text="Αν τα follow-ups μένουν χωρίς τελικό status." />
            <DangerItem text="Αν η διοίκηση δεν βλέπει καθαρή εικόνα." />
            <DangerItem text="Αν δεν υπάρχει συμφωνημένο decision meeting στο τέλος." />
          </div>
        </section>
      </section>

      <section style={timelinePanel}>
        <div style={sectionKicker}>Pilot timeline</div>
        <h2 style={sectionTitle}>Προτεινόμενο χρονοδιάγραμμα 45 ημερών</h2>

        <div style={timeline}>
          <TimelineStep
            day="Days 1–5"
            title="Setup & data preparation"
            text="Επιλογή ασθενών, users, import format, βασικά workflows και initial configuration."
          />

          <TimelineStep
            day="Days 6–15"
            title="First operational use"
            text="Η ομάδα ξεκινάει χρήση signals, tasks, patient lists και ATLAS review."
          />

          <TimelineStep
            day="Days 16–30"
            title="Follow-up execution"
            text="Μετράμε task creation, follow-up closure, critical case handling και time-to-triage."
          />

          <TimelineStep
            day="Days 31–40"
            title="Executive review"
            text="Παράγονται statistics, business impact και executive report για διοικητική αξιολόγηση."
          />

          <TimelineStep
            day="Days 41–45"
            title="Rollout decision"
            text="Απόφαση: rollout, extension ή redesign. Όχι αόριστη αναβολή."
          />
        </div>
      </section>

      <section style={decisionPanel}>
        <div>
          <div style={sectionKicker}>Final decision gate</div>
          <h2 style={decisionTitle}>Η απόφαση στο τέλος του pilot</h2>

          <p style={decisionText}>
            Το pilot πρέπει να τελειώσει με συγκεκριμένη απόφαση. Όχι “θα το δούμε”.
            Αν πετύχει τα KPIs, προχωράει σε rollout plan. Αν δεν πετύχει, καταγράφονται
            τα gaps και αποφασίζεται αν χρειάζεται extension ή redesign.
          </p>
        </div>

        <div style={decisionCards}>
          <DecisionCard
            title="Rollout"
            text="Η πλατφόρμα έδειξε αξία και προχωράει σε περισσότερους ασθενείς / χρήστες."
          />

          <DecisionCard
            title="Extend"
            text="Υπάρχει αξία, αλλά χρειάζεται λίγο παραπάνω pilot ή διορθώσεις."
          />

          <DecisionCard
            title="Stop / redesign"
            text="Το pilot δεν έδειξε αρκετή αξία ή το workflow δεν ήταν σωστό."
          />
        </div>
      </section>

      <section style={salesMessagePanel}>
        <div style={sectionKicker}>Sales message</div>
        <h2 style={sectionTitle}>Η φράση που πρέπει να πεις</h2>

        <div style={quoteBox}>
          Δεν σας ζητάμε να αποφασίσετε full rollout σήμερα. Σας ζητάμε να συμφωνήσουμε
          σε ένα pilot με πραγματικούς ασθενείς, πραγματικά KPIs και καθαρή απόφαση
          στο τέλος. Αν η πλατφόρμα δεν δείξει αξία, δεν προχωράμε. Αν δείξει αξία,
          έχουμε τεκμηριωμένο rollout plan.
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

function KpiCard({ number, title, target, why }) {
  return (
    <article style={kpiCard}>
      <div style={kpiNumber}>{number}</div>
      <h3 style={kpiTitle}>{title}</h3>

      <div style={targetBox}>
        <strong>Target:</strong> {target}
      </div>

      <p style={kpiWhy}>{why}</p>
    </article>
  );
}

function ScoreCard({ status, title, text, tone }) {
  return (
    <article style={{ ...scoreCard, ...toneStyle(tone) }}>
      <div style={scoreStatus}>{status}</div>
      <h3 style={scoreCardTitle}>{title}</h3>
      <p style={scoreCardText}>{text}</p>
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

function DangerItem({ text }) {
  return (
    <div style={dangerItem}>
      <span>!</span>
      <strong>{text}</strong>
    </div>
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

function DecisionCard({ title, text }) {
  return (
    <article style={decisionCard}>
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

const page = {
  display: 'grid',
  gap: 20
};

const hero = {
  background: 'linear-gradient(135deg, #020617 0%, #1e3a8a 52%, #0f766e 100%)',
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

const positionTitle = {
  margin: '8px 0',
  color: '#0f172a',
  fontSize: 30,
  lineHeight: 1.12,
  maxWidth: 960
};

const positionText = {
  margin: 0,
  color: '#475569',
  fontWeight: 750,
  lineHeight: 1.55,
  maxWidth: 980
};

const pilotBadge = {
  background: '#0f766e',
  color: '#ffffff',
  borderRadius: 999,
  padding: '16px 20px',
  fontWeight: 1000,
  letterSpacing: '0.06em'
};

const pilotScopeGrid = {
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
  fontWeight: 1000,
  lineHeight: 1.1
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

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 16
};

const kpiCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 22
};

const kpiNumber = {
  width: 42,
  height: 42,
  borderRadius: 999,
  background: '#0f766e',
  color: '#ffffff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 1000
};

const kpiTitle = {
  margin: '14px 0 12px',
  color: '#0f172a',
  fontSize: 22
};

const targetBox = {
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#065f46',
  borderRadius: 16,
  padding: 14,
  fontWeight: 850,
  lineHeight: 1.45
};

const kpiWhy = {
  margin: '12px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.55
};

const scorePanel = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(320px, 1.2fr)',
  gap: 24,
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
  color: '#ffffff',
  borderRadius: 30,
  padding: 32,
  boxShadow: '0 16px 50px rgba(15, 23, 42, 0.15)'
};

const scoreTitle = {
  margin: '8px 0',
  fontSize: 32,
  lineHeight: 1.12
};

const scoreText = {
  margin: 0,
  color: 'rgba(255,255,255,0.86)',
  fontWeight: 700,
  lineHeight: 1.6
};

const scoreCards = {
  display: 'grid',
  gap: 12
};

const scoreCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 18,
  color: '#0f172a'
};

const scoreStatus = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const scoreCardTitle = {
  margin: '8px 0',
  fontSize: 20
};

const scoreCardText = {
  margin: 0,
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.5
};

const twoColumn = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 18
};

const checkList = {
  display: 'grid',
  gap: 10
};

const dangerList = {
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

const dangerItem = {
  display: 'grid',
  gridTemplateColumns: '34px 1fr',
  gap: 10,
  alignItems: 'center',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 16,
  padding: 14
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

const decisionPanel = {
  display: 'grid',
  gridTemplateColumns: 'minmax(300px, 0.9fr) minmax(320px, 1.1fr)',
  gap: 22,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const decisionTitle = {
  margin: '8px 0',
  color: '#0f172a',
  fontSize: 32,
  lineHeight: 1.12
};

const decisionText = {
  margin: 0,
  color: '#475569',
  fontWeight: 750,
  lineHeight: 1.55
};

const decisionCards = {
  display: 'grid',
  gap: 12
};

const decisionCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
  color: '#0f172a'
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