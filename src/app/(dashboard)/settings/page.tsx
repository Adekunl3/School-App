"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { IDLE_LOCK_MS } from "@/lib/config";
import {
  IDLE_LOCK_OPTIONS,
  getIdleLockMs,
  getThemePreference,
  setIdleLockMinutes,
  setThemePreference,
  subscribePreferences,
  type ThemePreference,
} from "@/lib/preferences";
import { useSession } from "@/providers/SessionProvider";

const THEMES: { value: ThemePreference; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "Always light" },
  { value: "dark", label: "Dark", hint: "Always dark" },
  { value: "system", label: "System", hint: "Follow this device" },
];

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-md p-4 flex flex-col md:flex-row gap-4">
    <div className="md:w-1/3">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{description}</p>
    </div>
    <div className="md:w-2/3">{children}</div>
  </div>
);

/**
 * Preferences for this browser. They live on the device rather than the
 * account, so another computer keeps its own.
 */
const SettingsPage = () => {
  const { lock, signOut } = useSession();

  const [theme, setTheme] = useState<ThemePreference>("light");
  const [lockMinutes, setLockMinutes] = useState(Math.round(IDLE_LOCK_MS / 60_000));
  const [signingOut, setSigningOut] = useState(false);

  // Read after mount (localStorage) and follow the Navbar toggle.
  useEffect(() => {
    const sync = () => {
      setTheme(getThemePreference());
      setLockMinutes(Math.round(getIdleLockMs() / 60_000));
    };
    sync();
    return subscribePreferences(sync);
  }, []);

  const defaultMinutes = Math.round(IDLE_LOCK_MS / 60_000);
  const lockOptions = Array.from(new Set<number>([...IDLE_LOCK_OPTIONS, defaultMinutes, lockMinutes])).sort(
    (a, b) => a - b
  );

  return (
    <div className="flex-1 p-4 pt-0 flex flex-col gap-4">
      <h1 className="text-lg font-semibold px-1">Settings</h1>

      <Section title="Appearance" description="Light or dark colours. The moon/sun button in the top bar switches too.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
          {THEMES.map((option) => {
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setThemePreference(option.value)}
                className={`text-left rounded-md p-3 ring-[1.5px] transition-colors ${
                  active
                    ? "ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/40"
                    : "ring-gray-200 hover:bg-gray-50 dark:ring-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-300">{option.hint}</p>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Auto-lock"
        description="Lock the screen after this long without activity. Unlocking only needs your password."
      >
        <select
          value={lockMinutes}
          onChange={(e) => {
            const minutes = Number(e.target.value);
            setIdleLockMinutes(minutes);
            toast.success(`The screen will lock after ${minutes} minutes of inactivity.`);
          }}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full sm:w-64 dark:ring-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          {lockOptions.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes >= 60 ? `${minutes / 60} hour${minutes === 60 ? "" : "s"}` : `${minutes} minutes`}
              {minutes === defaultMinutes ? " (default)" : ""}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Session" description="Lock the screen when you step away, or sign out on a shared computer.">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={lock}
            className="py-2 px-4 rounded-md border border-gray-300 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Lock screen now
          </button>
          <button
            type="button"
            disabled={signingOut}
            aria-busy={signingOut}
            onClick={async () => {
              setSigningOut(true);
              await signOut();
            }}
            className="py-2 px-4 rounded-md bg-red-600 text-white text-sm disabled:opacity-60"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </Section>
    </div>
  );
};

export default SettingsPage;
