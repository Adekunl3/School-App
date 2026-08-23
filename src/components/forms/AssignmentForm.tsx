"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField from "../InputField";
import SelectField from "../SelectField";
import { ApiError } from "@/lib/apiClient";
import {
  optionalNumber,
  optionalText,
  requiredText,
  toApiDate,
  toDateInput,
} from "@/lib/formHelpers";
import { assignmentService } from "@/services/school";
import type { Assignment, AssignmentCreateInput } from "@/types/school";

const schema = z
  .object({
    title: requiredText(120, "Title"),
    description: optionalText(500),
    subjectId: requiredText(36, "Subject"),
    classId: requiredText(36, "Class"),
    teacherId: optionalText(36),
    startDate: optionalText(30),
    dueDate: requiredText(30, "Due date"),
    maxScore: optionalNumber(0.01, 1000),
  })
  .refine(
    (values) => !values.startDate || !values.dueDate || values.dueDate >= values.startDate,
    { message: "Due date cannot be before the start date.", path: ["dueDate"] }
  );

type Inputs = z.input<typeof schema>;

const AssignmentForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: Assignment;
  onSuccess?: () => void;
}) => {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: data?.title ?? "",
      description: data?.description ?? "",
      subjectId: data?.subjectId ?? "",
      classId: data?.classId ?? "",
      teacherId: data?.teacherId ?? "",
      startDate: toDateInput(data?.startDate),
      dueDate: toDateInput(data?.dueDate),
      maxScore: data?.maxScore ?? "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const parsed = schema.parse(formData);

    const payload: AssignmentCreateInput = {
      title: parsed.title,
      description: parsed.description,
      subjectId: parsed.subjectId,
      classId: parsed.classId,
      teacherId: parsed.teacherId,
      startDate: toApiDate(parsed.startDate),
      dueDate: toApiDate(parsed.dueDate),
      maxScore: parsed.maxScore ?? null,
    };

    setSubmitting(true);

    try {
      if (type === "create") {
        const result = await assignmentService.create(payload);
        toast.success(result.message || "Assignment created successfully!");
      } else {
        const assignmentId = data?.assignmentId;
        if (!assignmentId) {
          throw new ApiError("Cannot update: this assignment has no assignment ID.");
        }

        const result = await assignmentService.update({ ...payload, assignmentId });
        toast.success(result.message || "Assignment updated successfully!");
      }

      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new assignment" : "Update assignment"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
        />
        <SelectField
          label="Subject"
          name="subjectId"
          register={register}
          error={errors.subjectId}
          source="subjects"
        />
        <SelectField
          label="Class"
          name="classId"
          register={register}
          error={errors.classId}
          source="classes"
        />
        <SelectField
          label="Teacher"
          name="teacherId"
          register={register}
          error={errors.teacherId}
          source="teachers"
          placeholder="Unassigned"
        />
      </div>

      <span className="text-xs text-gray-400 font-medium">Dates &amp; marking</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Start Date"
          name="startDate"
          type="date"
          register={register}
          error={errors.startDate}
          inputProps={{ placeholder: "Defaults to today" }}
        />
        <InputField
          label="Due Date"
          name="dueDate"
          type="date"
          register={register}
          error={errors.dueDate}
        />
        <InputField
          label="Max Score"
          name="maxScore"
          type="number"
          register={register}
          error={errors.maxScore}
          inputProps={{ min: 0, step: "0.01", placeholder: "e.g. 20" }}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Description</label>
        <textarea
          rows={3}
          {...register("description")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          placeholder="What the students need to do"
        />
        {errors.description?.message && (
          <p className="text-xs text-red-400">{errors.description.message.toString()}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-60"
      >
        {submitting
          ? type === "create"
            ? "Creating..."
            : "Updating..."
          : type === "create"
          ? "Create"
          : "Update"}
      </button>
    </form>
  );
};

export default AssignmentForm;
