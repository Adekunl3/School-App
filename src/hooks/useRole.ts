"use client";

import { useSession } from "@/providers/SessionProvider";

export type Role = "admin" | "teacher" | "student" | "parent";

const KNOWN_ROLES: Role[] = ["admin", "teacher", "student", "parent"];

/**
 * The signed-in user's role, from the login response's `accType`.
 *
 * Replaces the hardcoded `role` constant in lib/data.ts, which made every
 * viewer look like an admin and so showed create/edit/delete controls to
 * everyone. An unrecognised role falls back to the most restricted one rather
 * than the most privileged.
 */
export const useRole = (): Role => {
  const { user } = useSession();

  const raw = (user?.role ?? "").trim().toLowerCase();
  const match = KNOWN_ROLES.find((role) => raw.includes(role));

  return match ?? "student";
};

/** True when the user may create, edit and delete records. */
export const useIsAdmin = (): boolean => useRole() === "admin";

/** True for roles that may record marks and attendance. */
export const useCanRecord = (): boolean => {
  const role = useRole();
  return role === "admin" || role === "teacher";
};

export default useRole;
