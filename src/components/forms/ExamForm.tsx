"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField from "../InputField";
import SelectField from "../SelectField";
import { FormFooter, FormHeader, FormSection } from "../FormLayout";
import { ApiError } from "@/lib/apiClient";
import {
  optionalNumber,
  optionalText,
  optionalTime,
  requiredText,
  toApiDate,
  toDateInput,
  toTimeInput,
} from "@/lib/formHelpers";
import { examService } from "@/services/school";
import type { Exam, ExamCreateInput } from "@/types/school";

const schema = z
  .object({
    title: optionalText(120),
    subjectId: requiredText(36, "Subject"),
    classId: requiredText(36, "Class"),
    teacherId: optionalText(36),
    examDate: requiredText(30, "Exam date"),
    startTime: optionalTime,
    endTime: optionalTime,
    maxScore: optionalNumber(0.01, 1000),
  })
  .refine(
    (values) => !values.startTime || !values.endTime || values.endTime > values.startTime,
    { message: "End time must be after start time.", path: ["endTime"] }
  );

type Inputs = z.input<typeof schema>;

const ExamForm = ({
  type,
  data,
  onSuccess,
  onCancel,
}: {
  type: "create" | "update";
  data?: Exam;
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
      subjectId: data?.subjectId ?? "",
      classId: data?.classId ?? "",
      teacherId: data?.teacherId ?? "",
      examDate: toDateInput(data?.date),
      startTime: toTimeInput(data?.startTime),
      endTime: toTimeInput(data?.endTime),
      maxScore: data?.maxScore ?? "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const parsed = schema.parse(formData);

    const payload: ExamCreateInput = {
      title: parsed.title,
      subjectId: parsed.subjectId,
      classId: parsed.classId,
      teacherId: parsed.teacherId,
      examDate: toApiDate(parsed.examDate),
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      maxScore: parsed.maxScore ?? null,
    };

    setSubmitting(true);

    try {
      if (type === "create") {
        const result = await examService.create(payload);
        toast.success(result.message || "Exam created successfully!");
      } else {
        const examId = data?.examId;
        if (!examId) {
          throw new ApiError("Cannot update: this exam has no exam ID.");
        }

        const result = await examService.update({ ...payload, examId });
        toast.success(result.message || "Exam updated successfully!");
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
        title={isCreate ? "Create a new exam" : "Update exam"}
        subtitle={
          isCreate
            ? "Set up the exam and its schedule. Fields marked * are required."
            : "Change the details below and save."
        }
      />

      <FormSection
        title="Exam details"
        hint="Title, subject, class and teacher"
        columns="sm:grid-cols-2"
      >
        <InputField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
          className="w-full sm:col-span-2"
          inputProps={{ placeholder: "e.g. Mid-term" }}
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
      </FormSection>

      <FormSection
        title="Schedule & marking"
        hint="Date, time and maximum score"
        columns="sm:grid-cols-2"
      >
        <InputField
          label="Date"
          name="examDate"
          type="date"
          register={register}
          error={errors.examDate}
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
          inputProps={{ min: 0, step: "0.01", placeholder: "e.g. 100" }}
        />
        <InputField
          label="Start Time"
          name="startTime"
          type="time"
          register={register}
          error={errors.startTime}
          className="w-full"
        />
        <InputField
          label="End Time"
          name="endTime"
          type="time"
          register={register}
          error={errors.endTime}
          className="w-full"
        />
        {/* Results snapshot MaxScore, and the server refuses to lower it below a
            mark already awarded. */}
        {!isCreate && (
          <p className="text-xs text-gray-400 sm:col-span-2">
            Max score cannot be lowered below the highest mark already recorded.
          </p>
        )}
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={isCreate ? "Create exam" : "Save changes"}
        submittingLabel={isCreate ? "Creating..." : "Saving..."}
      />
    </form>
  );
};

export default ExamForm;
