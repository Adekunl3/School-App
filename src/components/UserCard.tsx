"use client";

import Image from "next/image";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import type { DashboardSummary } from "@/types/school";

export type UserCardType = keyof DashboardSummary;

/**
 * Count tile on the admin dashboard.
 *
 * Reads GetDashboardSummary, which returns every head count in one call — the
 * hook shares that request, so a row of these tiles costs one round trip rather
 * than one per tile.
 */
const UserCard = ({ type }: { type: UserCardType }) => {
  const { summary, loading, error } = useDashboardSummary();

  const count = summary ? summary[type] : null;

  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow dark:odd:bg-gray-800 dark:even:bg-gray-700 p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2024/25
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>

      <h1 className="text-2xl font-semibold my-4">
        {loading ? "..." : count !== null ? count.toLocaleString() : "—"}
      </h1>

      <h2 className="capitalize text-sm font-medium text-gray-500">{type}</h2>

      {/* A dash alone reads as "zero"; say so quietly when the fetch failed. */}
      {error && <p className="text-[10px] text-red-500">Could not load</p>}
    </div>
  );
};

export default UserCard;
