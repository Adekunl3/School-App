// Cached, batched lookups of what each student owes.
//
// A balance badge can sit on every row of any list, so each badge asks for its
// own student here and the requests made in the same tick go to the server as
// one call. Results are cached until something that moves a balance succeeds
// (fees.ts calls invalidateStudentFees), or for CACHE_MS at most.

import { getOne } from "@/lib/apiClient";
import { feeEndpoints } from "@/utils/apiEndPoints";
import type { StudentFeeStatus } from "@/types/school";

/** Server limit per call. */
const BATCH_SIZE = 200;
const CACHE_MS = 60_000;

export type StudentFeeEntry =
  | { state: "loading" }
  | { state: "ready"; value: StudentFeeStatus }
  | { state: "error"; message: string };

const cache = new Map<string, { entry: StudentFeeEntry; at: number }>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const notify = () => listeners.forEach((listener) => listener());

const flush = async () => {
  flushTimer = null;
  const ids = Array.from(pending);
  pending.clear();

  for (let start = 0; start < ids.length; start += BATCH_SIZE) {
    const chunk = ids.slice(start, start + BATCH_SIZE);
    try {
      const rows = await getOne<StudentFeeStatus[]>(
        feeEndpoints.studentStatus(),
        { studentIds: chunk.join(",") },
        "Failed to load fee balances."
      );
      const byId = new Map((rows ?? []).map((row) => [row.studentId, row]));
      const now = Date.now();
      for (const id of chunk) {
        const value = byId.get(id);
        cache.set(id, {
          entry: value
            ? { state: "ready", value }
            : { state: "error", message: "No balance returned." },
          at: now,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load fee balances.";
      // Errors are not kept long, so the next render can retry.
      const at = Date.now() - CACHE_MS + 5_000;
      for (const id of chunk) cache.set(id, { entry: { state: "error", message }, at });
    }
    notify();
  }
};

/** Cached entry without queuing anything; safe to call during render. */
export const peekStudentFees = (studentId: string): StudentFeeEntry =>
  cache.get(studentId)?.entry ?? { state: "loading" };

/** Current entry for a student, queuing a fetch when there is none or it is stale. */
export const readStudentFees = (studentId: string): StudentFeeEntry => {
  const cached = cache.get(studentId);
  if (cached && (cached.entry.state === "loading" || Date.now() - cached.at < CACHE_MS)) {
    return cached.entry;
  }

  const entry: StudentFeeEntry = { state: "loading" };
  cache.set(studentId, { entry, at: Date.now() });
  pending.add(studentId);
  if (!flushTimer) flushTimer = setTimeout(() => void flush(), 10);
  return entry;
};

export const subscribeStudentFees = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Forget every cached balance; mounted badges refetch. */
export const invalidateStudentFees = (): void => {
  for (const [id, cached] of Array.from(cache.entries())) {
    if (cached.entry.state !== "loading") cache.delete(id);
  }
  notify();
};
