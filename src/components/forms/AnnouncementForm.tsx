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
import { optionalText, requiredText, toApiDate, toDateInput } from "@/lib/formHelpers";
import { announcementService } from "@/services/school";
import type { Announcement, AnnouncementCreateInput } from "@/types/school";

const schema = z.object({
  title: requiredText(120, "Title"),
  description: optionalText(1000),
  // Blank means school-wide.
  classId: optionalText(36),
  announcementDate: optionalText(30),
});

type Inputs = z.input<typeof schema>;

const AnnouncementForm = ({
  type,
  data,
  onSuccess,
  onCancel,
}: {
  type: "create" | "update";
  data?: Announcement;
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
      classId: data?.classId ?? "",
      announcementDate: toDateInput(data?.date),
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const parsed = schema.parse(formData);

    const payload: AnnouncementCreateInput = {
      title: parsed.title,
      description: parsed.description,
      classId: parsed.classId,
      announcementDate: toApiDate(parsed.announcementDate),
    };

    setSubmitting(true);

    try {
      if (type === "create") {
        const result = await announcementService.create(payload);
        toast.success(result.message || "Announcement posted successfully!");
      } else {
        const announcementId = data?.announcementId;
        if (!announcementId) {
          throw new ApiError("Cannot update: this announcement has no ID.");
        }

        const result = await announcementService.update({ ...payload, announcementId });
        toast.success(result.message || "Announcement updated successfully!");
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
        title={isCreate ? "Post an announcement" : "Update announcement"}
        subtitle={
          isCreate
            ? "Share news with the whole school or a single class. Fields marked * are required."
            : "Change the details below and save."
        }
      />

      <FormSection title="Audience" hint="Who sees this and when" columns="sm:grid-cols-2">
        <InputField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
          required
          className="w-full sm:col-span-2"
        />
        <SelectField
          label="Class"
          name="classId"
          register={register}
          error={errors.classId}
          source="classes"
          placeholder="Whole school"
          className="w-full"
        />
        <InputField
          label="Date"
          name="announcementDate"
          type="date"
          register={register}
          error={errors.announcementDate}
          className="w-full"
          inputProps={{ placeholder: "Defaults to today" }}
        />
      </FormSection>

      <FormSection title="Message" hint="What you want people to know" columns="sm:grid-cols-1">
        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Message
          </label>
          <textarea
            rows={4}
            {...register("description")}
            className={fieldClass(!!errors.description)}
            placeholder="What you want people to know"
          />
          {errors.description?.message && (
            <p className="text-xs text-red-500">{errors.description.message.toString()}</p>
          )}
        </div>
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={isCreate ? "Post announcement" : "Save changes"}
        submittingLabel={isCreate ? "Posting..." : "Saving..."}
      />
    </form>
  );
};

export default AnnouncementForm;
