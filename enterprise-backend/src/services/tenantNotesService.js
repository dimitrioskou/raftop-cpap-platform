const notesRepo = require('../repositories/notesRepo');

async function list(organizationId, filters = {}) {
  return notesRepo.findAllByOrganizationId(organizationId, filters);
}

async function details(organizationId, noteId) {
  return notesRepo.findByIdAndOrganizationId(noteId, organizationId);
}

async function create(organizationId, userId, payload) {
  return notesRepo.create({
    ...payload,
    organization_id: organizationId,
    created_by_user_id: userId,
    updated_by_user_id: userId
  });
}

async function update(organizationId, noteId, userId, payload) {
  return notesRepo.update(noteId, organizationId, {
    ...payload,
    updated_by_user_id: userId
  });
}

async function remove(organizationId, noteId) {
  return notesRepo.remove(noteId, organizationId);
}

module.exports = {
  list,
  details,
  create,
  update,
  remove
};