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
  optionalText,
  optionalTime,
  requiredText,
  toApiDate,
  toDateInput,
  toTimeInput,
} from "@/lib/formHelpers";
import { eventService } from "@/services/school";
import type { EventCreateInput, SchoolEvent } from "@/types/school";

const schema = z
  .object({
    title: requiredText(120, "Title"),
    description: optionalText(500),
    // Blank means school-wide, which is a valid choice rather than a missing one.
    classId: optionalText(36),
    eventDate: requiredText(30, "Date"),
    startTime: optionalTime,
    endTime: optionalTime,
  })
  .refine(
    (values) => !values.startTime || !values.endTime || values.endTime > values.startTime,
    { message: "End time must be after start time.", path: ["endTime"] }
  );

type Inputs = z.input<typeof schema>;

const EventForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: SchoolEvent;
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
      eventDate: toDateInput(data?.date),
      startTime: toTimeInput(data?.startTime),
      endTime: toTimeInput(data?.endTime),
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const parsed = schema.parse(formData);

    const payload: EventCreateInput = {
      title: parsed.title,
      description: parsed.description,
      classId: parsed.classId,
      eventDate: toApiDate(parsed.eventDate),
      startTime: parsed.startTime,
      endTime: parsed.endTime,
    };

    setSubmitting(true);

    try {
      if (type === "create") {
        const result = await eventService.create(payload);
        toast.success(result.message || "Event created successfully!");
      } else {
        const eventId = data?.eventId;
        if (!eventId) {
          throw new ApiError("Cannot update: this event has no event ID.");
        }

        const result = await eventService.update({ ...payload, eventId });
        toast.success(result.message || "Event updated successfully!");
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
        {type === "create" ? "Create a new event" : "Update event"}
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
          name="eventDate"
          type="date"
          register={register}
          error={errors.eventDate}
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

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Description</label>
        <textarea
          rows={3}
          {...register("description")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
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
            ? "Creating..."
            : "Updating..."
          : type === "create"
          ? "Create"
          : "Update"}
      </button>
    </form>
  );
};

export default EventForm;
