"use client";

import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import Performance from "@/components/Performance";
import { useMyTeacher } from "@/hooks/useMyTeacher";

/**
 * A teacher's own dashboard.
 *
 * The signed-in login has to be resolved to a teacher record first, because the
 * schedule endpoint filters on staff number, not username.
 */
const TeacherPage = () => {
  const { teacherId, loading, error } = useMyTeacher();

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule</h1>

          {loading ? (
            <p className="p-4 text-sm text-gray-500">Loading your schedule...</p>
          ) : error ? (
            <p className="p-4 text-sm text-red-600">{error.detail}</p>
          ) : !teacherId ? (
            // Deliberately not falling back to the unfiltered timetable — that
            // would show one teacher the whole school's lessons.
            <p className="p-4 text-sm text-gray-500">
              Your login is not linked to a teacher record, so there is no schedule
              to show. Ask an administrator to set the login username on your
              teacher record.
            </p>
          ) : (
            <BigCalendar teacherId={teacherId} />
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        {teacherId && <Performance teacherId={teacherId} />}
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
