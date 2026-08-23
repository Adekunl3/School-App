"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { formatDate } from "@/lib/formHelpers";
import { useIsAdmin } from "@/hooks/useRole";
import { assignmentService } from "@/services/school";
import type { Assignment } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Subject", accessor: "subject", sortProperty: "SubjectId" },
  { header: "Class", accessor: "class", sortProperty: "ClassId" },
  { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
  { header: "Due Date", accessor: "dueDate", sortProperty: "DueDate" },
  { header: "Actions", accessor: "action" },
];

/** Midnight today, for the overdue comparison. */
const startOfToday = (): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

const AssignmentListPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<Assignment>({
    fetcher: useCallback((query) => assignmentService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "DueDate",
    initialSortDirection: "Descending",
  });

  const renderRow = (item: Assignment) => {
    const due = item.dueDate ? new Date(item.dueDate).getTime() : null;
    const overdue = due !== null && !Number.isNaN(due) && due < startOfToday();

    return (
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
          {formatDate(item.dueDate)}
          {overdue && <span className="block text-xs text-amber-600">Past due</span>}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <FormModal
                  table="assignment"
                  type="update"
                  data={item}
                  onSuccess={list.refetch}
                />
                <FormModal
                  table="assignment"
                  type="delete"
                  id={item.assignmentId}
                  onSuccess={list.refetch}
                />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <ListPageShell<Assignment>
      title="All Assignments"
      table="assignment"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="assignments"
      canCreate={isAdmin}
    />
  );
};

export default AssignmentListPage;
