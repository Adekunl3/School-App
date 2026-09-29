"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import FeeSummaryTiles from "@/components/FeeSummaryTiles";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import Modal from "@/components/Modal";
import FeePaymentForm from "@/components/forms/FeePaymentForm";
import { Loader } from "@/components/Spinner";
import { StudentFeeBadge } from "@/components/StudentFeeBadge";
import { useAsync } from "@/hooks/useAsync";
import { useList } from "@/hooks/useList";
import { useLookup } from "@/hooks/useLookup";
import { useIsAdmin } from "@/hooks/useRole";
import { formatDate } from "@/lib/formHelpers";
import { STATUS_STYLES, feeService, formatMoney } from "@/services/fees";
import type { FeeBill, FeeStatusFilter, FeeSummary, Term } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Student", accessor: "student", sortProperty: "StudentId" },
  { header: "Class", accessor: "class", className: "hidden md:table-cell", sortProperty: "ClassId" },
  { header: "Due", accessor: "due", className: "hidden lg:table-cell", sortProperty: "TotalAmount" },
  { header: "Paid", accessor: "paid", className: "hidden md:table-cell", sortProperty: "AmountPaid" },
  { header: "Balance", accessor: "balance", sortProperty: "Balance" },
  { header: "Status", accessor: "status" },
  { header: "Actions", accessor: "action" },
];

const STATUS_FILTERS: { value: FeeStatusFilter | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "outstanding", label: "Still owing" },
  { value: "unpaid", label: "Not paid at all" },
  { value: "partpaid", label: "Part-paid" },
  { value: "paid", label: "Fully paid" },
  { value: "overdue", label: "Overdue" },
];

const selectClass = "ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm";

/** "2026/2027|1" <-> { session, term }. "" means "latest billed term". */
const parsePeriod = (value: string): { session?: string; term?: Term } => {
  if (!value) return {};
  const [session, term] = value.split("|");
  return { session, term: Number(term) as Term };
};

const PayButton = ({ bill, onPaid }: { bill: FeeBill; onPaid: () => void }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2 h-7 rounded-full bg-green-100 text-green-700 text-xs"
        title="Record a payment"
      >
        Pay
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <FeePaymentForm
            bill={bill}
            onSuccess={() => {
              setOpen(false);
              onPaid();
            }}
          />
        </Modal>
      )}
    </>
  );
};

