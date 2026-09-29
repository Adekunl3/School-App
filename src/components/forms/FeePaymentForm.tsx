"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import RemoteSelectField from "../RemoteSelectField";
import { ApiError, type ListQuery } from "@/lib/apiClient";
import { toApiDate } from "@/lib/formHelpers";
import { PAYMENT_METHODS, feeService, formatMoney } from "@/services/fees";
import { studentService } from "@/services/school";
import type { FeeBill, PaymentMethod, Student } from "@/types/school";
import MoneyInput from "@/components/MoneyInput";

const inputClass = "ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full";

const todayInput = (): string => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

/**
 * Records money against one bill. Opened from a bill row it is fixed to that
 * bill; opened on its own it asks for the student, then which of their unpaid
 * bills the money is for.
 *
 * Payments cannot be edited — a mistake is reversed and re-recorded, so the
 * history of what was received stays intact.
 */
const FeePaymentForm = ({
  bill: fixedBill,
  onSuccess,
}: {
  type?: "create" | "update";
  data?: unknown;
  /** Pay this bill; skips the student and bill pickers. */
  bill?: FeeBill;
  onSuccess?: () => void;
}) => {
  const [studentId, setStudentId] = useState(fixedBill?.studentId ?? "");
  const [bills, setBills] = useState<FeeBill[]>(fixedBill ? [fixedBill] : []);
  const [billId, setBillId] = useState(fixedBill?.billId ?? "");
  const [loadingBills, setLoadingBills] = useState(false);

  const [amount, setAmount] = useState(fixedBill ? String(fixedBill.balance) : "");
  const [paymentDate, setPaymentDate] = useState(todayInput());
  const [method, setMethod] = useState<PaymentMethod>("Transfer");
  const [reference, setReference] = useState("");
  const [remark, setRemark] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const searchStudents = useCallback((query: ListQuery) => studentService.list(query), []);

  // Picking a student loads what they still owe.
  useEffect(() => {
    if (fixedBill || !studentId) return;

    let active = true;
    setLoadingBills(true);
    setBills([]);
    setBillId("");

    feeService
      .bills({ page: 1, itemsPerPage: 20 }, { studentId, status: "outstanding" })
      .then((result) => {
        if (!active) return;
        setBills(result.items);
        if (result.items.length > 0) {
          setBillId(result.items[0].billId);
          setAmount(String(result.items[0].balance));
        }
      })
      .catch((err) => {
        if (active) toast.error(err instanceof ApiError ? err.detail : "Failed to load bills.");
      })
      .finally(() => {
        if (active) setLoadingBills(false);
      });

    return () => {
      active = false;
    };
  }, [fixedBill, studentId]);

  const selected = bills.find((b) => b.billId === billId);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const value = Number(amount);

    if (!billId) next.billId = studentId ? "This student has nothing outstanding." : "Select a student.";
    if (amount.trim() === "" || Number.isNaN(value) || value <= 0) {
      next.amount = "Enter an amount greater than zero.";
    } else if (selected && value > selected.balance) {
      next.amount = `The balance is only ${formatMoney(selected.balance)}.`;
    }
    if (paymentDate > todayInput()) next.paymentDate = "Payment date cannot be in the future.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await feeService.addPayment({
        billId,
        amount: Number(amount),
        paymentDate: toApiDate(paymentDate),
        method,
        reference: reference.trim() || undefined,
        remark: remark.trim() || undefined,
      });
      toast.success(response.message || "Payment recorded.");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Record a payment</h1>

      {fixedBill ? (
        <div className="text-sm text-gray-600">
          <p className="font-medium">{fixedBill.student}</p>
          <p>
            {fixedBill.termName} {fixedBill.session} · Bill {fixedBill.billId} · Balance{" "}
            <span className="font-semibold">{formatMoney(fixedBill.balance)}</span>
          </p>
        </div>
      ) : (
        <div className="flex justify-between flex-wrap gap-4">
          <RemoteSelectField<Student>
            label="Student"
            fetcher={searchStudents}
            getId={(item) => item.studentId}
            getLabel={(item) => item.name}
            getHint={(item) => item.class}
            value={studentId}
            onChange={setStudentId}
            placeholder="Search students..."
            error={!studentId ? errors.billId : undefined}
            sortProperty="LastName"
          />

          <div className="flex flex-col gap-2 w-full md:w-[48%]">
            <label className="text-xs text-gray-500">Bill</label>
            <select
              value={billId}
              onChange={(e) => {
                setBillId(e.target.value);
                const next = bills.find((b) => b.billId === e.target.value);
                if (next) setAmount(String(next.balance));
              }}
              className={inputClass}
              disabled={loadingBills || bills.length === 0}
            >
              {bills.length === 0 && (
                <option value="">{loadingBills ? "Loading..." : "No outstanding bills"}</option>
              )}
              {bills.map((b) => (
                <option key={b.billId} value={b.billId}>
                  {b.termName} {b.session} — owes {formatMoney(b.balance)}
                </option>
              ))}
            </select>
            {studentId && errors.billId && <p className="text-xs text-red-400">{errors.billId}</p>}
          </div>
        </div>
      )}

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Amount (₦)</label>
          <MoneyInput value={amount} onChange={setAmount} className={inputClass} />
          {errors.amount && <p className="text-xs text-red-400">{errors.amount}</p>}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Date paid</label>
          <input
            type="date"
            value={paymentDate}
            max={todayInput()}
            onChange={(e) => setPaymentDate(e.target.value)}
            className={inputClass}
          />
          {errors.paymentDate && <p className="text-xs text-red-400">{errors.paymentDate}</p>}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className={inputClass}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-xs text-gray-500">Reference</label>
          <input
            value={reference}
            maxLength={60}
            onChange={(e) => setReference(e.target.value)}
            className={inputClass}
            placeholder="Bank or teller reference"
          />
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-xs text-gray-500">Remark</label>
          <input
            value={remark}
            maxLength={200}
            onChange={(e) => setRemark(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-60"
      >
        {submitting ? "Recording..." : "Record payment"}
      </button>
    </form>
  );
};

export default FeePaymentForm;
