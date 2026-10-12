"use client";

import { Spinner } from "./Spinner";

/** Title block at the top of a form modal. */
export const FormHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <header className="pr-10">
    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
    {subtitle && (
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    )}
  </header>
);

/**
 * A titled group of fields on a responsive grid. Fields placed inside should be
 * full-width (`className="w-full"`, or `wide` on selects); use `col-span-*`
 * classes on a field to make it span columns.
 */
export const FormSection = ({
  title,
  hint,
  columns = "sm:grid-cols-2 lg:grid-cols-3",
  children,
}: {
  title: string;
  hint?: string;
  /** Tailwind grid column classes, e.g. "sm:grid-cols-2". */
  columns?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
    <div className={`grid grid-cols-1 gap-4 ${columns}`}>{children}</div>
  </section>
);

/**
 * Action bar pinned to the bottom of the modal so the buttons stay in view
 * while a long form scrolls. The negative margins cancel the modal's padding so
 * the bar spans its full width.
 */
export const FormFooter = ({
  onCancel,
  submitting,
  submitLabel,
  submittingLabel,
}: {
  onCancel?: () => void;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
}) => (
  <footer className="sticky -bottom-6 -mx-6 -mb-6 mt-2 flex items-center justify-end gap-3 rounded-b-xl border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
    {onCancel && (
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        Cancel
      </button>
    )}
    <button
      type="submit"
      disabled={submitting}
      aria-busy={submitting}
      className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
    >
      {submitting && <Spinner className="h-4 w-4" />}
      {submitting ? submittingLabel : submitLabel}
    </button>
  </footer>
);
