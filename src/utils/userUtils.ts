import { capitalizeWords } from "./stringUtils";

/**
 * Extracts role from user ID string
 * @param userId - The user ID string (e.g., "VINTAGE_PRESS_LTD_DEFAULT_DEFAULT_Admin")
 * @returns Extracted role (e.g., "Admin")
 */
export const extractRoleFromUserId = (userId: string): string => {
  if (!userId || typeof userId !== 'string') return "User";
  
  const lowerId = userId.toLowerCase().trim();
  
  // Priority: Check for specific role keywords
  const roleKeywords = [
    { keyword: 'admin', role: 'Admin' },
    { keyword: 'manager', role: 'Manager' },
    { keyword: 'supervisor', role: 'Supervisor' },
    { keyword: 'editor', role: 'Editor' },
    { keyword: 'viewer', role: 'Viewer' },
    { keyword: 'auditor', role: 'Auditor' },
    { keyword: 'approver', role: 'Approver' },
    { keyword: 'user', role: 'User' }
  ];

  for (const { keyword, role } of roleKeywords) {
    if (lowerId.includes(keyword)) {
      return role;
    }
  }

  // Fallback: Extract last segment after underscore
  const parts = userId.split('_').filter(part => part.trim() !== '');
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    return capitalizeWords(lastPart);
  }

  return "User";
};

/**
 * Formats user name from user ID for display
 * @param userId - The user ID string
 * @returns Formatted display name
 */
export const formatUserName = (userId: string): string => {
  if (!userId || typeof userId !== 'string') return "Guest User";
  
  const parts = userId.split('_').filter(part => 
    part.trim() !== '' && 
    !part.toLowerCase().includes('default') &&
    !part.toLowerCase().includes('admin') &&
    !part.toLowerCase().includes('user')
  );
  
  if (parts.length > 0) {
    // Return the company/organization name (usually first part)
    return parts[0].replace(/_/g, ' ');
  }
  
  // Clean up the full string as fallback
  return userId
    .replace(/_/g, ' ')
    .replace(/\b(DEFAULT|ADMIN|USER)\b/gi, '')
    .trim() || "User";
};

/**
 * Gets user initials for avatar display
 * @param userName - The user's name
 * @returns Initials string (e.g., "JD" for John Doe)
 */
export const getUserInitials = (userName: string): string => {
  if (!userName || typeof userName !== 'string') return "U";
  
  const words = userName.split(' ').filter(word => word.trim() !== '');
  
  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return userName.charAt(0).toUpperCase() || "U";
};

export interface UserLocation {
  company?: string;
  division?: string;
  department?: string;
  branch?: string;
}

export interface UserData {
  /** PowerAPI Identity user id. */
  userId: string;
  /** The username the user signs in with (also used to unlock). */
  username: string;
  /** Composite Identity name, e.g. ACME_DEFAULT_DEFAULT_jdoe. */
  uniqueName: string;
  /** Human-friendly name shown in the navbar. */
  displayName: string;
  role: string;
  initials: string;
  company?: string;
  location?: UserLocation;
  accType?: string[];
}

/** PowerAPI serializes anonymous objects with inconsistent casing. */
const field = <T = unknown>(source: any, key: string): T | undefined => {
  if (!source || typeof source !== 'object') return undefined;
  const lower = key.charAt(0).toLowerCase() + key.slice(1);
  const upper = key.charAt(0).toUpperCase() + key.slice(1);
  const hit = source[key] ?? source[lower] ?? source[upper];
  return hit === null ? undefined : (hit as T);
};

/**
 * Derives the role from the `accType` array the login endpoint returns,
 * falling back to keyword extraction from the composite Identity name.
 */
const resolveRole = (accType: string[] | undefined, uniqueName: string): string => {
  const named = accType?.find((entry) => typeof entry === 'string' && entry.trim() !== '');
  if (named && named.toLowerCase() !== 'user') {
    return capitalizeWords(named);
  }
  return extractRoleFromUserId(uniqueName) || (named ? capitalizeWords(named) : 'User');
};

/**
 * Parses user data out of a `POST api/Login/{token}` response.
 *
 * Shape: { statusCode, message, data: { userId, userName, location, accType,
 * warehouses }, jwtToken, expiration, refreshToken }
 *
 * @param apiResponse - the full login response body
 * @param typedUsername - what the user entered; the most accurate display name
 */
export const parseUserData = (apiResponse: any, typedUsername?: string): UserData => {
  const payload = field<Record<string, any>>(apiResponse, 'data') ?? apiResponse ?? {};

  const uniqueName = field<string>(payload, 'userName') ?? '';
  const userId = field<string>(payload, 'userId') ?? uniqueName;
  const accType = field<string[]>(payload, 'accType');
  const location = field<UserLocation>(payload, 'location');

  const username = (typedUsername ?? '').trim() || extractAccountSegment(uniqueName);
  const displayName = username || formatUserName(uniqueName) || 'User';
  const role = resolveRole(accType, uniqueName);

  return {
    userId,
    username,
    uniqueName,
    displayName,
    role,
    initials: getUserInitials(displayName),
    company: field<string>(location, 'company') ?? extractSegmentSafe(uniqueName),
    location,
    accType,
  };
};

/** Last segment of a composite Identity name is the account's own username. */
const extractAccountSegment = (uniqueName: string): string => {
  if (!uniqueName) return '';
  const parts = uniqueName.split('_').filter((part) => part.trim() !== '');
  return parts.length > 0 ? parts[parts.length - 1] : '';
};

const extractSegmentSafe = (uniqueName: string): string | undefined =>
  uniqueName ? uniqueName.split('_')[0] || undefined : undefined;

/**
 * Stores user data in localStorage
 * @param userData - User data to store
 * @deprecated Session state is owned by `@/lib/authStorage`. Use `saveUser`
 * there instead so lock state and cross-tab sync stay consistent.
 */
export const storeUserData = (userData: UserData): void => {
  try {
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('userId', userData.username);
  } catch (error) {
    console.error('Failed to store user data:', error);
  }
};

/**
 * Retrieves user data from localStorage
 * @returns User data or null
 * @deprecated Use `getUserData` from `@/lib/authStorage`, or `useSession()`.
 */
export const retrieveUserData = (): UserData | null => {
  try {
    const stored = localStorage.getItem('userData');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to retrieve user data:', error);
    return null;
  }
};

/**
 * Clears user data from storage
 * @deprecated Use `clearSession` from `@/lib/authStorage` — it also clears
 * tokens, lock state and the remembered route.
 */
export const clearUserData = (): void => {
  localStorage.removeItem('userData');
  localStorage.removeItem('userId');
};