"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField from "../InputField";
import SelectField from "../SelectField";
import { ApiError } from "@/lib/apiClient";
import { optionalInt, optionalText, requiredText } from "@/lib/formHelpers";
import { invalidateLookups } from "@/hooks/useLookup";
import { classService } from "@/services/school";
import type { ClassCreateInput, SchoolClass } from "@/types/school";

const schema = z.object({
  // Unlike students and teachers, a class code is human-meaningful ("1B") so
  // there is nothing sensible for the server to auto-generate.
  classId: requiredText(36, "Class code"),
  name: optionalText(50),
  capacity: optionalInt(1, 200),
  grade: optionalInt(1, 15),
  supervisorId: optionalText(36),
});

type Inputs = z.input<typeof schema>;

const ClassForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: SchoolClass;
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
      classId: data?.classId ?? "",
      name: data?.name ?? "",
      capacity: data?.capacity ?? "",
      grade: data?.grade ?? "",
      supervisorId: data?.supervisorId ?? "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const parsed = schema.parse(formData);

    const payload: Omit<ClassCreateInput, "classId"> = {
      name: parsed.name,
      capacity: parsed.capacity ?? null,
      grade: parsed.grade ?? null,
      supervisorId: parsed.supervisorId,
    };

    setSubmitting(true);

    try {
      if (type === "create") {
        const result = await classService.create({
          ...payload,
          classId: parsed.classId,
        });
        toast.success(result.message || "Class created successfully!");
      } else {
        const classId = data?.classId;
        if (!classId) {
          throw new ApiError("Cannot update: this class has no class code.");
        }

        const result = await classService.update({ ...payload, classId });
        toast.success(result.message || "Class updated successfully!");
      }

      // Class and grade pickers across the app are now stale.
      invalidateLookups("classes", "grades");
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
        {type === "create" ? "Create a new class" : "Update class"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Class Code"
          name="classId"
          register={register}
          error={errors.classId}
          inputProps={{
            placeholder: "e.g. 1B",
            readOnly: type === "update",
            disabled: type === "update",
          }}
        />
        <InputField
          label="Display Name"
          name="name"
          register={register}
          error={errors.name}
          inputProps={{ placeholder: "Defaults to the class code" }}
        />
        <InputField
          label="Grade"
          name="grade"
          type="number"
          register={register}
          error={errors.grade}
          inputProps={{ min: 1, max: 15 }}
        />
        <InputField
          label="Capacity"
          name="capacity"
          type="number"
          register={register}
          error={errors.capacity}
          inputProps={{ min: 1, max: 200 }}
        />
        <SelectField
          label="Form Teacher"
          name="supervisorId"
          register={register}
          error={errors.supervisorId}
          source="teachers"
          placeholder="Unassigned"
        />
      </div>

      {/* The server refuses a capacity below the current roster, so warn before
          the user submits something that will bounce. */}
      {type === "update" && data && data.enrolledCount > 0 && (
        <p className="text-xs text-gray-400">
          {data.enrolledCount} student{data.enrolledCount === 1 ? "" : "s"} currently
          assigned — capacity cannot be set below this.
        </p>
      )}

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

export default ClassForm;
