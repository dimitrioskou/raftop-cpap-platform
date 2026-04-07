import apiClient from './client';

export async function getPaymentsConfig({ tenantId } = {}) {
  return apiClient.get('/api/tenant/payments/config', {
    tenantId
  });
}

export async function createCardPaymentIntent(payload = {}) {
  return apiClient.post('/api/tenant/payments/card/intent', payload, {
    tenantId: payload.tenantId
  });
}

export async function createPayPalOrder(payload = {}) {
  return apiClient.post('/api/tenant/payments/paypal/order', payload, {
    tenantId: payload.tenantId
  });
}

export async function capturePayPalOrder(payload = {}) {
  return apiClient.post('/api/tenant/payments/paypal/capture', payload, {
    tenantId: payload.tenantId
  });
}

export async function createBankTransferPayment(payload = {}) {
  return apiClient.post('/api/tenant/payments/bank-transfer', payload, {
    tenantId: payload.tenantId
  });
}

export async function createCashPayment(payload = {}) {
  return apiClient.post('/api/tenant/payments/cash', payload, {
    tenantId: payload.tenantId
  });
}

export async function listTenantPayments({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/payments', {
    tenantId,
    query
  });
}

export async function verifyTenantPayment(payload = {}) {
  return apiClient.post('/api/tenant/payments/verify', payload, {
    tenantId: payload.tenantId
  });
}