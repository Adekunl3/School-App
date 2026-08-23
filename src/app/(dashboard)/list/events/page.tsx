"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { formatDate } from "@/lib/formHelpers";
import { useIsAdmin } from "@/hooks/useRole";
import { eventService } from "@/services/school";
import type { SchoolEvent } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Title", accessor: "title", sortProperty: "Title" },
  { header: "Class", accessor: "class", sortProperty: "ClassId" },
  { header: "Date", accessor: "date", sortProperty: "EventDate" },
  { header: "Time", accessor: "time", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const EventListPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<SchoolEvent>({
    fetcher: useCallback((query) => eventService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "EventDate",
    initialSortDirection: "Descending",
  });

  const renderRow = (item: SchoolEvent) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:even:bg-gray-700"
    >
      <td className="p-4">
        <h3 className="font-semibold">{item.title || "-"}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
        )}
      </td>
      {/* The API sends "All" for a school-wide event rather than a class code. */}
      <td>{item.class || "All"}</td>
      <td>{formatDate(item.date)}</td>
      <td className="hidden md:table-cell">{item.time || "All day"}</td>
      <td>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <FormModal
                table="event"
                type="update"
                data={item}
                onSuccess={list.refetch}
              />
              <FormModal
                table="event"
                type="delete"
                id={item.eventId}
                onSuccess={list.refetch}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <ListPageShell<SchoolEvent>
      title="All Events"
      table="event"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="events"
      canCreate={isAdmin}
    />
  );
};

export default EventListPage;
