"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/apiClient";
import { moduleServices, type ModuleName } from "@/services/school";

// Lazy-loaded so opening one module's page does not pull in every other
// module's form and validation schema.
const loading = () => <p className="p-4 text-sm text-gray-500">Loading form...</p>;

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), { loading });
const StudentForm = dynamic(() => import("./forms/StudentForm"), { loading });
const ParentForm = dynamic(() => import("./forms/ParentForm"), { loading });
const ClassForm = dynamic(() => import("./forms/ClassForm"), { loading });
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), { loading });
const LessonForm = dynamic(() => import("./forms/LessonForm"), { loading });
const ExamForm = dynamic(() => import("./forms/ExamForm"), { loading });
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), { loading });
const ResultForm = dynamic(() => import("./forms/ResultForm"), { loading });
const EventForm = dynamic(() => import("./forms/EventForm"), { loading });
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), { loading });
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), { loading });

type FormRenderer = (
  type: "create" | "update",
  data: any,
  onSuccess: () => void
) => JSX.Element;

const forms: Record<ModuleName, FormRenderer> = {
  teacher: (type, data, onSuccess) => (
    <TeacherForm type={type} data={data} onSuccess={onSuccess} />
  ),
  student: (type, data, onSuccess) => (
    <StudentForm type={type} data={data} onSuccess={onSuccess} />
  ),
  parent: (type, data, onSuccess) => (
    <ParentForm type={type} data={data} onSuccess={onSuccess} />
  ),
  class: (type, data, onSuccess) => (
    <ClassForm type={type} data={data} onSuccess={onSuccess} />
  ),
  subject: (type, data, onSuccess) => (
    <SubjectForm type={type} data={data} onSuccess={onSuccess} />
  ),
  lesson: (type, data, onSuccess) => (
    <LessonForm type={type} data={data} onSuccess={onSuccess} />
  ),
  exam: (type, data, onSuccess) => (
    <ExamForm type={type} data={data} onSuccess={onSuccess} />
  ),
  assignment: (type, data, onSuccess) => (
    <AssignmentForm type={type} data={data} onSuccess={onSuccess} />
  ),
  result: (type, data, onSuccess) => (
    <ResultForm type={type} data={data} onSuccess={onSuccess} />
  ),
  event: (type, data, onSuccess) => (
    <EventForm type={type} data={data} onSuccess={onSuccess} />
  ),
  announcement: (type, data, onSuccess) => (
    <AnnouncementForm type={type} data={data} onSuccess={onSuccess} />
  ),
  attendance: (type, data, onSuccess) => (
    <AttendanceForm type={type} data={data} onSuccess={onSuccess} />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  onSuccess,
}: {
  table: ModuleName;
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  onSuccess?: () => void;
}) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-lamaPurple";

  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const close = () => setOpen(false);

  /** Closes the modal and lets the caller refresh its list. */
  const finish = () => {
    setOpen(false);
    onSuccess?.();
  };

  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);

    try {
      // One registry lookup instead of a branch per module. Any module the
      // registry knows about can be deleted from any list page.
      const result = await moduleServices[table].remove(String(id));
      toast.success(result.message || `Deleted successfully.`);
      finish();
    } catch (err) {
      // The services return a readable reason when a delete is blocked by
      // dependents (a class with students, a parent with children), so surface
      // it rather than a generic failure.
      toast.error(
        err instanceof ApiError ? err.detail : "Failed to delete. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const renderBody = () => {
    if (type === "delete") {
      if (!id) {
        return <p className="p-4 text-sm text-red-500">Nothing selected to delete.</p>;
      }

      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleDelete();
          }}
          className="p-4 flex flex-col gap-4"
        >
          <span className="text-center font-medium">
            All data will be lost. Are you sure you want to delete this {table}?
          </span>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={close}
              disabled={deleting}
              className="border border-gray-300 py-2 px-4 rounded-md disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting}
              className="bg-red-700 text-white py-2 px-4 rounded-md border-none disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      );
    }

    const render = forms[table];
    return render ? (
      render(type, data, finish)
    ) : (
      <p className="p-4 text-sm text-red-500">No form available for {table}.</p>
    );
  };

  return (
    <>
      <button
        type="button"
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
        title={`${type} ${table}`}
        aria-label={`${type} ${table}`}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>

      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-md relative w-full md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[45%] max-h-[90vh] overflow-y-auto">
            {renderBody()}
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer"
              onClick={close}
              aria-label="Close"
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
