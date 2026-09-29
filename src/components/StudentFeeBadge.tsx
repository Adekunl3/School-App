"use client";

import Link from "next/link";
import { useStudentFees } from "@/hooks/useStudentFees";
import { useIsAdmin } from "@/hooks/useRole";
import { formatMoney } from "@/services/fees";
import type { StudentFeeEntry } from "@/services/studentFees";
import { Spinner } from "./Spinner";

interface Totals {
  bills: number;
  amountDue: number;
  amountPaid: number;
  balance: number;
  isOverdue: boolean;
}

const sum = (entries: StudentFeeEntry[]): Totals | "loading" | { error: string } => {
  if (entries.some((e) => e.state === "loading")) return "loading";
  const failed = entries.find((e) => e.state === "error");
  if (failed?.state === "error") return { error: failed.message };

  return entries.reduce<Totals>(
    (total, e) => {
      if (e.state !== "ready") return total;
      return {
        bills: total.bills + e.value.bills,
        amountDue: total.amountDue + e.value.amountDue,
        amountPaid: total.amountPaid + e.value.amountPaid,
        balance: total.balance + e.value.balance,
        isOverdue: total.isOverdue || e.value.isOverdue,
      };
    },
    { bills: 0, amountDue: 0, amountPaid: 0, balance: 0, isOverdue: false }
  );
};

const Badge = ({
  entries,
  href,
  size,
}: {
  entries: StudentFeeEntry[];
  href: string;
  size: "sm" | "lg";
}) => {
  const totals = sum(entries);
  const base =
    size === "lg"
      ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium"
      : "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs whitespace-nowrap";

  if (totals === "loading") {
    return (
      <span className={`${base} bg-gray-100 text-gray-500`}>
        <Spinner className="w-3 h-3" /> Fees
      </span>
    );
  }
  if ("error" in totals) {
    return (
      <span className={`${base} bg-gray-100 text-gray-500`} title={`Could not load fees: ${totals.error}`}>
        Fees: -
      </span>
    );
  }

  const { bills, amountDue, amountPaid, balance, isOverdue } = totals;

  const [label, style] =
    bills === 0
      ? ["No bills", "bg-gray-100 text-gray-500"]
      : balance <= 0
      ? ["Fully paid", "bg-green-100 text-green-700"]
      : [
          `Owes ${formatMoney(balance)}`,
          isOverdue ? "bg-red-600 text-white" : amountPaid > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700",
        ];

  const title =
    bills === 0
      ? "No bills generated yet"
      : `Billed ${formatMoney(amountDue)} · Paid ${formatMoney(amountPaid)} · Balance ${formatMoney(balance)}` +
        ` across ${bills} bill${bills === 1 ? "" : "s"}${isOverdue ? " · overdue" : ""}`;

  return (
    <Link href={href} className={`${base} ${style} hover:opacity-80`} title={title}>
      {label}
    </Link>
  );
};

/**
 * What a student owes across every bill, or "Fully paid". Admins only, like
 * the rest of fees. Clicking it opens that student's bills.
 */
export const StudentFeeBadge = ({
  studentId,
  size = "sm",
}: {
  studentId?: string | null;
  size?: "sm" | "lg";
}) => {
  const isAdmin = useIsAdmin();
  const entries = useStudentFees(isAdmin ? [studentId] : []);

  if (!isAdmin || !studentId) return null;
  return (
    <Badge entries={entries} href={`/list/fees?studentId=${encodeURIComponent(studentId)}`} size={size} />
  );
};

/** The same for all of a parent's children together. */
export const FamilyFeeBadge = ({
  parentId,
  studentIds,
}: {
  parentId: string;
  studentIds: string[];
}) => {
  const isAdmin = useIsAdmin();
  const entries = useStudentFees(isAdmin ? studentIds : []);

  if (!isAdmin || studentIds.length === 0) return null;
  return (
    <Badge entries={entries} href={`/list/fees/family?parentId=${encodeURIComponent(parentId)}`} size="sm" />
  );
};

export default StudentFeeBadge;
