"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { useIsAdmin } from "@/hooks/useRole";
import { parentService } from "@/services/school";
import type { Parent } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Info", accessor: "info", sortProperty: "LastName" },
  { header: "Student Names", accessor: "students", className: "hidden md:table-cell" },
  { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
  { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "action" },
];

const ParentListPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<Parent>({
    fetcher: useCallback((query) => parentService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "LastName",
  });

  const renderRow = (item: Parent) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:even:bg-gray-700"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">
            {item.email || item.relationship || item.parentId}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.students.length > 0 ? item.students.join(", ") : "No children linked"}
      </td>
      <td className="hidden lg:table-cell">{item.phone || "-"}</td>
      <td className="hidden lg:table-cell">{item.address || "-"}</td>
      <td>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <FormModal
                table="parent"
                type="update"
                data={item}
                onSuccess={list.refetch}
              />
              <FormModal
                table="parent"
                type="delete"
                id={item.parentId}
                onSuccess={list.refetch}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <ListPageShell<Parent>
      title="All Parents"
      table="parent"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="parents"
      canCreate={isAdmin}
    />
  );
};

export default ParentListPage;
