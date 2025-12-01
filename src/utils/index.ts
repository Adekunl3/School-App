import { capitalizeWords, extractSegment, formatIdForDisplay } from './stringUtils';
import { clearUserData, extractRoleFromUserId, formatUserName, getUserInitials, parseUserData, retrieveUserData, storeUserData } from './userUtils';


export const userUtils = {
  extractRoleFromUserId,
  formatUserName,
  getUserInitials,
  parseUserData,
  storeUserData,
  retrieveUserData,
  clearUserData
};

export const stringUtils = {
  capitalizeWords,
  formatIdForDisplay,
  extractSegment
};