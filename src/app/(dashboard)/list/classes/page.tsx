"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { useIsAdmin } from "@/hooks/useRole";
import { classService } from "@/services/school";
import type { SchoolClass } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Class Name", accessor: "name", sortProperty: "ClassId" },
  {
    header: "Capacity",
    accessor: "capacity",
    className: "hidden md:table-cell",
    sortProperty: "Capacity",
  },
  {
    header: "Grade",
    accessor: "grade",
    className: "hidden md:table-cell",
    sortProperty: "Grade",
  },
  { header: "Supervisor", accessor: "supervisor", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const ClassListPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<SchoolClass>({
    fetcher: useCallback((query) => classService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "Grade",
  });

  const renderRow = (item: SchoolClass) => {
    // Capacity is optional; a class without one is not "0 of 0 full".
    const full = item.capacity !== null && item.enrolledCount >= item.capacity;

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:even:bg-gray-700"
      >
        <td className="flex items-center gap-4 p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-xs text-gray-500">
              {item.enrolledCount} enrolled
              {item.capacity !== null && ` of ${item.capacity}`}
            </p>
          </div>
        </td>
        <td className="hidden md:table-cell">
          {item.capacity ?? "-"}
          {full && <span className="ml-2 text-xs text-amber-600">Full</span>}
        </td>
        <td className="hidden md:table-cell">{item.grade ?? "-"}</td>
        <td className="hidden md:table-cell">{item.supervisor || "Unassigned"}</td>
        <td>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <FormModal
                  table="class"
                  type="update"
                  data={item}
                  onSuccess={list.refetch}
                />
                <FormModal
                  table="class"
                  type="delete"
                  id={item.classId}
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
    <ListPageShell<SchoolClass>
      title="All Classes"
      table="class"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="classes"
      canCreate={isAdmin}
    />
  );
};

export default ClassListPage;
