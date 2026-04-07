import { request } from './client';

export async function getSuperAdminDashboard() {
  return request('/super-admin/dashboard', {
    method: 'GET'
  });
}

export async function getOrganizations() {
  return request('/super-admin/organizations', {
    method: 'GET'
  });
}

export async function getLicenses() {
  return request('/super-admin/licenses', {
    method: 'GET'
  });
}

export async function getModules() {
  return request('/super-admin/modules', {
    method: 'GET'
  });
}