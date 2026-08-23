"use client";

import { useCallback } from "react";
import Image from "next/image";
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
import { dashboardService } from "@/services/school";
import type { WeeklyAttendance } from "@/types/school";

const AttendanceChart = () => {
  const { data, loading, error } = useAsync<WeeklyAttendance[]>(
    useCallback(() => dashboardService.weeklyAttendance(), [])
  );

  const rows = data ?? [];
  // The API always returns all five weekdays, zeroed where there is no data, so
  // an all-zero week means "no registers taken" rather than "nothing loaded".
  const hasRecords = rows.some((row) => row.present > 0 || row.absent > 0);

  return (
    <div className="bg-white rounded-lg p-4 h-full dark:odd:bg-gray-800 dark:even:bg-gray-700">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Attendance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-gray-500">Loading attendance...</p>
      ) : error ? (
        <p className="mt-8 text-sm text-red-600">{error.message}</p>
      ) : !hasRecords ? (
        <p className="mt-8 text-sm text-gray-500">
          No attendance recorded this week.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={rows} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tick={{ fill: "#d1d5db" }}
              tickLine={false}
            />
            <YAxis axisLine={false} tick={{ fill: "#d1d5db" }} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "10px", borderColor: "lightgray" }}
            />
            <Legend
              align="left"
              verticalAlign="top"
              wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }}
            />
            <Bar
              dataKey="present"
              fill="#FAE27C"
              legendType="circle"
              radius={[10, 10, 0, 0]}
            />
            <Bar
              dataKey="absent"
              fill="#C3EBFA"
              legendType="circle"
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AttendanceChart;
