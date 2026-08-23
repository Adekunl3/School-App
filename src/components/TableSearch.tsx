"use client";

import Image from "next/image";

/**
 * Search box for a list page. Controlled when `onChange` is supplied; falls back
 * to the original uncontrolled input for pages not yet wired to the API.
 */
type TableSearchProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

const TableSearch = ({ value, onChange, placeholder = "Search..." }: TableSearchProps) => {
  const controlled = typeof onChange === "function";

  return (
    <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder={placeholder}
        aria-label="Search"
        className="w-[200px] p-2 bg-transparent outline-none"
        {...(controlled
          ? { value: value ?? "", onChange: (e) => onChange!(e.target.value) }
          : {})}
      />
    </div>
  );
};

export default TableSearch;
