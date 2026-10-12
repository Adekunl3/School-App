"use client";

import { useEffect, useReducer } from "react";
import {
  peekStudentFees,
  readStudentFees,
  subscribeStudentFees,
  type StudentFeeEntry,
} from "@/services/studentFees";

/**
 * Fee position for each of `studentIds`. Lookups from every component on the
 * page are batched into one request and shared through a cache, so a badge
 * per table row costs one call per page, not one per row.
 */
export const useStudentFees = (studentIds: (string | null | undefined)[]): StudentFeeEntry[] => {
  const ids = studentIds.filter((id): id is string => Boolean(id));
  const key = ids.join(",");

  // Bumped whenever the cache changes, which re-renders and re-queues
  // anything invalidated after a payment.
  const [version, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribeStudentFees(bump), []);

  useEffect(() => {
    if (key) key.split(",").forEach((id) => readStudentFees(id));
  }, [key, version]);

  return ids.map(peekStudentFees);
};

export default useStudentFees;
