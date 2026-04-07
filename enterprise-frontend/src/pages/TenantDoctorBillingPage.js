import React from 'react';
import OperationsWorkspaceTablePage from '../components/OperationsWorkspaceTablePage';
import { statusBadgeStyle } from '../utils/uiStyles';

function formatCurrency(value) {
  const num = Number(value || 0);
  return `€${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeRow(item, index) {
  return {
    id: String(item.id || `doctor-sub-${index + 1}`),
    doctorName: item.doctor_name || `Doctor ${index + 1}`,
    doctorEmail: item.doctor_email || '—',
    patientCount: Number(item.patient_count || 0),
    planLabel: item.plan_label || 'Starter',
    annualFee: Number(item.annual_fee || 0),
    monthlyEquivalent: Number(item.monthly_equivalent || 0),
    status: String(item.status || 'active').toLowerCase()
  };
}

function kindForStatus(value) {
  if (value === 'active') return 'success';
  if (value === 'pending') return 'warning';
  return 'info';
}

export default function TenantDoctorBillingPage() {
  return (
    <OperationsWorkspaceTablePage
      title="Doctor Billing"
      subtitle="Premium doctor subscription and billing workspace."
      entityLabel="doctor billing rows"
      endpointGroups={['/api/tenant/billing']}
      responseKeys={['doctorSubscriptions']}
      fallbackRows={[]}
      normalizeRow={normalizeRow}
      metricsBuilder={(rows) => [
        { label: 'Doctors', value: rows.length, tone: 'blue' },
        { label: 'Active', value: rows.filter((r) => r.status === 'active').length, tone: 'green' },
        {
          label: 'ARR',
          value: formatCurrency(rows.reduce((sum, row) => sum + Number(row.annualFee || 0), 0)),
          tone: 'purple'
        },
        {
          label: 'MRR',
          value: formatCurrency(rows.reduce((sum, row) => sum + Number(row.monthlyEquivalent || 0), 0)),
          tone: 'orange'
        }
      ]}
      searchPlaceholder="Search by doctor, email or plan..."
      getSearchText={(row) => `${row.doctorName} ${row.doctorEmail} ${row.planLabel}`}
      filterLabel="Status"
      filterOptions={[
        { label: 'All statuses', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Pending', value: 'pending' }
      ]}
      getFilterValue={(row) => row.status}
      columns={[
        {
          label: 'Doctor',
          render: (row) => (
            <div>
              <div style={{ fontWeight: 900 }}>{row.doctorName}</div>
              <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>{row.doctorEmail}</div>
            </div>
          )
        },
        { label: 'Patients', render: (row) => row.patientCount },
        { label: 'Plan', render: (row) => row.planLabel },
        { label: 'Annual Fee', render: (row) => formatCurrency(row.annualFee) },
        { label: 'Monthly Eq.', render: (row) => formatCurrency(row.monthlyEquivalent) },
        { label: 'Status', render: (row) => <span style={statusBadgeStyle(kindForStatus(row.status))}>{row.status}</span> }
      ]}
    />
  );
}