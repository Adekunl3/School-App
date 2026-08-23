"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import RemoteSelectField from "../RemoteSelectField";
import { ApiError, type ListQuery } from "@/lib/apiClient";
import { toApiDate, toDateInput } from "@/lib/formHelpers";
import { attendanceService, studentService } from "@/services/school";
import type { Attendance, AttendanceCreateInput, Student } from "@/types/school";

/** Today, as yyyy-MM-dd in the viewer's own timezone. */
const todayInput = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

/**
 * A register entry for one student on one day.
 *
 * "Late" is only meaningful for someone who turned up, so marking absent clears
 * it — the server enforces the same rule and would otherwise reject the save.
 */
const AttendanceForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: Attendance;
  onSuccess?: () => void;
}) => {
  const isUpdate = type === "update";

  const [studentId, setStudentId] = useState(data?.studentId ?? "");
  const [attendanceDate, setAttendanceDate] = useState(
    data?.date ? toDateInput(data.date) : todayInput()
  );
  const [present, setPresent] = useState(data?.present ?? true);
  const [late, setLate] = useState(data?.late ?? false);
  const [remark, setRemark] = useState(data?.remark ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const searchStudents = useCallback(
    (query: ListQuery) => studentService.list(query),
    []
  );

  const setPresence = (value: boolean) => {
    setPresent(value);
    if (!value) setLate(false);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!isUpdate && !studentId) next.studentId = "Select a student.";
    if (!attendanceDate) {
      next.attendanceDate = "Pick a date.";
    } else if (attendanceDate > todayInput()) {
      next.attendanceDate = "Attendance cannot be recorded for a future date.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      if (isUpdate) {
        const attendanceId = data?.attendanceId;
        if (!attendanceId) {
          throw new ApiError("Cannot update: this record has no attendance ID.");
        }

        const result = await attendanceService.update({
          attendanceId,
          attendanceDate: toApiDate(attendanceDate),
          present,
          late,
          remark: remark.trim() || undefined,
        });
        toast.success(result.message || "Attendance updated successfully!");
      } else {
        const payload: AttendanceCreateInput = {
          studentId,
          // ClassId is omitted on purpose — the server defaults it to the
          // student's current class.
          attendanceDate: toApiDate(attendanceDate),
          present,
          late,
          remark: remark.trim() || undefined,
        };

        const result = await attendanceService.create(payload);
        toast.success(result.message || "Attendance recorded successfully!");
      }

      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {isUpdate ? "Update attendance" : "Record attendance"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        {isUpdate ? (
          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <span className="text-xs text-gray-500">Student</span>
            <span className="text-sm">{data?.student || data?.studentId || "-"}</span>
            <span className="text-xs text-gray-400">{data?.class || "No class"}</span>
          </div>
        ) : (
          <RemoteSelectField<Student>
            label="Student"
            fetcher={searchStudents}
            getId={(item) => item.studentId}
            getLabel={(item) => item.name}
            getHint={(item) => item.class}
            value={studentId}
            onChange={setStudentId}
            placeholder="Search students..."
            error={errors.studentId}
            sortProperty="LastName"
          />
        )}

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Date</label>
          <input
            type="date"
            value={attendanceDate}
            max={todayInput()}
            onChange={(event) => setAttendanceDate(event.target.value)}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          />
          {errors.attendanceDate && (
            <p className="text-xs text-red-400">{errors.attendanceDate}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <span className="text-xs text-gray-500">Status</span>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="presence"
                checked={present}
                onChange={() => setPresence(true)}
              />
              Present
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="presence"
                checked={!present}
                onChange={() => setPresence(false)}
              />
              Absent
            </label>
          </div>

          <label
            className={`flex items-center gap-2 text-sm ${
              present ? "cursor-pointer" : "opacity-50"
            }`}
          >
            <input
              type="checkbox"
              checked={late}
              disabled={!present}
              onChange={(event) => setLate(event.target.checked)}
            />
            Arrived late
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Remark</label>
        <input
          type="text"
          value={remark}
          maxLength={200}
          onChange={(event) => setRemark(event.target.value)}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          placeholder="Optional — e.g. reason for absence"
        />
      </div>

      {!isUpdate && (
        <p className="text-xs text-gray-400">
          Each student can have only one record per day. If one already exists, edit
          it instead.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-60"
      >
        {submitting ? (isUpdate ? "Updating..." : "Recording...") : isUpdate ? "Update" : "Record"}
      </button>
    </form>
  );
};

export default AttendanceForm;
