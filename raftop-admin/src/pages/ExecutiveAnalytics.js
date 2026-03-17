import React, { useMemo } from 'react';

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

const sectionTitleStyle = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 14,
  color: '#111827'
};

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  color: '#374151'
};

const tableWrapStyle = {
  overflowX: 'auto'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};

const thStyle = {
  textAlign: 'left',
  padding: '12px 10px',
  borderBottom: '1px solid #e5e7eb',
  fontSize: 13,
  color: '#6b7280',
  fontWeight: 700,
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '12px 10px',
  borderBottom: '1px solid #f3f4f6',
  fontSize: 14,
  color: '#111827',
  verticalAlign: 'top'
};

function kpiColor(type) {
  if (type === 'critical') return '#dc2626';
  if (type === 'warning') return '#ea580c';
  if (type === 'success') return '#16a34a';
  if (type === 'info') return '#2563eb';
  if (type === 'purple') return '#7c3aed';
  return '#111827';
}

function smallTrend(isPositive) {
  return {
    color: isPositive ? '#16a34a' : '#dc2626',
    fontWeight: 700,
    fontSize: 13
  };
}

function statusPill(label) {
  const value = String(label || '').toLowerCase();

  if (value.includes('critical')) {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    };
  }

  if (value.includes('warning') || value.includes('risk')) {
    return {
      background: '#ffedd5',
      color: '#9a3412',
      border: '1px solid #fdba74'
    };
  }

  if (value.includes('good') || value.includes('recovered') || value.includes('ok') || value.includes('excellent')) {
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac'
    };
  }

  return {
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe'
  };
}

