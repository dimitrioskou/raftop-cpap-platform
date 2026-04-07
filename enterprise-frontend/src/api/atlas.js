import apiClient from './client';

export async function getAtlasSummary({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/atlas', {
    tenantId,
    query
  });
}

export async function getAtlasQueue({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/atlas/queue', {
    tenantId,
    query
  });
}

export async function getAtlasDaily({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/atlas/daily', {
    tenantId,
    query
  });
}

export async function getAtlasTasks({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/atlas/tasks', {
    tenantId,
    query
  });
}

export async function getAtlasAlerts({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/atlas/alerts', {
    tenantId,
    query
  });
}

export async function getAtlasAutoActions({ tenantId, query } = {}) {
  return apiClient.get('/api/tenant/atlas/auto-actions', {
    tenantId,
    query
  });
}

export async function recalculateAtlas({ tenantId } = {}) {
  return apiClient.post(
    '/api/tenant/atlas/recalculate',
    {},
    { tenantId }
  );
}

export async function runAiScoring({ tenantId } = {}) {
  return apiClient.post(
    '/api/tenant/atlas/run-ai',
    {},
    { tenantId }
  );
}

export async function runAutoActions({ tenantId } = {}) {
  return apiClient.post(
    '/api/tenant/atlas/run-auto-actions',
    {},
    { tenantId }
  );
}