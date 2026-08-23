// Direct calls against PowerAPI's AccountController.
//
// These use their own axios instance rather than `lib/api.ts` so that the
// 401 -> refresh -> retry interceptor can call `refreshSession()` without
// recursing into itself.

import axios from "axios";
import { API_BASE_URL } from "./config";
import { authEndpoints } from "@/utils/apiEndPoints";
import { parseUserData, type UserData } from "@/utils/userUtils";
import type { SessionTokens } from "./authStorage";

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * PowerAPI returns anonymous objects, so casing depends on the serializer
 * configured for the route (System.Text.Json camelCases, Newtonsoft here does
 * not always). Read both spellings rather than betting on one.
 */
const pick = <T = unknown>(source: unknown, key: string): T | undefined => {
  if (!source || typeof source !== "object") return undefined;
  const bag = source as Record<string, unknown>;
  const lower = key.charAt(0).toLowerCase() + key.slice(1);
  const upper = key.charAt(0).toUpperCase() + key.slice(1);
  const hit = bag[key] ?? bag[lower] ?? bag[upper];
  return hit === null ? undefined : (hit as T);
};

export interface LoginResult extends SessionTokens {
  user: UserData;
  /** The composite Identity name, e.g. ACME_DEFAULT_DEFAULT_jdoe. */
  uniqueName: string;
}

/**
 * Thrown for any auth failure with a message safe to show the user.
 * `isCredentialError` distinguishes "wrong password" from "bad license token"
 * or a transport failure, which matters on the lock screen.
 */
export class AuthError extends Error {
  readonly status?: number;
  readonly isCredentialError: boolean;

  constructor(message: string, status?: number, isCredentialError = false) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.isCredentialError = isCredentialError;
  }
}

const toAuthError = (error: unknown, fallback: string): AuthError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const apiMessage =
      pick<string>(error.response?.data, "message") ??
      pick<string>(error.response?.data, "title");

    if (!error.response) {
      return new AuthError(
        "Cannot reach the server. Check your connection and try again.",
        undefined,
        false
      );
    }

    if (status && status >= 500) {
      return new AuthError(
        apiMessage || "Server error. Please try again later.",
        status,
        false
      );
    }

    // A 401 from Login is either bad credentials or a bad license token. Only
    // the former should count against the unlock attempt budget.
    const invalidLicense = /invalid token/i.test(apiMessage ?? "");

    return new AuthError(
      apiMessage || fallback,
      status,
      status === 401 && !invalidLicense
    );
  }

  return new AuthError(
    error instanceof Error ? error.message : fallback,
    undefined,
    false
  );
};

const readTokens = (body: unknown): SessionTokens => {
  const accessToken = pick<string>(body, "jwtToken");
  const refreshToken = pick<string>(body, "refreshToken");
  const expirationRaw = pick<string | Date>(body, "expiration");

  if (!accessToken || !refreshToken) {
    throw new AuthError(
      "The server did not return a valid session. Please contact your administrator."
    );
  }

  return {
    accessToken,
    refreshToken,
    expiration:
      expirationRaw instanceof Date
        ? expirationRaw.toISOString()
        : expirationRaw ?? null,
  };
};

/** POST api/Login/{token} */
export const login = async (
  username: string,
  password: string
): Promise<LoginResult> => {
  try {
    const { data } = await authClient.post(authEndpoints.login(), {
      username,
      password,
    });

    const tokens = readTokens(data);
    const payload = pick<Record<string, unknown>>(data, "data") ?? {};

    return {
      ...tokens,
      user: parseUserData(data, username),
      uniqueName: pick<string>(payload, "userName") ?? username,
    };
  } catch (error) {
    throw toAuthError(error, "Incorrect username and/or password.");
  }
};

/** POST api/Refresh/{token} */
export const refreshSession = async (
  accessToken: string,
  refreshToken: string
): Promise<SessionTokens> => {
  try {
    const { data } = await authClient.post(authEndpoints.refresh(), {
      accessToken,
      refreshToken,
    });
    return readTokens(data);
  } catch (error) {
    throw toAuthError(error, "Your session has expired. Please sign in again.");
  }
};

/** DELETE api/Logout/{token} — best effort, never blocks the local sign-out. */
export const revokeSession = async (accessToken: string): Promise<void> => {
  try {
    await authClient.delete(authEndpoints.logout(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // The server-side session may already be gone; local teardown still runs.
  }
};

/** GET api/Auth/{token} — license/subscription check. */
export const verifyLicense = async (): Promise<{
  ok: boolean;
  message: string;
}> => {
  try {
    const { data } = await authClient.get(authEndpoints.verify());
    const status = pick<string>(data, "status") ?? "";
    return {
      ok: /success/i.test(status),
      message: pick<string>(data, "message") ?? "",
    };
  } catch (error) {
    const authError = toAuthError(error, "License check failed.");
    return { ok: false, message: authError.message };
  }
};
