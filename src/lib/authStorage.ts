// Single source of truth for everything the session persists.
// Nothing else in the app should touch localStorage for auth state.

import type { UserData } from "@/utils/userUtils";

export const STORAGE_KEYS = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  expiration: "tokenExpiration",
  userData: "userData",
  userId: "userId",
  /** The username the user actually typed — needed to unlock with password only. */
  username: "authUsername",
  locked: "sessionLocked",
  lockedAt: "sessionLockedAt",
  lastActivity: "sessionLastActivity",
  lastPath: "sessionLastPath",
  persistentToast: "persistentToast",
} as const;

/** Fired on the current tab whenever session storage changes (the native
 *  `storage` event only fires in *other* tabs). */
export const AUTH_CHANGE_EVENT = "auth:change";

const isBrowser = () => typeof window !== "undefined";

const read = (key: string): string | null => {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked — nothing useful to do */
  }
};

const remove = (key: string): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

const notify = (): void => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  /** ISO timestamp from the API's `expiration` field. */
  expiration: string | null;
}

// ---------------------------------------------------------------- tokens

export const getAccessToken = (): string | null =>
  read(STORAGE_KEYS.accessToken);

export const getRefreshToken = (): string | null =>
  read(STORAGE_KEYS.refreshToken);

export const getExpiration = (): number | null => {
  const raw = read(STORAGE_KEYS.expiration);
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
};

/** Replaces the token trio. Used by both login and refresh. */
export const saveTokens = (tokens: SessionTokens): void => {
  write(STORAGE_KEYS.accessToken, tokens.accessToken);
  write(STORAGE_KEYS.refreshToken, tokens.refreshToken);
  if (tokens.expiration) {
    write(STORAGE_KEYS.expiration, tokens.expiration);
  } else {
    remove(STORAGE_KEYS.expiration);
  }
  notify();
};

// ------------------------------------------------------------------ user

export const getUsername = (): string | null => read(STORAGE_KEYS.username);

export const getUserData = (): UserData | null => {
  const raw = read(STORAGE_KEYS.userData);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserData;
  } catch {
    return null;
  }
};

export const saveUser = (username: string, user: UserData): void => {
  write(STORAGE_KEYS.username, username);
  write(STORAGE_KEYS.userData, JSON.stringify(user));
  // `userId` is read directly by some older components — keep it populated.
  write(STORAGE_KEYS.userId, user.userId || username);
  notify();
};

// ------------------------------------------------------------------ lock

export const isLocked = (): boolean => read(STORAGE_KEYS.locked) === "1";

export const getLockedAt = (): number | null => {
  const raw = read(STORAGE_KEYS.lockedAt);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const setLocked = (locked: boolean): void => {
  if (locked) {
    write(STORAGE_KEYS.locked, "1");
    if (!getLockedAt()) write(STORAGE_KEYS.lockedAt, String(Date.now()));
  } else {
    remove(STORAGE_KEYS.locked);
    remove(STORAGE_KEYS.lockedAt);
  }
  notify();
};

// -------------------------------------------------------------- activity

export const getLastActivity = (): number => {
  const parsed = Number(read(STORAGE_KEYS.lastActivity));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/** Written on a throttle by the session provider; also syncs sibling tabs. */
export const touchActivity = (at: number = Date.now()): void => {
  write(STORAGE_KEYS.lastActivity, String(at));
};

// ------------------------------------------------------------- last path

export const getLastPath = (): string | null => read(STORAGE_KEYS.lastPath);

export const setLastPath = (path: string): void =>
  write(STORAGE_KEYS.lastPath, path);

// ---------------------------------------------------------------- toasts

/** Survives the redirect to /sign-in so the user learns why they were kicked. */
export const setPersistentToast = (message: string): void =>
  write(STORAGE_KEYS.persistentToast, message);

export const consumePersistentToast = (): string | null => {
  const message = read(STORAGE_KEYS.persistentToast);
  if (message) remove(STORAGE_KEYS.persistentToast);
  return message;
};

// --------------------------------------------------------------- session

export const hasSession = (): boolean => Boolean(getAccessToken());

/** Wipes auth state but leaves user preferences (theme) intact. */
export const clearSession = (): void => {
  [
    STORAGE_KEYS.accessToken,
    STORAGE_KEYS.refreshToken,
    STORAGE_KEYS.expiration,
    STORAGE_KEYS.userData,
    STORAGE_KEYS.userId,
    STORAGE_KEYS.username,
    STORAGE_KEYS.locked,
    STORAGE_KEYS.lockedAt,
    STORAGE_KEYS.lastActivity,
    STORAGE_KEYS.lastPath,
  ].forEach(remove);
  notify();
};

/** Subscribes to session changes in this tab *and* sibling tabs. */
export const subscribeToAuthChanges = (listener: () => void): (() => void) => {
  if (!isBrowser()) return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || Object.values(STORAGE_KEYS).includes(event.key as never)) {
      listener();
    }
  };

  window.addEventListener(AUTH_CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
};
