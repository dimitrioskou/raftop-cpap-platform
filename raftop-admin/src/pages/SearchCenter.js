import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const pageStyle = {
  padding: 24
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 14,
  boxSizing: 'border-box'
};

const linkCardStyle = {
  display: 'block',
  textDecoration: 'none',
  color: '#111827',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 16,
  background: '#ffffff'
};

const modules = [
  {
    title: 'Patients',
    path: '/patients',
    keywords: ['patients', 'patient', 'ασθενείς', 'ασθενής', 'patient records'],
    description: 'Αναζήτηση και διαχείριση patient records.'
  },
  {
    title: 'Devices',
    path: '/devices',
    keywords: ['devices', 'device', 'cpap', 'συσκευές', 'συσκευή', 'resmed', 'philips'],
    description: 'Παρακολούθηση CPAP devices και αναθέσεων.'
  },
  {
    title: 'Tasks',
    path: '/tasks',
    keywords: ['tasks', 'task', 'δουλειές', 'εργασίες', 'follow-up tasks', 'recheck'],
    description: 'Operational tasks, follow-up actions και reminders.'
  },
  {
    title: 'Notes',
    path: '/notes',
    keywords: ['notes', 'note', 'σημειώσεις', 'σημείωση'],
    description: 'Εσωτερικές σημειώσεις και patient comments.'
  },
  {
    title: 'Referrals',
    path: '/referrals',
    keywords: ['referrals', 'referral', 'παραπομπές', 'παραπομπή', 'doctor'],
    description: 'Παραπομπές από ιατρούς, κλινικές και συνεργάτες.'
  },
  {
    title: 'Compliance',
    path: '/compliance',
    keywords: ['compliance', '80h', 'hours', 'ώρες', 'adherence'],
    description: '80h compliance monitoring και usage analysis.'
  },
  {
    title: 'Follow-up Center',
    path: '/followup',
    keywords: ['follow-up', 'followup', 'calls', 'patients below 80', 'επικοινωνία'],
    description: 'Διαχείριση follow-up ασθενών κάτω από 80 ώρες.'
  },
  {
    title: 'Follow-up Outcomes',
    path: '/followup-outcomes',
    keywords: ['outcomes', 'outcome', 'results', 'αποτελέσματα', 'callback'],
    description: 'Αποτελέσματα επικοινωνίας και patient responses.'
  },
  {
    title: 'Priority Queue',
    path: '/priority-queue',
    keywords: ['priority', 'queue', 'critical', 'urgent', 'προτεραιότητα'],
    description: 'Λίστα προτεραιότητας για άμεσες follow-up ενέργειες.'
  },
  {
    title: 'Daily Action Board',
    path: '/daily-board',
    keywords: ['daily', 'board', 'action board', 'today', 'ημερήσιο'],
    description: 'Ημερήσιος operational πίνακας ενεργειών.'
  },
  {
    title: 'Recheck Scheduler',
    path: '/recheck-scheduler',
    keywords: ['recheck', 'scheduler', 'schedule', 'ραντεβού', 'επανέλεγχος'],
    description: 'Προγραμματισμός recheck tasks και callback actions.'
  },
  {
    title: 'Recovery Funnel',
    path: '/recovery-funnel',
    keywords: ['recovery', 'funnel', 'improving', 'recovered', 'βελτίωση'],
    description: 'Παρακολούθηση recovery πορείας ασθενών.'
  },
  {
    title: 'Activity',
    path: '/activity',
    keywords: ['activity', 'logs', 'history', 'ιστορικό'],
    description: 'Πρόσφατες ενέργειες και system activity.'
  },
  {
    title: 'Settings',
    path: '/settings',
    keywords: ['settings', 'config', 'ρυθμίσεις'],
    description: 'Ρυθμίσεις εφαρμογής και follow-up defaults.'
  }
];

export default function SearchCenter() {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return modules;

    return modules.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((keyword) => keyword.toLowerCase().includes(q))
      );
    });
  }, [query]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Search Center</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Γρήγορη πλοήγηση σε όλα τα βασικά modules του RAFTOP Admin.
      </p>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
          Search module
        </label>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={inputStyle}
          placeholder="patients / devices / follow-up / recheck / referrals..."
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16
        }}
      >
        {results.length === 0 ? (
          <div style={cardStyle}>No modules found.</div>
        ) : (
          results.map((item) => (
            <Link key={item.path} to={item.path} style={linkCardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ color: '#4b5563', margin: 0 }}>{item.description}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}