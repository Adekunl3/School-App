// School fees: fee items, per-student bills, payments and the family view.

import {
  deleteOne,
  getList,
  getOne,
  postOne,
  putOne,
  type ListQuery,
  type ListResult,
  type MutationResult,
} from "@/lib/apiClient";
import { feeEndpoints, feeItemEndpoints } from "@/utils/apiEndPoints";
import { createCrudService, type CrudService } from "./crud";
import { invalidateStudentFees } from "./studentFees";
import type {
  FamilyFees,
  FamilyPaymentInput,
  FamilyPaymentResult,
  FeeBill,
  FeeBillFilters,
  FeeBillGenerateInput,
  FeeBillGenerateResult,
  FeeBillUpdateInput,
  FeeItem,
  FeeItemCreateInput,
  FeeItemUpdateInput,
  FeePayment,
  FeePaymentCreateInput,
  FeePaymentFilters,
  FeeSummary,
  StudentFeeStatus,
  Term,
} from "@/types/school";

export const feeItemService = createCrudService<FeeItem, FeeItemCreateInput, FeeItemUpdateInput>({
  endpoints: feeItemEndpoints,
  label: "fee item",
  idParam: "feeItemId",
});

/** Drops cached student balances once a call that moves them succeeds. */
const changesBalances = <T>(request: Promise<T>): Promise<T> =>
  request.then((result) => {
    invalidateStudentFees();
    return result;
  });

export const feeService = {
  bills: (query: ListQuery = {}, filters: FeeBillFilters = {}): Promise<ListResult<FeeBill>> =>
    getList<FeeBill>(feeEndpoints.bills(), query, "Failed to load bills.", { ...filters }),

  /** Includes the bill's lines and payments. */
  bill: (billId: string) =>
    getOne<FeeBill>(feeEndpoints.billById(), { billId }, "Failed to load bill."),

  generateBills: (payload: FeeBillGenerateInput): Promise<MutationResult<FeeBillGenerateResult>> =>
    changesBalances(
      postOne<FeeBillGenerateResult>(feeEndpoints.generateBills(), payload, "Failed to generate bills.")
    ),

  updateBill: (payload: FeeBillUpdateInput) =>
    changesBalances(putOne<FeeBill>(feeEndpoints.updateBill(), payload, "Failed to update bill.")),

  removeBill: (billId: string) =>
    changesBalances(deleteOne<null>(feeEndpoints.deleteBill(), { billId }, "Failed to delete bill.")),

  payments: (query: ListQuery = {}, filters: FeePaymentFilters = {}): Promise<ListResult<FeePayment>> =>
    getList<FeePayment>(feeEndpoints.payments(), query, "Failed to load payments.", { ...filters }),

  addPayment: (payload: FeePaymentCreateInput) =>
    changesBalances(postOne<FeePayment>(feeEndpoints.addPayment(), payload, "Failed to record payment.")),

  addFamilyPayment: (payload: FamilyPaymentInput): Promise<MutationResult<FamilyPaymentResult>> =>
    changesBalances(
      postOne<FamilyPaymentResult>(feeEndpoints.addFamilyPayment(), payload, "Failed to record payment.")
    ),

  /** Reverses the payment; the bill's balance is restored. */
  reversePayment: (paymentId: string) =>
    changesBalances(
      deleteOne<null>(feeEndpoints.deletePayment(), { paymentId }, "Failed to reverse payment.")
    ),

  family: (parentId: string, session?: string, term?: Term) =>
    getOne<FamilyFees>(feeEndpoints.family(), { parentId, session, term }, "Failed to load family fees."),

  /** Totals across every bill for each student, including students never billed. */
  studentStatus: (studentIds: string[]) =>
    getOne<StudentFeeStatus[]>(
      feeEndpoints.studentStatus(),
      { studentIds: studentIds.join(",") },
      "Failed to load fee balances."
    ),

  /** Defaults to the most recent session + term that has bills. */
  summary: (session?: string, term?: Term) =>
    getOne<FeeSummary>(feeEndpoints.summary(), { session, term }, "Failed to load fee summary."),
};

/**
 * Bills and payments seen through the generic CRUD shape, so FormModal and
 * the list shell can drive them like any other module. "Create" on a bill
 * means generating bills for a term; payments cannot be edited, only reversed.
 */
export const feeBillCrud: CrudService<FeeBill, FeeBillGenerateInput, FeeBillUpdateInput> = {
  list: (query) => feeService.bills(query),
  byId: feeService.bill,
  create: (payload) =>
    feeService.generateBills(payload) as unknown as Promise<MutationResult<FeeBill>>,
  update: feeService.updateBill,
  remove: feeService.removeBill,
};

export const feePaymentCrud: CrudService<FeePayment, FeePaymentCreateInput, unknown> = {
  list: (query) => feeService.payments(query),
  byId: async () => {
    throw new Error("Payments are loaded through their bill.");
  },
  create: feeService.addPayment,
  update: async () => {
    throw new Error("Payments cannot be edited. Reverse it and record it again.");
  },
  remove: feeService.reversePayment,
};

// ------------------------------------------------------------ display helpers

export const TERM_OPTIONS: { value: Term; label: string }[] = [
  { value: 1, label: "First Term" },
  { value: 2, label: "Second Term" },
  { value: 3, label: "Third Term" },
];

export const PAYMENT_METHODS = ["Cash", "Transfer", "POS", "Cheque", "Other"] as const;

// en-US grouping pinned explicitly: "en-NG" currency output differs between
// browsers ("₦1,000.00" in some, "NGN 1,000.00" in others).
const amountFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1000000 -> "1,000,000.00". */
export const formatAmount = (value?: number | null): string =>
  value === null || value === undefined || Number.isNaN(value) ? "-" : amountFormat.format(value);

/** 1000000 -> "₦1,000,000.00"; negatives as "-₦500.00". */
export const formatMoney = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value < 0 ? "-" : ""}₦${amountFormat.format(Math.abs(value))}`;
};

/** The session that starts in the current school year, e.g. "2026/2027" from September 2026. */
export const currentSession = (today = new Date()): string => {
  // Nigerian sessions start in September.
  const start = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  return `${start}/${start + 1}`;
};

export const SESSION_PATTERN = /^\d{4}\/\d{4}$/;

export const isValidSession = (value: string): boolean => {
  if (!SESSION_PATTERN.test(value.trim())) return false;
  const [start, end] = value.trim().split("/").map(Number);
  return end === start + 1;
};

export const STATUS_STYLES: Record<string, string> = {
  Paid: "bg-green-100 text-green-700",
  "Part-paid": "bg-amber-100 text-amber-700",
  Unpaid: "bg-red-100 text-red-700",
  Overdue: "bg-red-600 text-white",
};
