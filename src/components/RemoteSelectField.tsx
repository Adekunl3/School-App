"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, type ListQuery, type ListResult } from "@/lib/apiClient";

export interface RemoteSelectFieldProps<T> {
  label: string;
  /** Page fetcher — the same service method the list pages use. */
  fetcher: (query: ListQuery) => Promise<ListResult<T>>;
  /** Value stored when a row is picked. */
  getId: (item: T) => string;
  /** Primary text shown for a row. */
  getLabel: (item: T) => string;
  /** Optional secondary text. */
  getHint?: (item: T) => string | null;

  value: string;
  onChange: (id: string) => void;
  /** Label for an already-selected value, so editing shows a name not an id. */
  selectedLabel?: string | null;

  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Sort column sent to the API. */
  sortProperty?: string;
}

const PAGE_SIZE = 8;
const DEBOUNCE_MS = 300;

/**
 * Searchable picker backed by a paged list endpoint.
 *
 * Used where a plain `<select>` would not do: students (potentially thousands,
 * so the options cannot all be loaded) and exams/assignments (which have no
 * lookup endpoint of their own). Searching happens server-side, so only a
 * handful of rows are ever fetched.
 */
const RemoteSelectField = <T,>({
  label,
  fetcher,
  getId,
  getLabel,
  getHint,
  value,
  onChange,
  selectedLabel,
  placeholder = "Search...",
  error,
  disabled = false,
  sortProperty,
}: RemoteSelectFieldProps<T>) => {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  /** Label for the current `value`, once known. */
  const [chosenLabel, setChosenLabel] = useState<string | null>(selectedLabel ?? null);

  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [term]);

  // Only fetch while the dropdown is open — a closed picker costs nothing.
  useEffect(() => {
    if (!open) return;

    const requestId = ++requestIdRef.current;
    let active = true;

    setLoading(true);
    setLoadError(null);

    fetcher({
      page: 1,
      itemsPerPage: PAGE_SIZE,
      searchTerm: debounced,
      sortProperty,
    })
      .then((result) => {
        // Ignore a slow earlier keystroke that resolves after a later one.
        if (!active || requestId !== requestIdRef.current) return;
        setItems(result.items);
      })
      .catch((err) => {
        if (!active || requestId !== requestIdRef.current) return;
        setItems([]);
        setLoadError(err instanceof ApiError ? err.message : "Failed to search.");
      })
      .finally(() => {
        if (active && requestId === requestIdRef.current) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debounced, fetcher, open, sortProperty]);

  // Close when focus leaves, so the dropdown does not hang over other fields.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const select = (item: T) => {
    onChange(getId(item));
    setChosenLabel(getLabel(item));
    setTerm("");
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setChosenLabel(null);
    setTerm("");
  };

  return (
    <div className="flex flex-col gap-2 w-full md:w-1/4" ref={containerRef}>
      <label className="text-xs text-gray-500">{label}</label>

      {value && chosenLabel ? (
        <div className="flex items-center justify-between gap-2 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm">
          <span className="truncate">{chosenLabel}</span>
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="text-xs text-gray-400 hover:text-red-500 shrink-0"
            aria-label={`Clear ${label}`}
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-60"
          />

          {open && (
            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
              {loading ? (
                <p className="p-2 text-xs text-gray-400">Searching...</p>
              ) : loadError ? (
                <p className="p-2 text-xs text-red-400">{loadError}</p>
              ) : items.length === 0 ? (
                <p className="p-2 text-xs text-gray-400">
                  {debounced ? `No matches for "${debounced}".` : "No records found."}
                </p>
              ) : (
                items.map((item) => {
                  const hint = getHint?.(item);
                  return (
                    <button
                      key={getId(item)}
                      type="button"
                      onClick={() => select(item)}
                      className="block w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100"
                    >
                      {getLabel(item)}
                      {hint && <span className="ml-2 text-xs text-gray-400">{hint}</span>}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default RemoteSelectField;
