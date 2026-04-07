const plansRepo = require('../repositories/plansRepo');

async function listPlans() {
  return plansRepo.findAll();
}

async function getPlan(planId) {
  return plansRepo.findById(planId);
}

async function createPlan(payload) {
  return plansRepo.create(payload);
}

async function updatePlan(planId, payload) {
  return plansRepo.update(planId, payload);
}

module.exports = {
  listPlans,
  getPlan,
  createPlan,
  updatePlan
};