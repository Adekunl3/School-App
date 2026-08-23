"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import FormModal from "@/components/FormModal";
import Performance from "@/components/Performance";
import { role } from "@/lib/data";
import { ApiError } from "@/lib/apiClient";
import { fetchStudent } from "@/services/students";
import type { Student } from "@/types/school";

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "-"
    : parsed.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const InfoCard = ({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
    <Image src={icon} alt="" width={24} height={24} className="w-6 h-6" />
    <div>
      <h1 className="text-xl font-semibold">{value}</h1>
      <span className="text-sm text-gray-400">{label}</span>
    </div>
  </div>
);

const SingleStudentPage = () => {
  const params = useParams<{ id: string }>();
  const studentId = decodeURIComponent(params?.id ?? "");

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      setStudent(await fetchStudent(studentId));
    } catch (err) {
      setStudent(null);
      setError(err instanceof ApiError ? err : new ApiError("Failed to load student."));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex-1 p-4">
        <p className="text-sm text-gray-500">Loading student...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex-1 p-4">
        <p className="text-sm text-red-600">
          {error?.detail ?? "Student not found."}
        </p>
        <div className="mt-2 flex gap-4 text-sm">
          <button type="button" onClick={load} className="text-indigo-600 hover:underline">
            Try again
          </button>
          <Link href="/list/students" className="text-indigo-600 hover:underline">
            Back to all students
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
                src={student.photo || "/avatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
                unoptimized
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">{student.name}</h1>
                {role === "admin" && (
                  <FormModal
                    table="student"
                    type="update"
                    data={student}
                    onSuccess={load}
                  />
                )}
              </div>

              <p className="text-sm text-gray-600">
                Student ID {student.studentId}
                {student.class ? ` · Class ${student.class}` : ""}
                {student.active ? "" : " · Inactive"}
              </p>

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="Blood type" width={14} height={14} />
                  <span>{student.bloodType || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="Admitted" width={14} height={14} />
                  <span>{formatDate(student.admissionDate)}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="Email" width={14} height={14} />
                  <span className="truncate">{student.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="Phone" width={14} height={14} />
                  <span>{student.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <InfoCard
              icon="/singleBranch.png"
              value={student.grade != null ? String(student.grade) : "-"}
              label="Grade"
            />
            <InfoCard
              icon="/singleClass.png"
              value={student.class || "-"}
              label="Class"
            />
            {/* Attendance and lesson counts need GetWeeklyAttendance / GetLessons,
                which are not built yet — shown as unavailable rather than faked. */}
            <InfoCard icon="/singleAttendance.png" value="—" label="Attendance" />
            <InfoCard icon="/singleLesson.png" value="—" label="Lessons" />
          </div>
        </div>

        {/* GUARDIAN */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-md p-4">
          <h1 className="text-xl font-semibold">Parent / Guardian</h1>
          {student.parent ? (
            <div className="mt-4 flex items-center gap-4">
              <Image
                src={student.parent.photo || "/avatar.png"}
                alt=""
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
                unoptimized
              />
              <div className="text-sm">
                <p className="font-medium">{student.parent.name}</p>
                <p className="text-gray-500">
                  {student.parent.relationship || "Guardian"}
                  {student.parent.phone ? ` · ${student.parent.phone}` : ""}
                </p>
                {student.parent.email && (
                  <p className="text-xs text-gray-400">{student.parent.email}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              {student.parentId
                ? `Linked to parent ${student.parentId}, but that record could not be found.`
                : "No parent or guardian linked to this student."}
            </p>
          )}
        </div>

        {/* BOTTOM */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-md p-4 h-[800px]">
          <h1>Student&apos;s Schedule</h1>
          {/* Placeholder data — needs GetSchedule. */}
          <BigCalendar />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link className="p-3 rounded-md bg-lamaSkyLight" href="/list/lessons">
              Student&apos;s Lessons
            </Link>
            <Link className="p-3 rounded-md bg-lamaPurpleLight" href="/list/teachers">
              Student&apos;s Teachers
            </Link>
            <Link className="p-3 rounded-md bg-pink-50" href="/list/exams">
              Student&apos;s Exams
            </Link>
            <Link className="p-3 rounded-md bg-lamaSkyLight" href="/list/assignments">
              Student&apos;s Assignments
            </Link>
            <Link className="p-3 rounded-md bg-lamaYellowLight" href="/list/results">
              Student&apos;s Results
            </Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
