"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader } from "@/components/Spinner";
import { useMyTeacher } from "@/hooks/useMyTeacher";
import { homeRouteFor, useRole } from "@/hooks/useRole";
import { useSession } from "@/providers/SessionProvider";

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-xs text-gray-500 dark:text-gray-300 sm:w-40 shrink-0">{label}</span>
    <span className="text-sm break-all">{value || "-"}</span>
  </div>
);

/**
 * The signed-in user's own details. PowerAPI has no profile endpoint, so this
 * shows what the login returned, plus the matching teacher record for a
 * teacher (linked by username).
 */
const ProfilePage = () => {
  const { user, username, lock, signOut } = useSession();
  const role = useRole();
  const { teacher, loading: teacherLoading } = useMyTeacher();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.displayName || username || "User";
  const location = user?.location;

  return (
    <div className="flex-1 p-4 pt-0 flex flex-col xl:flex-row gap-4">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        <div className="bg-lamaSky dark:bg-gray-800 rounded-md p-6 flex items-center gap-4">
          <div className="w-20 h-20 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
            {user?.initials || "U"}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">{displayName}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">{user?.role || role}</p>
            {user?.company && (
              <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{user.company}</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md p-4">
          <h2 className="text-lg font-semibold">Account</h2>
          <Row label="Username" value={user?.username || username} />
          <Row label="Messaging address" value={user?.username || username} />
          <Row label="Role" value={user?.role || role} />
          <Row label="User ID" value={user?.userId} />
          <Row label="Account name" value={user?.uniqueName} />
        </div>

        {location && (
          <div className="bg-white dark:bg-gray-800 rounded-md p-4">
            <h2 className="text-lg font-semibold">School</h2>
            <Row label="Company" value={location.company ?? user?.company} />
            <Row label="Division" value={location.division} />
            <Row label="Department" value={location.department} />
            <Row label="Branch" value={location.branch} />
          </div>
        )}

        {role === "teacher" && (
          <div className="bg-white dark:bg-gray-800 rounded-md p-4">
            <h2 className="text-lg font-semibold">Teacher record</h2>
            {teacherLoading ? (
              <Loader label="Looking up your teacher record..." className="py-3" />
            ) : teacher ? (
              <>
                <Row label="Name" value={teacher.name} />
                <Row label="Teacher ID" value={teacher.teacherId} />
                <Row label="Email" value={teacher.email} />
                <Row label="Phone" value={teacher.phone} />
                <Link
                  href={`/list/teachers/${encodeURIComponent(teacher.teacherId)}`}
                  className="inline-block mt-3 text-sm text-indigo-600 hover:underline"
                >
                  Open full teacher profile
                </Link>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
                No teacher record has your username yet. Ask an administrator to set the
                Username on your teacher record.
              </p>
            )}
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-md p-4">
          <h2 className="text-lg font-semibold">Shortcuts</h2>
          <div className="mt-4 flex gap-3 flex-wrap text-xs">
            <Link className="p-3 rounded-md bg-lamaSkyLight dark:bg-gray-700" href={homeRouteFor(role)}>
              Dashboard
            </Link>
            <Link className="p-3 rounded-md bg-lamaPurpleLight dark:bg-gray-700" href="/list/messages">
              Messages
            </Link>
            <Link className="p-3 rounded-md bg-lamaYellowLight dark:bg-gray-700" href="/settings">
              Settings
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md p-4 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Session</h2>
          <button
            type="button"
            onClick={lock}
            className="py-2 px-4 rounded-md border border-gray-300 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Lock screen
          </button>
          <button
            type="button"
            disabled={signingOut}
            aria-busy={signingOut}
            onClick={async () => {
              setSigningOut(true);
              await signOut();
            }}
            className="py-2 px-4 rounded-md bg-red-600 text-white text-sm disabled:opacity-60"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
