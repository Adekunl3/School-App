"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField from "../InputField";
import MultiSelectField from "../MultiSelectField";
import { FormFooter, FormHeader, FormSection } from "../FormLayout";
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
  onCancel,
}: {
  type: "create" | "update";
  data?: Subject;
  onSuccess?: () => void;
  onCancel?: () => void;
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

  const isCreate = type === "create";

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <FormHeader
        title={isCreate ? "Add a new subject" : "Update subject"}
        subtitle={
          isCreate
            ? "Fill in the subject details. Fields marked * are required."
            : "Change the details below and save."
        }
      />

      <FormSection title="Subject details" hint="Code and name" columns="sm:grid-cols-2">
        <InputField
          label="Subject Code"
          name="subjectId"
          register={register}
          error={errors.subjectId}
          required
          className="w-full"
          inputProps={{ placeholder: "e.g. MTH",
            readOnly: !isCreate,
            disabled: !isCreate, }}
        />
        <InputField
          label="Name"
          name="name"
          register={register}
          error={errors.name}
          required
          className="w-full"
          inputProps={{ placeholder: "e.g. Mathematics" }}
        />
      </FormSection>

      <FormSection title="Teachers" hint="Who can teach this subject" columns="sm:grid-cols-1">
        <MultiSelectField
          label="Teachers"
          source="teachers"
          value={teacherIds}
          onChange={setTeacherIds}
          hint="Who is qualified to teach this subject. Leave empty to assign later."
          disabled={submitting}
        />
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={isCreate ? "Create subject" : "Save changes"}
        submittingLabel={isCreate ? "Creating..." : "Saving..."}
      />
    </form>
  );
};

export default SubjectForm;
