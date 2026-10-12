"use client";

import type { FieldError } from "react-hook-form";
import { fieldClass } from "./InputField";
import { useLookup } from "@/hooks/useLookup";
import type { LookupSource } from "@/services/school";
import type { Lookup } from "@/types/school";

type SelectFieldProps = {
  label: string;
  name: string;
  register: any;
  error?: FieldError;
  /** Options provided directly. Mutually exclusive with `source`. */
  options?: Lookup[];
  /** Lookup endpoint to populate from. */
  source?: LookupSource;
  /** Shown as the empty choice; omit to make the field required-looking. */
  placeholder?: string;
  /** Renders full-width instead of the default quarter-width. */
  wide?: boolean;
  disabled?: boolean;
  /** Overrides the wrapper sizing; takes precedence over `wide`. */
  className?: string;
};

/**
 * Single select that mirrors InputField's layout, either from a static option
 * list or from one of the GetXList lookup endpoints.
 */
const SelectField = ({
  label,
  name,
  register,
  error,
  options,
  source,
  placeholder = "Select...",
  wide = false,
  disabled = false,
  className,
}: SelectFieldProps) => {
  // Hooks cannot be called conditionally, so the lookup always runs; passing a
  // static `options` list simply means its result is ignored.
  const lookup = useLookup(source ?? "classes");
  const usingLookup = Boolean(source);

  const items = usingLookup ? lookup.options : options ?? [];
  const loading = usingLookup && lookup.loading;
  const loadError = usingLookup ? lookup.error : null;

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? `w-full ${wide ? "" : "md:w-1/4"}`}`}>
      <label className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</label>
      <select
        {...register(name)}
        disabled={disabled || loading}
        className={fieldClass(!!error)}
      >
        <option value="">{loading ? "Loading..." : placeholder}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.description ? `${item.name} — ${item.description}` : item.name}
          </option>
        ))}
      </select>

      {error?.message && (
        <p className="text-xs text-red-500">{error.message.toString()}</p>
      )}

      {/* A failed lookup leaves the select empty, which otherwise looks like
          "there are none" rather than "this did not load". */}
      {loadError && <p className="text-xs text-red-500">{loadError.message}</p>}

      {!loading && !loadError && usingLookup && items.length === 0 && (
        <p className="text-xs text-amber-500">
          None available yet — create one first.
        </p>
      )}
    </div>
  );
};

export default SelectField;
