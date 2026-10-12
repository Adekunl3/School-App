"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/apiClient";
import { MODULE_LABELS, moduleServices, type ModuleName } from "@/services/school";
import { Loader } from "@/components/Spinner";
import Modal from "@/components/Modal";

// Lazy-loaded so opening one module's page does not pull in every other
// module's form and validation schema.
const loading = () => <Loader label="Loading form..." className="p-4" />;

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
const FeeItemForm = dynamic(() => import("./forms/FeeItemForm"), { loading });
const FeeBillForm = dynamic(() => import("./forms/FeeBillForm"), { loading });
const FeePaymentForm = dynamic(() => import("./forms/FeePaymentForm"), { loading });

type FormRenderer = (
  type: "create" | "update",
  data: any,
  onSuccess: () => void,
  onCancel: () => void
) => JSX.Element;

const forms: Record<ModuleName, FormRenderer> = {
  teacher: (type, data, onSuccess, onCancel) => (
    <TeacherForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  student: (type, data, onSuccess, onCancel) => (
    <StudentForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  parent: (type, data, onSuccess, onCancel) => (
    <ParentForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  class: (type, data, onSuccess, onCancel) => (
    <ClassForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  subject: (type, data, onSuccess, onCancel) => (
    <SubjectForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  lesson: (type, data, onSuccess, onCancel) => (
    <LessonForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  exam: (type, data, onSuccess, onCancel) => (
    <ExamForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  assignment: (type, data, onSuccess, onCancel) => (
    <AssignmentForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  result: (type, data, onSuccess, onCancel) => (
    <ResultForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  event: (type, data, onSuccess, onCancel) => (
    <EventForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  announcement: (type, data, onSuccess, onCancel) => (
    <AnnouncementForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  attendance: (type, data, onSuccess, onCancel) => (
    <AttendanceForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  feeItem: (type, data, onSuccess, onCancel) => (
    <FeeItemForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  feeBill: (type, data, onSuccess, onCancel) => (
    <FeeBillForm type={type} data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ),
  feePayment: (type, data, onSuccess, onCancel) => (
    <FeePaymentForm onSuccess={onSuccess} onCancel={onCancel} />
  ),
};

/** Delete prompts where the generic "all data will be lost" would mislead. */
const DELETE_PROMPTS: Partial<Record<ModuleName, string>> = {
  feePayment: "Reverse this payment? The amount goes back onto the bill balance.",
  feeBill: "Delete this bill? Only bills with no payments can be deleted.",
  feeItem: "Delete this fee item? Items already on bills cannot be deleted — mark them inactive instead.",
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
            {DELETE_PROMPTS[table] ??
              `All data will be lost. Are you sure you want to delete this ${MODULE_LABELS[table] ?? table}?`}
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
              aria-busy={deleting}
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
      render(type, data, finish, close)
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
        title={`${type} ${MODULE_LABELS[table] ?? table}`}
        aria-label={`${type} ${MODULE_LABELS[table] ?? table}`}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>

      {open && <Modal onClose={close}>{renderBody()}</Modal>}
    </>
  );
};

export default FormModal;
