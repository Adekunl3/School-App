"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField from "../InputField";
import SelectField from "../SelectField";
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
}: {
  type: "create" | "update";
  data?: Announcement;
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

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Post an announcement" : "Update announcement"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Title" name="title" register={register} error={errors.title} />
        <SelectField
          label="Class"
          name="classId"
          register={register}
          error={errors.classId}
          source="classes"
          placeholder="Whole school"
        />
        <InputField
          label="Date"
          name="announcementDate"
          type="date"
          register={register}
          error={errors.announcementDate}
          inputProps={{ placeholder: "Defaults to today" }}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Message</label>
        <textarea
          rows={4}
          {...register("description")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          placeholder="What you want people to know"
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
            ? "Posting..."
            : "Updating..."
          : type === "create"
          ? "Post"
          : "Update"}
      </button>
    </form>
  );
};

export default AnnouncementForm;
