"use client";

import Image from "next/image";

/**
 * Placeholder for the finance chart.
 *
 * There is no data behind this yet: the school schema has no fee, invoice or
 * payment tables, and `GetFinanceSummary` was never built. The previous version
 * of this component rendered a hardcoded twelve-month income/expense array,
 * which read as real figures on the dashboard — showing nothing is safer than
 * showing invented money.
 *
 * To make this live, decide first whether school fees get their own tables or
 * hook into PowerAPI's existing financial modules, then add the endpoint and
 * swap this out.
 */
const FinanceChart = () => {
  return (
    <div className="bg-white rounded-lg p-4 h-full dark:bg-gray-800">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Finance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>

      <div className="h-[90%] flex flex-col items-center justify-center text-center gap-2">
        <p className="text-sm text-gray-500">Not available yet</p>
        <p className="text-xs text-gray-400 max-w-sm">
          Fee and payment tracking has not been built. Once a finance schema exists
          this will show income against expenses.
        </p>
      </div>
    </div>
  );
};

export default FinanceChart;
