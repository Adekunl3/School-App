"use client";

import { useCallback } from "react";
import { useAsync } from "./useAsync";
import { useSession } from "@/providers/SessionProvider";
import { teacherService } from "@/services/school";
import type { Teacher } from "@/types/school";

/**
 * The teacher record belonging to the signed-in user.
 *
 * PowerAPI has no "my school profile" endpoint, and a platform login is linked
 * to a teacher only through `SchoolTeacher.Username`. So this searches the
 * teacher list by username and keeps an exact match — the column is covered by
 * the list endpoint's default search columns, and a filtered unique index makes
 * at most one row match per tenant.
 *
 * Returns null when the signed-in user has no teacher record, which is the
 * normal case for an admin. Callers should not silently fall back to unfiltered
 * data: showing a teacher the whole school's timetable is worse than showing
 * them nothing and saying why.
 *
 * A `GetMyProfile/{token}` endpoint would remove this round trip entirely and is
 * the better long-term fix.
 */
export const useMyTeacher = () => {
  const { user } = useSession();
  const username = user?.username ?? "";

  const { data, loading, error } = useAsync<Teacher | null>(
    useCallback(async () => {
      if (!username) return null;

      const result = await teacherService.list({
        page: 1,
        itemsPerPage: 5,
        searchTerm: username,
      });

      // The search is a partial match, so confirm the username really is this
      // user's rather than trusting the first row back.
      return (
        result.items.find(
          (teacher) =>
            (teacher.username ?? "").toLowerCase() === username.toLowerCase()
        ) ?? null
      );
    }, [username]),
    [username]
  );

  return {
    teacher: data,
    teacherId: data?.teacherId ?? null,
    loading,
    error,
  };
};

export default useMyTeacher;
