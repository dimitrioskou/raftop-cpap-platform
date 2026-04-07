import apiClient from './client';

export async function getTenantDashboard({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/dashboard', { tenantId, query });
}

export async function getTenantPatients({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/patients', { tenantId, query });
}

export async function getTenantDevices({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/devices', { tenantId, query });
}

export async function getTenantCompliance({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/compliance', { tenantId, query });
}

export async function getTenantFollowups({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/followup', { tenantId, query });
}

export async function getTenantTasks({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/tasks', { tenantId, query });
}

export async function getTenantNotes({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/notes', { tenantId, query });
}

export async function getTenantReferrals({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/referrals', { tenantId, query });
}

export async function getTenantNotifications({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/notifications', { tenantId, query });
}

export async function getTenantUsers({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/users', { tenantId, query });
}

export async function getTenantModules({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/modules', { tenantId, query });
}

export async function getTenantIntegrations({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/integrations', { tenantId, query });
}

export async function getTenantBranding({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/branding', { tenantId, query });
}