"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import RemoteSelectField from "../RemoteSelectField";
import { ApiError, type ListQuery } from "@/lib/apiClient";
import { toApiDate, toDateInput } from "@/lib/formHelpers";
import {
  assignmentService,
  examService,
  resultService,
  studentService,
} from "@/services/school";
import type {
  Assignment,
  Exam,
  Result,
  ResultCreateInput,
  ResultType,
  Student,
} from "@/types/school";

/**
 * Marks are entered against an exam or an assignment. Subject, class, teacher
 * and max score are all inherited from whichever source is chosen, so this form
 * deliberately does not offer them — the server copies them across.
 *
 * Written with plain state rather than react-hook-form because the shape is
 * conditional (which source field applies depends on the type radio) and the two
 * pickers are async comboboxes rather than registered inputs.
 */
const ResultForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: Result;
  onSuccess?: () => void;
}) => {
  const isUpdate = type === "update";

  const [resultType, setResultType] = useState<ResultType>(
    (data?.type as ResultType) || "exam"
  );
  const [studentId, setStudentId] = useState(data?.studentId ?? "");
  const [examId, setExamId] = useState(data?.examId ?? "");
  const [assignmentId, setAssignmentId] = useState(data?.assignmentId ?? "");
  const [score, setScore] = useState(data?.score !== null && data?.score !== undefined ? String(data.score) : "");
  const [resultDate, setResultDate] = useState(toDateInput(data?.date));
  const [remark, setRemark] = useState(data?.remark ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Stable identities, or RemoteSelectField refetches on every keystroke render.
  const searchStudents = useCallback(
    (query: ListQuery) => studentService.list(query),
    []
  );
  const searchExams = useCallback((query: ListQuery) => examService.list(query), []);
  const searchAssignments = useCallback(
    (query: ListQuery) => assignmentService.list(query),
    []
  );

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!isUpdate) {
      if (!studentId) next.studentId = "Select a student.";
      if (resultType === "exam" && !examId) next.examId = "Select an exam.";
      if (resultType === "assignment" && !assignmentId) {
        next.assignmentId = "Select an assignment.";
      }
    }

    const parsedScore = Number(score);
    if (score.trim() === "") {
      next.score = "Score is required.";
    } else if (Number.isNaN(parsedScore) || parsedScore < 0) {
      next.score = "Score must be zero or more.";
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
        const resultId = data?.resultId;
        if (!resultId) {
          throw new ApiError("Cannot update: this result has no result ID.");
        }

        // Only the mark, date and remark are editable — moving a result to a
        // different student or exam is a delete-and-recreate.
        const response = await resultService.update({
          resultId,
          score: Number(score),
          resultDate: toApiDate(resultDate),
          remark: remark.trim() || undefined,
        });
        toast.success(response.message || "Result updated successfully!");
      } else {
        const payload: ResultCreateInput = {
          studentId,
          resultType,
          examId: resultType === "exam" ? examId : undefined,
          assignmentId: resultType === "assignment" ? assignmentId : undefined,
          score: Number(score),
          resultDate: toApiDate(resultDate),
          remark: remark.trim() || undefined,
        };

        const response = await resultService.create(payload);
        toast.success(response.message || "Result recorded successfully!");
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
        {isUpdate ? "Update result" : "Record a result"}
      </h1>

      {isUpdate ? (
        <div className="text-sm text-gray-500 flex flex-col gap-1">
          <span>
            <span className="text-gray-400">Student:</span> {data?.student || "-"}
          </span>
          <span>
            <span className="text-gray-400">For:</span> {data?.subject || "-"} (
            {data?.type || "-"})
          </span>
          <span className="text-xs text-gray-400">
            Student and source cannot be changed — delete and re-record instead.
          </span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500">Result for</span>
            <div className="flex gap-4 text-sm">
              {(["exam", "assignment"] as ResultType[]).map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resultType"
                    value={option}
                    checked={resultType === option}
                    onChange={() => {
                      setResultType(option);
                      // Clear the other source so a stale id is never submitted.
                      if (option === "exam") setAssignmentId("");
                      else setExamId("");
                    }}
                  />
                  <span className="capitalize">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between flex-wrap gap-4">
            <RemoteSelectField<Student>
              label="Student"
              fetcher={searchStudents}
              getId={(item) => item.studentId}
              getLabel={(item) => item.name}
              getHint={(item) => item.class}
              value={studentId}
              onChange={setStudentId}
              selectedLabel={data?.student}
              placeholder="Search students..."
              error={errors.studentId}
              sortProperty="LastName"
            />

            {resultType === "exam" ? (
              <RemoteSelectField<Exam>
                label="Exam"
                fetcher={searchExams}
                getId={(item) => item.examId}
                getLabel={(item) => item.title || item.examId}
                getHint={(item) =>
                  [item.subject, item.class].filter(Boolean).join(" · ") || null
                }
                value={examId}
                onChange={setExamId}
                placeholder="Search exams..."
                error={errors.examId}
                sortProperty="ExamDate"
              />
            ) : (
              <RemoteSelectField<Assignment>
                label="Assignment"
                fetcher={searchAssignments}
                getId={(item) => item.assignmentId}
                getLabel={(item) => item.title || item.assignmentId}
                getHint={(item) =>
                  [item.subject, item.class].filter(Boolean).join(" · ") || null
                }
                value={assignmentId}
                onChange={setAssignmentId}
                placeholder="Search assignments..."
                error={errors.assignmentId}
                sortProperty="DueDate"
              />
            )}
          </div>
        </>
      )}

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Score {data?.maxScore ? `(out of ${data.maxScore})` : ""}
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={score}
            onChange={(event) => setScore(event.target.value)}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          />
          {errors.score && <p className="text-xs text-red-400">{errors.score}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Date</label>
          <input
            type="date"
            value={resultDate}
            onChange={(event) => setResultDate(event.target.value)}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          />
          <p className="text-xs text-gray-400">Defaults to the exam/assignment date.</p>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Remark</label>
          <input
            type="text"
            value={remark}
            maxLength={200}
            onChange={(event) => setRemark(event.target.value)}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            placeholder="Optional"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400">
        The score is checked against the source&apos;s max score, and a student can
        only have one result per exam or assignment.
      </p>

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

export default ResultForm;
