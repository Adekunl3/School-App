"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { formatDate } from "@/lib/formHelpers";
import { useIsAdmin } from "@/hooks/useRole";
import { examService } from "@/services/school";
import type { Exam } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Subject", accessor: "subject", sortProperty: "SubjectId" },
  { header: "Class", accessor: "class", sortProperty: "ClassId" },
  { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
  { header: "Date", accessor: "date", sortProperty: "ExamDate" },
  { header: "Max Score", accessor: "maxScore", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "action" },
];

const ExamListPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<Exam>({
    fetcher: useCallback((query) => examService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "ExamDate",
    initialSortDirection: "Descending",
  });

  const renderRow = (item: Exam) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:even:bg-gray-700"
    >
      <td className="p-4">
        <h3 className="font-semibold">{item.subject || "-"}</h3>
        {item.title && <p className="text-xs text-gray-500">{item.title}</p>}
      </td>
      <td>{item.class || "-"}</td>
      <td className="hidden md:table-cell">{item.teacher || "Unassigned"}</td>
      <td>
        {formatDate(item.date)}
        {item.startTime && (
          <span className="block text-xs text-gray-500">
            {item.startTime}
            {item.endTime ? ` - ${item.endTime}` : ""}
          </span>
        )}
      </td>
      <td className="hidden lg:table-cell">{item.maxScore ?? "-"}</td>
      <td>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <FormModal table="exam" type="update" data={item} onSuccess={list.refetch} />
              <FormModal
                table="exam"
                type="delete"
                id={item.examId}
                onSuccess={list.refetch}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <ListPageShell<Exam>
      title="All Exams"
      table="exam"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="exams"
      canCreate={isAdmin}
    />
  );
};

export default ExamListPage;
