import { FieldError } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  register: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  /** Shows a red asterisk. Visual only; validation stays in the form's schema. */
  required?: boolean;
  /** Overrides the wrapper sizing, e.g. "w-full" inside a grid. */
  className?: string;
};

/** Shared control styling so inputs, selects and textareas look alike. */
export const fieldClass = (hasError?: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors
  focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
  dark:bg-gray-800 dark:text-gray-200 dark:disabled:bg-gray-700/60 dark:disabled:text-gray-400 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/40"
      : "border-gray-300 focus:border-indigo-400 focus:ring-indigo-100 dark:border-gray-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
  }`;

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  inputProps,
  required,
  className = "w-full md:w-1/4",
}: InputFieldProps) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        type={type}
        {...register(name)}
        className={fieldClass(!!error)}
        aria-invalid={error ? true : undefined}
        {...inputProps}
        defaultValue={defaultValue}
      />
      {error?.message && (
        <p className="text-xs text-red-500">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default InputField;
