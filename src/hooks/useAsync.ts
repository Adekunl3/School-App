"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/apiClient";

export interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/**
 * Runs a one-shot fetch and tracks its loading/error state.
 *
 * For the dashboard widgets, which each read a single aggregate rather than a
 * paged list. Stale responses are discarded via a request counter, so a slow
 * earlier call cannot overwrite a newer one after `deps` change.
 *
 * `fetcher` must be stable (wrap it in useCallback) — it is intentionally not in
 * the dependency list, because an inline arrow would otherwise refetch on every
 * render. Pass anything that should trigger a refetch through `deps`.
 */
export const useAsync = <T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseAsyncResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const requestIdRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let active = true;

    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (!active || requestId !== requestIdRef.current) return;
        setData(result);
      })
      .catch((err) => {
        if (!active || requestId !== requestIdRef.current) return;
        setData(null);
        setError(err instanceof ApiError ? err : new ApiError("Failed to load data."));
      })
      .finally(() => {
        if (active && requestId === requestIdRef.current) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, ...deps]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, loading, error, refetch };
};

export default useAsync;