export default function ExecutiveAnalytics() {
  const topKpis = [
    {
      title: 'Total Patients',
      value: 7000,
      trend: '+4.8% vs last month',
      trendUp: true,
      color: 'info'
    },
    {
      title: 'Critical Cases',
      value: 312,
      trend: '-7.2% vs last week',
      trendUp: true,
      color: 'critical'
    },
    {
      title: 'Warning Cases',
      value: 824,
      trend: '-2.4% vs last week',
      trendUp: true,
      color: 'warning'
    },
    {
      title: 'Recovered Patients',
      value: 1840,
      trend: '+9.1% vs last month',
      trendUp: true,
      color: 'success'
    },
    {
      title: 'Open Follow-up Tasks',
      value: 426,
      trend: '+3.5% vs yesterday',
      trendUp: false,
      color: 'purple'
    },
    {
      title: 'Callback Requests',
      value: 158,
      trend: '+11.0% vs yesterday',
      trendUp: false,
      color: 'info'
    }
  ];

  const complianceData = [
    { label: 'Critical', value: 312, percentage: '4.5%' },
    { label: 'Warning', value: 824, percentage: '11.8%' },
    { label: 'OK', value: 5864, percentage: '83.7%' },
    { label: 'Average Usage', value: '76h', percentage: 'monthly average' }
  ];

  const recoveryFunnel = [
    { stage: 'Identified', count: 1136 },
    { stage: 'Contacted', count: 902 },
    { stage: 'Improving', count: 441 },
    { stage: 'Recovered', count: 184 }
  ];

  const brandStats = [
    {
      brand: 'ResMed',
      patients: 3420,
      avgUsage: '79h',
      critical: 118,
      warning: 362,
      recoveryRate: '31%'
    },
    {
      brand: 'SEFAM',
      patients: 1675,
      avgUsage: '74h',
      critical: 86,
      warning: 229,
      recoveryRate: '24%'
    },
    {
      brand: 'BMC',
      patients: 1905,
      avgUsage: '72h',
      critical: 108,
      warning: 233,
      recoveryRate: '22%'
    }
  ];

  const staffStats = [
    {
      name: 'Anna K.',
      completedTasks: 84,
      openTasks: 11,
      outcomesLogged: 62,
      notesAdded: 55,
      rechecksScheduled: 18,
      repeatabilityScore: 92,
      status: 'Excellent'
    },
    {
      name: 'Nikos P.',
      completedTasks: 73,
      openTasks: 16,
      outcomesLogged: 58,
      notesAdded: 47,
      rechecksScheduled: 14,
      repeatabilityScore: 87,
      status: 'Good'
    },
    {
      name: 'Maria T.',
      completedTasks: 65,
      openTasks: 22,
      outcomesLogged: 49,
      notesAdded: 45,
      rechecksScheduled: 12,
      repeatabilityScore: 78,
      status: 'Needs Review'
    },
    {
      name: 'Eleni S.',
      completedTasks: 91,
      openTasks: 8,
      outcomesLogged: 69,
      notesAdded: 61,
      rechecksScheduled: 21,
      repeatabilityScore: 95,
      status: 'Excellent'
    }
  ];

  const operationalStats = [
    {
      title: 'Tasks Closed Today',
      value: 97,
      color: 'success'
    },
    {
      title: 'Overdue Tasks',
      value: 38,
      color: 'critical'
    },
    {
      title: 'No Answer Outcomes',
      value: 44,
      color: 'warning'
    },
    {
      title: 'Rechecks Scheduled',
      value: 27,
      color: 'purple'
    }
  ];

  const executiveHighlights = useMemo(() => {
    return [
      'Η συμμόρφωση παραμένει υψηλή στο μεγαλύτερο μέρος του στόλου ασθενών, αλλά υπάρχει σαφές cluster warning περιστατικών που θέλει έγκαιρο follow-up.',
      'Η ResMed κατηγορία εμφανίζει την υψηλότερη μέση χρήση και καλύτερο recovery rate στο demo analytics layer.',
      'Η ομάδα follow-up δείχνει καλή παραγωγικότητα, αλλά υπάρχει διαφορά repeatability score μεταξύ των υπαλλήλων, κάτι που ο ιδιοκτήτης μπορεί να χρησιμοποιήσει για coaching και standardization.',
      'Τα callback requests και τα open tasks πρέπει να παρακολουθούνται καθημερινά γιατί επηρεάζουν άμεσα την operational πειθαρχία.'
    ];
  }, []);

  const ownerSummary = {
    mainInsight: 'Το σύστημα δείχνει ότι η μεγαλύτερη επιχειρησιακή ευκαιρία είναι η μετατροπή των warning περιστατικών σε improving πριν περάσουν σε critical κατάσταση.',
    mainRisk: 'Ο όγκος open tasks και callback requests μπορεί να δημιουργήσει καθυστέρηση στην παρέμβαση αν δεν διατηρηθεί υψηλή πειθαρχία ομάδας.',
    mainOpportunity: 'Η ResMed κατηγορία και οι top-performing agents δείχνουν ότι υπάρχουν ήδη patterns επιτυχίας που μπορούν να γίνουν standard workflow.',
    managementAction: 'Προτεραιότητα σε warning-to-contact workflow, καθημερινό έλεγχο overdue callbacks και coaching στους agents με χαμηλότερο repeatability score.'
  };

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Executive Analytics Center</h1>
        <p style={{ color: '#4b5563', margin: 0 }}>
          Διοικητική εικόνα για ασθενείς, συμμόρφωση, follow-up απόδοση, brands και staff repeatability.
        </p>
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: 24,
          background: 'linear-gradient(135deg, #111827 0%, #1d4ed8 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 10px 30px rgba(17,24,39,0.18)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 16
          }}
        >
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
              Owner Summary
            </div>
            <div style={{ color: '#dbeafe' }}>
              Daily executive interpretation for RAFTOPOULOS leadership
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.15)',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            Demo owner layer
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 14,
              padding: 14
            }}
          >
            <div style={{ fontSize: 12, color: '#bfdbfe', marginBottom: 8 }}>Main Insight</div>
            <div style={{ fontWeight: 700 }}>{ownerSummary.mainInsight}</div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 14,
              padding: 14
            }}
          >
            <div style={{ fontSize: 12, color: '#bfdbfe', marginBottom: 8 }}>Main Risk</div>
            <div style={{ fontWeight: 700 }}>{ownerSummary.mainRisk}</div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 14,
              padding: 14
            }}
          >
            <div style={{ fontSize: 12, color: '#bfdbfe', marginBottom: 8 }}>Main Opportunity</div>
            <div style={{ fontWeight: 700 }}>{ownerSummary.mainOpportunity}</div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 14,
              padding: 14
            }}
          >
            <div style={{ fontSize: 12, color: '#bfdbfe', marginBottom: 8 }}>Management Action</div>
            <div style={{ fontWeight: 700 }}>{ownerSummary.managementAction}</div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >
        {topKpis.map((item) => (
          <div key={item.title} style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
              {item.title}
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: kpiColor(item.color),
                marginBottom: 8
              }}
            >
              {item.value}
            </div>
            <div style={smallTrend(item.trendUp)}>{item.trend}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: 16,
          marginBottom: 24
        }}
      >
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Executive Interpretation</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {executiveHighlights.map((item, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 14,
                  background: '#fafafa'
                }}
              >
                <div style={{ color: '#374151' }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Operational Snapshot</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {operationalStats.map((item) => (
              <div
                key={item.title}
                style={{
                  border: '1px solid #f3f4f6',
                  borderRadius: 12,
                  padding: 14
                }}
              >
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: kpiColor(item.color)
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Compliance Snapshot</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {complianceData.map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #f3f4f6',
                  paddingBottom: 10
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{item.percentage}</div>
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color:
                      item.label === 'Critical'
                        ? '#dc2626'
                        : item.label === 'Warning'
                        ? '#ea580c'
                        : item.label === 'OK'
                        ? '#16a34a'
                        : '#2563eb'
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Recovery Funnel</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {recoveryFunnel.map((item) => (
              <div
                key={item.stage}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontWeight: 700 }}>{item.stage}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Management Notes</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 12, background: '#eff6ff' }}>
              <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>
                Main Priority
              </div>
              <div style={{ color: '#1f2937' }}>
                Μείωση των critical περιστατικών με πιο γρήγορο πρώτο contact.
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: 12, background: '#fff7ed' }}>
              <div style={{ fontWeight: 700, color: '#9a3412', marginBottom: 4 }}>
                Team Focus
              </div>
              <div style={{ color: '#1f2937' }}>
                Βελτίωση repeatability στα follow-up flows και συνέπεια στα callbacks.
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: 12, background: '#ecfdf5' }}>
              <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                Positive Signal
              </div>
              <div style={{ color: '#1f2937' }}>
                Η recovery pipeline δείχνει ότι το intervention model μπορεί να φέρει measurable βελτίωση.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={sectionTitleStyle}>Brand Performance Overview</div>
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Brand</th>
                <th style={thStyle}>Patients</th>
                <th style={thStyle}>Avg Usage</th>
                <th style={thStyle}>Critical</th>
                <th style={thStyle}>Warning</th>
                <th style={thStyle}>Recovery Rate</th>
              </tr>
            </thead>
            <tbody>
              {brandStats.map((item) => (
                <tr key={item.brand}>
                  <td style={tdStyle}><strong>{item.brand}</strong></td>
                  <td style={tdStyle}>{item.patients}</td>
                  <td style={tdStyle}>{item.avgUsage}</td>
                  <td style={tdStyle}>{item.critical}</td>
                  <td style={tdStyle}>{item.warning}</td>
                  <td style={tdStyle}>{item.recoveryRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 14
          }}
        >
          <div style={sectionTitleStyle}>Staff Performance & Repeatability</div>
          <div style={badgeStyle}>Demo analytics layer</div>
        </div>

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Staff</th>
                <th style={thStyle}>Tasks Completed</th>
                <th style={thStyle}>Open Tasks</th>
                <th style={thStyle}>Outcomes Logged</th>
                <th style={thStyle}>Notes Added</th>
                <th style={thStyle}>Rechecks</th>
                <th style={thStyle}>Repeatability Score</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {staffStats.map((item) => (
                <tr key={item.name}>
                  <td style={tdStyle}><strong>{item.name}</strong></td>
                  <td style={tdStyle}>{item.completedTasks}</td>
                  <td style={tdStyle}>{item.openTasks}</td>
                  <td style={tdStyle}>{item.outcomesLogged}</td>
                  <td style={tdStyle}>{item.notesAdded}</td>
                  <td style={tdStyle}>{item.rechecksScheduled}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 800, color: '#111827' }}>
                      {item.repeatabilityScore}/100
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        ...statusPill(item.status)
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 12,
            background: '#f9fafb',
            color: '#374151'
          }}
        >
          <strong>Τι σημαίνει το Repeatability Score:</strong> δείχνει πόσο σταθερά και σωστά
          ακολουθεί κάθε υπάλληλος το operational workflow, πόσο συνεπής είναι στα follow-up βήματα,
          πόσο πλήρως καταγράφει notes/outcomes και αν φέρνει επαναλαμβανόμενα αποτελέσματα.
        </div>
      </div>
    </div>
  );
}