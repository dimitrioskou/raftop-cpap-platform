const snapshots = [
  {
    id: 'comp_raft_1',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_1',
    patient_name: 'Maria Papadopoulou',
    phone: '6900000001',
    snapshot_date: new Date().toISOString(),
    usage_hours: 42,
    target_hours: 80,
    compliance_status: 'critical',
    priority_level: 'critical',
    created_at: new Date().toISOString()
  },
  {
    id: 'comp_raft_2',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_2',
    patient_name: 'Giorgos Nikolaou',
    phone: '6900000002',
    snapshot_date: new Date().toISOString(),
    usage_hours: 68,
    target_hours: 80,
    compliance_status: 'warning',
    priority_level: 'high',
    created_at: new Date().toISOString()
  },
  {
    id: 'comp_clinic_1',
    organization_id: 'org_demo_clinic_1',
    patient_id: 'patient_clinic_1',
    patient_name: 'Eleni Kosta',
    phone: '6900000010',
    snapshot_date: new Date().toISOString(),
    usage_hours: 84,
    target_hours: 80,
    compliance_status: 'ok',
    priority_level: 'low',
    created_at: new Date().toISOString()
  }
];

async function findAllByOrganizationId(organizationId, filters = {}) {
  let rows = snapshots.filter(
    (item) => String(item.organization_id) === String(organizationId)
  );

  if (filters.status) {
    rows = rows.filter(
      (item) =>
        String(item.compliance_status).toLowerCase() === String(filters.status).toLowerCase()
    );
  }

  if (filters.q) {
    const q = String(filters.q).toLowerCase();
    rows = rows.filter((item) =>
      String(item.patient_name || '').toLowerCase().includes(q) ||
      String(item.phone || '').toLowerCase().includes(q)
    );
  }

  return rows;
}

async function getOverviewByOrganizationId(organizationId) {
  const rows = await findAllByOrganizationId(organizationId);

  return {
    total: rows.length,
    critical: rows.filter((x) => x.compliance_status === 'critical').length,
    warning: rows.filter((x) => x.compliance_status === 'warning').length,
    ok: rows.filter((x) => x.compliance_status === 'ok').length,
    avgUsage:
      rows.length > 0
        ? Math.round(rows.reduce((sum, x) => sum + Number(x.usage_hours || 0), 0) / rows.length)
        : 0
  };
}

module.exports = {
  findAllByOrganizationId,
  getOverviewByOrganizationId
};