"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/apiClient";
import { lookupService, type LookupSource } from "@/services/school";
import type { Lookup } from "@/types/school";

/**
 * Lookup lists are small, change rarely and are needed by almost every form, so
 * they are cached for the lifetime of the page rather than refetched each time a
 * modal opens.
 *
 * In-flight requests are cached too, so two selects mounting together share one
 * request instead of racing.
 */
const cache = new Map<LookupSource, Lookup[]>();
const inFlight = new Map<LookupSource, Promise<Lookup[]>>();

const load = (source: LookupSource): Promise<Lookup[]> => {
  const cached = cache.get(source);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(source);
  if (pending) return pending;

  const request = lookupService[source]()
    .then((rows) => {
      cache.set(source, rows);
      return rows;
    })
    .finally(() => {
      inFlight.delete(source);
    });

  inFlight.set(source, request);
  return request;
};

/** Drops cached lookups so the next mount refetches — call after a mutation
 *  that changes one of these lists (creating a class, a teacher, ...). */
export const invalidateLookups = (...sources: LookupSource[]): void => {
  if (sources.length === 0) {
    cache.clear();
    return;
  }
  sources.forEach((source) => cache.delete(source));
};

export interface UseLookupResult {
  options: Lookup[];
  loading: boolean;
  error: ApiError | null;
}

export const useLookup = (source: LookupSource): UseLookupResult => {
  const [options, setOptions] = useState<Lookup[]>(() => cache.get(source) ?? []);
  const [loading, setLoading] = useState(!cache.has(source));
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let active = true;

    const cached = cache.get(source);
    if (cached) {
      setOptions(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    load(source)
      .then((rows) => {
        if (!active) return;
        setOptions(rows);
      })
      .catch((err) => {
        if (!active) return;
        setOptions([]);
        setError(
          err instanceof ApiError ? err : new ApiError(`Failed to load ${source}.`)
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [source]);

  return { options, loading, error };
};

export default useLookup;
