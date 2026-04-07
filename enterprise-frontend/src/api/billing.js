import apiClient from './client';

export async function getDoctorBillingSummary({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/billing', {
    tenantId,
    query
  });
}

export async function getRevenueAnalytics({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/billing/revenue', {
    tenantId,
    query
  });
}

export async function createDoctorCheckoutSession(payload = {}) {
  return apiClient.post('/api/tenant/billing/checkout', payload, {
    tenantId: payload.tenantId
  });
}

export async function createDoctorBillingPortalSession(payload = {}) {
  return apiClient.post('/api/tenant/billing/portal', payload, {
    tenantId: payload.tenantId
  });
}