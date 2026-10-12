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
import { fieldClass } from "../InputField";
import { FormFooter, FormHeader, FormSection } from "../FormLayout";

const labelClass = "text-xs font-medium text-gray-600 dark:text-gray-300";
const wrapClass = "flex w-full flex-col gap-1.5";
const errClass = "text-xs text-red-500";

/**
 * "Create" generates bills for a term from its fee items: every active student
 * in the chosen class, or the whole school. Students already billed for the
 * term are skipped, so running it again after admissions is safe.
 */
const GenerateBills = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
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
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <FormHeader
        title="Generate bills"
        subtitle="Each active student gets one bill for the term, made up of the fee items for their class plus the items charged to all classes. Students already billed are skipped."
      />

      <FormSection title="Billing period" hint="Which session and term to bill" columns="sm:grid-cols-2">
        <div className={wrapClass}>
          <label className={labelClass}>
            Session <span className="text-red-500">*</span>
          </label>
          <input
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className={fieldClass(!!error)}
          />
          {error && <p className={errClass}>{error}</p>}
        </div>
        <div className={wrapClass}>
          <label className={labelClass}>Term</label>
          <select
            value={term}
            onChange={(e) => setTerm(Number(e.target.value) as Term)}
            className={fieldClass(false)}
          >
            {TERM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </FormSection>

      <FormSection title="Recipients and deadline" hint="Who is billed and when it is due" columns="sm:grid-cols-2">
        <div className={wrapClass}>
          <label className={labelClass}>Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className={fieldClass(false)}
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
        <div className={wrapClass}>
          <label className={labelClass}>Due date (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={fieldClass(false)}
          />
        </div>
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel="Generate bills"
        submittingLabel="Generating..."
      />
    </form>
  );
};

/**
 * "Update" shows the full bill — lines and payments — and lets the discount,
 * due date and remark change. The server refuses a discount that would leave
 * the bill overpaid.
 */
const EditBill = ({
  data,
  onSuccess,
  onCancel,
}: {
  data: FeeBill;
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
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
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <FormHeader
            title={`Bill ${shown.billId}`}
            subtitle={`${shown.student} · ${shown.class || "No class"} · ${shown.termName} ${shown.session}`}
          />
        </div>
        <span className={`mr-10 mt-1 shrink-0 rounded-full px-2 py-1 text-xs ${STATUS_STYLES[status] ?? ""}`}>
          {status}
        </span>
      </div>

      {loading && <Loader label="Loading bill..." className="" />}
      {error && <p className="text-sm text-red-600">{error.detail}</p>}

      {bill && (
        <div className="flex flex-col gap-4 text-sm text-gray-700 dark:text-gray-200">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">Charges</h2>
          <table className="w-full">
            <tbody>
              {(bill.lines ?? []).map((line) => (
                <tr key={line.lineNo} className="border-b border-gray-100 dark:border-gray-700">
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
              <tr className="border-t border-gray-200 font-semibold dark:border-gray-700">
                <td className="py-1">Balance</td>
                <td className="py-1 text-right">{formatMoney(bill.balance)}</td>
              </tr>
            </tbody>
          </table>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">Payments</h2>
            {(bill.payments ?? []).length === 0 ? (
              <p className="text-gray-500">No payments yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-300">
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
                    <tr key={payment.paymentId} className="border-t border-gray-100 dark:border-gray-700">
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

      <FormSection title="Adjustments" hint="Discount, due date and remark">
        <div className={wrapClass}>
          <label className={labelClass}>Discount (₦)</label>
          <MoneyInput value={discount} onChange={setDiscount} className={fieldClass(false)} />
        </div>
        <div className={wrapClass}>
          <label className={labelClass}>Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={fieldClass(false)}
          />
        </div>
        <div className={wrapClass}>
          <label className={labelClass}>Remark</label>
          <input
            value={remark}
            maxLength={200}
            onChange={(e) => setRemark(e.target.value)}
            className={fieldClass(false)}
            placeholder="e.g. Sibling discount"
          />
        </div>
      </FormSection>

      <FormFooter
        onCancel={onCancel}
        submitting={submitting}
        submitLabel="Save changes"
        submittingLabel="Saving..."
      />
    </form>
  );
};

const FeeBillForm = ({
  type,
  data,
  onSuccess,
  onCancel,
}: {
  type: "create" | "update";
  data?: FeeBill;
  onSuccess?: () => void;
  onCancel?: () => void;
}) =>
  type === "update" && data ? (
    <EditBill data={data} onSuccess={onSuccess} onCancel={onCancel} />
  ) : (
    <GenerateBills onSuccess={onSuccess} onCancel={onCancel} />
  );

export default FeeBillForm;
