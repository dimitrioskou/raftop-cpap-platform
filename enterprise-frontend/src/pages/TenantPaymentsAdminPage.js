import React from 'react';
import OperationsWorkspaceTablePage from '../components/OperationsWorkspaceTablePage';
import { formatDateTime } from '../utils/tenantDataHelpers';
import { statusBadgeStyle } from '../utils/uiStyles';

function formatCurrency(value) {
  const num = Number(value || 0);
  return `€${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeRow(item, index) {
  return {
    id: String(item.id || `txn-${index + 1}`),
    reference: item.reference || `REF-${index + 1}`,
    doctorName: item.doctor_name || '—',
    planLabel: item.plan_label || '—',
    amount: Number(item.amount || 0),
    currency: item.currency || 'EUR',
    status: String(item.status || 'pending').toLowerCase(),
    createdAt: item.created_at || null
  };
}

function kindForStatus(value) {
  if (value === 'paid') return 'success';
  if (value === 'pending') return 'warning';
  return 'info';
}

export default function TenantPaymentsAdminPage() {
  return (
    <OperationsWorkspaceTablePage
      title="Payments Admin"
      subtitle="Premium transaction workspace for subscription payment oversight."
      entityLabel="payment transaction rows"
      endpointGroups={['/api/tenant/payments']}
      responseKeys={['transactions']}
      fallbackRows={[]}
      normalizeRow={normalizeRow}
      metricsBuilder={(rows) => [
        { label: 'Transactions', value: rows.length, tone: 'blue' },
        { label: 'Paid', value: rows.filter((r) => r.status === 'paid').length, tone: 'green' },
        { label: 'Pending', value: rows.filter((r) => r.status === 'pending').length, tone: 'orange' },
        {
          label: 'Collected',
          value: formatCurrency(rows.filter((r) => r.status === 'paid').reduce((sum, row) => sum + Number(row.amount || 0), 0)),
          tone: 'purple'
        }
      ]}
      searchPlaceholder="Search by reference, doctor or plan..."
      getSearchText={(row) => `${row.reference} ${row.doctorName} ${row.planLabel}`}
      filterLabel="Status"
      filterOptions={[
        { label: 'All statuses', value: 'all' },
        { label: 'Paid', value: 'paid' },
        { label: 'Pending', value: 'pending' }
      ]}
      getFilterValue={(row) => row.status}
      columns={[
        {
          label: 'Reference',
          render: (row) => (
            <div>
              <div style={{ fontWeight: 900 }}>{row.reference}</div>
              <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>ID: {row.id}</div>
            </div>
          )
        },
        { label: 'Doctor', render: (row) => row.doctorName || '—' },
        { label: 'Plan', render: (row) => row.planLabel || '—' },
        { label: 'Amount', render: (row) => `${formatCurrency(row.amount)} ${row.currency}` },
        { label: 'Status', render: (row) => <span style={statusBadgeStyle(kindForStatus(row.status))}>{row.status}</span> },
        { label: 'Created', render: (row) => formatDateTime(row.createdAt) }
      ]}
    />
  );
}