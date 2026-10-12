"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/apiClient";
import { useLookup } from "@/hooks/useLookup";
import {
  TERM_OPTIONS,
  currentSession,
  feeItemService,
  isValidSession,
} from "@/services/fees";
import type { FeeItem, Term } from "@/types/school";
import MoneyInput from "@/components/MoneyInput";
import { fieldClass } from "../InputField";
import { FormFooter, FormHeader, FormSection } from "../FormLayout";

const labelClass = "text-xs font-medium text-gray-600 dark:text-gray-300";
const wrapClass = "flex w-full flex-col gap-1.5";
const errClass = "text-xs text-red-500";

/**
 * One charge for a session + term, for a single class or every class.
 *
 * Editing an item does not touch bills already issued — they keep the amount
 * they were generated with — so the form says so rather than surprising anyone.
 */
const FeeItemForm = ({
  type,
  data,
  onSuccess,
  onCancel,
}: {
  type: "create" | "update";
  data?: FeeItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
  const isUpdate = type === "update";
  const classes = useLookup("classes");

  const [name, setName] = useState(data?.name ?? "");
  const [amount, setAmount] = useState(data ? String(data.amount) : "");
  const [session, setSession] = useState(data?.session ?? currentSession());
  const [term, setTerm] = useState<Term>(data?.term ?? 1);
  const [classId, setClassId] = useState(data?.classId ?? "");
  const [active, setActive] = useState(data?.active ?? true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const value = Number(amount);

    if (!name.trim()) next.name = "Name is required.";
    if (amount.trim() === "" || Number.isNaN(value) || value <= 0) {
      next.amount = "Enter an amount greater than zero.";
    }
    if (!isValidSession(session)) next.session = "Use the form 2026/2027.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        amount: Number(amount),
        session: session.trim(),
        term,
      };

      const response = isUpdate
        ? await feeItemService.update({
            feeItemId: data!.feeItemId,
            ...payload,
            // "" tells the server to switch the item to every class.
            classId,
            active,
          })
        : await feeItemService.create({ ...payload, classId: classId || undefined });

      toast.success(response.message || "Fee item saved.");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <FormHeader
        title={isUpdate ? "Update fee item" : "Add a fee item"}
        subtitle={
          isUpdate
            ? "Changes apply to bills generated from now on. Bills already issued keep their amounts."
            : "Define a charge for a session and term. Fields marked * are required."
        }
      />

      <FormSection title="Charge" hint="What is being charged and how much" columns="sm:grid-cols-2">
        <div className={wrapClass}>
          <label className={labelClass}>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass(!!errors.name)}
            placeholder="e.g. Tuition"
          />
          {errors.name && <p className={errClass}>{errors.name}</p>}
        </div>

        <div className={wrapClass}>
          <label className={labelClass}>
            Amount (₦) <span className="text-red-500">*</span>
          </label>
          <MoneyInput value={amount} onChange={setAmount} className={fieldClass(!!errors.amount)} />
          {errors.amount && <p className={errClass}>{errors.amount}</p>}
        </div>
      </FormSection>

      <FormSection title="Applies to" hint="Session, term and class">
        <div className={wrapClass}>
          <label className={labelClass}>
            Session <span className="text-red-500">*</span>
          </label>
          <input
            value={session}
            onChange={(event) => setSession(event.target.value)}
            className={fieldClass(!!errors.session)}
            placeholder="2026/2027"
          />
          {errors.session && <p className={errClass}>{errors.session}</p>}
        </div>

        <div className={wrapClass}>
          <label className={labelClass}>Term</label>
          <select
            value={term}
            onChange={(event) => setTerm(Number(event.target.value) as Term)}
            className={fieldClass(false)}
          >
            {TERM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={wrapClass}>
          <label className={labelClass}>Class</label>
          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className={fieldClass(false)}
            disabled={classes.loading}
          >
            <option value="">All classes</option>
            {classes.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        {isUpdate && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200 sm:col-span-2 lg:col-span-3">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Active — inactive items are left off newly generated bills
          </label>
        )}
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={isUpdate ? "Save changes" : "Create fee item"}
        submittingLabel={isUpdate ? "Saving..." : "Creating..."}
      />
    </form>
  );
};

export default FeeItemForm;
