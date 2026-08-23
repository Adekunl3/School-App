"use client";

import { useCallback } from "react";
import Image from "next/image";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { useAsync } from "@/hooks/useAsync";
import { dashboardService } from "@/services/school";
import type { GenderCount } from "@/types/school";

/** Rounded share of the total, guarding the zero-students case. */
const share = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0;

const CountChart = () => {
  const { data, loading, error } = useAsync<GenderCount>(
    useCallback(() => dashboardService.genderCount(), [])
  );

  const total = data?.total ?? 0;
  const boys = data?.boys ?? 0;
  const girls = data?.girls ?? 0;
  const unspecified = data?.unspecified ?? 0;

  const chartData = [
    { name: "Total", count: total, fill: "white" },
    { name: "Girls", count: girls, fill: "#FAE27C" },
    { name: "Boys", count: boys, fill: "#C3EBFA" },
  ];

  return (
    <div className="bg-white rounded-xl w-full h-full p-4 dark:odd:bg-gray-800 dark:even:bg-gray-700">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Students</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-gray-500">Loading...</p>
      ) : error ? (
        <p className="mt-8 text-sm text-red-600">{error.message}</p>
      ) : total === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          No students enrolled yet.
        </p>
      ) : (
        <>
          {/* CHART */}
          <div className="relative w-full h-[75%]">
            <ResponsiveContainer>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="100%"
                barSize={32}
                data={chartData}
              >
                <RadialBar background dataKey="count" />
              </RadialBarChart>
            </ResponsiveContainer>
            <Image
              src="/maleFemale.png"
              alt=""
              width={50}
              height={50}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>

          {/* BOTTOM */}
          <div className="flex justify-center gap-16">
            <div className="flex flex-col gap-1">
              <div className="w-5 h-5 bg-lamaSky rounded-full" />
              <h1 className="font-bold">{boys.toLocaleString()}</h1>
              <h2 className="text-xs text-gray-400">Boys ({share(boys, total)}%)</h2>
            </div>
            <div className="flex flex-col gap-1">
              <div className="w-5 h-5 bg-lamaYellow rounded-full" />
              <h1 className="font-bold">{girls.toLocaleString()}</h1>
              <h2 className="text-xs text-gray-400">Girls ({share(girls, total)}%)</h2>
            </div>
          </div>

          {/* The two bars would not add up to the total without this, which
              looks like a bug rather than missing data. */}
          {unspecified > 0 && (
            <p className="mt-2 text-center text-xs text-gray-400">
              {unspecified.toLocaleString()} with no sex recorded
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default CountChart;
