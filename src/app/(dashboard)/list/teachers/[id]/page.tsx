"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import FormModal from "@/components/FormModal";
import Performance from "@/components/Performance";
import { useAsync } from "@/hooks/useAsync";
import { useIsAdmin } from "@/hooks/useRole";
import { formatDate } from "@/lib/formHelpers";
import { teacherService } from "@/services/school";
import type { Teacher } from "@/types/school";

const SingleTeacherPage = () => {
  const params = useParams<{ id: string }>();
  const teacherId = params?.id ? decodeURIComponent(params.id) : "";
  const isAdmin = useIsAdmin();

  const { data: teacher, loading, error, refetch } = useAsync<Teacher>(
    useCallback(() => teacherService.byId(teacherId), [teacherId]),
    [teacherId]
  );

  if (loading) {
    return <p className="p-4 text-sm text-gray-500">Loading teacher...</p>;
  }

  if (error || !teacher) {
    return (
      <div className="p-4 text-sm">
        <p className="text-red-600">{error?.detail ?? "Teacher not found."}</p>
        <div className="mt-2 flex gap-4">
          <button
            type="button"
            onClick={refetch}
            className="text-indigo-600 hover:underline"
          >
            Try again
          </button>
          <Link href="/list/teachers" className="text-indigo-600 hover:underline">
            Back to teachers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={teacher.photo || "/avatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
                // Photo URLs are arbitrary, so skip next/image optimisation.
                unoptimized
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">{teacher.name}</h1>
                {isAdmin && (
                  <FormModal
                    table="teacher"
                    type="update"
                    data={teacher}
                    onSuccess={refetch}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {teacher.username
                  ? `Signs in as ${teacher.username}`
                  : "No platform login linked"}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="" width={14} height={14} />
                  <span>{teacher.bloodType || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>{formatDate(teacher.dateOfBirth)}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span className="truncate">{teacher.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{teacher.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {teacher.active ? "Active" : "Inactive"}
                </h1>
                <span className="text-sm text-gray-400">Status</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">{teacher.teacherId}</h1>
                <span className="text-sm text-gray-400">Staff Number</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">{formatDate(teacher.hireDate)}</h1>
                <span className="text-sm text-gray-400">Hired</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold capitalize">
                  {teacher.sex || "-"}
                </h1>
                <span className="text-sm text-gray-400">Sex</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM — this teacher's timetable */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Teacher&apos;s Schedule</h1>
          <BigCalendar teacherId={teacher.teacherId} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            {/* Filtering by teacher needs the list Filters param, which is not
                wired yet, so these link to the unfiltered lists. */}
            <Link className="p-3 rounded-md bg-lamaSkyLight" href="/list/classes">
              Classes
            </Link>
            <Link className="p-3 rounded-md bg-lamaPurpleLight" href="/list/lessons">
              Lessons
            </Link>
            <Link className="p-3 rounded-md bg-lamaYellowLight" href="/list/exams">
              Exams
            </Link>
            <Link className="p-3 rounded-md bg-pink-50" href="/list/assignments">
              Assignments
            </Link>
            <Link className="p-3 rounded-md bg-lamaSkyLight" href="/list/results">
              Results
            </Link>
          </div>
        </div>
        <Performance teacherId={teacher.teacherId} />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
