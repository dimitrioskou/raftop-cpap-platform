const tasksRepo = require('../repositories/tasksRepo');

async function list(organizationId, filters = {}) {
  return tasksRepo.findAllByOrganizationId(organizationId, filters);
}

async function details(organizationId, taskId) {
  return tasksRepo.findByIdAndOrganizationId(taskId, organizationId);
}

async function create(organizationId, userId, payload) {
  return tasksRepo.create({
    ...payload,
    organization_id: organizationId,
    created_by_user_id: userId,
    updated_by_user_id: userId
  });
}

async function update(organizationId, taskId, userId, payload) {
  return tasksRepo.update(taskId, organizationId, {
    ...payload,
    updated_by_user_id: userId
  });
}

async function remove(organizationId, taskId) {
  return tasksRepo.remove(taskId, organizationId);
}

module.exports = {
  list,
  details,
  create,
  update,
  remove
};