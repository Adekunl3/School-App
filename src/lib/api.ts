import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, LICENSE_TOKEN, SIGN_IN_ROUTE, TOKEN_REFRESH_LEAD_MS } from "./config";
import { refreshSession } from "./authService";
import {
  clearSession,
  getAccessToken,
  getExpiration,
  getRefreshToken,
  saveTokens,
  setPersistentToast,
} from "./authStorage";

export { API_BASE_URL };
/** @deprecated import `LICENSE_TOKEN` from `@/lib/config` instead. */
export const TOKEN = LICENSE_TOKEN;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  /** Set on a request to opt it out of the refresh-and-retry cycle. */
  _skipAuthRefresh?: boolean;
};

// ------------------------------------------------- single-flight refresh

let inFlightRefresh: Promise<string> | null = null;

const performRefresh = async (): Promise<string> => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) {
    throw new Error("No refresh credentials available");
  }

  const tokens = await refreshSession(accessToken, refreshToken);
  saveTokens(tokens);
  return tokens.accessToken;
};

/**
 * Concurrent 401s share one refresh call — otherwise parallel requests each
 * rotate the refresh token and all but one of them lose the race.
 */
export const refreshAccessToken = (): Promise<string> => {
  if (!inFlightRefresh) {
    inFlightRefresh = performRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
};

/** Refreshes only when the access token is at or near expiry. */
export const ensureFreshAccessToken = async (): Promise<string | null> => {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  const expiresAt = getExpiration();
  if (expiresAt !== null && expiresAt - Date.now() > TOKEN_REFRESH_LEAD_MS) {
    return accessToken;
  }

  return refreshAccessToken();
};

/** Tears down the session and sends the user back to sign-in. */
export const endSession = (message?: string): void => {
  clearSession();
  if (typeof window === "undefined") return;
  if (message) setPersistentToast(message);
  if (window.location.pathname !== SIGN_IN_ROUTE) {
    window.location.href = SIGN_IN_ROUTE;
  }
};

// ------------------------------------------------------------ interceptors

api.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetriableConfig | undefined;

    const shouldTryRefresh =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original._skipAuthRefresh &&
      Boolean(getRefreshToken());

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    original!._retry = true;

    try {
      const accessToken = await refreshAccessToken();
      original!.headers.Authorization = `Bearer ${accessToken}`;
      return api(original!);
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);
      endSession("Your session has expired. Please sign in again.");
      return Promise.reject(error);
    }
  }
);
