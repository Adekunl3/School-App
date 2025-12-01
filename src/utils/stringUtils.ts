/**
 * Capitalizes the first letter of each word in a string
 * @param str - Input string
 * @returns Capitalized string
 */
export const capitalizeWords = (str: string): string => {
  if (!str || typeof str !== 'string') return "";
  
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || "";
};

/**
 * Cleans and formats IDs for display
 * @param idString - Raw ID string
 * @returns Cleaned display string
 */
export const formatIdForDisplay = (idString: string): string => {
  if (!idString) return "";
  
  return idString
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extracts specific segment from delimited string
 * @param str - Delimited string
 * @param delimiter - Delimiter character (default: '_')
 * @param segmentIndex - Index of segment to extract (0-based)
 * @returns Extracted segment or empty string
 */
export const extractSegment = (
  str: string, 
  delimiter: string = '_', 
  segmentIndex: number = 0
): string => {
  if (!str) return "";
  
  const segments = str.split(delimiter);
  return segments[segmentIndex] || "";
};