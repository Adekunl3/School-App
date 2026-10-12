"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getRequestCounts,
  getServerRequestCounts,
  subscribeRequests,
} from "@/lib/requestTracker";
import { Spinner } from "./Spinner";

/** True once `active` has stayed true for `delayMs`, so quick calls do not flash. */
const useDelayed = (active: boolean, delayMs: number): boolean => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = window.setTimeout(() => setShown(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [active, delayMs]);

  return shown;
};

/**
 * App-wide activity indicator.
 *
 * - Any request in flight: a bar across the top of the window.
 * - A save, delete or import in flight: the page is covered at once so
 *   nothing can be clicked twice, and a "Please wait" card appears if it takes
 *   more than a moment.
 */
const GlobalLoader = () => {
  const { reads, writes } = useSyncExternalStore(
    subscribeRequests,
    getRequestCounts,
    getServerRequestCounts
  );

  const busy = reads + writes > 0;
  const showBar = useDelayed(busy, 150);
  const showCard = useDelayed(writes > 0, 400);

  return (
    <>
      {showBar && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[70] overflow-hidden bg-indigo-100" aria-hidden>
          <div className="h-full w-1/3 bg-indigo-500 animate-[loaderbar_1.1s_ease-in-out_infinite]" />
        </div>
      )}
      {writes > 0 && (
        <div
          className="fixed inset-0 z-[60] cursor-wait flex items-center justify-center"
          aria-busy="true"
          aria-live="polite"
        >
          {showCard && (
            <div className="flex items-center gap-3 rounded-md bg-white dark:bg-gray-800 px-4 py-3 shadow-lg text-sm">
              <Spinner className="w-5 h-5 text-indigo-600" />
              <span>Please wait...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default GlobalLoader;
