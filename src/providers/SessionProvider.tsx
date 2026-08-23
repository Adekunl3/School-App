"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { AuthError, login as loginRequest, revokeSession } from "@/lib/authService";
import { ensureFreshAccessToken } from "@/lib/api";
import {
  IDLE_LOCK_MS,
  IDLE_WARNING_MS,
  MAX_LOCK_MS,
  MAX_UNLOCK_ATTEMPTS,
  SESSION_TICK_MS,
  SIGN_IN_ROUTE,
} from "@/lib/config";
import {
  clearSession,
  getAccessToken,
  getLastActivity,
  getLockedAt,
  getUserData,
  getUsername,
  hasSession,
  isLocked,
  saveTokens,
  saveUser,
  setLastPath,
  setLocked,
  setPersistentToast,
  subscribeToAuthChanges,
  touchActivity,
} from "@/lib/authStorage";
import type { UserData } from "@/utils/userUtils";

export type SessionStatus = "loading" | "unauthenticated" | "active" | "locked";

interface SessionContextValue {
  status: SessionStatus;
  user: UserData | null;
  /** Username to prefill on the lock screen. */
  username: string;
  /** Consecutive failed unlock attempts. */
  failedUnlockAttempts: number;
  attemptsRemaining: number;
  /** ms until the idle lock fires; null when locked or signed out. */
  msUntilLock: number | null;
  lock: () => void;
  unlock: (password: string) => Promise<void>;
  signOut: (message?: string) => Promise<void>;
  /** Resets the idle countdown — for the "I'm still here" warning action. */
  keepAlive: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
  "focus",
] as const;

/** Don't hammer localStorage on every mousemove. */
const ACTIVITY_WRITE_THROTTLE_MS = 5000;

