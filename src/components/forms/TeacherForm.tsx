"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import InputField from "../InputField";
import { api } from "@/lib/api";
import { endpoints } from "@/utils/apiEndPoints";
import toast from "react-hot-toast";

const createSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(50, { message: "Username must be at most 50 characters long!" }),
  email: z.string().email({ message: "Invalid email address!" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long!" }),
  firstName: z.string().min(1, { message: "First name is required!" }),
  lastName: z.string().min(1, { message: "Last name is required!" }),
});

const updateSchema = createSchema.extend({
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long!" })
    .optional()
    .or(z.literal("")),
});

type Inputs = z.infer<typeof createSchema>;

const TeacherForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(type === "create" ? createSchema : updateSchema),
    defaultValues: {
      username: data?.username,
      email: data?.email,
      firstName: data?.firstName,
      lastName: data?.lastName,
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    setSubmitting(true);
    try {
      if (type === "create") {
        await api.post(endpoints.teachers, formData);
        toast.success("Teacher created successfully!");
      } else {
        const payload: Record<string, unknown> = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await api.put(endpoints.teacher(data.id), payload);
        toast.success("Teacher updated successfully!");
      }
      onSuccess?.();
    } catch (err: any) {
      const message =
        err.response?.data?.title ||
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new teacher" : "Update teacher"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
          inputProps={{ disabled: type === "update" }}
        />
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue=""
          register={register}
          error={errors?.password}
          inputProps={{
            placeholder:
              type === "update" ? "Leave blank to keep current password" : "",
          }}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="firstName"
          defaultValue={data?.firstName}
          register={register}
          error={errors.firstName}
        />
        <InputField
          label="Last Name"
          name="lastName"
          defaultValue={data?.lastName}
          register={register}
          error={errors.lastName}
        />
      </div>
      <button
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-60"
        disabled={submitting}
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
