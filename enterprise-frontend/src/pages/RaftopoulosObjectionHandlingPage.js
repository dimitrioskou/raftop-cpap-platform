import React from 'react';
import { Link } from 'react-router-dom';

export default function RaftopoulosObjectionHandlingPage() {
  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>RAFTOP CPAP CARE Pro / Objection Handling</div>

        <h1 style={title}>
          Απαντήσεις στις δύσκολες ερωτήσεις της Raftopoulos
        </h1>

        <p style={subtitle}>
          Η σωστή πώληση δεν είναι να υποσχεθούμε υπερβολικά πράγματα.
          Είναι να δείξουμε με ακρίβεια τι είναι έτοιμο, τι χρειάζεται pilot,
          τι θέλει production προετοιμασία και πού δημιουργείται πραγματική αξία.
        </p>

        <div style={heroActions}>
          <Link to="/sales/raftopoulos/decision-room" style={primaryButton}>
            Decision Room
          </Link>

          <Link to="/tenant/business-impact" style={secondaryButton}>
            Business Impact
          </Link>

          <Link to="/sales/raftopoulos/pilot" style={secondaryButton}>
            Pilot Proposal
          </Link>

          <Link to="/tenant/statistics" style={secondaryButton}>
            Statistics
          </Link>
        </div>
      </section>

      <section style={positionPanel}>
        <div>
          <div style={sectionKicker}>Positioning</div>

          <h2 style={positionTitle}>
            Δεν το παρουσιάζεις ως “τελειωμένο production σύστημα”.
            Το παρουσιάζεις ως pilot-ready operational control platform.
          </h2>

          <p style={positionText}>
            Αυτό είναι κρίσιμο. Αν πεις ότι είναι production-ready πριν γίνει
            πραγματικό deployment, πραγματικά δεδομένα, backup policy, ρόλοι,
            GDPR documentation και συμφωνημένο import flow, θα δημιουργήσεις
            επικίνδυνη προσδοκία. Η σωστή θέση είναι: controlled commercial demo
            και pilot-ready πλατφόρμα.
          </p>
        </div>

        <div style={positionBadge}>
          PILOT-READY
        </div>
      </section>

      <section style={quickAnswersGrid}>
        <QuickAnswer
          label="Είναι έτοιμο για πώληση;"
          value="Για controlled pilot"
          tone="success"
        />

        <QuickAnswer
          label="Είναι production-ready;"
          value="Όχι ακόμη"
          tone="warning"
        />

        <QuickAnswer
          label="Χρειάζεται πραγματικό pilot;"
          value="Ναι"
          tone="success"
        />

        <QuickAnswer
          label="Υπάρχει σαφής αξία;"
          value="Ναι"
          tone="success"
        />

        <QuickAnswer
          label="Υπάρχει ρίσκο;"
          value="Μόνο αν υποσχεθούμε υπερβολικά"
          tone="warning"
        />

        <QuickAnswer
          label="Σωστό επόμενο βήμα;"
          value="50–100 ασθενείς"
          tone="success"
        />
      </section>

      <section style={panel}>
        <div style={sectionKicker}>Critical objections</div>
        <h2 style={sectionTitle}>Οι ερωτήσεις που πρέπει να απαντηθούν σωστά</h2>

        <div style={qaGrid}>
          <QA
            question="1. Είναι έτοιμο για παραγωγή;"
            answer="Όχι με την έννοια πλήρους production rollout. Είναι έτοιμο για controlled pilot και εμπορική αξιολόγηση. Για παραγωγή χρειάζονται deployment, backup policy, ρόλοι χρηστών, audit trail, πραγματικά δεδομένα, GDPR documentation και συμφωνημένο operational workflow."
            correctPhrase="Η σωστή επόμενη κίνηση δεν είναι full rollout. Είναι pilot με πραγματικά δεδομένα και μετρήσιμα KPIs."
            tone="warning"
          />

          <QA
            question="2. Από πού παίρνει CPAP data;"
            answer="Στο pilot ξεκινάμε με structured import, συνήθως CSV ή αρχείο που μπορεί να δώσει η υπάρχουσα διαδικασία. Direct API integration εξετάζεται μόνο εφόσον είναι τεχνικά, συμβατικά και εμπορικά διαθέσιμο."
            correctPhrase="Δεν υποσχόμαστε API πριν επιβεβαιωθεί. Ξεκινάμε ρεαλιστικά με structured import."
          />

          <QA
            question="3. Γιατί να μην συνεχίσουμε με Excel;"
            answer="Το Excel καταγράφει. Δεν προτεραιοποιεί, δεν αναθέτει owner, δεν βγάζει closed-loop status, δεν δείχνει ποια follow-ups χάνονται, δεν δίνει executive control και δεν κλιμακώνεται καλά σε μεγάλο CPAP χαρτοφυλάκιο."
            correctPhrase="Το Excel είναι αποθήκη. Το RAFTOP είναι control system."
            tone="danger"
          />

          <QA
            question="4. Τι κερδίζουμε οικονομικά;"
            answer="Το κέρδος δεν είναι απλώς άμεσο έσοδο. Είναι προστατευμένη αξία: λιγότερα χαμένα follow-ups, καλύτερο retention ασθενών, λιγότερος χρόνος προσωπικού σε χειροκίνητο triage, καλύτερη αξιοποίηση service και πιθανή συνέχεια σε consumables."
            correctPhrase="Το Business Impact page δείχνει από πού δημιουργείται η αξία και επιτρέπει αλλαγή παραδοχών."
          />

          <QA
            question="5. Είναι ασφαλές;"
            answer="Για demo και pilot μπορεί να λειτουργήσει με ελεγχόμενη πρόσβαση, tenant isolation και περιορισμένα δεδομένα. Για production απαιτείται πλήρης έλεγχος: authentication, role permissions, audit logs, backups, encryption policy, data retention και συμβατική κάλυψη."
            correctPhrase="Δεν πουλάμε ασφάλεια με λόγια. Τη μετατρέπουμε σε production checklist."
            tone="warning"
          />

          <QA
            question="6. Τι γίνεται με GDPR;"
            answer="Για pilot πρέπει να οριστεί ποια δεδομένα μπαίνουν, ποιος τα βλέπει, ποιος είναι controller/processor, ποια είναι η βάση επεξεργασίας, πόσο διατηρούνται και πώς διαγράφονται. Στο commercial demo δεν πρέπει να χρησιμοποιούνται πραγματικά ευαίσθητα δεδομένα χωρίς συμφωνία."
            correctPhrase="Το GDPR δεν είναι εμπόδιο αν σχεδιαστεί σωστά. Είναι μέρος του production rollout."
            tone="warning"
          />

          <QA
            question="7. Πώς θα ξέρουμε ότι πέτυχε το pilot;"
            answer="Με συγκεκριμένα KPIs: πόσα signals εντοπίστηκαν, πόσα έγιναν tasks, πόσα follow-ups έκλεισαν, πόσα critical cases μειώθηκαν, πόσο γρήγορα κινήθηκε η ομάδα και τι operational value φάνηκε."
            correctPhrase="Δεν ζητάμε να μας πιστέψουν. Ζητάμε να το μετρήσουμε."
          />

          <QA
            question="8. Τι ρίσκο έχει για τη Raftopoulos;"
            answer="Το ρίσκο μειώνεται επειδή δεν ζητάμε άμεσο full rollout. Ξεκινάμε με περιορισμένο pilot, μικρό αριθμό χρηστών, συγκεκριμένο scope και σαφή success criteria."
            correctPhrase="Το pilot είναι μηχανισμός μείωσης ρίσκου."
          />

          <QA
            question="9. Μπορεί να πουληθεί μετά σε ιατρούς;"
            answer="Ναι, αλλά όχι αμέσως ως γενικό προϊόν χωρίς δοκιμή. Πρώτα πρέπει να αποδειχθεί στον εσωτερικό πληθυσμό της Raftopoulos, να σταθεροποιηθούν workflows και μετά να πακεταριστεί ως doctor-facing SaaS ή white-label module."
            correctPhrase="Πρώτα εσωτερική απόδειξη αξίας, μετά resale σε ιατρούς."
          />

          <QA
            question="10. Πόσο γρήγορα μπορούμε να ξεκινήσουμε;"
            answer="Controlled pilot μπορεί να ξεκινήσει μόλις συμφωνηθούν χρήστες, ασθενείς, import format, βασικά follow-up σενάρια και όρια χρήσης. Δεν χρειάζεται να λυθούν όλα τα production ζητήματα για να ξεκινήσει το pilot."
            correctPhrase="Pilot πρώτα. Production μετά την απόδειξη αξίας."
          />
        </div>
      </section>

      <section style={redFlagPanel}>
        <div style={sectionKickerDanger}>Red flags</div>
        <h2 style={redFlagTitle}>Τι δεν πρέπει να πεις</h2>

        <div style={redFlagGrid}>
          <BadPhrase text="Είναι 100% production-ready." />
          <BadPhrase text="Συνδέεται σίγουρα με όλα τα CPAP APIs." />
          <BadPhrase text="Δεν χρειάζεται GDPR έλεγχος." />
          <BadPhrase text="Θα αντικαταστήσει άμεσα όλα τα συστήματά σας." />
          <BadPhrase text="Το κέρδος είναι εγγυημένο." />
          <BadPhrase text="Μπορείτε να το ανοίξετε αύριο σε 7.000 ασθενείς." />
        </div>
      </section>

      <section style={greenPanel}>
        <div style={sectionKickerSuccess}>Correct language</div>
        <h2 style={greenTitle}>Τι πρέπει να πεις αντί για αυτά</h2>

        <div style={greenGrid}>
          <GoodPhrase text="Είναι έτοιμο για controlled pilot με καθαρό scope." />
          <GoodPhrase text="Ξεκινάμε με structured import και εξετάζουμε integrations μετά." />
          <GoodPhrase text="Για production θα φτιάξουμε GDPR και security checklist." />
          <GoodPhrase text="Δεν αντικαθιστά απότομα τη λειτουργία. Τη βελτιώνει σταδιακά." />
          <GoodPhrase text="Το οικονομικό όφελος θα μετρηθεί με παραμετρικό Business Impact model." />
          <GoodPhrase text="Πρώτα 50–100 ασθενείς, μετά τεκμηριωμένο rollout." />
        </div>
      </section>

      <section style={panel}>
        <div style={sectionKicker}>Objection-to-page mapping</div>
        <h2 style={sectionTitle}>Ποια σελίδα δείχνεις ανάλογα με την ερώτηση</h2>

        <div style={mappingGrid}>
          <MapCard
            objection="Θέλω να καταλάβω συνολικά τι είναι."
            page="Sales Snapshot"
            link="/sales/raftopoulos"
          />

          <MapCard
            objection="Γιατί να το κάνουμε;"
            page="Decision Room"
            link="/sales/raftopoulos/decision-room"
          />

          <MapCard
            objection="Τι στατιστικά θα έχουμε;"
            page="Statistics"
            link="/tenant/statistics"
          />

          <MapCard
            objection="Πού είναι το κέρδος;"
            page="Business Impact"
            link="/tenant/business-impact"
          />

          <MapCard
            objection="Θέλω αναφορά για διοίκηση."
            page="Executive Report"
            link="/tenant/statistics/report"
          />

          <MapCard
            objection="Ποιο είναι το επόμενο βήμα;"
            page="Pilot Proposal"
            link="/sales/raftopoulos/pilot"
          />
        </div>
      </section>

      <section style={closingPanel}>
        <div>
          <div style={closingKicker}>Final answer</div>

          <h2 style={closingTitle}>
            Η ώριμη απάντηση στη Raftopoulos
          </h2>

          <p style={closingText}>
            Το RAFTOP CPAP CARE Pro δεν πρέπει να παρουσιαστεί ως απλή εφαρμογή.
            Πρέπει να παρουσιαστεί ως pilot-ready operational control system για
            CPAP χαρτοφυλάκιο. Η αξία του είναι ότι δείχνει πού πρέπει να δράσει
            η ομάδα, ποια follow-ups κινδυνεύουν, τι αξία προστατεύεται και αν οι
            ενέργειες τελικά κλείνουν.
          </p>
        </div>

        <div style={closingActions}>
          <Link to="/demo/raftopoulos/decision-room" style={primaryButton}>
            Open Decision Launcher
          </Link>

          <Link to="/demo/raftopoulos/pilot" style={secondaryButton}>
            Open Pilot Launcher
          </Link>
        </div>
      </section>
    </main>
  );
}

