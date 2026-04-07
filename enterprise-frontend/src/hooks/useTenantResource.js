import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildApiNotice, fetchJson } from '../utils/tenantDataHelpers';

async function fetchFirstAvailablePayload(endpointGroups = [], signal) {
  const urls = Array.isArray(endpointGroups) ? endpointGroups.filter(Boolean) : [];
  const diagnostics = [];

  for (const url of urls) {
    try {
      const payload = await fetchJson(url, { signal });
      return {
        payload,
        debug: `Using ${url}`
      };
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      diagnostics.push(`${url} -> ERROR ${error.message}`);
    }
  }

  throw new Error(diagnostics.join(' || ') || 'No endpoint responded successfully.');
}

export default function useTenantResource({
  endpointGroups = [],
  extractData,
  normalizeData,
  fallbackData,
  entityLabel = 'resource'
}) {
  const [data, setData] = useState(fallbackData ?? null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setApiError('');
      setUsingFallback(false);
      setDebugInfo('');

      try {
        const result = await fetchFirstAvailablePayload(endpointGroups, signal);
        const rawPayload = result.payload;
        const extracted =
          typeof extractData === 'function' ? extractData(rawPayload) : rawPayload;
        const normalized =
          typeof normalizeData === 'function' ? normalizeData(extracted) : extracted;

        const hasUsableData =
          normalized != null &&
          (!(Array.isArray(normalized)) || normalized.length > 0);

        setDebugInfo(result.debug || '');

        if (!hasUsableData) {
          setData(fallbackData ?? null);
          setUsingFallback(true);
          setApiError(`No usable ${entityLabel} returned from API. Showing fallback data.`);
        } else {
          setData(normalized);
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;

        setData(fallbackData ?? null);
        setUsingFallback(true);
        setApiError(error.message || `Failed to load ${entityLabel}.`);
        setDebugInfo('Request failed before usable payload was found.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [endpointGroups, extractData, normalizeData, fallbackData, entityLabel]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refresh = useCallback(() => {
    const controller = new AbortController();
    load(controller.signal);
  }, [load]);

  const apiNotice = useMemo(() => {
    const notice = buildApiNotice({
      apiError,
      usingFallback,
      entityLabel
    });

    if (!notice) return null;

    return {
      ...notice,
      details: debugInfo ? `Debug: ${debugInfo}` : undefined
    };
  }, [apiError, usingFallback, entityLabel, debugInfo]);

  return {
    data,
    loading,
    apiNotice,
    refresh
  };
}