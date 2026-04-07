const items = [
  {
    id: 'pq_raft_1',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_1',
    patientName: 'Maria Papadopoulou',
    phone: '6900000001',
    priority: 'CRITICAL',
    reason: 'Usage below 50% of target',
    recommendedAction: 'Immediate follow-up call',
    usage_hours: 42,
    created_at: new Date().toISOString()
  },
  {
    id: 'pq_raft_2',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_2',
    patientName: 'Giorgos Nikolaou',
    phone: '6900000002',
    priority: 'HIGH',
    reason: 'Warning adherence trend',
    recommendedAction: 'Schedule recheck',
    usage_hours: 68,
    created_at: new Date().toISOString()
  }
];

async function findAllByOrganizationId(organizationId) {
  const rows = items.filter(
    (item) => String(item.organization_id) === String(organizationId)
  );

  rows.sort((a, b) => {
    const pa = String(a.priority || '');
    const pb = String(b.priority || '');
    const score = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (score[pb] || 0) - (score[pa] || 0);
  });

  return rows;
}

module.exports = {
  findAllByOrganizationId
};