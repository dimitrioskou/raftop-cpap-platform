import React from 'react';
import OperationsWorkspaceTablePage from '../components/OperationsWorkspaceTablePage';
import { formatDateTime } from '../utils/tenantDataHelpers';
import { statusBadgeStyle } from '../utils/uiStyles';

const FALLBACK_ROWS = [
  {
    id: 'REF-1',
    title: 'Sleep study referral',
    patient_name: 'CPAP Test Patient',
    doctor_name: 'Doctor #1',
    source: 'Pulmonology',
    status: 'new',
    created_at: '2026-04-05T09:25:00Z'
  },
  {
    id: 'REF-2',
    title: 'CPAP review referral',
    patient_name: 'Μαρία Κωνσταντίνου',
    doctor_name: 'Doctor #3',
    source: 'Cardiology',
    status: 'in_progress',
    created_at: '2026-04-04T13:15:00Z'
  }
];

function normalizeRow(item, index) {
  return {
    id: String(item.id || `REF-${index + 1}`),
    title: item.title || item.referral_title || item.referralTitle || 'Referral',
    patientName: item.patient_name || item.patientName || item.name || '—',
    doctorName: item.doctor_name || item.doctorName || '—',
    source: item.source || item.department || item.referral_source || 'General',
    status: String(item.status || 'new').toLowerCase(),
    createdAt: item.created_at || item.createdAt || item.timestamp || null
  };
}

function kindForStatus(value) {
  if (value === 'completed') return 'success';
  if (value === 'new' || value === 'in_progress') return 'warning';
  return 'info';
}

export default function TenantReferralsPage() {
  return (
    <OperationsWorkspaceTablePage
      title="Referrals"
      subtitle="Premium referral intake workspace for clinical pipeline visibility."
      entityLabel="referral rows"
      endpointGroups={['/api/tenant/referrals']}
      responseKeys={['referrals']}
      fallbackRows={FALLBACK_ROWS}
      normalizeRow={normalizeRow}
      metricsBuilder={(rows) => [
        { label: 'Total Referrals', value: rows.length, tone: 'blue' },
        { label: 'New', value: rows.filter((r) => r.status === 'new').length, tone: 'orange' },
        { label: 'In Progress', value: rows.filter((r) => r.status === 'in_progress').length, tone: 'purple' },
        { label: 'Completed', value: rows.filter((r) => r.status === 'completed').length, tone: 'green' }
      ]}
      searchPlaceholder="Search by title, patient, doctor or source..."
      getSearchText={(row) => `${row.title} ${row.patientName} ${row.doctorName} ${row.source}`}
      filterLabel="Status"
      filterOptions={[
        { label: 'All statuses', value: 'all' },
        { label: 'New', value: 'new' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' }
      ]}
      getFilterValue={(row) => row.status}
      columns={[
        {
          label: 'Referral',
          render: (row) => (
            <div>
              <div style={{ fontWeight: 900 }}>{row.title}</div>
              <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>ID: {row.id}</div>
            </div>
          )
        },
        { label: 'Patient', render: (row) => row.patientName || '—' },
        { label: 'Doctor', render: (row) => row.doctorName || '—' },
        { label: 'Source', render: (row) => row.source },
        { label: 'Status', render: (row) => <span style={statusBadgeStyle(kindForStatus(row.status))}>{row.status}</span> },
        { label: 'Created', render: (row) => formatDateTime(row.createdAt) }
      ]}
    />
  );
}