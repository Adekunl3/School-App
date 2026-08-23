"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-2">Sign in to your account</h1>
        <p className="text-sm text-slate-500 mb-6">
          Use your PowerSoft credentials to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
              className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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

        <div className="mt-6 text-center text-sm text-slate-500">
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
    </div>
  );
};

export default SignInPage;
