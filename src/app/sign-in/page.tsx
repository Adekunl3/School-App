"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SignInPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise((res) => setTimeout(res, 900));
    setLoading(false);

    // Demo behaviour: accept any credentials, persist a demo token, and redirect to admin
    try {
      localStorage.setItem("auth", "demo-token");
    } catch (err) {
      // ignore localStorage errors in unusual environments
    }
    router.replace("/admin");
  };

  // If already signed in (demo token present), redirect immediately to admin
  useEffect(() => {
    try {
      const t = localStorage.getItem("auth");
      if (t) router.replace("/admin");
    } catch (err) {
      /* ignore */
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-2">Sign in to your account</h1>
        <p className="text-sm text-slate-500 mb-6">Demo sign-in — use any credentials to continue.</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-100 p-2 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="you@example.com"
              aria-label="email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="••••••••"
              aria-label="password"
            />
          </label>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center text-sm">
              <input type="checkbox" className="mr-2" />
              Remember me
            </label>
            <Link href="#" className="text-sm text-indigo-600 hover:underline">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <span>Don&apos;t have an account? </span>
          <Link href="#" className="text-indigo-600 hover:underline">Sign up</Link>
        </div>

        <div className="mt-6 text-xs text-slate-400">
          <strong>Demo credential (optional):</strong> admin@example.com / password
        </div>
      </div>
    </div>
  );
};

export default SignInPage;