"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { formatDayOfWeek } from "@/lib/formHelpers";
import { useIsAdmin } from "@/hooks/useRole";
import { lessonService } from "@/services/school";
import type { Lesson } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Subject", accessor: "subject", sortProperty: "SubjectId" },
  { header: "Class", accessor: "class", sortProperty: "ClassId" },
  { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
  {
    header: "Day",
    accessor: "day",
    className: "hidden md:table-cell",
    sortProperty: "DayOfWeek",
  },
  {
    header: "Time",
    accessor: "time",
    className: "hidden lg:table-cell",
    sortProperty: "StartTime",
  },
  { header: "Actions", accessor: "action" },
];

const LessonListPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<Lesson>({
    fetcher: useCallback((query) => lessonService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "DayOfWeek",
  });

  const renderRow = (item: Lesson) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:even:bg-gray-700"
    >
      <td className="p-4">
        <h3 className="font-semibold">{item.subject || "-"}</h3>
        {item.name && <p className="text-xs text-gray-500">{item.name}</p>}
      </td>
      <td>{item.class || "-"}</td>
      <td className="hidden md:table-cell">{item.teacher || "Unassigned"}</td>
      <td className="hidden md:table-cell">{formatDayOfWeek(item.dayOfWeek)}</td>
      <td className="hidden lg:table-cell">
        {item.startTime && item.endTime
          ? `${item.startTime} - ${item.endTime}`
          : "Not scheduled"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <FormModal
                table="lesson"
                type="update"
                data={item}
                onSuccess={list.refetch}
              />
              <FormModal
                table="lesson"
                type="delete"
                id={item.lessonId}
                onSuccess={list.refetch}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <ListPageShell<Lesson>
      title="All Lessons"
      table="lesson"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="lessons"
      canCreate={isAdmin}
    />
  );
};

export default LessonListPage;