const FeesContent = () => {
  const isAdmin = useIsAdmin();
  const classes = useLookup("classes");
  const router = useRouter();
  // Set by a student's fee badge: every bill for that student, all terms.
  const studentId = useSearchParams().get("studentId") ?? "";

  const [period, setPeriod] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<FeeStatusFilter | "">("");

  const selected = parsePeriod(period);

  const summary = useAsync<FeeSummary>(
    useCallback(() => feeService.summary(selected.session, selected.term), [selected.session, selected.term]),
    [period]
  );

  // With no period picked, follow whichever term the summary resolved to, so
  // the totals and the table always describe the same bills.
  const session = studentId ? selected.session : selected.session ?? summary.data?.session ?? undefined;
  const term = studentId ? selected.term : selected.term ?? summary.data?.term ?? undefined;

  const list = useList<FeeBill>({
    fetcher: useCallback(
      (query) =>
        feeService.bills(query, {
          session,
          term,
          classId: classId || undefined,
          status: status || undefined,
          studentId: studentId || undefined,
        }),
      [session, term, classId, status, studentId]
    ),
    itemsPerPage: 10,
  });

  const { setPage, refetch } = list;
  useEffect(() => setPage(1), [session, term, classId, status, studentId, setPage]);

  const refreshAll = useCallback(() => {
    refetch();
    summary.refetch();
  }, [refetch, summary]);

  if (!isAdmin) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-sm text-gray-500">
        Only administrators can view school fees.
      </div>
    );
  }

  const renderRow = (item: FeeBill) => {
    const badge = item.isOverdue ? "Overdue" : item.status;

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">
          <p className="font-semibold">{item.student || item.studentId}</p>
          <StudentFeeBadge studentId={item.studentId} />
          <p className="text-xs text-gray-500">
            {item.parent ? (
              <Link href={`/list/fees/family?parentId=${item.parentId}`} className="hover:underline">
                Family: {item.parent}
              </Link>
            ) : (
              `${item.termName} ${item.session}`
            )}
          </p>
        </td>
        <td className="hidden md:table-cell">{item.class || "-"}</td>
        <td className="hidden lg:table-cell">
          {formatMoney(item.amountDue)}
          {item.dueDate && <p className="text-xs text-gray-400">by {formatDate(item.dueDate)}</p>}
        </td>
        <td className="hidden md:table-cell">{formatMoney(item.amountPaid)}</td>
        <td className="font-semibold">{formatMoney(item.balance)}</td>
        <td>
          <span className={`px-2 py-1 rounded-full text-xs ${STATUS_STYLES[badge] ?? ""}`}>{badge}</span>
        </td>
        <td>
          <div className="flex items-center gap-2">
            {item.balance > 0 && <PayButton bill={item} onPaid={refreshAll} />}
            <FormModal table="feeBill" type="update" data={item} onSuccess={refreshAll} />
            {item.amountPaid === 0 && (
              <FormModal table="feeBill" type="delete" id={item.billId} onSuccess={refreshAll} />
            )}
          </div>
        </td>
      </tr>
    );
  };

  const periods = summary.data?.periods ?? [];

  const filters = (
    <div className="flex flex-col gap-4">
      {summary.error ? (
        <p className="text-sm text-red-600">{summary.error.detail}</p>
      ) : summary.data && summary.data.bills > 0 ? (
        <FeeSummaryTiles summary={summary.data} />
      ) : !summary.loading ? (
        <p className="text-sm text-gray-500">
          No bills yet. Add <Link href="/list/fee-items" className="text-indigo-600 hover:underline">fee items</Link>{" "}
          for the term, then use the + button to generate bills.
        </p>
      ) : null}

      {studentId && (
        <div className="flex flex-wrap items-center gap-2 text-sm bg-lamaSkyLight rounded-md p-2">
          <span>
            Every bill for <span className="font-semibold">{list.items[0]?.student || studentId}</span>
            {!selected.session && ", all terms"}
          </span>
          <StudentFeeBadge studentId={studentId} />
          <button
            type="button"
            onClick={() => router.replace("/list/fees")}
            className="text-indigo-600 hover:underline"
          >
            Show all students
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className={selectClass}>
          <option value="">
            {studentId ? "All terms" : summary.data?.session ? `Latest (${summary.data.termName} ${summary.data.session})` : "Latest term"}
          </option>
          {periods.map((p) => (
            <option key={`${p.session}|${p.term}`} value={`${p.session}|${p.term}`}>
              {p.termName} {p.session}
            </option>
          ))}
        </select>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className={selectClass}
          disabled={classes.loading}
        >
          <option value="">All classes</option>
          {classes.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as FeeStatusFilter | "")}
          className={selectClass}
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <ListPageShell<FeeBill>
      title="School Fees"
      table="feeBill"
      columns={columns}
      renderRow={renderRow}
      list={{ ...list, refetch: refreshAll }}
      noun="bills"
      searchPlaceholder="Search by student..."
      canCreate
      canImport={false}
      filters={filters}
      toolbar={
        <Link
          href="/list/fees/family"
          className="h-8 px-3 flex items-center rounded-full bg-lamaSky text-xs"
          title="Fees by family"
        >
          Families
        </Link>
      }
    />
  );
};

// useSearchParams needs a Suspense boundary under the app router.
const FeesPage = () => (
  <Suspense fallback={<Loader label="Loading fees..." />}>
    <FeesContent />
  </Suspense>
);

export default FeesPage;
