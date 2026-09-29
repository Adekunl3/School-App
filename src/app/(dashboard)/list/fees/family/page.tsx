"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import RemoteSelectField from "@/components/RemoteSelectField";
import { useAsync } from "@/hooks/useAsync";
import { useIsAdmin } from "@/hooks/useRole";
import { ApiError, type ListQuery } from "@/lib/apiClient";
import { formatDate, toApiDate } from "@/lib/formHelpers";
import { PAYMENT_METHODS, STATUS_STYLES, feeService, formatMoney } from "@/services/fees";
import { parentService } from "@/services/school";
import type { FamilyFees, FamilyPaymentResult, Parent, PaymentMethod } from "@/types/school";
import { Loader } from "@/components/Spinner";
import MoneyInput from "@/components/MoneyInput";

const inputClass = "ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full";

const todayInput = (): string => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

/**
 * One payment from a parent covering several children. The server applies it
 * to the family's outstanding bills oldest-due first, and every resulting
 * payment row shares one receipt number.
 */
const FamilyPayment = ({ family, onPaid }: { family: FamilyFees; onPaid: () => void }) => {
  const [amount, setAmount] = useState(String(family.balance));
  const [paymentDate, setPaymentDate] = useState(todayInput());
  const [method, setMethod] = useState<PaymentMethod>("Transfer");
  const [reference, setReference] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<FamilyPaymentResult | null>(null);

  useEffect(() => setAmount(String(family.balance)), [family.balance]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);

    if (Number.isNaN(value) || value <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    if (value > family.balance) {
      toast.error(`The family only owes ${formatMoney(family.balance)}.`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await feeService.addFamilyPayment({
        parentId: family.parentId,
        amount: value,
        paymentDate: toApiDate(paymentDate),
        method,
        reference: reference.trim() || undefined,
        remark: remark.trim() || undefined,
      });
      toast.success(response.message);
      setResult(response.data);
      setReference("");
      setRemark("");
      onPaid();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-md flex flex-col gap-4">
      <div>
        <h2 className="font-semibold">Record a family payment</h2>
        <p className="text-xs text-gray-500">
          The amount is applied to the oldest outstanding bill first, across all children.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Amount (₦)</label>
          <MoneyInput value={amount} onChange={setAmount} className={inputClass} />
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col gap-2 w-1/2">
            <label className="text-xs text-gray-500">Date paid</label>
            <input
              type="date"
              value={paymentDate}
              max={todayInput()}
              onChange={(e) => setPaymentDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2 w-1/2">
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
        </div>
        <input
          value={reference}
          maxLength={60}
          onChange={(e) => setReference(e.target.value)}
          className={inputClass}
          placeholder="Bank or teller reference"
        />
        <input
          value={remark}
          maxLength={200}
          onChange={(e) => setRemark(e.target.value)}
          className={inputClass}
          placeholder="Remark (optional)"
        />
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-60"
        >
          {submitting ? "Recording..." : "Record payment"}
        </button>
      </form>

      {result && (
        <div className="text-sm bg-green-50 rounded-md p-3">
          <p className="font-medium">
            Receipt {result.receiptNo} — {formatMoney(result.amount)}
          </p>
          <ul className="mt-1 text-gray-600">
            {result.allocations.map((a) => (
              <li key={a.paymentId}>
                {a.student}: {formatMoney(a.amount)} ({a.termName} {a.session})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const FamilyFeesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parentId") ?? "";

  const searchParents = useCallback((query: ListQuery) => parentService.list(query), []);

  const family = useAsync<FamilyFees | null>(
    useCallback(() => (parentId ? feeService.family(parentId) : Promise.resolve(null)), [parentId]),
    [parentId]
  );

  const choose = (id: string) =>
    router.replace(id ? `/list/fees/family?parentId=${encodeURIComponent(id)}` : "/list/fees/family");

  // Kept through a refetch (so a payment's receipt stays on screen), but never
  // shown for a different parent than the one selected.
  const data = family.data?.parentId === parentId ? family.data : null;

  return (
    <div className="flex-1 p-4 pt-0 flex flex-col gap-4">
      <div className="bg-white p-4 rounded-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Family Fees</h1>
          <Link href="/list/fees" className="text-sm text-indigo-600 hover:underline">
            Back to School Fees
          </Link>
        </div>
        <div className="flex flex-wrap gap-4">
          <RemoteSelectField<Parent>
            label="Parent / guardian"
            fetcher={searchParents}
            getId={(item) => item.parentId}
            getLabel={(item) => item.name}
            getHint={(item) => (item.students.length ? item.students.join(", ") : item.phone)}
            value={parentId}
            onChange={choose}
            selectedLabel={data?.parent}
            placeholder="Search parents..."
            sortProperty="LastName"
          />
        </div>
      </div>

      {!parentId ? (
        <p className="bg-white p-4 rounded-md text-sm text-gray-500">
          Choose a parent to see all their children&apos;s bills together.
        </p>
      ) : family.loading && !data ? (
        <Loader label="Loading family fees..." className="bg-white p-4 rounded-md" />
      ) : family.error ? (
        <p className="bg-white p-4 rounded-md text-sm text-red-600">{family.error.detail}</p>
      ) : data ? (
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="w-full xl:w-2/3 flex flex-col gap-4">
            <div className="bg-white p-4 rounded-md">
              <p className="font-semibold">{data.parent}</p>
              <p className="text-xs text-gray-500">
                {[data.phone, data.email].filter(Boolean).join(" · ") || "No contact details"}
              </p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Billed", value: data.amountDue },
                  { label: "Paid", value: data.amountPaid },
                  { label: "Balance", value: data.balance },
                ].map((tile) => (
                  <div key={tile.label} className="rounded-md bg-lamaSkyLight p-3">
                    <p className="text-xs text-gray-500">{tile.label}</p>
                    <p className="font-semibold">{formatMoney(tile.value)}</p>
                  </div>
                ))}
              </div>
            </div>

            {data.children.length === 0 && (
              <p className="bg-white p-4 rounded-md text-sm text-gray-500">
                No children are linked to this parent. Set the parent on each student&apos;s record.
              </p>
            )}

            {data.children.map((child) => (
              <div key={child.studentId} className="bg-white p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{child.student}</p>
                    <p className="text-xs text-gray-500">{child.class || "No class"}</p>
                  </div>
                  <p className="text-sm">
                    Owes <span className="font-semibold">{formatMoney(child.balance)}</span>
                  </p>
                </div>
                {child.bills.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No bills yet.</p>
                ) : (
                  <table className="w-full text-sm mt-3">
                    <thead className="text-xs text-gray-500 text-left">
                      <tr>
                        <th className="py-1">Term</th>
                        <th className="py-1 hidden md:table-cell">Due</th>
                        <th className="py-1 hidden md:table-cell">Paid</th>
                        <th className="py-1">Balance</th>
                        <th className="py-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {child.bills.map((bill) => {
                        const badge = bill.isOverdue ? "Overdue" : bill.status;
                        return (
                          <tr key={bill.billId} className="border-t border-gray-100">
                            <td className="py-1">
                              {bill.termName} {bill.session}
                              {bill.dueDate && (
                                <p className="text-xs text-gray-400">due {formatDate(bill.dueDate)}</p>
                              )}
                            </td>
                            <td className="py-1 hidden md:table-cell">{formatMoney(bill.amountDue)}</td>
                            <td className="py-1 hidden md:table-cell">{formatMoney(bill.amountPaid)}</td>
                            <td className="py-1 font-medium">{formatMoney(bill.balance)}</td>
                            <td className="py-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${STATUS_STYLES[badge] ?? ""}`}>
                                {badge}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>

          <div className="w-full xl:w-1/3">
            {data.balance > 0 ? (
              <FamilyPayment family={data} onPaid={family.refetch} />
            ) : (
              <p className="bg-white p-4 rounded-md text-sm text-green-700">
                {data.amountDue > 0 ? "This family is fully paid up." : "Nothing has been billed yet."}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const FamilyFeesPage = () => {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-sm text-gray-500">
        Only administrators can view school fees.
      </div>
    );
  }

  // useSearchParams needs a Suspense boundary under the app router.
  return (
    <Suspense fallback={<Loader label="Loading..." className="p-4" />}>
      <FamilyFeesContent />
    </Suspense>
  );
};

export default FamilyFeesPage;
