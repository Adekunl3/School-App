"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField, { fieldClass } from "../InputField";
import SelectField from "../SelectField";
import { FormFooter, FormHeader, FormSection } from "../FormLayout";
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
  onCancel,
}: {
  type: "create" | "update";
  data?: Assignment;
  onSuccess?: () => void;
  onCancel?: () => void;
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

  const isCreate = type === "create";

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <FormHeader
        title={isCreate ? "Create a new assignment" : "Update assignment"}
        subtitle={
          isCreate
            ? "Describe the assignment and set its dates. Fields marked * are required."
            : "Change the details below and save."
        }
      />

      <FormSection
        title="Assignment details"
        hint="Title, subject, class and teacher"
        columns="sm:grid-cols-2"
      >
        <InputField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
          required
          className="w-full sm:col-span-2"
        />
        <SelectField
          label="Subject"
          name="subjectId"
          register={register}
          error={errors.subjectId}
          source="subjects"
          className="w-full"
        />
        <SelectField
          label="Class"
          name="classId"
          register={register}
          error={errors.classId}
          source="classes"
          className="w-full"
        />
        <SelectField
          label="Teacher"
          name="teacherId"
          register={register}
          error={errors.teacherId}
          source="teachers"
          placeholder="Unassigned"
          className="w-full sm:col-span-2"
        />
        <div className="flex w-full flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Description
          </label>
          <textarea
            rows={3}
            {...register("description")}
            className={fieldClass(!!errors.description)}
            placeholder="What the students need to do"
          />
          {errors.description?.message && (
            <p className="text-xs text-red-500">{errors.description.message.toString()}</p>
          )}
        </div>
      </FormSection>

      <FormSection title="Dates & marking" hint="When it starts, when it is due, and the score">
        <InputField
          label="Start Date"
          name="startDate"
          type="date"
          register={register}
          error={errors.startDate}
          className="w-full"
          inputProps={{ placeholder: "Defaults to today" }}
        />
        <InputField
          label="Due Date"
          name="dueDate"
          type="date"
          register={register}
          error={errors.dueDate}
          required
          className="w-full"
        />
        <InputField
          label="Max Score"
          name="maxScore"
          type="number"
          register={register}
          error={errors.maxScore}
          className="w-full"
          inputProps={{ min: 0, step: "0.01", placeholder: "e.g. 20" }}
        />
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={isCreate ? "Create assignment" : "Save changes"}
        submittingLabel={isCreate ? "Creating..." : "Saving..."}
      />
    </form>
  );
};

export default AssignmentForm;
