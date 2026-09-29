"use client";

import { formatMoney } from "@/services/fees";
import type { FeeSummary } from "@/types/school";

/** Expected / collected / outstanding for one term, plus the bill counts. */
const FeeSummaryTiles = ({ summary }: { summary: FeeSummary }) => {
  const collectedPct =
    summary.expected > 0 ? Math.round((summary.collected / summary.expected) * 100) : 0;

  const tiles = [
    { label: "Expected", value: formatMoney(summary.expected), hint: `${summary.bills} bills` },
    { label: "Collected", value: formatMoney(summary.collected), hint: `${collectedPct}% of expected` },
    {
      label: "Outstanding",
      value: formatMoney(summary.outstanding),
      hint: `${summary.unpaid + summary.partPaid} students owing`,
    },
  ];

  const counts = [
    { label: "Paid", value: summary.paid, className: "bg-green-100 text-green-700" },
    { label: "Part-paid", value: summary.partPaid, className: "bg-amber-100 text-amber-700" },
    { label: "Unpaid", value: summary.unpaid, className: "bg-red-100 text-red-700" },
    { label: "Overdue", value: summary.overdue, className: "bg-red-600 text-white" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-md bg-lamaSkyLight p-3">
            <p className="text-xs text-gray-500">{tile.label}</p>
            <p className="text-lg font-semibold">{tile.value}</p>
            <p className="text-xs text-gray-400">{tile.hint}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {counts.map((count) => (
          <span key={count.label} className={`px-2 py-1 rounded-full ${count.className}`}>
            {count.value} {count.label.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
};

export default FeeSummaryTiles;
