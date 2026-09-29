"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { useIsAdmin } from "@/hooks/useRole";
import { formatDate } from "@/lib/formHelpers";
import { feeService, formatMoney } from "@/services/fees";
import type { FeePayment } from "@/types/school";
import { StudentFeeBadge } from "@/components/StudentFeeBadge";

const columns: ListColumn[] = [
  { header: "Date", accessor: "date", sortProperty: "PaymentDate" },
  { header: "Student", accessor: "student", sortProperty: "StudentId" },
  { header: "Term", accessor: "term", className: "hidden lg:table-cell" },
  { header: "Receipt", accessor: "receipt", className: "hidden md:table-cell", sortProperty: "ReceiptNo" },
  { header: "Method", accessor: "method", className: "hidden md:table-cell" },
  { header: "Amount", accessor: "amount", sortProperty: "Amount" },
  { header: "Actions", accessor: "action" },
];

const FeePaymentsPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<FeePayment>({
    fetcher: useCallback((query) => feeService.payments(query), []),
    itemsPerPage: 10,
  });

  if (!isAdmin) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-sm text-gray-500">
        Only administrators can view payments.
      </div>
    );
  }

  const renderRow = (item: FeePayment) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{formatDate(item.paymentDate)}</td>
      <td>
        <p className="font-semibold">{item.student || item.studentId}</p>
        <p className="text-xs text-gray-500 md:hidden">{item.receiptNo}</p>
        <StudentFeeBadge studentId={item.studentId} />
      </td>
      <td className="hidden lg:table-cell">
        {item.termName} {item.session}
      </td>
      <td className="hidden md:table-cell">{item.receiptNo}</td>
      <td className="hidden md:table-cell">
        {item.method || "-"}
        {item.reference && <p className="text-xs text-gray-400">{item.reference}</p>}
      </td>
      <td className="font-semibold">{formatMoney(item.amount)}</td>
      <td>
        <FormModal table="feePayment" type="delete" id={item.paymentId} onSuccess={list.refetch} />
      </td>
    </tr>
  );

  return (
    <ListPageShell<FeePayment>
      title="Fee Payments"
      table="feePayment"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="payments"
      searchPlaceholder="Search student, receipt or reference..."
      filters={
        <p className="text-xs text-gray-500">
          Deleting a payment reverses it and puts the amount back on the bill. To pay for several
          children at once, use the Families page on School Fees.
        </p>
      }
    />
  );
};

export default FeePaymentsPage;
