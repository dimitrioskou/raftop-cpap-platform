import React from 'react';
import OperationsWorkspaceTablePage from '../components/OperationsWorkspaceTablePage';
import { statusBadgeStyle } from '../utils/uiStyles';

function formatCurrency(value) {
  const num = Number(value || 0);
  return `€${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeRow(item, index) {
  return {
    id: String(item.id || `revenue-${index + 1}`),
    doctorName: item.doctor_name || `Doctor ${index + 1}`,
    planLabel: item.plan_label || 'Starter',
    patientCount: Number(item.patient_count || 0),
    subscriptionMrr: Number(item.monthly_equivalent || 0),
    patientServiceMrr: Number(item.estimated_patient_revenue_monthly || 0),
    totalMrr: Number(item.total_monthly_value || 0),
    status: String(item.status || 'active').toLowerCase()
  };
}

function kindForStatus(value) {
  return value === 'active' ? 'success' : 'warning';
}

export default function TenantRevenuePage() {
  return (
    <OperationsWorkspaceTablePage
      title="Revenue"
      subtitle="Premium revenue workspace for doctor subscriptions and patient-linked value."
      entityLabel="revenue rows"
      endpointGroups={['/api/tenant/billing']}
      responseKeys={['doctorSubscriptions']}
      fallbackRows={[]}
      normalizeRow={normalizeRow}
      metricsBuilder={(rows) => [
        { label: 'Active Revenue Accounts', value: rows.filter((r) => r.status === 'active').length, tone: 'blue' },
        {
          label: 'Subscription MRR',
          value: formatCurrency(rows.reduce((sum, row) => sum + Number(row.subscriptionMrr || 0), 0)),
          tone: 'green'
        },
        {
          label: 'Patient Service MRR',
          value: formatCurrency(rows.reduce((sum, row) => sum + Number(row.patientServiceMrr || 0), 0)),
          tone: 'purple'
        },
        {
          label: 'Total MRR',
          value: formatCurrency(rows.reduce((sum, row) => sum + Number(row.totalMrr || 0), 0)),
          tone: 'dark'
        }
      ]}
      searchPlaceholder="Search by doctor or plan..."
      getSearchText={(row) => `${row.doctorName} ${row.planLabel}`}
      filterLabel="Status"
      filterOptions={[
        { label: 'All statuses', value: 'all' },
        { label: 'Active', value: 'active' }
      ]}
      getFilterValue={(row) => row.status}
      columns={[
        {
          label: 'Doctor',
          render: (row) => (
            <div>
              <div style={{ fontWeight: 900 }}>{row.doctorName}</div>
              <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>{row.planLabel}</div>
            </div>
          )
        },
        { label: 'Patients', render: (row) => row.patientCount },
        { label: 'Subscription MRR', render: (row) => formatCurrency(row.subscriptionMrr) },
        { label: 'Patient MRR', render: (row) => formatCurrency(row.patientServiceMrr) },
        { label: 'Total MRR', render: (row) => formatCurrency(row.totalMrr) },
        { label: 'Status', render: (row) => <span style={statusBadgeStyle(kindForStatus(row.status))}>{row.status}</span> }
      ]}
    />
  );
}