const IDLE_WARNING_TOAST_ID = "session-idle-warning";

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<UserData | null>(null);
  const [username, setUsername] = useState("");
  const [failedUnlockAttempts, setFailedUnlockAttempts] = useState(0);
  const [msUntilLock, setMsUntilLock] = useState<number | null>(null);

  /** Authoritative in-memory activity clock; localStorage is the cross-tab mirror. */
  const lastActivityRef = useRef<number>(Date.now());
  const lastActivityWriteRef = useRef<number>(0);
  const warnedRef = useRef(false);
  const statusRef = useRef<SessionStatus>("loading");

  const setStatusSafe = useCallback((next: SessionStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const markActivity = useCallback((persist: boolean) => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (warnedRef.current) {
      warnedRef.current = false;
      toast.dismiss(IDLE_WARNING_TOAST_ID);
    }

    if (persist || now - lastActivityWriteRef.current > ACTIVITY_WRITE_THROTTLE_MS) {
      lastActivityWriteRef.current = now;
      touchActivity(now);
    }
  }, []);

  // ------------------------------------------------------------- bootstrap

  useEffect(() => {
    if (!hasSession()) {
      setStatusSafe("unauthenticated");
      return;
    }

    setUser(getUserData());
    setUsername(getUsername() ?? "");

    if (isLocked()) {
      setStatusSafe("locked");
      return;
    }

    // A stored activity stamp older than the idle window means the tab was
    // closed (or the machine slept) past the threshold — lock immediately
    // rather than granting a fresh window on reload.
    const stored = getLastActivity();
    if (stored > 0 && Date.now() - stored >= IDLE_LOCK_MS) {
      setLocked(true);
      setStatusSafe("locked");
      return;
    }

    lastActivityRef.current = stored > 0 ? stored : Date.now();
    markActivity(true);
    setStatusSafe("active");
  }, [markActivity, setStatusSafe]);

  // --------------------------------------------------------- lock / unlock

  const lock = useCallback(() => {
    if (!hasSession()) return;
    toast.dismiss(IDLE_WARNING_TOAST_ID);
    warnedRef.current = false;
    setLocked(true);
    setStatusSafe("locked");
  }, [setStatusSafe]);

  const signOut = useCallback(
    async (message?: string) => {
      const accessToken = getAccessToken();
      toast.dismiss(IDLE_WARNING_TOAST_ID);

      if (accessToken) {
        await revokeSession(accessToken);
      }

      clearSession();
      setUser(null);
      setUsername("");
      setFailedUnlockAttempts(0);
      setStatusSafe("unauthenticated");

      if (message) setPersistentToast(message);
      if (typeof window !== "undefined") {
        window.location.href = SIGN_IN_ROUTE;
      }
    },
    [setStatusSafe]
  );

  const unlock = useCallback(
    async (password: string) => {
      const storedUsername = getUsername();

      if (!storedUsername) {
        await signOut("Please sign in again.");
        throw new AuthError("Session details are missing. Please sign in again.");
      }

      const previousUniqueName = getUserData()?.uniqueName;

      try {
        // Re-authenticating is what makes "password only" safe: the username is
        // taken from storage, never from input, so an unlock cannot become a
        // silent switch to a different account.
        const result = await loginRequest(storedUsername, password);

        if (
          previousUniqueName &&
          result.uniqueName &&
          previousUniqueName !== result.uniqueName
        ) {
          await signOut("Your account context changed. Please sign in again.");
          throw new AuthError("Account mismatch. Please sign in again.");
        }

        saveTokens(result);
        saveUser(storedUsername, result.user);
        setUser(result.user);
        setFailedUnlockAttempts(0);
        setLocked(false);
        markActivity(true);
        setStatusSafe("active");
      } catch (error) {
        if (error instanceof AuthError && error.isCredentialError) {
          const attempts = failedUnlockAttempts + 1;
          setFailedUnlockAttempts(attempts);

          if (attempts >= MAX_UNLOCK_ATTEMPTS) {
            await signOut(
              "Too many failed unlock attempts. Please sign in again."
            );
          }
        }
        throw error;
      }
    },
    [failedUnlockAttempts, markActivity, setStatusSafe, signOut]
  );

  // ----------------------------------------------------- activity tracking

  useEffect(() => {
    if (status !== "active") return;

    const onActivity = () => markActivity(false);

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Coming back to the tab is not activity — evaluate the idle window
        // against the stamp from before it was hidden.
        const stored = getLastActivity();
        if (stored > lastActivityRef.current) lastActivityRef.current = stored;
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, onActivity)
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [markActivity, status]);

  // ------------------------------------------------- heartbeat: idle + token

  useEffect(() => {
    if (status !== "active" && status !== "locked") {
      setMsUntilLock(null);
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;

      if (!hasSession()) {
        setStatusSafe("unauthenticated");
        return;
      }

      if (statusRef.current === "locked") {
        const lockedAt = getLockedAt();
        if (lockedAt && Date.now() - lockedAt >= MAX_LOCK_MS) {
          await signOut("Locked too long. Please sign in again.");
        }
        return;
      }

      // Sibling tabs keep this session alive through the shared stamp.
      const stored = getLastActivity();
      if (stored > lastActivityRef.current) lastActivityRef.current = stored;

      const idleFor = Date.now() - lastActivityRef.current;
      const remaining = IDLE_LOCK_MS - idleFor;
      setMsUntilLock(Math.max(0, remaining));

      if (remaining <= 0) {
        lock();
        return;
      }

      if (remaining <= IDLE_WARNING_MS && !warnedRef.current) {
        warnedRef.current = true;
        toast(
          `Locking in ${Math.max(1, Math.round(remaining / 1000))}s due to inactivity.`,
          { id: IDLE_WARNING_TOAST_ID, duration: IDLE_WARNING_MS, icon: "🔒" }
        );
      }

      // Keep the access token ahead of expiry so work resumes without a 401
      // round trip. Failures here are non-fatal — the response interceptor is
      // still the backstop.
      try {
        await ensureFreshAccessToken();
      } catch (error) {
        console.error("Proactive token refresh failed:", error);
      }
    };

    void tick();
    const interval = window.setInterval(() => void tick(), SESSION_TICK_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [lock, setStatusSafe, signOut, status]);

  // ------------------------------------------------------ cross-tab sync

  useEffect(() => {
    return subscribeToAuthChanges(() => {
      if (!hasSession()) {
        if (statusRef.current !== "unauthenticated") {
          setUser(null);
          setUsername("");
          setStatusSafe("unauthenticated");
        }
        return;
      }

      setUser(getUserData());
      setUsername(getUsername() ?? "");

      const lockedElsewhere = isLocked();
      if (lockedElsewhere && statusRef.current === "active") {
        setStatusSafe("locked");
      } else if (!lockedElsewhere && statusRef.current === "locked") {
        // Unlocked in another tab — follow it.
        setFailedUnlockAttempts(0);
        markActivity(true);
        setStatusSafe("active");
      }
    });
  }, [markActivity, setStatusSafe]);

  // ----------------------- remember the route so a reload resumes in place

  useEffect(() => {
    if (!pathname || pathname === SIGN_IN_ROUTE || pathname === "/logout") return;
    if (status !== "active" && status !== "locked") return;
    setLastPath(pathname);
  }, [pathname, status]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user,
      username,
      failedUnlockAttempts,
      attemptsRemaining: Math.max(0, MAX_UNLOCK_ATTEMPTS - failedUnlockAttempts),
      msUntilLock,
      lock,
      unlock,
      signOut,
      keepAlive: () => markActivity(true),
    }),
    [
      failedUnlockAttempts,
      lock,
      markActivity,
      msUntilLock,
      signOut,
      status,
      unlock,
      user,
      username,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside a SessionProvider");
  }
  return context;
};

export default SessionProvider;
