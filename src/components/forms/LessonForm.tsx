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
}: {
  type: "create" | "update";
  data?: Lesson;
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

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new lesson" : "Update lesson"}
      </h1>

      <span className="text-xs text-gray-400 font-medium">What is taught</span>
      <div className="flex justify-between flex-wrap gap-4">
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
        <InputField
          label="Lesson Name"
          name="name"
          register={register}
          error={errors.name}
          inputProps={{ placeholder: "Optional" }}
        />
      </div>

      <span className="text-xs text-gray-400 font-medium">
        Timetable slot — repeats weekly
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <SelectField
          label="Day"
          name="dayOfWeek"
          register={register}
          error={errors.dayOfWeek}
          options={DAY_OPTIONS}
          placeholder="Not scheduled"
        />
        <InputField
          label="Start Time"
          name="startTime"
          type="time"
          register={register}
          error={errors.startTime}
        />
        <InputField
          label="End Time"
          name="endTime"
          type="time"
          register={register}
          error={errors.endTime}
        />
      </div>

      {/* The server rejects overlapping slots for the same class or teacher, so
          say so before the attempt rather than only in the error toast. */}
      <p className="text-xs text-gray-400">
        A class and a teacher can each hold only one lesson at a time — overlapping
        slots are rejected.
      </p>

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

export default LessonForm;
