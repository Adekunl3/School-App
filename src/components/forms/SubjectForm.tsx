"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField from "../InputField";
import MultiSelectField from "../MultiSelectField";
import { ApiError } from "@/lib/apiClient";
import { requiredText } from "@/lib/formHelpers";
import { invalidateLookups } from "@/hooks/useLookup";
import { subjectService } from "@/services/school";
import type { Subject } from "@/types/school";

const schema = z.object({
  subjectId: requiredText(36, "Subject code"),
  name: requiredText(80, "Name"),
});

type Inputs = z.input<typeof schema>;

const SubjectForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: Subject;
  onSuccess?: () => void;
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Teacher assignment lives outside react-hook-form because it is a checkbox
  // list, not a single input.
  const [teacherIds, setTeacherIds] = useState<string[]>(data?.teacherIds ?? []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      subjectId: data?.subjectId ?? "",
      name: data?.name ?? "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const parsed = schema.parse(formData);

    setSubmitting(true);

    try {
      if (type === "create") {
        const result = await subjectService.create({
          subjectId: parsed.subjectId,
          name: parsed.name,
          teacherIds,
        });
        toast.success(result.message || "Subject created successfully!");
      } else {
        const subjectId = data?.subjectId;
        if (!subjectId) {
          throw new ApiError("Cannot update: this subject has no subject code.");
        }

        // Always sending the list means the update replaces the assignment set,
        // which is what the checkboxes represent — including clearing it.
        const result = await subjectService.update({
          subjectId,
          name: parsed.name,
          teacherIds,
        });
        toast.success(result.message || "Subject updated successfully!");
      }

      invalidateLookups("subjects");
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
        {type === "create" ? "Create a new subject" : "Update subject"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Subject Code"
          name="subjectId"
          register={register}
          error={errors.subjectId}
          inputProps={{
            placeholder: "e.g. MTH",
            readOnly: type === "update",
            disabled: type === "update",
          }}
        />
        <InputField
          label="Name"
          name="name"
          register={register}
          error={errors.name}
          inputProps={{ placeholder: "e.g. Mathematics" }}
        />
      </div>

      <MultiSelectField
        label="Teachers"
        source="teachers"
        value={teacherIds}
        onChange={setTeacherIds}
        hint="Who is qualified to teach this subject. Leave empty to assign later."
        disabled={submitting}
      />

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

export default SubjectForm;
