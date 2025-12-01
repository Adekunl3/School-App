"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      localStorage.removeItem("accessToken");
    } catch (err) {
      // ignore
    }
    // Give a small delay for UX, then redirect to sign-in
    const t = setTimeout(() => router.replace("/sign-in"), 250);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">Signing out…</h1>
        <p className="text-sm text-slate-500">You are being signed out and will be redirected to the login page.</p>
      </div>
    </div>
  );
}
