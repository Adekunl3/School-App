// Counts the API requests in flight so the app can show that something is
// happening and block clicks while a save is running. Fed by the interceptors
// in api.ts; read through useSyncExternalStore in GlobalLoader.

export interface RequestCounts {
  reads: number;
  writes: number;
}

let counts: RequestCounts = { reads: 0, writes: 0 };
const listeners = new Set<() => void>();

const set = (next: RequestCounts) => {
  counts = next;
  listeners.forEach((listener) => listener());
};

export const isWrite = (method?: string): boolean =>
  !!method && !["get", "head", "options"].includes(method.toLowerCase());

export const requestStarted = (write: boolean): void =>
  set(write ? { ...counts, writes: counts.writes + 1 } : { ...counts, reads: counts.reads + 1 });

export const requestFinished = (write: boolean): void =>
  set(
    write
      ? { ...counts, writes: Math.max(0, counts.writes - 1) }
      : { ...counts, reads: Math.max(0, counts.reads - 1) }
  );

export const getRequestCounts = (): RequestCounts => counts;

const SERVER_COUNTS: RequestCounts = { reads: 0, writes: 0 };
export const getServerRequestCounts = (): RequestCounts => SERVER_COUNTS;

export const subscribeRequests = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
