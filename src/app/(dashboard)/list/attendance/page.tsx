"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { formatDate } from "@/lib/formHelpers";
import { useCanRecord } from "@/hooks/useRole";
import { attendanceService } from "@/services/school";
import type { Attendance } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Student", accessor: "student", sortProperty: "StudentId" },
  { header: "Class", accessor: "class", className: "hidden md:table-cell" },
  { header: "Date", accessor: "date", sortProperty: "AttendanceDate" },
  { header: "Status", accessor: "status", sortProperty: "Present" },
  { header: "Remark", accessor: "remark", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "action" },
];

const STATUS_STYLES: Record<string, string> = {
  Present: "bg-green-100 text-green-700",
  Late: "bg-amber-100 text-amber-700",
  Absent: "bg-red-100 text-red-700",
};

const AttendanceListPage = () => {
  const canRecord = useCanRecord();

  const list = useList<Attendance>({
    fetcher: useCallback((query) => attendanceService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "AttendanceDate",
    initialSortDirection: "Descending",
  });

  const renderRow = (item: Attendance) => {
    // The API derives status; fall back to the flags if it is ever absent.
    const status = item.status ?? (item.present ? (item.late ? "Late" : "Present") : "Absent");

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:even:bg-gray-700"
      >
        <td className="p-4 font-semibold">{item.student || item.studentId || "-"}</td>
        <td className="hidden md:table-cell">{item.class || "-"}</td>
        <td>{formatDate(item.date)}</td>
        <td>
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {status}
          </span>
        </td>
        <td className="hidden lg:table-cell">{item.remark || "-"}</td>
        <td>
          <div className="flex items-center gap-2">
            {canRecord && (
              <>
                <FormModal
                  table="attendance"
                  type="update"
                  data={item}
                  onSuccess={list.refetch}
                />
                <FormModal
                  table="attendance"
                  type="delete"
                  id={item.attendanceId}
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
    <ListPageShell<Attendance>
      title="Student Attendance"
      table="attendance"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="attendance records"
      searchPlaceholder="Search by student..."
      canCreate={canRecord}
    />
  );
};

export default AttendanceListPage;
