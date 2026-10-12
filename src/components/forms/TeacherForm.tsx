"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField, { fieldClass } from "../InputField";
import { ApiError } from "@/lib/apiClient";
import { FormFooter, FormHeader, FormSection } from "../FormLayout";
import {
  optionalEmail,
  optionalText,
  optionalPastDate,
  optionalUrl,
  requiredText,
  toApiDate,
  toDateInput,
  todayInput,
} from "@/lib/formHelpers";
import { invalidateLookups } from "@/hooks/useLookup";
import { teacherService } from "@/services/school";
import type { Teacher, TeacherCreateInput } from "@/types/school";

const schema = z.object({
  // Server allocates the staff number when this is left blank.
  teacherId: optionalText(36),
  username: optionalText(100),
  firstName: requiredText(50, "First name"),
  lastName: requiredText(50, "Last name"),
  middleName: optionalText(50),
  email: optionalEmail,
  phone: optionalText(20),
  address: optionalText(200),
  sex: z.enum(["", "male", "female"]).optional(),
  dateOfBirth: optionalPastDate("Date of birth"),
  bloodType: optionalText(5),
  hireDate: optionalPastDate("Hire date"),
  photo: optionalUrl,
});

type Inputs = z.input<typeof schema>;

const TeacherForm = ({
  type,
  data,
  onSuccess,
  onCancel,
}: {
  type: "create" | "update";
  data?: Teacher;
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
      teacherId: data?.teacherId ?? "",
      username: data?.username ?? "",
      firstName: data?.firstName ?? "",
      lastName: data?.lastName ?? "",
      middleName: data?.middleName ?? "",
      email: data?.email ?? "",
      phone: data?.phone ?? "",
      address: data?.address ?? "",
      sex: (data?.sex as "male" | "female" | undefined) ?? "",
      dateOfBirth: toDateInput(data?.dateOfBirth),
      bloodType: data?.bloodType ?? "",
      hireDate: toDateInput(data?.hireDate),
      photo: data?.photo ?? "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const parsed = schema.parse(formData);

    const payload: TeacherCreateInput = {
      username: parsed.username,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      middleName: parsed.middleName,
      email: parsed.email,
      phone: parsed.phone,
      address: parsed.address,
      sex: parsed.sex || undefined,
      dateOfBirth: toApiDate(parsed.dateOfBirth),
      bloodType: parsed.bloodType,
      hireDate: toApiDate(parsed.hireDate),
      photo: parsed.photo,
    };

    setSubmitting(true);

    try {
      if (type === "create") {
        const result = await teacherService.create({
          ...payload,
          teacherId: parsed.teacherId,
        });
        toast.success(result.message || "Teacher created successfully!");
      } else {
        // The staff number is the key — take it from the loaded record, never
        // from the (read-only) input.
        const teacherId = data?.teacherId;
        if (!teacherId) {
          throw new ApiError("Cannot update: this teacher has no teacher ID.");
        }

        const result = await teacherService.update({ ...payload, teacherId });
        toast.success(result.message || "Teacher updated successfully!");
      }

      // Teacher pickers elsewhere (class supervisor, lesson teacher) are now stale.
      invalidateLookups("teachers");
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
        title={isCreate ? "Add a new teacher" : "Update teacher"}
        subtitle={
          isCreate
            ? "Fill in the teacher's details. Fields marked * are required."
            : "Change the details below and save."
        }
      />

      <FormSection title="Employment" hint="Staff number, login and hire date">
        <InputField
          label="Teacher ID"
          name="teacherId"
          register={register}
          error={errors.teacherId}
          className="w-full"
          inputProps={{
            readOnly: !isCreate,
            disabled: !isCreate,
            placeholder: isCreate ? "Leave blank to auto-generate" : undefined,
          }}
        />
        <InputField
          label="Login Username"
          name="username"
          register={register}
          error={errors.username}
          className="w-full"
          inputProps={{ placeholder: "Optional" }}
        />
        <InputField
          label="Hire Date"
          name="hireDate"
          type="date"
          register={register}
          error={errors.hireDate}
          className="w-full"
          inputProps={{ max: todayInput() }}
        />
      </FormSection>

      <FormSection title="Personal information" hint="Name and basic details">
        <InputField
          label="First Name"
          name="firstName"
          register={register}
          error={errors.firstName}
          required
          className="w-full"
        />
        <InputField
          label="Middle Name"
          name="middleName"
          register={register}
          error={errors.middleName}
          className="w-full"
        />
        <InputField
          label="Last Name"
          name="lastName"
          register={register}
          error={errors.lastName}
          required
          className="w-full"
        />
        <InputField
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          register={register}
          error={errors.dateOfBirth}
          className="w-full"
          inputProps={{ max: todayInput() }}
        />

        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Sex
          </label>
          <select className={fieldClass(!!errors.sex)} {...register("sex")}>
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-500">{errors.sex.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Blood Type"
          name="bloodType"
          register={register}
          error={errors.bloodType}
          className="w-full"
          inputProps={{ placeholder: "e.g. A+" }}
        />
      </FormSection>

      <FormSection title="Contact" hint="How to reach this teacher" columns="sm:grid-cols-2">
        <InputField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          className="w-full"
          inputProps={{ placeholder: "name@example.com" }}
        />
        <InputField
          label="Phone"
          name="phone"
          type="tel"
          register={register}
          error={errors.phone}
          className="w-full"
        />
        <InputField
          label="Address"
          name="address"
          register={register}
          error={errors.address}
          className="w-full sm:col-span-2"
        />
        {/* The API stores a photo URL; there is no upload endpoint yet. */}
        <InputField
          label="Photo URL"
          name="photo"
          register={register}
          error={errors.photo}
          className="w-full sm:col-span-2"
          inputProps={{ placeholder: "https://..." }}
        />
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={isCreate ? "Create teacher" : "Save changes"}
        submittingLabel={isCreate ? "Creating..." : "Saving..."}
      />
    </form>
  );
};

export default TeacherForm;
