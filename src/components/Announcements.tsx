"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useAsync } from "@/hooks/useAsync";
import { formatDate } from "@/lib/formHelpers";
import { dashboardService } from "@/services/school";
import type { Announcement } from "@/types/school";

/** Cycled so consecutive cards alternate, as the mock version did. */
const CARD_TINTS = ["bg-lamaSkyLight", "bg-lamaPurpleLight", "bg-lamaYellowLight"];

const Announcements = () => {
  const { data, loading, error } = useAsync<Announcement[]>(
    useCallback(() => dashboardService.latestAnnouncements(3), [])
  );

  const announcements = data ?? [];

  return (
    <div className="bg-white p-4 rounded-md dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <Link
          href="/list/announcements"
          className="text-xs text-gray-400 hover:text-indigo-600 hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading announcements...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error.message}</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-gray-500">No announcements yet.</p>
        ) : (
          announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`${CARD_TINTS[index % CARD_TINTS.length]} rounded-md p-4 dark:bg-gray-700`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-medium">{announcement.title}</h2>
                <span className="text-xs text-gray-500 bg-white rounded-md px-1 py-1 shrink-0 dark:bg-gray-800 dark:text-gray-300">
                  {formatDate(announcement.date)}
                </span>
              </div>

              {announcement.description && (
                <p className="text-sm text-gray-500 mt-1">{announcement.description}</p>
              )}

              {/* The API sends "All" for a school-wide notice. */}
              {announcement.class && announcement.class !== "All" && (
                <p className="text-xs text-gray-400 mt-1">
                  Class {announcement.class}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
