import React from 'react';
import AtlasWorkspaceTablePage from '../components/AtlasWorkspaceTablePage';
import { statusBadgeStyle } from '../utils/uiStyles';
import { formatDateTime } from '../utils/tenantDataHelpers';

const FALLBACK_ROWS = [
  {
    id: 'atlas-alert-1',
    alert_name: 'Critical CPAP compliance drop',
    patient_name: 'CPAP Test Patient',
    doctor_name: 'Doctor #1',
    severity: 'critical',
    status: 'open',
    created_at: '2026-04-05T07:30:00Z'
  },
  {
    id: 'atlas-alert-2',
    alert_name: 'CPAP usage below target',
    patient_name: 'Μαρία Κωνσταντίνου',
    doctor_name: 'Doctor #3',
    severity: 'warning',
    status: 'open',
    created_at: '2026-04-05T08:40:00Z'
  }
];

function normalizeRow(item, index) {
  return {
    id: String(item.id || `atlas-alert-${index + 1}`),
    alertName: item.alert_name || item.alertName || 'ATLAS Alert',
    patientName: item.patient_name || item.patientName || item.name || `Patient ${index + 1}`,
    doctorName: item.doctor_name || item.doctorName || '—',
    severity: String(item.severity || 'warning').toLowerCase(),
    status: String(item.status || 'open').toLowerCase(),
    createdAt: item.created_at || item.createdAt || null
  };
}

function kindForSeverity(value) {
  return value === 'critical' ? 'danger' : 'warning';
}

function kindForStatus(value) {
  return value === 'open' ? 'warning' : 'success';
}

export default function TenantAtlasAlertsPage() {
  return (
    <AtlasWorkspaceTablePage
      title="ATLAS Alerts"
      subtitle="Premium alert board for ATLAS-triggered issues."
      entityLabel="ATLAS alert rows"
      endpointGroups={['/api/tenant/atlas/alerts']}
      responseKeys={['alerts']}
      fallbackRows={FALLBACK_ROWS}
      normalizeRow={normalizeRow}
      metricsBuilder={(rows) => [
        { label: 'Total Alerts', value: rows.length, tone: 'purple' },
        { label: 'Critical', value: rows.filter((r) => r.severity === 'critical').length, tone: 'dark' },
        { label: 'Warning', value: rows.filter((r) => r.severity === 'warning').length, tone: 'orange' },
        { label: 'Open', value: rows.filter((r) => r.status === 'open').length, tone: 'blue' }
      ]}
      searchPlaceholder="Search by alert, patient or doctor..."
      getSearchText={(row) => `${row.alertName} ${row.patientName} ${row.doctorName}`}
      filterLabel="Severity"
      filterOptions={[
        { label: 'All severities', value: 'all' },
        { label: 'Critical', value: 'critical' },
        { label: 'Warning', value: 'warning' }
      ]}
      getFilterValue={(row) => row.severity}
      columns={[
        {
          label: 'Alert',
          render: (row) => (
            <div>
              <div style={{ fontWeight: 900 }}>{row.alertName}</div>
              <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>ID: {row.id}</div>
            </div>
          )
        },
        { label: 'Patient', render: (row) => row.patientName },
        { label: 'Doctor', render: (row) => row.doctorName || '—' },
        { label: 'Severity', render: (row) => <span style={statusBadgeStyle(kindForSeverity(row.severity))}>{row.severity}</span> },
        { label: 'Status', render: (row) => <span style={statusBadgeStyle(kindForStatus(row.status))}>{row.status}</span> },
        { label: 'Created', render: (row) => formatDateTime(row.createdAt) }
      ]}
    />
  );
}