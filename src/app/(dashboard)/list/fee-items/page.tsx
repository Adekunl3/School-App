"use client";

import { useCallback } from "react";
import FormModal from "@/components/FormModal";
import ListPageShell, { type ListColumn } from "@/components/ListPageShell";
import { useList } from "@/hooks/useList";
import { useIsAdmin } from "@/hooks/useRole";
import { feeItemService, formatMoney } from "@/services/fees";
import type { FeeItem } from "@/types/school";

const columns: ListColumn[] = [
  { header: "Fee", accessor: "name", sortProperty: "Name" },
  { header: "Class", accessor: "class", className: "hidden md:table-cell", sortProperty: "ClassId" },
  { header: "Term", accessor: "term", className: "hidden md:table-cell", sortProperty: "Session" },
  { header: "Amount", accessor: "amount", sortProperty: "Amount" },
  { header: "Actions", accessor: "action" },
];

const FeeItemsPage = () => {
  const isAdmin = useIsAdmin();

  const list = useList<FeeItem>({
    fetcher: useCallback((query) => feeItemService.list(query), []),
    itemsPerPage: 10,
  });

  if (!isAdmin) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-sm text-gray-500">
        Only administrators can manage fee items.
      </div>
    );
  }

  const renderRow = (item: FeeItem) => (
    <tr
      key={item.id}
      className={`border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight ${
        item.active ? "" : "text-gray-400"
      }`}
    >
      <td className="p-4 font-semibold">
        {item.name}
        {!item.active && <span className="ml-2 text-xs font-normal">(inactive)</span>}
      </td>
      <td className="hidden md:table-cell">{item.class}</td>
      <td className="hidden md:table-cell">
        {item.termName} {item.session}
      </td>
      <td>{formatMoney(item.amount)}</td>
      <td>
        <div className="flex items-center gap-2">
          <FormModal table="feeItem" type="update" data={item} onSuccess={list.refetch} />
          <FormModal table="feeItem" type="delete" id={item.feeItemId} onSuccess={list.refetch} />
        </div>
      </td>
    </tr>
  );

  return (
    <ListPageShell<FeeItem>
      title="Fee Items"
      table="feeItem"
      columns={columns}
      renderRow={renderRow}
      list={list}
      noun="fee items"
      searchPlaceholder="Search fee items..."
      filters={
        <p className="text-xs text-gray-500">
          What the school charges each term. Items with no class apply to every class. Bills are
          generated from these on the Fees page.
        </p>
      }
    />
  );
};

export default FeeItemsPage;
