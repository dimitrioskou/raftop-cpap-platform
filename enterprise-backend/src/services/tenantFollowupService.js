const complianceRepo = require('../repositories/complianceRepo');
const priorityQueueRepo = require('../repositories/priorityQueueRepo');
const followupOutcomesRepo = require('../repositories/followupOutcomesRepo');
const rechecksRepo = require('../repositories/rechecksRepo');
const recoveryRepo = require('../repositories/recoveryRepo');
const tasksRepo = require('../repositories/tasksRepo');
const notesRepo = require('../repositories/notesRepo');

async function getFollowUpPatients(organizationId) {
  const rows = await complianceRepo.findAllByOrganizationId(organizationId);
  return rows.filter((item) => ['critical', 'warning'].includes(item.compliance_status));
}

async function getPriorityQueue(organizationId) {
  return priorityQueueRepo.findAllByOrganizationId(organizationId);
}

async function getComplianceOverview(organizationId) {
  return complianceRepo.getOverviewByOrganizationId(organizationId);
}

async function getOutcomes(organizationId) {
  return followupOutcomesRepo.findAllByOrganizationId(organizationId);
}

async function getOutcomesSummary(organizationId) {
  return followupOutcomesRepo.getSummaryByOrganizationId(organizationId);
}

async function createOutcome(organizationId, userId, payload) {
  return followupOutcomesRepo.create({
    ...payload,
    organization_id: organizationId,
    created_by_user_id: userId
  });
}

async function createFollowUpTask(organizationId, userId, payload) {
  return tasksRepo.create({
    ...payload,
    organization_id: organizationId,
    created_by_user_id: userId,
    updated_by_user_id: userId,
    source_module: payload.source_module || 'followup_center'
  });
}

async function createFollowUpNote(organizationId, userId, payload) {
  return notesRepo.create({
    ...payload,
    organization_id: organizationId,
    created_by_user_id: userId,
    updated_by_user_id: userId,
    category: payload.category || 'followup'
  });
}

async function getRechecks(organizationId) {
  return rechecksRepo.findAllByOrganizationId(organizationId);
}

async function createRecheck(organizationId, userId, payload) {
  return rechecksRepo.create({
    ...payload,
    organization_id: organizationId,
    created_by_user_id: userId,
    updated_by_user_id: userId
  });
}

async function getRecoveryFunnel(organizationId) {
  return recoveryRepo.findAllByOrganizationId(organizationId);
}

async function getRecoverySummary(organizationId) {
  return recoveryRepo.getSummaryByOrganizationId(organizationId);
}

module.exports = {
  getFollowUpPatients,
  getPriorityQueue,
  getComplianceOverview,
  getOutcomes,
  getOutcomesSummary,
  createOutcome,
  createFollowUpTask,
  createFollowUpNote,
  getRechecks,
  createRecheck,
  getRecoveryFunnel,
  getRecoverySummary
};