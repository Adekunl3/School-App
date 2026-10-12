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
  onCancel,
}: {
  type: "create" | "update";
  data?: SchoolClass;
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

  const isCreate = type === "create";

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <FormHeader
        title={isCreate ? "Add a new class" : "Update class"}
        subtitle={
          isCreate
            ? "Fill in the class details. Fields marked * are required."
            : "Change the details below and save."
        }
      />

      <FormSection
        title="Class details"
        hint="Code, grade, capacity and form teacher"
        columns="sm:grid-cols-2"
      >
        <InputField
          label="Class Code"
          name="classId"
          register={register}
          error={errors.classId}
          required
          className="w-full"
          inputProps={{ placeholder: "e.g. 1B",
            readOnly: !isCreate,
            disabled: !isCreate, }}
        />
        <InputField
          label="Display Name"
          name="name"
          register={register}
          error={errors.name}
          className="w-full"
          inputProps={{ placeholder: "Defaults to the class code" }}
        />
        <InputField
          label="Grade"
          name="grade"
          type="number"
          register={register}
          error={errors.grade}
          className="w-full"
          inputProps={{ min: 1, max: 15 }}
        />
        <InputField
          label="Capacity"
          name="capacity"
          type="number"
          register={register}
          error={errors.capacity}
          className="w-full"
          inputProps={{ min: 1, max: 200 }}
        />
        <SelectField
          label="Form Teacher"
          name="supervisorId"
          register={register}
          error={errors.supervisorId}
          source="teachers"
          placeholder="Unassigned"
          className="w-full sm:col-span-2"
        />

        {/* The server refuses a capacity below the current roster, so warn before
            the user submits something that will bounce. */}
        {type === "update" && data && data.enrolledCount > 0 && (
          <p className="text-xs text-gray-400 sm:col-span-2">
            {data.enrolledCount} student{data.enrolledCount === 1 ? "" : "s"} currently
            assigned — capacity cannot be set below this.
          </p>
        )}
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={isCreate ? "Create class" : "Save changes"}
        submittingLabel={isCreate ? "Creating..." : "Saving..."}
      />
    </form>
  );
};

export default ClassForm;
