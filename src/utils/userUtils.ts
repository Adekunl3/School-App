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

/**
 * Parses complete user data from API response
 * @param apiResponse - The full API response object
 * @returns Structured user data object
 */
export interface UserData {
  userId: string;
  userName: string;
  role: string;
  initials: string;
  company?: string;
}

export const parseUserData = (apiResponse: any): UserData => {
  const userId = apiResponse?.userId || apiResponse?.data?.userId || '';
  const userName = apiResponse?.userName || apiResponse?.data?.userName || '';
  
  const displayName = formatUserName(userId);
  const role = extractRoleFromUserId(userId);
  const initials = getUserInitials(displayName);
  
  // Extract company name (first part before underscores)
  const company = userId.split('_')[0] || undefined;
  
  return {
    userId,
    userName: userName || displayName,
    role,
    initials,
    company
  };
};

/**
 * Stores user data in localStorage
 * @param userData - User data to store
 */
export const storeUserData = (userData: UserData): void => {
  try {
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('userId', userData.userId);
  } catch (error) {
    console.error('Failed to store user data:', error);
  }
};

/**
 * Retrieves user data from localStorage
 * @returns User data or null
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
 */
export const clearUserData = (): void => {
  localStorage.removeItem('userData');
  localStorage.removeItem('userId');
};