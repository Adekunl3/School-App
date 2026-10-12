"use client";

import { useState } from "react";
import { formatAmount } from "@/services/fees";

/** "1,234,567.8" -> "1234567.8". Keeps one decimal point and at most 2 decimals. */
const toRaw = (text: string): string => {
  const cleaned = text.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join("").slice(0, 2)}`;
};

/** "1234567.8" -> "1,234,567.8" while typing, leaving a trailing "." alone. */
const group = (raw: string): string => {
  if (raw === "") return "";
  const [whole, decimals] = raw.split(".");
  const grouped = (whole.replace(/^0+(?=\d)/, "") || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimals === undefined ? grouped : `${grouped}.${decimals}`;
};

/**
 * Amount field shown as 1,000,000.00. `value` and `onChange` use the plain
 * number string ("1000000"), so callers keep doing Number(value).
 */
const MoneyInput = ({
  value,
  onChange,
  className,
  placeholder = "0.00",
  disabled,
}: {
  value: string;
  onChange: (raw: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  const raw = toRaw(value);
  // Full two-decimal form once the field is left; grouped as typed while in it.
  const shown = focused || raw === "" || Number.isNaN(Number(raw)) ? group(raw) : formatAmount(Number(raw));

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={shown}
      onChange={(event) => onChange(toRaw(event.target.value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default MoneyInput;
