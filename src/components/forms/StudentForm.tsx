"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField from "../InputField";
import SelectField from "../SelectField";
import { ApiError } from "@/lib/apiClient";
import { createStudent, updateStudent } from "@/services/students";
import type { Student, StudentCreateInput } from "@/types/school";

/** Blank optional inputs should be omitted, not sent as "". */
const optionalText = (max: number) =>
  z
    .string()
    .max(max, { message: `Must be ${max} characters or fewer` })
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined));

const schema = z.object({
  // Server allocates the admission number when this is left blank.
  studentId: optionalText(36),
  firstName: z
    .string()
    .min(1, { message: "First name is required!" })
    .max(50, { message: "First name must be 50 characters or fewer" }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required!" })
    .max(50, { message: "Last name must be 50 characters or fewer" }),
  middleName: optionalText(50),
  email: z
    .union([z.literal(""), z.string().email({ message: "Invalid email address!" })])
    .optional()
    .transform((value) => (value ? value : undefined)),
  phone: optionalText(20),
  grade: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(15)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : Number(value))),
  classId: optionalText(36),
  address: optionalText(200),
  sex: z.enum(["", "male", "female"]).optional(),
  dateOfBirth: optionalText(30),
  bloodType: optionalText(5),
  admissionDate: optionalText(30),
  parentId: optionalText(36),
  photo: z
    .union([z.literal(""), z.string().url({ message: "Enter a valid photo URL" })])
    .optional()
    .transform((value) => (value ? value : undefined)),
});

type Inputs = z.input<typeof schema>;

/** yyyy-MM-dd for <input type="date">. */
const toDateInput = (value?: string | null): string =>
  value ? value.slice(0, 10) : "";

/** Date-only value the API can parse back into a DateTime. */
const toApiDate = (value?: string): string | undefined =>
  value ? new Date(`${value}T00:00:00Z`).toISOString() : undefined;

const StudentForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: Student;
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
      studentId: data?.studentId ?? "",
      firstName: data?.firstName ?? "",
      lastName: data?.lastName ?? "",
      middleName: data?.middleName ?? "",
      email: data?.email ?? "",
      phone: data?.phone ?? "",
      grade: data?.grade ?? "",
      classId: data?.class ?? "",
      address: data?.address ?? "",
      sex: (data?.sex as "male" | "female" | undefined) ?? "",
      dateOfBirth: toDateInput(data?.dateOfBirth),
      bloodType: data?.bloodType ?? "",
      admissionDate: toDateInput(data?.admissionDate),
      parentId: data?.parentId ?? "",
      photo: data?.photo ?? "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const parsed = schema.parse(formData);

    const payload: StudentCreateInput = {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      middleName: parsed.middleName,
      email: parsed.email,
      phone: parsed.phone,
      grade: parsed.grade ?? null,
      classId: parsed.classId,
      address: parsed.address,
      sex: parsed.sex || undefined,
      dateOfBirth: toApiDate(parsed.dateOfBirth),
      bloodType: parsed.bloodType,
      admissionDate: toApiDate(parsed.admissionDate),
      parentId: parsed.parentId,
      photo: parsed.photo,
    };

    setSubmitting(true);

    try {
      if (type === "create") {
        const result = await createStudent({
          ...payload,
          studentId: parsed.studentId,
        });
        toast.success(result.message || "Student created successfully!");
      } else {
        // The admission number is the key — it must come from the loaded record,
        // never from the (read-only) input.
        const studentId = data?.studentId;
        if (!studentId) {
          throw new ApiError("Cannot update: this student has no student ID.");
        }

        const result = await updateStudent({ ...payload, studentId });
        toast.success(result.message || "Student updated successfully!");
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
        {type === "create" ? "Create a new student" : "Update student"}
      </h1>

      <span className="text-xs text-gray-400 font-medium">Enrolment</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label={
            type === "create" ? "Student ID (leave blank to auto-generate)" : "Student ID"
          }
          name="studentId"
          register={register}
          error={errors.studentId}
          inputProps={{ readOnly: type === "update", disabled: type === "update" }}
        />
        <SelectField
          label="Class"
          name="classId"
          register={register}
          error={errors.classId}
          source="classes"
          placeholder="Unassigned"
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
          label="Admission Date"
          name="admissionDate"
          type="date"
          register={register}
          error={errors.admissionDate}
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
      </div>

      <span className="text-xs text-gray-400 font-medium">Guardian &amp; Photo</span>
      <div className="flex justify-between flex-wrap gap-4">
        <SelectField
          label="Parent / Guardian"
          name="parentId"
          register={register}
          error={errors.parentId}
          source="parents"
          placeholder="None linked"
        />
        {/* The API stores a photo URL. Direct file upload needs an upload
            endpoint, which the school module does not have yet. */}
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

export default StudentForm;
