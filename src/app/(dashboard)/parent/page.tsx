"use client";

import Announcements from "@/components/Announcements";

/**
 * A parent's own dashboard.
 *
 * Same gap as the student page, one step further removed: SchoolParent has no
 * Username column, so a parent login cannot be resolved to a parent record, let
 * alone to their children's classes.
 *
 * Once that link exists this becomes: resolve the parent, read `studentIds` from
 * the parent record (GetParentById already returns it), then render one
 * BigCalendar per child with `studentId` set.
 */
const ParentPage = () => {
  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule</h1>
          <p className="p-4 text-sm text-gray-500">
            Your children&apos;s timetables are not available yet: parent logins are
            not linked to parent records, so we cannot tell which children to show.
          </p>
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;
