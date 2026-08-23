"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { formatDate } from "@/lib/formHelpers";
import { useIsAdmin } from "@/hooks/useRole";
import { teacherService } from "@/services/school";
import type { Teacher } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Info", accessor: "info", sortProperty: "LastName" },
  {
    header: "Teacher ID",
    accessor: "teacherId",
    className: "hidden md:table-cell",
    sortProperty: "TeacherId",
  },
  { header: "Email", accessor: "email", className: "hidden lg:table-cell" },
  { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
  {
    header: "Joined",
    accessor: "hireDate",
    className: "hidden xl:table-cell",
    sortProperty: "HireDate",
  },
  { header: "Actions", accessor: "action" },
];

const TeacherListPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<Teacher>({
    fetcher: useCallback((query) => teacherService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "LastName",
  });

  const renderRow = (item: Teacher) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:even:bg-gray-700"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.photo || "/avatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
          // Remote photo URLs are arbitrary, so skip next/image optimisation
          // rather than allow-listing every host in next.config.mjs.
          unoptimized
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.username || "No login"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.teacherId}</td>
      <td className="hidden lg:table-cell">{item.email || "-"}</td>
      <td className="hidden lg:table-cell">{item.phone || "-"}</td>
      <td className="hidden xl:table-cell">{formatDate(item.hireDate)}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/teachers/${item.teacherId}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="View" width={16} height={16} />
            </button>
          </Link>
          {isAdmin && (
            <>
              <FormModal
                table="teacher"
                type="update"
                data={item}
                onSuccess={list.refetch}
              />
              <FormModal
                table="teacher"
                type="delete"
                id={item.teacherId}
                onSuccess={list.refetch}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <ListPageShell<Teacher>
      title="All Teachers"
      table="teacher"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="teachers"
      canCreate={isAdmin}
    />
  );
};

export default TeacherListPage;
