const entries = [
  {
    id: 'recovery_raft_1',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_1',
    patient_name: 'Maria Papadopoulou',
    stage: 'contacted',
    priority: 'critical',
    note: 'First call completed, waiting callback.',
    last_action: 'callback requested',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'recovery_raft_2',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_2',
    patient_name: 'Giorgos Nikolaou',
    stage: 'improving',
    priority: 'high',
    note: 'Usage improved after education.',
    last_action: 'follow-up completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findAllByOrganizationId(organizationId) {
  const rows = entries.filter(
    (item) => String(item.organization_id) === String(organizationId)
  );

  rows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return rows;
}

async function getSummaryByOrganizationId(organizationId) {
  const rows = await findAllByOrganizationId(organizationId);

  return {
    total: rows.length,
    identified: rows.filter((x) => x.stage === 'identified').length,
    contacted: rows.filter((x) => x.stage === 'contacted').length,
    improving: rows.filter((x) => x.stage === 'improving').length,
    recovered: rows.filter((x) => x.stage === 'recovered').length
  };
}

module.exports = {
  findAllByOrganizationId,
  getSummaryByOrganizationId
};