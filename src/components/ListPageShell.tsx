"use client";

import { useCallback } from "react";
import Image from "next/image";
import FormModal from "./FormModal";
import Pagination from "./Pagination";
import Table from "./Table";
import TableSearch from "./TableSearch";
import type { UseListResult } from "@/hooks/useList";
import type { ModuleName } from "@/services/school";

export interface ListColumn {
  header: string;
  accessor: string;
  className?: string;
  /** API property name to sort by. Omit for columns the API cannot order on. */
  sortProperty?: string;
}

export interface ListPageShellProps<T> {
  title: string;
  /** Module name, for the create button and the delete confirmation wording. */
  table: ModuleName;
  columns: ListColumn[];
  renderRow: (item: T) => React.ReactNode;
  list: UseListResult<T>;
  searchPlaceholder?: string;
  /** Noun used in the empty/loading copy, e.g. "lessons". */
  noun?: string;
  /** Set false for roles that may not create records. */
  canCreate?: boolean;
}

/**
 * Chrome shared by every list page: title, search, sort, create button, the
 * loading/error/empty states and pagination.
 *
 * Each page supplies only its columns and row renderer, so the states that are
 * easy to forget — a failed fetch, an empty search, a disabled control while
 * loading — behave the same everywhere instead of being re-implemented per page.
 */
const ListPageShell = <T,>({
  title,
  table,
  columns,
  renderRow,
  list,
  searchPlaceholder,
  noun,
  canCreate = true,
}: ListPageShellProps<T>) => {
  const {
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
  } = list;

  const label = noun ?? `${table}s`;

  // Steps through the columns the API can order by, flipping direction each
  // time it comes back round to the current one.
  const cycleSort = useCallback(() => {
    const sortable = columns
      .map((column) => column.sortProperty)
      .filter((property): property is string => Boolean(property));

    if (sortable.length === 0) return;

    const currentIndex = sortable.indexOf(sortProperty ?? "");
    const next =
      sortDirection === "Ascending" && currentIndex >= 0
        ? sortable[currentIndex]
        : sortable[(currentIndex + 1) % sortable.length];

    toggleSort(next);
  }, [columns, sortDirection, sortProperty, toggleSort]);

  const sortable = columns.some((column) => column.sortProperty);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">{title}</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={searchPlaceholder ?? `Search ${label}...`}
          />
          <div className="flex items-center gap-4 self-end">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
              title="Filter (not yet implemented)"
              disabled
            >
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            {sortable && (
              <button
                type="button"
                onClick={cycleSort}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
                title={`Sort by ${sortProperty ?? "default"} (${sortDirection})`}
              >
                <Image src="/sort.png" alt="Sort" width={14} height={14} />
              </button>
            )}
            {canCreate && <FormModal table={table} type="create" onSuccess={refetch} />}
          </div>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <p className="p-4 text-sm text-gray-500">Loading {label}...</p>
      ) : error ? (
        <div className="p-4 text-sm">
          <p className="text-red-600">{error.detail}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-2 text-indigo-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">
          {searchTerm
            ? `No ${label} match "${searchTerm}".`
            : `No ${label} yet. Use the + button to add one.`}
        </p>
      ) : (
        // Wide tables scroll inside their own container rather than pushing the
        // page sideways.
        <div className="overflow-x-auto">
          <Table columns={columns} renderRow={renderRow} data={items} />
        </div>
      )}

      {/* PAGINATION */}
      <Pagination
        currentPage={metadata.currentPage || page}
        totalPages={metadata.totalPages}
        totalCount={metadata.totalCount}
        hasPrevious={metadata.hasPrevious}
        hasNext={metadata.hasNext}
        onPageChange={setPage}
        disabled={loading}
      />
    </div>
  );
};

export default ListPageShell;
