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

const inputClass = "ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full";

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
}: {
  type: "create" | "update";
  data?: FeeItem;
  onSuccess?: () => void;
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
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{isUpdate ? "Update fee item" : "Add a fee item"}</h1>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-xs text-gray-500">Name</label>
          <input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
            placeholder="e.g. Tuition"
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-xs text-gray-500">Amount (₦)</label>
          <MoneyInput value={amount} onChange={setAmount} className={inputClass} />
          {errors.amount && <p className="text-xs text-red-400">{errors.amount}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Session</label>
          <input
            value={session}
            onChange={(event) => setSession(event.target.value)}
            className={inputClass}
            placeholder="2026/2027"
          />
          {errors.session && <p className="text-xs text-red-400">{errors.session}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Term</label>
          <select
            value={term}
            onChange={(event) => setTerm(Number(event.target.value) as Term)}
            className={inputClass}
          >
            {TERM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Class</label>
          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className={inputClass}
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
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Active — inactive items are left off newly generated bills
          </label>
        )}
      </div>

      {isUpdate && (
        <p className="text-xs text-gray-400">
          Changes apply to bills generated from now on. Bills already issued keep their amounts.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-60"
      >
        {submitting ? "Saving..." : isUpdate ? "Update" : "Create"}
      </button>
    </form>
  );
};

export default FeeItemForm;
