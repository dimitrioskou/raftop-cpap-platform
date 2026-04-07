import React from 'react';
import OperationsWorkspaceTablePage from '../components/OperationsWorkspaceTablePage';
import { formatDateTime } from '../utils/tenantDataHelpers';
import { statusBadgeStyle } from '../utils/uiStyles';

const FALLBACK_ROWS = [
  {
    id: 'NT-1',
    title: 'Critical follow-up alert',
    category: 'clinical',
    patient_name: 'CPAP Test Patient',
    priority: 'critical',
    status: 'unread',
    created_at: '2026-04-05T08:20:00Z'
  },
  {
    id: 'NT-2',
    title: 'Offline device detected',
    category: 'device',
    patient_name: 'Μαρία Κωνσταντίνου',
    priority: 'warning',
    status: 'read',
    created_at: '2026-04-05T09:10:00Z'
  }
];

function normalizeRow(item, index) {
  return {
    id: String(item.id || `NT-${index + 1}`),
    title: item.title || item.subject || item.message || 'Notification',
    category: String(item.category || item.type || 'system').toLowerCase(),
    patientName: item.patient_name || item.patientName || item.name || '—',
    priority: String(item.priority || item.severity || 'warning').toLowerCase(),
    status: String(item.status || 'unread').toLowerCase(),
    createdAt: item.created_at || item.createdAt || item.timestamp || null
  };
}

function kindForPriority(value) {
  if (value === 'critical') return 'danger';
  if (value === 'warning') return 'warning';
  return 'info';
}

function kindForStatus(value) {
  if (value === 'read') return 'success';
  if (value === 'unread') return 'warning';
  return 'info';
}

export default function TenantNotificationsPage() {
  return (
    <OperationsWorkspaceTablePage
      title="Notifications"
      subtitle="Premium notification center for tenant operations and patient workflows."
      entityLabel="notification rows"
      endpointGroups={['/api/tenant/notifications']}
      responseKeys={['notifications']}
      fallbackRows={FALLBACK_ROWS}
      normalizeRow={normalizeRow}
      metricsBuilder={(rows) => [
        { label: 'Total Notifications', value: rows.length, tone: 'blue' },
        { label: 'Unread', value: rows.filter((r) => r.status === 'unread').length, tone: 'dark' },
        { label: 'Critical', value: rows.filter((r) => r.priority === 'critical').length, tone: 'orange' },
        { label: 'Categories', value: new Set(rows.map((r) => r.category)).size, tone: 'purple' }
      ]}
      searchPlaceholder="Search by title, patient or category..."
      getSearchText={(row) => `${row.title} ${row.patientName} ${row.category}`}
      filterLabel="Status"
      filterOptions={[
        { label: 'All statuses', value: 'all' },
        { label: 'Unread', value: 'unread' },
        { label: 'Read', value: 'read' }
      ]}
      getFilterValue={(row) => row.status}
      columns={[
        {
          label: 'Notification',
          render: (row) => (
            <div>
              <div style={{ fontWeight: 900 }}>{row.title}</div>
              <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>ID: {row.id}</div>
            </div>
          )
        },
        { label: 'Category', render: (row) => row.category },
        { label: 'Patient', render: (row) => row.patientName || '—' },
        { label: 'Priority', render: (row) => <span style={statusBadgeStyle(kindForPriority(row.priority))}>{row.priority}</span> },
        { label: 'Status', render: (row) => <span style={statusBadgeStyle(kindForStatus(row.status))}>{row.status}</span> },
        { label: 'Created', render: (row) => formatDateTime(row.createdAt) }
      ]}
    />
  );
}