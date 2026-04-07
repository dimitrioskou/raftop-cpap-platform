const licensesRepo = require('../repositories/licensesRepo');

async function listLicenses() {
  return licensesRepo.findAll();
}

async function getLicense(licenseId) {
  return licensesRepo.findById(licenseId);
}

async function createLicense(payload) {
  return licensesRepo.create(payload);
}

async function updateLicense(licenseId, payload) {
  return licensesRepo.update(licenseId, payload);
}

async function updateLicenseStatus(licenseId, licenseStatus) {
  return licensesRepo.updateStatus(licenseId, licenseStatus);
}

module.exports = {
  listLicenses,
  getLicense,
  createLicense,
  updateLicense,
  updateLicenseStatus
};