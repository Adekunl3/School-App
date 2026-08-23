"use client";

import { useLookup } from "@/hooks/useLookup";
import type { LookupSource } from "@/services/school";

type MultiSelectFieldProps = {
  label: string;
  source: LookupSource;
  /** Currently selected ids. */
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
  disabled?: boolean;
};

/**
 * Checkbox list for a many-to-many field (subject → teachers).
 *
 * Deliberately not a `<select multiple>`: that control is easy to mis-operate
 * with a mouse (clicking one option silently clears the rest) and gives no
 * indication of what is selected until you scroll it.
 */
const MultiSelectField = ({
  label,
  source,
  value,
  onChange,
  hint,
  disabled = false,
}: MultiSelectFieldProps) => {
  const { options, loading, error } = useLookup(source);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-baseline justify-between">
        <label className="text-xs text-gray-500">{label}</label>
        {value.length > 0 && (
          <span className="text-xs text-gray-400">{value.length} selected</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-xs text-red-400">{error.message}</p>
      ) : options.length === 0 ? (
        <p className="text-xs text-amber-500">None available yet — create one first.</p>
      ) : (
        <div className="max-h-40 overflow-y-auto rounded-md ring-[1.5px] ring-gray-300 p-2 flex flex-col gap-1">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 rounded px-1"
            >
              <input
                type="checkbox"
                checked={value.includes(option.id)}
                onChange={() => toggle(option.id)}
                disabled={disabled}
              />
              <span>{option.name}</span>
              {option.description && (
                <span className="text-xs text-gray-400">{option.description}</span>
              )}
            </label>
          ))}
        </div>
      )}

      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
};

export default MultiSelectField;
