// Local storage keys
const USER_ID_KEY = 'cullinary_user_id';
const USER_NAME_KEY = 'cullinary_user_name';
const USER_PREFERENCES_KEY = 'cullinary_user_preferences';
const USER_FAVORITES_KEY = 'cullinary_user_favorites';

// Use relative path for the import
import { type DietaryPreferences } from "./types/user-types";

// Get user ID from localStorage
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const userId = localStorage.getItem(USER_ID_KEY);
    console.log("LocalStorage: getUserId - retrieved userId:", userId ? "exists" : "not found");
    return userId;
  } catch (error) {
    console.error("Error getting userId from localStorage:", error);
    return null;
  }
}

// Save user ID to localStorage
export function saveUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_ID_KEY, userId);
    console.log("LocalStorage: saveUserId - saved userId:", userId);
  } catch (error) {
    console.error("Error saving userId to localStorage:", error);
  }
}

// Get user name from localStorage
export function getUserName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const userName = localStorage.getItem(USER_NAME_KEY);
    console.log("LocalStorage: getUserName - retrieved userName:", userName ? "exists" : "not found");
    return userName;
  } catch (error) {
    console.error("Error getting userName from localStorage:", error);
    return null;
  }
}

// Save user name to localStorage
export function saveUserName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_NAME_KEY, name);
    console.log("LocalStorage: saveUserName - saved name:", name);
  } catch (error) {
    console.error("Error saving userName to localStorage:", error);
  }
}

// Check if user has set their name
export function hasUserName(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(USER_NAME_KEY);
}

// Get user dietary preferences from localStorage
export function getUserPreferences(): DietaryPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const prefsString = localStorage.getItem(USER_PREFERENCES_KEY);
    if (prefsString) {
      return JSON.parse(prefsString) as DietaryPreferences;
    }
    return null;
  } catch (error) {
    console.error("Error getting user preferences from localStorage:", error);
    return null;
  }
}

// Save user dietary preferences to localStorage
export function saveUserPreferences(preferences: DietaryPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Error saving user preferences to localStorage:", error);
  }
}

export function getUserFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const favoritesString = localStorage.getItem(USER_FAVORITES_KEY);
    return favoritesString ? JSON.parse(favoritesString) : [];
  } catch (error) {
    console.error("Error getting user favorites from localStorage:", error);
    return [];
  }
}

export function saveUserFavorites(favorites: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Error saving user favorites to localStorage:", error);
  }
} 