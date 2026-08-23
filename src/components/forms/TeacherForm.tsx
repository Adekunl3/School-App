"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField from "../InputField";
import { ApiError } from "@/lib/apiClient";
import {
  optionalEmail,
  optionalText,
  optionalUrl,
  requiredText,
  toApiDate,
  toDateInput,
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
  dateOfBirth: optionalText(30),
  bloodType: optionalText(5),
  hireDate: optionalText(30),
  photo: optionalUrl,
});

type Inputs = z.input<typeof schema>;

const TeacherForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: Teacher;
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

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new teacher" : "Update teacher"}
      </h1>

      <span className="text-xs text-gray-400 font-medium">Employment</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label={
            type === "create" ? "Teacher ID (leave blank to auto-generate)" : "Teacher ID"
          }
          name="teacherId"
          register={register}
          error={errors.teacherId}
          inputProps={{ readOnly: type === "update", disabled: type === "update" }}
        />
        <InputField
          label="Login Username"
          name="username"
          register={register}
          error={errors.username}
          inputProps={{ placeholder: "Optional" }}
        />
        <InputField
          label="Hire Date"
          name="hireDate"
          type="date"
          register={register}
          error={errors.hireDate}
        />
      </div>

      <span className="text-xs text-gray-400 font-medium">Personal Information</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="firstName"
          register={register}
          error={errors.firstName}
        />
        <InputField
          label="Last Name"
          name="lastName"
          register={register}
          error={errors.lastName}
        />
        <InputField
          label="Middle Name"
          name="middleName"
          register={register}
          error={errors.middleName}
        />
        <InputField label="Email" name="email" register={register} error={errors.email} />
        <InputField label="Phone" name="phone" register={register} error={errors.phone} />
        <InputField
          label="Address"
          name="address"
          register={register}
          error={errors.address}
        />
        <InputField
          label="Blood Type"
          name="bloodType"
          register={register}
          error={errors.bloodType}
          inputProps={{ placeholder: "e.g. A+" }}
        />
        <InputField
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          register={register}
          error={errors.dateOfBirth}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sex</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
          >
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">{errors.sex.message.toString()}</p>
          )}
        </div>

        {/* The API stores a photo URL; there is no upload endpoint yet. */}
        <InputField
          label="Photo URL"
          name="photo"
          register={register}
          error={errors.photo}
          inputProps={{ placeholder: "https://..." }}
        />
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

export default TeacherForm;
