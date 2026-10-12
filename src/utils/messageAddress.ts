// The API addresses messages by Identity user name, which is the composite
// "<COMPANY>_<DIVISION>_<DEPARTMENT>_<account>" (the company part may itself
// contain underscores). People know each other by the last part only, so the
// UI shows and accepts that and adds the sender's own prefix when sending.

/** "ACME_DEFAULT_DEFAULT_" from "ACME_DEFAULT_DEFAULT_jdoe". */
export const addressPrefix = (myUniqueName: string): string => {
  const cut = myUniqueName.lastIndexOf("_");
  return cut >= 0 ? myUniqueName.slice(0, cut + 1) : "";
};

/** What a person types ("jdoe") -> the address the API stores. */
export const toAddress = (input: string, myUniqueName: string): string => {
  const value = input.trim();
  const prefix = addressPrefix(myUniqueName);
  if (!prefix || value.toUpperCase().startsWith(prefix.toUpperCase())) return value;
  return prefix + value;
};

/** A stored address -> what to show; full form kept for other schools. */
export const displayAddress = (address: string | null | undefined, myUniqueName: string): string => {
  if (!address) return "-";
  const prefix = addressPrefix(myUniqueName);
  return prefix && address.toUpperCase().startsWith(prefix.toUpperCase())
    ? address.slice(prefix.length)
    : address;
};
