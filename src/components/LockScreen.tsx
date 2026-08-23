"use client";

import { useEffect, useRef, useState } from "react";
import { AuthError } from "@/lib/authService";
import { useSession } from "@/providers/SessionProvider";

/**
 * Full-viewport overlay shown when the session is locked. It is rendered as a
 * sibling of the dashboard content rather than a route, so the page underneath
 * stays mounted — component state, scroll position and open modals all survive
 * the lock and are there again the moment the password is accepted.
 */
const LockScreen = () => {
  const { user, username, unlock, signOut, attemptsRemaining, failedUnlockAttempts } =
    useSession();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // While locked, nothing behind the overlay should be reachable by keyboard.
  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!password) {
      setError("Enter your password to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await unlock(password);
      setPassword("");
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : "Could not unlock. Please try again."
      );
      setPassword("");
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user?.displayName || username || "your account";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Session locked"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 dark:text-white">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-xl font-semibold text-white">
            {user?.initials || "U"}
          </div>

          <h1 className="mt-4 text-lg font-semibold">Session locked</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Signed in as <span className="font-medium">{displayName}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Enter your password to pick up where you left off.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Username is fixed to the locked account — read-only by design. */}
          <input
            type="text"
            value={username}
            readOnly
            autoComplete="username"
            aria-label="username"
            tabIndex={-1}
            className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-gray-600 dark:bg-gray-700 dark:text-slate-300"
          />

          <div>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Password"
              aria-label="password"
              aria-invalid={Boolean(error)}
              autoComplete="current-password"
              disabled={submitting}
              className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700"
            />
            {error && (
              <p className="mt-2 text-xs text-red-600" role="alert">
                {error}
                {/* Only meaningful once a wrong password has been counted —
                    network or license errors don't consume attempts. */}
                {failedUnlockAttempts > 0 && attemptsRemaining > 0 && (
                  <span className="text-slate-400">
                    {" "}
                    ({attemptsRemaining} attempt
                    {attemptsRemaining === 1 ? "" : "s"} left)
                  </span>
                )}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Unlocking...
              </span>
            ) : (
              "Unlock"
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void signOut()}
          disabled={submitting}
          className="mt-4 w-full text-center text-xs text-slate-500 hover:text-indigo-600 hover:underline disabled:opacity-60 dark:text-slate-400"
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
};

export default LockScreen;
