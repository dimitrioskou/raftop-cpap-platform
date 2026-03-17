import React, { useMemo, useState } from 'react';

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
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 14,
  boxSizing: 'border-box'
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

function scoreColor(score) {
  if (score >= 90) return '#16a34a';
  if (score >= 80) return '#2563eb';
  if (score >= 70) return '#d97706';
  return '#dc2626';
}

function scoreBg(score) {
  if (score >= 90) return '#dcfce7';
  if (score >= 80) return '#dbeafe';
  if (score >= 70) return '#ffedd5';
  return '#fee2e2';
}

function statusPill(status) {
  const value = String(status || '').toLowerCase();

  if (value.includes('excellent')) {
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac'
    };
  }

  if (value.includes('good')) {
    return {
      background: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid #93c5fd'
    };
  }

  if (value.includes('review') || value.includes('attention')) {
    return {
      background: '#ffedd5',
      color: '#9a3412',
      border: '1px solid #fdba74'
    };
  }

  return {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db'
  };
}

export default function StaffPerformance() {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');

  const staffData = [
    {
      id: 1,
      name: 'Anna K.',
      team: 'Follow-up Team A',
      role: 'Follow-up Specialist',
      tasksCompleted: 84,
      openTasks: 11,
      overdueTasks: 2,
      outcomesLogged: 62,
      notesAdded: 55,
      callbacksScheduled: 19,
      rechecksScheduled: 18,
      workflowCompletion: 96,
      documentationScore: 94,
      timelinessScore: 91,
      repeatabilityScore: 92,
      recoveryContribution: 27,
      status: 'Excellent'
    },
    {
      id: 2,
      name: 'Nikos P.',
      team: 'Follow-up Team A',
      role: 'Patient Support Agent',
      tasksCompleted: 73,
      openTasks: 16,
      overdueTasks: 4,
      outcomesLogged: 58,
      notesAdded: 47,
      callbacksScheduled: 16,
      rechecksScheduled: 14,
      workflowCompletion: 88,
      documentationScore: 84,
      timelinessScore: 85,
      repeatabilityScore: 87,
      recoveryContribution: 22,
      status: 'Good'
    },
    {
      id: 3,
      name: 'Maria T.',
      team: 'Follow-up Team B',
      role: 'Follow-up Specialist',
      tasksCompleted: 65,
      openTasks: 22,
      overdueTasks: 7,
      outcomesLogged: 49,
      notesAdded: 45,
      callbacksScheduled: 12,
      rechecksScheduled: 12,
      workflowCompletion: 76,
      documentationScore: 79,
      timelinessScore: 74,
      repeatabilityScore: 78,
      recoveryContribution: 15,
      status: 'Needs Review'
    },
    {
      id: 4,
      name: 'Eleni S.',
      team: 'Follow-up Team B',
      role: 'Senior Coordinator',
      tasksCompleted: 91,
      openTasks: 8,
      overdueTasks: 1,
      outcomesLogged: 69,
      notesAdded: 61,
      callbacksScheduled: 24,
      rechecksScheduled: 21,
      workflowCompletion: 98,
      documentationScore: 96,
      timelinessScore: 95,
      repeatabilityScore: 95,
      recoveryContribution: 31,
      status: 'Excellent'
    },
    {
      id: 5,
      name: 'Giorgos M.',
      team: 'Device Support Team',
      role: 'Device Support Agent',
      tasksCompleted: 58,
      openTasks: 19,
      overdueTasks: 5,
      outcomesLogged: 34,
      notesAdded: 39,
      callbacksScheduled: 9,
      rechecksScheduled: 8,
      workflowCompletion: 80,
      documentationScore: 82,
      timelinessScore: 77,
      repeatabilityScore: 79,
      recoveryContribution: 11,
      status: 'Good'
    }
  ];

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();

    return staffData.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.team.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q);

      const matchesTeam =
        teamFilter === 'all' ||
        item.team.toLowerCase() === teamFilter.toLowerCase();

      return matchesSearch && matchesTeam;
    });
  }, [search, teamFilter]);

  const summary = useMemo(() => {
    const total = filteredStaff.length || 1;

    const avgRepeatability = Math.round(
      filteredStaff.reduce((sum, item) => sum + item.repeatabilityScore, 0) / total
    );

    const avgWorkflow = Math.round(
      filteredStaff.reduce((sum, item) => sum + item.workflowCompletion, 0) / total
    );

    const avgTimeliness = Math.round(
      filteredStaff.reduce((sum, item) => sum + item.timelinessScore, 0) / total
    );

    const totalCompleted = filteredStaff.reduce((sum, item) => sum + item.tasksCompleted, 0);
    const totalOpen = filteredStaff.reduce((sum, item) => sum + item.openTasks, 0);
    const totalOverdue = filteredStaff.reduce((sum, item) => sum + item.overdueTasks, 0);

    return {
      staffCount: filteredStaff.length,
      avgRepeatability,
      avgWorkflow,
      avgTimeliness,
      totalCompleted,
      totalOpen,
      totalOverdue
    };
  }, [filteredStaff]);

  const rankedStaff = useMemo(() => {
    return [...filteredStaff].sort(
      (a, b) => b.repeatabilityScore - a.repeatabilityScore
    );
  }, [filteredStaff]);

  const topPerformer = rankedStaff[0];
  const needsAttention = [...filteredStaff].sort(
    (a, b) => a.repeatabilityScore - b.repeatabilityScore
  )[0];

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Staff Performance Center</h1>
        <p style={{ color: '#4b5563', margin: 0 }}>
          Παρακολούθηση απόδοσης υπαλλήλων, ποιότητας workflow, συνέπειας και repeatability.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            Staff in View
          </div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{summary.staffCount}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            Avg Repeatability
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: scoreColor(summary.avgRepeatability) }}>
            {summary.avgRepeatability}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            Avg Workflow Completion
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#2563eb' }}>
            {summary.avgWorkflow}%
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            Avg Timeliness
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#7c3aed' }}>
            {summary.avgTimeliness}%
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            Tasks Completed
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#16a34a' }}>
            {summary.totalCompleted}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            Overdue Tasks
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#dc2626' }}>
            {summary.totalOverdue}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 24
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            Team Filters
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14
            }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={inputStyle}
                placeholder="staff / team / role"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Team
              </label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="all">all</option>
                <option value="follow-up team a">Follow-up Team A</option>
                <option value="follow-up team b">Follow-up Team B</option>
                <option value="device support team">Device Support Team</option>
              </select>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            Management Insights
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: '#ecfdf5'
              }}
            >
              <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                Top Performer
              </div>
              <div style={{ color: '#111827' }}>
                {topPerformer ? `${topPerformer.name} — Repeatability ${topPerformer.repeatabilityScore}/100` : '-'}
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: '#fff7ed'
              }}
            >
              <div style={{ fontWeight: 700, color: '#9a3412', marginBottom: 4 }}>
                Needs Attention
              </div>
              <div style={{ color: '#111827' }}>
                {needsAttention ? `${needsAttention.name} — Repeatability ${needsAttention.repeatabilityScore}/100` : '-'}
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: '#eff6ff'
              }}
            >
              <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>
                Key Message
              </div>
              <div style={{ color: '#111827' }}>
                Η διοίκηση μπορεί να αξιολογεί όχι μόνο την παραγωγικότητα, αλλά και τη συνέπεια στην εκτέλεση του workflow.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 14 }}>
          Staff Leaderboard
        </div>

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Staff</th>
                <th style={thStyle}>Team</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Tasks Completed</th>
                <th style={thStyle}>Open Tasks</th>
                <th style={thStyle}>Overdue</th>
                <th style={thStyle}>Outcomes</th>
                <th style={thStyle}>Notes</th>
                <th style={thStyle}>Rechecks</th>
                <th style={thStyle}>Repeatability</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rankedStaff.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}><strong>{item.name}</strong></td>
                  <td style={tdStyle}>{item.team}</td>
                  <td style={tdStyle}>{item.role}</td>
                  <td style={tdStyle}>{item.tasksCompleted}</td>
                  <td style={tdStyle}>{item.openTasks}</td>
                  <td style={tdStyle}>{item.overdueTasks}</td>
                  <td style={tdStyle}>{item.outcomesLogged}</td>
                  <td style={tdStyle}>{item.notesAdded}</td>
                  <td style={tdStyle}>{item.rechecksScheduled}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-flex',
                        minWidth: 56,
                        justifyContent: 'center',
                        padding: '6px 10px',
                        borderRadius: 999,
                        fontWeight: 800,
                        color: scoreColor(item.repeatabilityScore),
                        background: scoreBg(item.repeatabilityScore)
                      }}
                    >
                      {item.repeatabilityScore}
                    </span>
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
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16
        }}
      >
        {filteredStaff.map((item) => (
          <div key={item.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{item.name}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{item.role}</div>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 30,
                  padding: '0 10px',
                  borderRadius: 999,
                  fontWeight: 800,
                  color: scoreColor(item.repeatabilityScore),
                  background: scoreBg(item.repeatabilityScore)
                }}
              >
                {item.repeatabilityScore}
              </div>
            </div>

            <div style={{ color: '#4b5563', marginBottom: 12 }}>{item.team}</div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Workflow Completion</div>
                <div style={{ fontWeight: 700 }}>{item.workflowCompletion}%</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Documentation Score</div>
                <div style={{ fontWeight: 700 }}>{item.documentationScore}%</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Timeliness Score</div>
                <div style={{ fontWeight: 700 }}>{item.timelinessScore}%</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Recovery Contribution</div>
                <div style={{ fontWeight: 700 }}>{item.recoveryContribution} cases</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Manager View</div>
                <div style={{ color: '#374151' }}>
                  {item.repeatabilityScore >= 90
                    ? 'Very strong execution consistency and high-quality case handling.'
                    : item.repeatabilityScore >= 80
                    ? 'Stable operational performance with room for small improvements.'
                    : 'Needs closer coaching for workflow consistency and callback discipline.'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          ...cardStyle
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
          What the Repeatability Score Means
        </div>
        <div style={{ color: '#374151' }}>
          Το Repeatability Score δείχνει πόσο σταθερά ακολουθεί ένας υπάλληλος το σωστό operational flow:
          δημιουργία task, προσθήκη note, καταγραφή outcome, σωστό callback handling, recheck scheduling
          και συνολικά συνέπεια στην εκτέλεση. Είναι ιδανικό metric για τον ιδιοκτήτη που θέλει να
          βλέπει και αποτέλεσμα και πειθαρχία διαδικασίας.
        </div>
      </div>
    </div>
  );
}