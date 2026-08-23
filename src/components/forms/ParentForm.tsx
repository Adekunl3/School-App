"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import InputField from "../InputField";
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
}: {
  type: "create" | "update";
  data?: Parent;
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

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new parent" : "Update parent"}
      </h1>

      <span className="text-xs text-gray-400 font-medium">Identity</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label={
            type === "create" ? "Parent ID (leave blank to auto-generate)" : "Parent ID"
          }
          name="parentId"
          register={register}
          error={errors.parentId}
          inputProps={{ readOnly: type === "update", disabled: type === "update" }}
        />
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

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Relationship</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("relationship")}
          >
            <option value="">Not specified</option>
            {RELATIONSHIPS.map((relationship) => (
              <option key={relationship} value={relationship}>
                {relationship}
              </option>
            ))}
          </select>
          {errors.relationship?.message && (
            <p className="text-xs text-red-400">
              {errors.relationship.message.toString()}
            </p>
          )}
        </div>
      </div>

      <span className="text-xs text-gray-400 font-medium">
        Contact — at least one of phone or email is required
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Phone" name="phone" register={register} error={errors.phone} />
        <InputField label="Email" name="email" register={register} error={errors.email} />
        <InputField
          label="Address"
          name="address"
          register={register}
          error={errors.address}
        />
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

export default ParentForm;
