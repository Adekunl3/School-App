"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/apiClient";
import { useAsync } from "@/hooks/useAsync";
import { useLookup } from "@/hooks/useLookup";
import { formatDate, toApiDate, toDateInput } from "@/lib/formHelpers";
import {
  STATUS_STYLES,
  TERM_OPTIONS,
  currentSession,
  feeService,
  formatMoney,
  isValidSession,
} from "@/services/fees";
import type { FeeBill, Term } from "@/types/school";
import { Loader } from "@/components/Spinner";
import MoneyInput from "@/components/MoneyInput";

const inputClass = "ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full";

/**
 * "Create" generates bills for a term from its fee items: every active student
 * in the chosen class, or the whole school. Students already billed for the
 * term are skipped, so running it again after admissions is safe.
 */
const GenerateBills = ({ onSuccess }: { onSuccess?: () => void }) => {
  const classes = useLookup("classes");

  const [session, setSession] = useState(currentSession());
  const [term, setTerm] = useState<Term>(1);
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isValidSession(session)) {
      setError("Use the form 2026/2027.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const response = await feeService.generateBills({
        session: session.trim(),
        term,
        classId: classId || undefined,
        dueDate: toApiDate(dueDate),
      });

      if (response.data && response.data.created > 0) {
        toast.success(response.message);
        onSuccess?.();
      } else {
        // Nothing new — keep the form open so the reason stays visible.
        toast(response.message, { icon: "ℹ️" });
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Failed to generate bills.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Generate bills</h1>
      <p className="text-sm text-gray-500">
        Each active student gets one bill for the term, made up of the fee items for their
        class plus the items charged to all classes. Students already billed are skipped.
      </p>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-xs text-gray-500">Session</label>
          <input value={session} onChange={(e) => setSession(e.target.value)} className={inputClass} />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-xs text-gray-500">Term</label>
          <select
            value={term}
            onChange={(e) => setTerm(Number(e.target.value) as Term)}
            className={inputClass}
          >
            {TERM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-xs text-gray-500">Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className={inputClass}
            disabled={classes.loading}
          >
            <option value="">Whole school</option>
            {classes.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-xs text-gray-500">Due date (optional)</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-60"
      >
        {submitting ? "Generating..." : "Generate bills"}
      </button>
    </form>
  );
};

/**
 * "Update" shows the full bill — lines and payments — and lets the discount,
 * due date and remark change. The server refuses a discount that would leave
 * the bill overpaid.
 */
const EditBill = ({ data, onSuccess }: { data: FeeBill; onSuccess?: () => void }) => {
  const { data: bill, loading, error } = useAsync<FeeBill>(
    useCallback(() => feeService.bill(data.billId), [data.billId]),
    [data.billId]
  );

  const [discount, setDiscount] = useState(String(data.discount ?? 0));
  const [dueDate, setDueDate] = useState(toDateInput(data.dueDate));
  const [remark, setRemark] = useState(data.remark ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [reversing, setReversing] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(discount);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Discount must be zero or more.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await feeService.updateBill({
        billId: data.billId,
        discount: value,
        dueDate: toApiDate(dueDate),
        remark,
      });
      toast.success(response.message || "Bill updated.");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Failed to update bill.");
    } finally {
      setSubmitting(false);
    }
  };

  const reverse = async (paymentId: string, amount: number) => {
    if (!window.confirm(`Reverse this payment of ${formatMoney(amount)}? The bill balance will go back up.`)) {
      return;
    }

    setReversing(paymentId);
    try {
      const response = await feeService.reversePayment(paymentId);
      toast.success(response.message);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Failed to reverse payment.");
    } finally {
      setReversing(null);
    }
  };

  const shown = bill ?? data;
  const status = shown.isOverdue ? "Overdue" : shown.status;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="flex items-start justify-between gap-4 pr-6">
        <div>
          <h1 className="text-xl font-semibold">Bill {shown.billId}</h1>
          <p className="text-sm text-gray-500">
            {shown.student} · {shown.class || "No class"} · {shown.termName} {shown.session}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${STATUS_STYLES[status] ?? ""}`}>{status}</span>
      </div>

      {loading && <Loader label="Loading bill..." className="" />}
      {error && <p className="text-sm text-red-600">{error.detail}</p>}

      {bill && (
        <div className="flex flex-col gap-4 text-sm">
          <table className="w-full">
            <tbody>
              {(bill.lines ?? []).map((line) => (
                <tr key={line.lineNo} className="border-b border-gray-100">
                  <td className="py-1">{line.description}</td>
                  <td className="py-1 text-right">{formatMoney(line.amount)}</td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="py-1">Total</td>
                <td className="py-1 text-right">{formatMoney(bill.totalAmount)}</td>
              </tr>
              {bill.discount > 0 && (
                <tr className="text-gray-500">
                  <td className="py-1">Discount</td>
                  <td className="py-1 text-right">-{formatMoney(bill.discount)}</td>
                </tr>
              )}
              <tr className="text-gray-500">
                <td className="py-1">Paid</td>
                <td className="py-1 text-right">-{formatMoney(bill.amountPaid)}</td>
              </tr>
              <tr className="font-semibold">
                <td className="py-1">Balance</td>
                <td className="py-1 text-right">{formatMoney(bill.balance)}</td>
              </tr>
            </tbody>
          </table>

          <div>
            <h2 className="font-medium mb-2">Payments</h2>
            {(bill.payments ?? []).length === 0 ? (
              <p className="text-gray-500">No payments yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="text-xs text-gray-500">
                  <tr>
                    <th className="py-1">Date</th>
                    <th className="py-1">Receipt</th>
                    <th className="py-1 hidden md:table-cell">Method / ref</th>
                    <th className="py-1 text-right">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {bill.payments!.map((payment) => (
                    <tr key={payment.paymentId} className="border-t border-gray-100">
                      <td className="py-1">{formatDate(payment.paymentDate)}</td>
                      <td className="py-1">{payment.receiptNo}</td>
                      <td className="py-1 hidden md:table-cell">
                        {[payment.method, payment.reference].filter(Boolean).join(" · ") || "-"}
                      </td>
                      <td className="py-1 text-right">{formatMoney(payment.amount)}</td>
                      <td className="py-1 text-right">
                        <button
                          type="button"
                          onClick={() => void reverse(payment.paymentId, payment.amount)}
                          disabled={reversing !== null}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          {reversing === payment.paymentId ? "Reversing..." : "Reverse"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Discount (₦)</label>
          <MoneyInput value={discount} onChange={setDiscount} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Due date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Remark</label>
          <input
            value={remark}
            maxLength={200}
            onChange={(e) => setRemark(e.target.value)}
            className={inputClass}
            placeholder="e.g. Sibling discount"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
};

const FeeBillForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: FeeBill;
  onSuccess?: () => void;
}) =>
  type === "update" && data ? (
    <EditBill data={data} onSuccess={onSuccess} />
  ) : (
    <GenerateBills onSuccess={onSuccess} />
  );

export default FeeBillForm;
