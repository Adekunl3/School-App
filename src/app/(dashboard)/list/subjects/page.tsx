"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { useIsAdmin } from "@/hooks/useRole";
import { subjectService } from "@/services/school";
import type { Subject } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Subject Name", accessor: "name", sortProperty: "Name" },
  {
    header: "Code",
    accessor: "subjectId",
    className: "hidden md:table-cell",
    sortProperty: "SubjectId",
  },
  { header: "Teachers", accessor: "teachers", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const SubjectListPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<Subject>({
    fetcher: useCallback((query) => subjectService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "Name",
  });

  const renderRow = (item: Subject) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:even:bg-gray-700"
    >
      <td className="p-4 font-semibold">{item.name}</td>
      <td className="hidden md:table-cell">{item.subjectId}</td>
      <td className="hidden md:table-cell">
        {item.teachers.length > 0 ? item.teachers.join(", ") : "No teachers assigned"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <FormModal
                table="subject"
                type="update"
                data={item}
                onSuccess={list.refetch}
              />
              <FormModal
                table="subject"
                type="delete"
                id={item.subjectId}
                onSuccess={list.refetch}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <ListPageShell<Subject>
      title="All Subjects"
      table="subject"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="subjects"
      canCreate={isAdmin}
    />
  );
};

export default SubjectListPage;
