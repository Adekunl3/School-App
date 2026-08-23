"use client";

/**
 * Server-side pagination control.
 *
 * Every prop is optional so the pages still on mock data keep rendering the
 * original static bar until they are wired up.
 */
type PaginationProps = {
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPageChange?: (page: number) => void;
  disabled?: boolean;
};

/**
 * Page numbers to render: always first and last, plus a window around the
 * current page, with gaps collapsed to an ellipsis.
 */
const buildPageWindow = (currentPage: number, totalPages: number): (number | "gap")[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages]);
  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) pages.add(page);
  }

  const ordered = Array.from(pages).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];

  ordered.forEach((page, index) => {
    if (index > 0 && page - (ordered[index - 1] as number) > 1) result.push("gap");
    result.push(page);
  });

  return result;
};

const Pagination = ({
  currentPage,
  totalPages,
  totalCount,
  hasPrevious,
  hasNext,
  onPageChange,
  disabled = false,
}: PaginationProps) => {
  const controlled = typeof onPageChange === "function";

  if (!controlled) {
    return (
      <div className="p-4 flex items-center justify-between text-gray-500">
        <button
          disabled
          className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <div className="flex items-center gap-2 text-sm">
          <button className="px-2 rounded-sm bg-lamaSky">1</button>
        </div>
        <button
          disabled
          className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  }

  const page = currentPage ?? 1;
  const pageCount = totalPages ?? 0;

  // Nothing to page through — show the count so an empty table is explained.
  if (pageCount <= 1) {
    return (
      <div className="p-4 flex items-center justify-center text-xs text-gray-500">
        {totalCount === 0
          ? "No records found"
          : `${totalCount} record${totalCount === 1 ? "" : "s"}`}
      </div>
    );
  }

  return (
    <div className="p-4 flex items-center justify-between text-gray-500">
      <button
        type="button"
        disabled={disabled || !(hasPrevious ?? page > 1)}
        onClick={() => onPageChange!(page - 1)}
        className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Prev
      </button>

      <div className="flex items-center gap-2 text-sm">
        {buildPageWindow(page, pageCount).map((entry, index) =>
          entry === "gap" ? (
            <span key={`gap-${index}`} className="px-1">
              ...
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              disabled={disabled}
              aria-current={entry === page ? "page" : undefined}
              onClick={() => onPageChange!(entry)}
              className={`px-2 rounded-sm disabled:cursor-not-allowed ${
                entry === page ? "bg-lamaSky" : ""
              }`}
            >
              {entry}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        disabled={disabled || !(hasNext ?? page < pageCount)}
        onClick={() => onPageChange!(page + 1)}
        className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
