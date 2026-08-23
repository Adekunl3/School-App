"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { revokeSession } from "@/lib/authService";
import { SIGN_IN_ROUTE } from "@/lib/config";
import { clearSession, getAccessToken } from "@/lib/authStorage";

export default function LogoutPage() {
  const router = useRouter();
  const ranRef = useRef(false);

  useEffect(() => {
    // React 18 StrictMode double-invokes effects in dev; revoke exactly once.
    if (ranRef.current) return;
    ranRef.current = true;

    const signOut = async () => {
      const accessToken = getAccessToken();

      // DELETE api/Logout/{token} — revokes the refresh session server-side so
      // the token cannot be replayed. Best effort; local teardown always runs.
      if (accessToken) {
        await revokeSession(accessToken);
      }

      clearSession();
      router.replace(SIGN_IN_ROUTE);
    };

    void signOut();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">Signing out…</h1>
        <p className="text-sm text-slate-500">
          You are being signed out and will be redirected to the login page.
        </p>
      </div>
    </div>
  );
}
