"use client";

import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import EventCalendar from "@/components/EventCalendar";

/**
 * A student's own dashboard.
 *
 * The schedule is not filtered yet: SchoolStudent has no Username column, so
 * there is nothing linking a platform login to a student record — unlike
 * teachers, which have one. Resolving "which student am I" needs either that
 * column or a `GetMyProfile/{token}` endpoint.
 *
 * Rather than show one student the whole school's timetable, this says what is
 * missing. Once the link exists, pass `studentId` to BigCalendar — the schedule
 * endpoint already accepts it and resolves the student's class server-side.
 */
const StudentPage = () => {
  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule</h1>
          <p className="p-4 text-sm text-gray-500">
            Your timetable is not available yet: student logins are not linked to
            student records, so we cannot tell which class to show. An administrator
            can find your class under Students.
          </p>
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