function QuickAnswer({ label, value, tone = 'default' }) {
  return (
    <article style={{ ...quickCard, ...toneStyle(tone) }}>
      <div style={quickLabel}>{label}</div>
      <div style={quickValue}>{value}</div>
    </article>
  );
}

function QA({ question, answer, correctPhrase, tone = 'default' }) {
  return (
    <article style={{ ...qaCard, ...toneStyle(tone) }}>
      <h3 style={qaQuestion}>{question}</h3>

      <p style={qaAnswer}>{answer}</p>

      <div style={correctBox}>
        <strong>Σωστή φράση:</strong> {correctPhrase}
      </div>
    </article>
  );
}

function BadPhrase({ text }) {
  return (
    <div style={badPhrase}>
      <span>✕</span>
      <strong>{text}</strong>
    </div>
  );
}

function GoodPhrase({ text }) {
  return (
    <div style={goodPhrase}>
      <span>✓</span>
      <strong>{text}</strong>
    </div>
  );
}

function MapCard({ objection, page, link }) {
  return (
    <article style={mapCard}>
      <div style={mapObjection}>{objection}</div>
      <Link to={link} style={mapLink}>
        {page}
      </Link>
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
  background: 'linear-gradient(135deg, #020617 0%, #7f1d1d 48%, #be123c 100%)',
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
  background: '#fffbeb',
  border: '1px solid #fde68a',
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

const sectionKickerDanger = {
  color: '#dc2626',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const sectionKickerSuccess = {
  color: '#16a34a',
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
  color: '#78350f',
  fontWeight: 750,
  lineHeight: 1.55,
  maxWidth: 980
};

const positionBadge = {
  background: '#0f172a',
  color: '#ffffff',
  borderRadius: 999,
  padding: '14px 18px',
  fontWeight: 1000,
  letterSpacing: '0.06em'
};

const quickAnswersGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 14
};

const quickCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 20,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)'
};

const quickLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const quickValue = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 22,
  fontWeight: 1000,
  lineHeight: 1.15
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

const qaGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: 16
};

const qaCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 22,
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)'
};

const qaQuestion = {
  margin: 0,
  color: '#0f172a',
  fontSize: 20,
  lineHeight: 1.22
};

const qaAnswer = {
  margin: '12px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.6
};

const correctBox = {
  marginTop: 14,
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#065f46',
  borderRadius: 16,
  padding: 14,
  fontWeight: 800,
  lineHeight: 1.45
};

const redFlagPanel = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const redFlagTitle = {
  margin: '8px 0 18px',
  color: '#991b1b',
  fontSize: 32,
  lineHeight: 1.12
};

const redFlagGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12
};

const badPhrase = {
  display: 'grid',
  gridTemplateColumns: '34px 1fr',
  gap: 10,
  alignItems: 'center',
  background: '#ffffff',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 18,
  padding: 16
};

const greenPanel = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const greenTitle = {
  margin: '8px 0 18px',
  color: '#166534',
  fontSize: 32,
  lineHeight: 1.12
};

const greenGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12
};

const goodPhrase = {
  display: 'grid',
  gridTemplateColumns: '34px 1fr',
  gap: 10,
  alignItems: 'center',
  background: '#ffffff',
  border: '1px solid #bbf7d0',
  color: '#166534',
  borderRadius: 18,
  padding: 16
};

const mappingGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14
};

const mapCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 18
};

const mapObjection = {
  color: '#334155',
  fontWeight: 800,
  lineHeight: 1.45,
  marginBottom: 14
};

const mapLink = {
  display: 'inline-block',
  background: '#0f172a',
  color: '#ffffff',
  borderRadius: 12,
  padding: '10px 13px',
  fontWeight: 1000,
  textDecoration: 'none'
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