/** A small rotating ring; inherits the text colour. */
export const Spinner = ({ className = "w-4 h-4" }: { className?: string }) => (
  <span
    role="status"
    aria-label="Loading"
    className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
  />
);

/** Spinner with a line of text, for a section that is still loading. */
export const Loader = ({ label = "Loading...", className = "p-4" }: { label?: string; className?: string }) => (
  <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
    <Spinner />
    <span>{label}</span>
  </div>
);

export default Spinner;
