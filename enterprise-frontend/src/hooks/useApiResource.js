import { useEffect, useMemo, useRef, useState } from 'react';

export default function useApiResource(loader, deps = [], options = {}) {
  const {
    enabled = true,
    fallbackData = null
  } = options;

  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const mountedRef = useRef(true);

  const stableFallback = useMemo(() => fallbackData, [fallbackData]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled || typeof loader !== 'function') {
        if (mountedRef.current && !cancelled) {
          setLoading(false);
          setError(null);
          setUsingFallback(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await loader();

        if (cancelled || !mountedRef.current) return;

        setData(result);
        setUsingFallback(false);
        setLoading(false);
      } catch (err) {
        if (cancelled || !mountedRef.current) return;

        setError(err);

        if (stableFallback !== undefined) {
          setData(stableFallback);
          setUsingFallback(true);
        }

        setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [enabled, loader, stableFallback, ...deps]);

  return {
    data,
    loading,
    error,
    usingFallback
  };
}