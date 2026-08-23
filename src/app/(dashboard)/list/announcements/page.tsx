"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { formatDate } from "@/lib/formHelpers";
import { useIsAdmin } from "@/hooks/useRole";
import { announcementService } from "@/services/school";
import type { Announcement } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Title", accessor: "title", sortProperty: "Title" },
  { header: "Class", accessor: "class", sortProperty: "ClassId" },
  { header: "Date", accessor: "date", sortProperty: "AnnouncementDate" },
  { header: "Actions", accessor: "action" },
];

const AnnouncementListPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<Announcement>({
    fetcher: useCallback((query) => announcementService.list(query), []),
    itemsPerPage: 10,
    initialSortProperty: "AnnouncementDate",
    initialSortDirection: "Descending",
  });

  const renderRow = (item: Announcement) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:even:bg-gray-700"
    >
      <td className="p-4">
        <h3 className="font-semibold">{item.title || "-"}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 max-w-md">
            {item.description}
          </p>
        )}
      </td>
      <td>{item.class || "All"}</td>
      <td>{formatDate(item.date)}</td>
      <td>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <FormModal
                table="announcement"
                type="update"
                data={item}
                onSuccess={list.refetch}
              />
              <FormModal
                table="announcement"
                type="delete"
                id={item.announcementId}
                onSuccess={list.refetch}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <ListPageShell<Announcement>
      title="All Announcements"
      table="announcement"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="announcements"
      canCreate={isAdmin}
    />
  );
};

export default AnnouncementListPage;
