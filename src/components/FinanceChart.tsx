"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAsync } from "@/hooks/useAsync";
import { feeService, formatMoney } from "@/services/fees";
import type { FeeSummary } from "@/types/school";
import { Loader } from "@/components/Spinner";

const compact = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Fees collected against fees still owed, by class, for the latest billed
 * term. Uses the same palette as the attendance chart so the dashboard reads
 * as one set.
 */
const FinanceChart = () => {
  const { data, loading, error } = useAsync<FeeSummary>(
    useCallback(() => feeService.summary(), [])
  );

  const rows = (data?.byClass ?? []).map((row) => ({
    name: row.class,
    collected: row.collected,
    outstanding: row.outstanding,
  }));

  return (
    <div className="bg-white rounded-lg p-4 h-full dark:bg-gray-800 flex flex-col">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h1 className="text-lg font-semibold">Fees</h1>
          {data?.session && (
            <p className="text-xs text-gray-500">
              {data.termName} {data.session} · {formatMoney(data.collected)} of{" "}
              {formatMoney(data.expected)} collected
            </p>
          )}
        </div>
        <Link href="/list/fees" className="text-xs text-indigo-600 hover:underline whitespace-nowrap">
          View fees
        </Link>
      </div>

      {loading ? (
        <Loader label="Loading fees..." className="mt-8" />
      ) : error ? (
        <p className="mt-8 text-sm text-red-600">{error.message}</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          No bills yet. Set up fee items and generate bills on the Fees page.
        </p>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
              <XAxis dataKey="name" axisLine={false} tick={{ fill: "#9ca3af" }} tickLine={false} />
              <YAxis
                axisLine={false}
                tick={{ fill: "#9ca3af" }}
                tickLine={false}
                tickFormatter={(value: number) => compact.format(value)}
              />
              <Tooltip
                formatter={(value: number) => formatMoney(value)}
                contentStyle={{ borderRadius: "10px", borderColor: "lightgray" }}
              />
              <Legend
                align="left"
                verticalAlign="top"
                wrapperStyle={{ paddingTop: "10px", paddingBottom: "20px" }}
              />
              <Bar dataKey="collected" stackId="fees" fill="#FAE27C" legendType="circle" />
              <Bar
                dataKey="outstanding"
                stackId="fees"
                fill="#C3EBFA"
                legendType="circle"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default FinanceChart;
