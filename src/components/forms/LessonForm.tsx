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
  DAY_OPTIONS,
  optionalText,
  optionalTime,
  requiredText,
  toTimeInput,
} from "@/lib/formHelpers";
import { lessonService } from "@/services/school";
import type { Lesson, LessonCreateInput } from "@/types/school";

const schema = z
  .object({
    name: optionalText(80),
    subjectId: requiredText(36, "Subject"),
    classId: requiredText(36, "Class"),
    teacherId: optionalText(36),
    dayOfWeek: optionalText(1),
    startTime: optionalTime,
    endTime: optionalTime,
  })
  .refine(
    (values) => !values.startTime || !values.endTime || values.endTime > values.startTime,
    { message: "End time must be after start time.", path: ["endTime"] }
  );

type Inputs = z.input<typeof schema>;

const LessonForm = ({
  type,
  data,
  onSuccess,
  onCancel,
}: {
  type: "create" | "update";
  data?: Lesson;
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
      name: data?.name ?? "",
      subjectId: data?.subjectId ?? "",
      classId: data?.classId ?? "",
      teacherId: data?.teacherId ?? "",
      dayOfWeek: data?.dayOfWeek !== null && data?.dayOfWeek !== undefined
        ? String(data.dayOfWeek)
        : "",
      startTime: toTimeInput(data?.startTime),
      endTime: toTimeInput(data?.endTime),
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const parsed = schema.parse(formData);

    const payload: LessonCreateInput = {
      name: parsed.name,
      subjectId: parsed.subjectId,
      classId: parsed.classId,
      teacherId: parsed.teacherId,
      dayOfWeek: parsed.dayOfWeek ? Number(parsed.dayOfWeek) : null,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
    };

    setSubmitting(true);

    try {
      if (type === "create") {
        const result = await lessonService.create(payload);
        toast.success(result.message || "Lesson created successfully!");
      } else {
        const lessonId = data?.lessonId;
        if (!lessonId) {
          throw new ApiError("Cannot update: this lesson has no lesson ID.");
        }

        const result = await lessonService.update({ ...payload, lessonId });
        toast.success(result.message || "Lesson updated successfully!");
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
        title={isCreate ? "Create a new lesson" : "Update lesson"}
        subtitle={
          isCreate
            ? "Choose what is taught and when. Fields marked * are required."
            : "Change the details below and save."
        }
      />

      <FormSection title="What is taught" hint="Subject, class and teacher" columns="sm:grid-cols-2">
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
          className="w-full"
        />
        <InputField
          label="Lesson Name"
          name="name"
          register={register}
          error={errors.name}
          className="w-full"
          inputProps={{ placeholder: "Optional" }}
        />
      </FormSection>

      <FormSection title="Timetable slot" hint="Repeats weekly">
        <SelectField
          label="Day"
          name="dayOfWeek"
          register={register}
          error={errors.dayOfWeek}
          options={DAY_OPTIONS}
          placeholder="Not scheduled"
          className="w-full"
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
        {/* The server rejects overlapping slots for the same class or teacher, so
            say so before the attempt rather than only in the error toast. */}
        <p className="text-xs text-gray-400 sm:col-span-2 lg:col-span-3">
          A class and a teacher can each hold only one lesson at a time — overlapping
          slots are rejected.
        </p>
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={isCreate ? "Create lesson" : "Save changes"}
        submittingLabel={isCreate ? "Creating..." : "Saving..."}
      />
    </form>
  );
};

export default LessonForm;
