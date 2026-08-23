"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { useIsAdmin } from "@/hooks/useRole";
import { fetchStudents } from "@/services/students";
import type { Student } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Info", accessor: "info", sortProperty: "LastName" },
  {
    header: "Student ID",
    accessor: "studentId",
    className: "hidden md:table-cell",
    sortProperty: "StudentId",
  },
  {
    header: "Grade",
    accessor: "grade",
    className: "hidden md:table-cell",
    sortProperty: "Grade",
  },
  { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
  { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "action" },
];

const StudentListPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<Student>({
    fetcher: useCallback(fetchStudents, []),
    itemsPerPage: 10,
    initialSortProperty: "LastName",
  });

  const renderRow = (item: Student) => (
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
          // rather than requiring every host in next.config.mjs.
          unoptimized
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.class || "Unassigned"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.studentId}</td>
      <td className="hidden md:table-cell">{item.grade ?? "-"}</td>
      <td className="hidden lg:table-cell">{item.phone || "-"}</td>
      <td className="hidden lg:table-cell">{item.address || "-"}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/students/${item.studentId}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="View" width={16} height={16} />
            </button>
          </Link>
          {isAdmin && (
            <>
              <FormModal
                table="student"
                type="update"
                data={item}
                onSuccess={list.refetch}
              />
              <FormModal
                table="student"
                type="delete"
                id={item.studentId}
                onSuccess={list.refetch}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <ListPageShell<Student>
      title="All Students"
      table="student"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="students"
      canCreate={isAdmin}
    />
  );
};

export default StudentListPage;
