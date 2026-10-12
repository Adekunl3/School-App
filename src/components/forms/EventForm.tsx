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
  onCancel,
}: {
  type: "create" | "update";
  data?: SchoolEvent;
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

  const isCreate = type === "create";

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <FormHeader
        title={isCreate ? "Create a new event" : "Update event"}
        subtitle={
          isCreate
            ? "Schedule an event for the whole school or a single class. Fields marked * are required."
            : "Change the details below and save."
        }
      />

      <FormSection
        title="Event details"
        hint="What is happening and who it is for"
        columns="sm:grid-cols-2"
      >
        <InputField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
          required
          className="w-full"
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
        <div className="flex w-full flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Description
          </label>
          <textarea
            rows={3}
            {...register("description")}
            className={fieldClass(!!errors.description)}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-500">{errors.description.message.toString()}</p>
          )}
        </div>
      </FormSection>

      <FormSection title="Schedule" hint="Date and time of the event">
        <InputField
          label="Date"
          name="eventDate"
          type="date"
          register={register}
          error={errors.eventDate}
          required
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
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={isCreate ? "Create event" : "Save changes"}
        submittingLabel={isCreate ? "Creating..." : "Saving..."}
      />
    </form>
  );
};

export default EventForm;
