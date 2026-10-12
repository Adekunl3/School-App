"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField, { fieldClass } from "../InputField";
import { FormFooter, FormHeader, FormSection } from "../FormLayout";
import { ApiError } from "@/lib/apiClient";
import { optionalEmail, optionalText, optionalUrl, requiredText } from "@/lib/formHelpers";
import { invalidateLookups } from "@/hooks/useLookup";
import { parentService } from "@/services/school";
import type { Parent, ParentCreateInput } from "@/types/school";

const schema = z
  .object({
    // Server allocates the id when this is left blank.
    parentId: optionalText(36),
    firstName: requiredText(50, "First name"),
    lastName: requiredText(50, "Last name"),
    email: optionalEmail,
    phone: optionalText(20),
    address: optionalText(200),
    relationship: optionalText(30),
    photo: optionalUrl,
  })
  // Mirrors the server rule: a guardian with neither a phone nor an email
  // cannot be contacted, which defeats the point of the record. Checked here so
  // the message lands on a field instead of arriving as a toast.
  .refine((values) => Boolean(values.phone || values.email), {
    message: "Enter a phone number or an email address.",
    path: ["phone"],
  });

type Inputs = z.input<typeof schema>;

const RELATIONSHIPS = ["Mother", "Father", "Guardian", "Grandparent", "Sibling", "Other"];

const ParentForm = ({
  type,
  data,
  onSuccess,
  onCancel,
}: {
  type: "create" | "update";
  data?: Parent;
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
      parentId: data?.parentId ?? "",
      firstName: data?.firstName ?? "",
      lastName: data?.lastName ?? "",
      email: data?.email ?? "",
      phone: data?.phone ?? "",
      address: data?.address ?? "",
      relationship: data?.relationship ?? "",
      photo: data?.photo ?? "",
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const parsed = schema.parse(formData);

    const payload: ParentCreateInput = {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      address: parsed.address,
      relationship: parsed.relationship,
      photo: parsed.photo,
    };

    setSubmitting(true);

    try {
      if (type === "create") {
        const result = await parentService.create({
          ...payload,
          parentId: parsed.parentId,
        });
        toast.success(result.message || "Parent created successfully!");
      } else {
        const parentId = data?.parentId;
        if (!parentId) {
          throw new ApiError("Cannot update: this parent has no parent ID.");
        }

        const result = await parentService.update({ ...payload, parentId });
        toast.success(result.message || "Parent updated successfully!");
      }

      // The student form's guardian picker is now stale.
      invalidateLookups("parents");
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
        title={isCreate ? "Add a new parent" : "Update parent"}
        subtitle={
          isCreate
            ? "Fill in the parent's details. Fields marked * are required."
            : "Change the details below and save."
        }
      />

      <FormSection title="Identity" hint="Name and relationship to the student">
        <InputField
          label="Parent ID"
          name="parentId"
          register={register}
          error={errors.parentId}
          className="w-full"
          inputProps={{ readOnly: !isCreate,
            disabled: !isCreate,
            placeholder: isCreate ? "Leave blank to auto-generate" : undefined, }}
        />
        <InputField
          label="First Name"
          name="firstName"
          register={register}
          error={errors.firstName}
          required
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
        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Relationship
          </label>
          <select className={fieldClass(!!errors.relationship)} {...register("relationship")}>
            <option value="">Not specified</option>
            {RELATIONSHIPS.map((relationship) => (
              <option key={relationship} value={relationship}>
                {relationship}
              </option>
            ))}
          </select>
          {errors.relationship?.message && (
            <p className="text-xs text-red-500">{errors.relationship.message.toString()}</p>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Contact"
        hint="At least one of phone or email is required"
        columns="sm:grid-cols-2"
      >
        <InputField
          label="Phone"
          name="phone"
          type="tel"
          register={register}
          error={errors.phone}
          className="w-full"
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          className="w-full"
        />
        <InputField
          label="Address"
          name="address"
          register={register}
          error={errors.address}
          className="w-full sm:col-span-2"
        />
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
        submitLabel={isCreate ? "Create parent" : "Save changes"}
        submittingLabel={isCreate ? "Creating..." : "Saving..."}
      />
    </form>
  );
};

export default ParentForm;
