"use client";

import { useCallback } from "react";
import Image from "next/image";
import { Pie, PieChart, ResponsiveContainer } from "recharts";
import { useAsync } from "@/hooks/useAsync";
import { dashboardService } from "@/services/school";
import type { Performance as PerformanceData } from "@/types/school";

/**
 * Average result percentage for one student or one teacher.
 *
 * The API averages percentages rather than raw scores, so a 100-mark exam does
 * not outweigh a 10-mark assignment.
 */
const Performance = ({
  studentId,
  teacherId,
}: {
  studentId?: string;
  teacherId?: string;
}) => {
  const { data, loading, error } = useAsync<PerformanceData>(
    useCallback(
      () => dashboardService.performance({ studentId, teacherId }),
      [studentId, teacherId]
    ),
    [studentId, teacherId]
  );

  const score = data?.score ?? 0;
  const resultCount = data?.resultCount ?? 0;

  const chartData = [
    { name: "Achieved", value: score, fill: "#C3EBFA" },
    { name: "Remaining", value: Math.max(0, 100 - score), fill: "#FAE27C" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md h-80 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Performance</h1>
        <Image src="/moreDark.png" alt="" width={16} height={16} />
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-gray-500">Loading performance...</p>
      ) : error ? (
        <p className="mt-8 text-sm text-red-600">{error.message}</p>
      ) : resultCount === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          No results recorded yet.
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="value"
                startAngle={180}
                endAngle={0}
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <h1 className="text-3xl font-bold">{score}%</h1>
            <p className="text-xs text-gray-400">average</p>
          </div>

          <h2 className="font-medium absolute bottom-16 left-0 right-0 m-auto text-center text-sm">
            Across {resultCount} result{resultCount === 1 ? "" : "s"}
          </h2>
        </>
      )}
    </div>
  );
};

export default Performance;
