// Shared zod pieces and value converters for the school forms.
//
// Blank inputs must be omitted rather than sent as "", because the update
// endpoints treat null as "leave this field alone" — an empty string would
// overwrite a good value with a blank one.

import { z } from "zod";

/** Optional free text, trimmed, with blanks collapsed to undefined. */
export const optionalText = (max: number) =>
  z
    .string()
    .max(max, { message: `Must be ${max} characters or fewer` })
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined));

/** Required free text. */
export const requiredText = (max: number, label: string) =>
  z
    .string()
    .min(1, { message: `${label} is required!` })
    .max(max, { message: `${label} must be ${max} characters or fewer` })
    .transform((value) => value.trim());

/** Optional email that also accepts an empty field. */
export const optionalEmail = z
  .union([z.literal(""), z.string().email({ message: "Invalid email address!" })])
  .optional()
  .transform((value) => (value ? value : undefined));

/** Optional URL that also accepts an empty field. */
export const optionalUrl = z
  .union([z.literal(""), z.string().url({ message: "Enter a valid URL" })])
  .optional()
  .transform((value) => (value ? value : undefined));

/**
 * Optional integer from a text/number input.
 * `<input type="number">` yields "" when cleared, which `coerce.number()` would
 * otherwise turn into 0.
 */
export const optionalInt = (min: number, max: number) =>
  z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .int({ message: "Must be a whole number" })
        .min(min, { message: `Must be at least ${min}` })
        .max(max, { message: `Must be at most ${max}` }),
    ])
    .optional()
    .transform((value) =>
      value === "" || value === undefined ? undefined : Number(value)
    );

/** Optional decimal, for scores. */
export const optionalNumber = (min: number, max: number) =>
  z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .min(min, { message: `Must be at least ${min}` })
        .max(max, { message: `Must be at most ${max}` }),
    ])
    .optional()
    .transform((value) =>
      value === "" || value === undefined ? undefined : Number(value)
    );

/** Required decimal, for a mark that must be entered. */
export const requiredNumber = (min: number, max: number, label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} is required!` })
    .min(min, { message: `${label} must be at least ${min}` })
    .max(max, { message: `${label} must be at most ${max}` });

/** "HH:mm" as produced by `<input type="time">`. */
export const optionalTime = z
  .union([
    z.literal(""),
    z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, { message: "Use HH:mm" }),
  ])
  .optional()
  .transform((value) => (value ? value : undefined));

// ----------------------------------------------------------------- converters

/** yyyy-MM-dd for `<input type="date">`. */
export const toDateInput = (value?: string | null): string =>
  value ? value.slice(0, 10) : "";

/** HH:mm for `<input type="time">`. */
export const toTimeInput = (value?: string | null): string =>
  value ? value.slice(0, 5) : "";

/**
 * Date-only value the API can parse into a DateTime.
 * Anchored at UTC midnight so a user east of GMT does not have their date
 * shifted back a day by the timezone offset.
 */
export const toApiDate = (value?: string): string | undefined =>
  value ? new Date(`${value}T00:00:00Z`).toISOString() : undefined;

/** Formats an API timestamp for display, or a dash when absent. */
export const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "-"
    : parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

/** Long day names, indexed to match the API's 0 = Sunday. */
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const formatDayOfWeek = (day?: number | null): string =>
  day !== null && day !== undefined && day >= 0 && day <= 6 ? DAY_NAMES[day] : "-";

/** Weekday options for a day-of-week select. */
export const DAY_OPTIONS = DAY_NAMES.map((name, index) => ({
  id: String(index),
  name,
  description: null,
}));
