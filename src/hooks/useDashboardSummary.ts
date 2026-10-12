"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/apiClient";
import { dashboardService } from "@/services/school";
import type { DashboardSummary } from "@/types/school";

/**
 * The four count tiles all read the same aggregate, so the request is shared:
 * without this, rendering the row of cards would fire four identical calls.
 */
let cached: DashboardSummary | null = null;
let inFlight: Promise<DashboardSummary> | null = null;

const load = (): Promise<DashboardSummary> => {
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;

  inFlight = dashboardService
    .summary()
    .then((summary) => {
      cached = summary;
      return summary;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
};

/** Drops the cached totals so the next mount refetches. */
export const invalidateDashboardSummary = (): void => {
  cached = null;
};

export interface UseDashboardSummaryResult {
  summary: DashboardSummary | null;
  loading: boolean;
  error: ApiError | null;
}

export const useDashboardSummary = (): UseDashboardSummaryResult => {
  const [summary, setSummary] = useState<DashboardSummary | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (cached) {
      setSummary(cached);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    load()
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch((err) => {
        if (!active) return;
        setSummary(null);
        setError(
          err instanceof ApiError ? err : new ApiError("Failed to load dashboard totals.")
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { summary, loading, error };
};

export default useDashboardSummary;
