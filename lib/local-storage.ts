// Local storage keys
const USER_ID_KEY = 'cullinary_user_id';
const MENUS_KEY = 'cullinary_menus';

// Types
interface StoredMenu {
  menu_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: number; // timestamp
}

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Get user ID from localStorage
export const getUserId = (): string | null => {
  if (!isLocalStorageAvailable()) return null;
  return localStorage.getItem(USER_ID_KEY);
};

// Save user ID to localStorage
export const saveUserId = (userId: string): void => {
  if (!isLocalStorageAvailable()) return;
  localStorage.setItem(USER_ID_KEY, userId);
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
export const saveMenuToStorage = (menu: StoredMenu): void => {
  if (!isLocalStorageAvailable()) return;
  
  const menus = getStoredMenus();
  
  // Check if menu already exists
  const existingIndex = menus.findIndex(m => m.menu_id === menu.menu_id);
  
  if (existingIndex >= 0) {
    // Update existing menu
    menus[existingIndex] = menu;
  } else {
    // Add new menu
    menus.push(menu);
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