// Central runtime configuration.
// Kept separate from lib/api.ts so auth helpers can read config without
// importing the axios instance (which would create an import cycle).

const readNumber = (raw: string | undefined, fallback: number): number => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * License/tenant token. This is NOT a JWT — PowerAPI uses it to resolve
 * company/division/department before the Identity lookup, so every route
 * needs it in the path.
 */
export const LICENSE_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? "";

const MINUTE = 60 * 1000;

/** Idle time before the app locks itself. */
export const IDLE_LOCK_MS = readNumber(
  process.env.NEXT_PUBLIC_IDLE_LOCK_MS,
  15 * MINUTE
);

/** How long before the lock we warn the user. */
export const IDLE_WARNING_MS = readNumber(
  process.env.NEXT_PUBLIC_IDLE_WARNING_MS,
  MINUTE
);

/**
 * Hard ceiling on how long a session may sit locked. Past this the refresh
 * token is assumed dead (PowerAPI issues them with a 1 day lifetime) and we
 * force a full sign-in instead of an unlock.
 */
export const MAX_LOCK_MS = readNumber(
  process.env.NEXT_PUBLIC_MAX_LOCK_MS,
  12 * 60 * MINUTE
);

/** Failed unlock attempts allowed before the session is torn down. */
export const MAX_UNLOCK_ATTEMPTS = readNumber(
  process.env.NEXT_PUBLIC_MAX_UNLOCK_ATTEMPTS,
  5
);

/** Refresh the access token this long before `expiration`. */
export const TOKEN_REFRESH_LEAD_MS = readNumber(
  process.env.NEXT_PUBLIC_TOKEN_REFRESH_LEAD_MS,
  90 * 1000
);

/** How often the session heartbeat evaluates idle + token state. */
export const SESSION_TICK_MS = 5 * 1000;

/** Route the user lands on after signing in when no previous route is known. */
export const DEFAULT_LANDING_ROUTE = "/admin";

export const SIGN_IN_ROUTE = "/sign-in";

if (process.env.NODE_ENV !== "production" && !LICENSE_TOKEN) {
  console.warn(
    "[config] NEXT_PUBLIC_API_TOKEN is not set. Every PowerAPI route requires " +
      "the license token in its path, so auth calls will fail with 'Invalid Token'."
  );
}
