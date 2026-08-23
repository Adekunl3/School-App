"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SIGN_IN_ROUTE } from "@/lib/config";
import { useSession } from "@/providers/SessionProvider";
import LockScreen from "./LockScreen";

const FullScreenMessage = ({ label }: { label: string }) => (
  <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
      <p className="mt-4 text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  </div>
);

/**
 * Guards the authenticated area.
 *
 * When locked it keeps `children` mounted and layers the lock screen on top,
 * which is what lets the user resume exactly where they were after typing
 * their password.
 */
const SessionGate = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(SIGN_IN_ROUTE);
    }
  }, [router, status]);

  if (status === "loading") {
    return <FullScreenMessage label="Restoring your session..." />;
  }

  if (status === "unauthenticated") {
    return <FullScreenMessage label="Redirecting to sign in..." />;
  }

  return (
    <>
      {children}
      {status === "locked" && <LockScreen />}
    </>
  );
};

export default SessionGate;
