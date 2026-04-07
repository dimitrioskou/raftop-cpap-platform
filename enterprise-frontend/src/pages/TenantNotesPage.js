import React from 'react';
import OperationsWorkspaceTablePage from '../components/OperationsWorkspaceTablePage';
import { formatDateTime } from '../utils/tenantDataHelpers';
import { statusBadgeStyle } from '../utils/uiStyles';

const FALLBACK_ROWS = [
  {
    id: 'NOTE-1',
    title: 'Patient requested mask adjustment',
    patient_name: 'Γεώργιος Παπαδόπουλος',
    author: 'Atlas Team',
    note_type: 'clinical',
    status: 'open',
    created_at: '2026-04-05T10:00:00Z'
  },
  {
    id: 'NOTE-2',
    title: 'Follow-up callback completed',
    patient_name: 'Μαρία Κωνσταντίνου',
    author: 'Support Desk',
    note_type: 'operational',
    status: 'closed',
    created_at: '2026-04-04T16:40:00Z'
  }
];

function normalizeRow(item, index) {
  return {
    id: String(item.id || `NOTE-${index + 1}`),
    title: item.title || item.note || item.message || 'Note',
    patientName: item.patient_name || item.patientName || item.name || '—',
    author: item.author || item.created_by || item.createdBy || 'Team',
    noteType: String(item.note_type || item.type || 'general').toLowerCase(),
    status: String(item.status || 'open').toLowerCase(),
    createdAt: item.created_at || item.createdAt || item.timestamp || null
  };
}

function kindForType(value) {
  if (value === 'clinical') return 'info';
  if (value === 'operational') return 'warning';
  return 'success';
}

function kindForStatus(value) {
  if (value === 'closed') return 'success';
  if (value === 'open') return 'warning';
  return 'info';
}

export default function TenantNotesPage() {
  return (
    <OperationsWorkspaceTablePage
      title="Notes"
      subtitle="Premium notes workspace for clinical and operational entries."
      entityLabel="note rows"
      endpointGroups={['/api/tenant/notes']}
      responseKeys={['notes']}
      fallbackRows={FALLBACK_ROWS}
      normalizeRow={normalizeRow}
      metricsBuilder={(rows) => [
        { label: 'Total Notes', value: rows.length, tone: 'blue' },
        { label: 'Open', value: rows.filter((r) => r.status === 'open').length, tone: 'orange' },
        { label: 'Closed', value: rows.filter((r) => r.status === 'closed').length, tone: 'green' },
        { label: 'Authors', value: new Set(rows.map((r) => r.author)).size, tone: 'purple' }
      ]}
      searchPlaceholder="Search by title, patient or author..."
      getSearchText={(row) => `${row.title} ${row.patientName} ${row.author} ${row.noteType}`}
      filterLabel="Status"
      filterOptions={[
        { label: 'All statuses', value: 'all' },
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' }
      ]}
      getFilterValue={(row) => row.status}
      columns={[
        {
          label: 'Note',
          render: (row) => (
            <div>
              <div style={{ fontWeight: 900 }}>{row.title}</div>
              <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>ID: {row.id}</div>
            </div>
          )
        },
        { label: 'Patient', render: (row) => row.patientName || '—' },
        { label: 'Author', render: (row) => row.author },
        { label: 'Type', render: (row) => <span style={statusBadgeStyle(kindForType(row.noteType))}>{row.noteType}</span> },
        { label: 'Status', render: (row) => <span style={statusBadgeStyle(kindForStatus(row.status))}>{row.status}</span> },
        { label: 'Created', render: (row) => formatDateTime(row.createdAt) }
      ]}
    />
  );
}