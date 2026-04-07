const patientsRepo = require('../repositories/patientsRepo');
const devicesRepo = require('../repositories/devicesRepo');
const tasksRepo = require('../repositories/tasksRepo');
const notesRepo = require('../repositories/notesRepo');

async function getOverview(organizationId) {
  const [patients, devices, tasks, notes] = await Promise.all([
    patientsRepo.findAllByOrganizationId(organizationId),
    devicesRepo.findAllByOrganizationId(organizationId),
    tasksRepo.findAllByOrganizationId(organizationId),
    notesRepo.findAllByOrganizationId(organizationId)
  ]);

  const pendingTasks = tasks.filter(
    (item) => !['completed', 'cancelled'].includes(String(item.status).toLowerCase())
  ).length;

  const offlineDevices = devices.filter(
    (item) => String(item.status).toLowerCase() === 'offline'
  ).length;

  return {
    organizationId,
    totalPatients: patients.length,
    totalDevices: devices.length,
    totalTasks: tasks.length,
    pendingTasks,
    totalNotes: notes.length,
    offlineDevices
  };
}

module.exports = {
  getOverview
};