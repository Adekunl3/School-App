// Per-browser preferences: colour theme and the idle auto-lock time.
//
// Kept in localStorage (they belong to this device, not the account) and
// broadcast with an event so the Navbar toggle and the Settings page stay in
// step when either one changes them.

import { IDLE_LOCK_MS } from "./config";

export type ThemePreference = "light" | "dark" | "system";

const THEME_KEY = "theme";
const IDLE_LOCK_KEY = "idleLockMinutes";
const CHANGE_EVENT = "preferences:change";

/** Choices offered on the Settings page, in minutes. */
export const IDLE_LOCK_OPTIONS = [5, 10, 15, 30, 60] as const;

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or storage blocked: the choice applies until reload.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

// ------------------------------------------------------------------- theme

export const getThemePreference = (): ThemePreference => {
  const saved = read(THEME_KEY);
  return saved === "dark" || saved === "system" ? saved : "light";
};

/** What is actually showing, with "system" resolved. */
export const resolveTheme = (preference: ThemePreference): "light" | "dark" => {
  if (preference !== "system") return preference;
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const applyTheme = (preference: ThemePreference = getThemePreference()): void => {
  document.documentElement.classList.toggle("dark", resolveTheme(preference) === "dark");
};

export const setThemePreference = (preference: ThemePreference): void => {
  write(THEME_KEY, preference);
  applyTheme(preference);
};

// --------------------------------------------------------------- auto-lock

/** Idle time before the session locks: the user's choice, else the configured default. */
export const getIdleLockMs = (): number => {
  const minutes = Number(read(IDLE_LOCK_KEY));
  return Number.isFinite(minutes) && minutes > 0 ? minutes * 60 * 1000 : IDLE_LOCK_MS;
};

export const setIdleLockMinutes = (minutes: number): void =>
  write(IDLE_LOCK_KEY, String(minutes));

// ------------------------------------------------------------------ events

export const subscribePreferences = (listener: () => void): (() => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_KEY || event.key === IDLE_LOCK_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
};
