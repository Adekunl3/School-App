"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { formatDate } from "@/lib/formHelpers";
import { useCanRecord } from "@/hooks/useRole";
import { resultService } from "@/services/school";
import type { Result } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Student", accessor: "student", sortProperty: "StudentId" },
  { header: "Subject", accessor: "subject", sortProperty: "SubjectId" },
  { header: "Class", accessor: "class", className: "hidden md:table-cell" },
  {
    header: "Type",
    accessor: "type",
    className: "hidden md:table-cell",
    sortProperty: "ResultType",
  },
  { header: "Score", accessor: "score", sortProperty: "Score" },
  {
    header: "Date",
    accessor: "date",
    className: "hidden lg:table-cell",
    sortProperty: "ResultDate",
  },
  { header: "Actions", accessor: "action" },
];

/** Traffic-light banding on the percentage the API already computed. */
const scoreColour = (percentage: number | null): string => {
  if (percentage === null) return "";
  if (percentage >= 70) return "text-green-600";
  if (percentage >= 50) return "text-amber-600";
  return "text-red-600";
};

const ResultListPage = () => {
  const canRecord = useCanRecord();

  const list = useList<Result>({
    fetcher: useCallback((query) => resultService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "ResultDate",
    initialSortDirection: "Descending",
  });

  const renderRow = (item: Result) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:even:bg-gray-700"
    >
      <td className="p-4 font-semibold">{item.student || item.studentId || "-"}</td>
      <td>{item.subject || "-"}</td>
      <td className="hidden md:table-cell">{item.class || "-"}</td>
      <td className="hidden md:table-cell capitalize">{item.type || "-"}</td>
      <td>
        <span className={scoreColour(item.percentage)}>
          {item.score ?? "-"}
          {item.maxScore !== null && ` / ${item.maxScore}`}
        </span>
        {item.percentage !== null && (
          <span className="block text-xs text-gray-500">{item.percentage}%</span>
        )}
      </td>
      <td className="hidden lg:table-cell">{formatDate(item.date)}</td>
      <td>
        <div className="flex items-center gap-2">
          {canRecord && (
            <>
              <FormModal
                table="result"
                type="update"
                data={item}
                onSuccess={list.refetch}
              />
              <FormModal
                table="result"
                type="delete"
                id={item.resultId}
                onSuccess={list.refetch}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <ListPageShell<Result>
      title="All Results"
      table="result"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="results"
      canCreate={canRecord}
    />
  );
};

export default ResultListPage;
