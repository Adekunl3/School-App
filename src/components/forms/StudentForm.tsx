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
import { optionalPastDate, todayInput } from "@/lib/formHelpers";
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
  dateOfBirth: optionalPastDate("Date of birth"),
  bloodType: optionalText(5),
  admissionDate: optionalPastDate("Admission date"),
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
  onCancel,
}: {
  type: "create" | "update";
  data?: Student;
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

  const isCreate = type === "create";

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <FormHeader
        title={isCreate ? "Add a new student" : "Update student"}
        subtitle={
          isCreate
            ? "Fill in the student's details. Fields marked * are required."
            : "Change the details below and save."
        }
      />

      <FormSection title="Enrolment" hint="Admission number, class and grade">
        <InputField
          label="Student ID"
          name="studentId"
          register={register}
          error={errors.studentId}
          className="w-full"
          inputProps={{ readOnly: !isCreate,
            disabled: !isCreate,
            placeholder: isCreate ? "Leave blank to auto-generate" : undefined, }}
        />
        <SelectField
          label="Class"
          name="classId"
          register={register}
          error={errors.classId}
          source="classes"
          placeholder="Unassigned"
          className="w-full"
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
          label="Admission Date"
          name="admissionDate"
          type="date"
          register={register}
          error={errors.admissionDate}
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

      <FormSection title="Contact" hint="How to reach this student" columns="sm:grid-cols-2">
        <InputField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          className="w-full"
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
      </FormSection>

      <FormSection title="Guardian &amp; photo" hint="Linked parent and photo URL" columns="sm:grid-cols-2">
        <SelectField
          label="Parent / Guardian"
          name="parentId"
          register={register}
          error={errors.parentId}
          source="parents"
          placeholder="None linked"
          className="w-full"
        />
        {/* The API stores a photo URL. Direct file upload needs an upload
            endpoint, which the school module does not have yet. */}
        <InputField
          label="Photo URL"
          name="photo"
          register={register}
          error={errors.photo}
          className="w-full"
          inputProps={{ placeholder: "https://..." }}
        />
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={isCreate ? "Create student" : "Save changes"}
        submittingLabel={isCreate ? "Creating..." : "Saving..."}
      />
    </form>
  );
};

export default StudentForm;
