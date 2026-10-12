"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, type ListQuery, type ListResult } from "@/lib/apiClient";
import type { PaginationMetadata } from "@/types/school";

export type SortDirection = "Ascending" | "Descending";

export interface UseListOptions<T> {
  /** Service call for one page. */
  fetcher: (query: ListQuery) => Promise<ListResult<T>>;
  itemsPerPage?: number;
  initialSortProperty?: string;
  initialSortDirection?: SortDirection;
  /** Delay before a typed search term triggers a request. */
  searchDebounceMs?: number;
}

export interface UseListResult<T> {
  items: T[];
  metadata: PaginationMetadata;
  loading: boolean;
  error: ApiError | null;

  page: number;
  setPage: (page: number) => void;

  /** Bound to the input — updates immediately, requests on a debounce. */
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  sortProperty?: string;
  sortDirection: SortDirection;
  /** Sorts by `property`, flipping direction when already sorted by it. */
  toggleSort: (property: string) => void;

  refetch: () => void;
}

const EMPTY_METADATA: PaginationMetadata = {
  currentPage: 1,
  totalCount: 0,
  totalPages: 0,
  hasPrevious: false,
  hasNext: false,
};

/**
 * Drives a PowerAPI-backed list: server pagination, debounced global search and
 * server-side sorting.
 *
 * Responses are matched against a request counter so a slow earlier page cannot
 * overwrite a faster later one.
 */
export const useList = <T>({
  fetcher,
  itemsPerPage = 10,
  initialSortProperty,
  initialSortDirection = "Ascending",
  searchDebounceMs = 350,
}: UseListOptions<T>): UseListResult<T> => {
  const [items, setItems] = useState<T[]>([]);
  const [metadata, setMetadata] = useState<PaginationMetadata>(EMPTY_METADATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortProperty, setSortProperty] = useState(initialSortProperty);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [reloadKey, setReloadKey] = useState(0);

  const requestIdRef = useRef(0);

  // Debounce the term, and go back to page 1 whenever it changes — staying on
  // page 5 of a narrower result set would show an empty table.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch((previous) => {
        if (previous !== searchTerm) setPage(1);
        return searchTerm;
      });
    }, searchDebounceMs);

    return () => window.clearTimeout(timer);
  }, [searchDebounceMs, searchTerm]);

  const query = useMemo<ListQuery>(
    () => ({
      page,
      itemsPerPage,
      searchTerm: debouncedSearch,
      sortProperty,
      sortDirection,
    }),
    [debouncedSearch, itemsPerPage, page, sortDirection, sortProperty]
  );

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher(query);
        // Ignore anything superseded by a newer request.
        if (!active || requestId !== requestIdRef.current) return;

        setItems(result.items);
        setMetadata(result.metadata);
      } catch (err) {
        if (!active || requestId !== requestIdRef.current) return;

        setItems([]);
        setMetadata(EMPTY_METADATA);
        setError(
          err instanceof ApiError ? err : new ApiError("Failed to load records.")
        );
      } finally {
        if (active && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [fetcher, query, reloadKey]);

  const toggleSort = useCallback((property: string) => {
    setSortProperty((current) => {
      setSortDirection((direction) =>
        current === property && direction === "Ascending" ? "Descending" : "Ascending"
      );
      return property;
    });
    setPage(1);
  }, []);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    items,
    metadata,
    loading,
    error,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    sortProperty,
    sortDirection,
    toggleSort,
    refetch,
  };
};

export default useList;
