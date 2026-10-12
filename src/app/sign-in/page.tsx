"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { AuthError, login } from "@/lib/authService";
import { DEFAULT_LANDING_ROUTE } from "@/lib/config";
import {
  consumePersistentToast,
  getLastPath,
  hasSession,
  saveTokens,
  saveUser,
  setLocked,
  touchActivity,
} from "@/lib/authStorage";

const SignInPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Surface whatever ended the previous session (expiry, idle timeout, ...).
  useEffect(() => {
    const message = consumePersistentToast();
    if (message) {
      toast.error(message, { duration: 6000 });
    }
  }, []);

  // Already signed in? Go back to the last route so a locked session resumes
  // on the page the user left, with the lock screen over it.
  useEffect(() => {
    if (hasSession()) {
      router.replace(getLastPath() || DEFAULT_LANDING_ROUTE);
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      toast.error("Please enter both username and password.", { duration: 5000 });
      return;
    }

    setLoading(true);

    try {
      const result = await login(trimmedUsername, trimmedPassword);

      // jwtToken and refreshToken are distinct values — storing one as both
      // is what previously broke the refresh flow.
      saveTokens(result);
      saveUser(trimmedUsername, result.user);
      setLocked(false);
      touchActivity();

      toast.success("Login successful! Redirecting...", { duration: 2000 });
      router.replace(getLastPath() || DEFAULT_LANDING_ROUTE);
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : "Invalid username or password. Please try again.";
      toast.error(message, { duration: 6000 });
      setPassword("");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-gray-900">
      {/* Brand panel (large screens) */}
      <aside className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-950 p-12 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Image src="/logo.png" alt="" width={28} height={28} />
          </span>
          <span className="text-xl font-bold tracking-tight">SchooL App</span>
        </div>

        <div>
          <h2 className="text-4xl font-bold leading-tight">
            School management,
            <br />
            made simple.
          </h2>
          <p className="mt-4 max-w-md text-indigo-100">
            Students, teachers, classes, exams and fees &mdash; everything your
            school runs on, in one place.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-indigo-50">
            {[
              "Track attendance, results and assignments",
              "Manage fees, payments and family balances",
              "Keep staff, students and parents connected",
            ].map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                  &#10003;
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-indigo-200">
          &copy; {new Date().getFullYear()} Development Solutions
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        {/* Brand header (small screens) */}
        <div className="mb-6 flex flex-col items-center text-center lg:hidden">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
            <Image src="/logo.png" alt="" width={34} height={34} />
          </span>
          <span className="mt-3 text-2xl font-bold">SchooL App</span>
          <span className="text-sm text-slate-500 dark:text-gray-300">
            School management, made simple.
          </span>
        </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-semibold mb-2">Sign in to your account</h1>
        <p className="text-sm text-slate-500 mb-6 dark:text-gray-300">
          Use your PowerSoft credentials to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              placeholder="Enter your username"
              aria-label="username"
              autoComplete="username"
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              placeholder="Enter your password"
              aria-label="password"
              autoComplete="current-password"
              disabled={loading}
            />
          </label>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center text-sm">
              <input type="checkbox" className="mr-2" disabled={loading} />
              Remember me
            </label>
            <Link
              href="#"
              className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
              onClick={(e) => loading && e.preventDefault()}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium disabled:opacity-60 hover:bg-indigo-700 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-gray-300">
          <span>Don&apos;t have an account? </span>
          <Link
            href="#"
            className="text-indigo-600 hover:underline"
            onClick={(e) => loading && e.preventDefault()}
          >
            Sign up
          </Link>
        </div>
      </div>
      </main>
    </div>
  );
};

export default SignInPage;
