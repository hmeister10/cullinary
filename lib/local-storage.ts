// Local storage keys
const USER_ID_KEY = 'cullinary_user_id';
const USER_NAME_KEY = 'cullinary_user_name';
const MENUS_KEY = 'cullinary_menus';
const USER_PREFERENCES_KEY = 'cullinary_user_preferences';

// Types
interface StoredMenu {
  menu_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: number; // timestamp
}

export interface DietaryPreferences {
  isVegetarian: boolean;
  dietType?: string;
  region?: string;
  healthTags?: string[];
  cuisinePreferences: string[];
  proteinPreferences: string[];
  specificPreferences: string[];
  avoidances: string[];
  occasionBasedDiet?: {
    enabled: boolean;
    days: string[];
    festivals: string[];
    other: string[];
  };
}

// Import Menu type from mock-data
import { Menu } from './mock-data';

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    // Ignore the error and return false
    console.error('LocalStorage is not available:', error);
    return false;
  }
};

// Get user ID from localStorage
export const getUserId = (): string | null => {
  if (!isLocalStorageAvailable()) {
    console.log('LocalStorage: getUserId - localStorage not available');
    return null;
  }
  const userId = localStorage.getItem(USER_ID_KEY);
  console.log(`LocalStorage: getUserId - retrieved userId: ${userId ? userId : 'null'}`);
  return userId;
};

// Save user ID to localStorage
export const saveUserId = (userId: string): void => {
  if (!isLocalStorageAvailable()) {
    console.log('LocalStorage: saveUserId - localStorage not available');
    return;
  }
  console.log(`LocalStorage: saveUserId - saving userId: ${userId}`);
  localStorage.setItem(USER_ID_KEY, userId);
};

// Get user name from localStorage
export const getUserName = (): string | null => {
  if (!isLocalStorageAvailable()) {
    console.log('LocalStorage: getUserName - localStorage not available');
    return null;
  }
  const userName = localStorage.getItem(USER_NAME_KEY);
  console.log(`LocalStorage: getUserName - retrieved userName: ${userName ? userName : 'null'}`);
  return userName;
};

// Save user name to localStorage
export const saveUserName = (userName: string): void => {
  if (!isLocalStorageAvailable()) {
    console.log('LocalStorage: saveUserName - localStorage not available');
    return;
  }
  console.log(`LocalStorage: saveUserName - saving userName: ${userName}`);
  localStorage.setItem(USER_NAME_KEY, userName);
};

// Check if user has set their name
export const hasUserName = (): boolean => {
  return !!getUserName();
};

// Get menus from localStorage
export const getStoredMenus = (): StoredMenu[] => {
  if (!isLocalStorageAvailable()) return [];
  
  const menusJson = localStorage.getItem(MENUS_KEY);
  if (!menusJson) return [];
  
  try {
    return JSON.parse(menusJson);
  } catch (e) {
    console.error('Error parsing menus from localStorage:', e);
    return [];
  }
};

// Save a menu to localStorage
export const saveMenuToStorage = (menu: StoredMenu | Menu): void => {
  if (!isLocalStorageAvailable()) return;
  
  const menus = getStoredMenus();
  
  // Ensure the menu has all required properties for StoredMenu
  const storedMenu: StoredMenu = {
    menu_id: menu.menu_id,
    name: 'name' in menu ? menu.name : `Menu ${menu.menu_id.substring(0, 6)}`,
    start_date: menu.start_date,
    end_date: menu.end_date,
    created_at: 'created_at' in menu ? menu.created_at : Date.now()
  };
  
  // Check if menu already exists
  const existingIndex = menus.findIndex(m => m.menu_id === storedMenu.menu_id);
  
  if (existingIndex >= 0) {
    // Update existing menu
    menus[existingIndex] = storedMenu;
  } else {
    // Add new menu
    menus.push(storedMenu);
  }
  
  // Sort by created_at (newest first)
  menus.sort((a, b) => b.created_at - a.created_at);
  
  // Save to localStorage
  localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
};

// Remove a menu from localStorage
export const removeMenuFromStorage = (menuId: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  const menus = getStoredMenus();
  const filteredMenus = menus.filter(menu => menu.menu_id !== menuId);
  
  localStorage.setItem(MENUS_KEY, JSON.stringify(filteredMenus));
};

// Get user dietary preferences from localStorage
export const getUserPreferences = (): DietaryPreferences | null => {
  if (!isLocalStorageAvailable()) {
    console.log('LocalStorage: getUserPreferences - localStorage not available');
    return null;
  }
  
  const preferencesJson = localStorage.getItem(USER_PREFERENCES_KEY);
  if (!preferencesJson) return null;
  
  try {
    return JSON.parse(preferencesJson);
  } catch (e) {
    console.error('Error parsing user preferences from localStorage:', e);
    return null;
  }
};

// Save user dietary preferences to localStorage
export const saveUserPreferences = (preferences: DietaryPreferences): void => {
  if (!isLocalStorageAvailable()) {
    console.log('LocalStorage: saveUserPreferences - localStorage not available');
    return;
  }
  
  console.log('LocalStorage: saveUserPreferences - saving preferences');
  localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
}; 