import { type Menu, type MenuMatches } from "@/lib/types/menu-types";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
  type Timestamp,
  type FieldValue
} from "firebase/firestore";

// --- Firestore Constants ---
const MENUS_COLLECTION = "menus";

// --- Helper Functions (can be moved to a utils file later) ---
function getDocRef(collectionName: string, id: string) {
  if (!db) throw new Error("Firestore not initialized");
  return doc(db, collectionName, id);
}
function getCollectionRef(collectionName: string) {
  if (!db) throw new Error("Firestore not initialized");
  return collection(db, collectionName);
}

// --- Types (Firestore-specific Menu representation) ---
interface FirestoreMenu {
  menu_id: string;
  start_date: string;
  end_date: string;
  participants: string[];
  matches: { // Store matches as string arrays
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snack: string[];
  };
  status?: 'pending' | 'active' | 'archived';
  createdBy: string; // Creator's user ID
  createdAt: Timestamp | FieldValue;
}

// --- Service Logic ---
export const menuService = {

  async createMenu(startDate: string, endDate: string, userId: string, userName?: string): Promise<string> {
    if (!db) throw new Error("Firestore not initialized");
    const menuId = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log(`MenuService(FS): Generated menu ID: ${menuId}`);
    try {
      const menuData: FirestoreMenu = {
        menu_id: menuId,
        start_date: startDate,
        end_date: endDate,
        participants: [userId],
        matches: { breakfast: [], lunch: [], dinner: [], snack: [] },
        status: 'pending',
        createdBy: userId,
        createdAt: serverTimestamp()
      };
      await setDoc(getDocRef(MENUS_COLLECTION, menuId), menuData);
      console.log(`MenuService(FS): Saved menu ${menuId}`);
      // Note: Adding menu to user's list is handled by UserService
      return menuId;
    } catch (error) {
      console.error(`MenuService(FS): Error creating menu ${menuId}:`, error);
      throw error;
    }
  },

  async getMenu(menuId: string): Promise<Menu | null> {
    if (!db) throw new Error("Firestore not initialized");
    const normalizedMenuId = menuId.toUpperCase();
    console.log(`MenuService(FS): Getting menu ${normalizedMenuId}`);
    try {
      const menuDoc = await getDoc(getDocRef(MENUS_COLLECTION, normalizedMenuId));
      if (!menuDoc.exists()) {
        console.log(`MenuService(FS): Menu ${normalizedMenuId} not found.`);
        return null;
      }
      const menuData = menuDoc.data() as FirestoreMenu;
      // Matches are already string arrays in FirestoreMenu
      return { ...menuData, matches: menuData.matches } as Menu;
    } catch (error) {
      console.error(`MenuService(FS): Error getting menu ${normalizedMenuId}:`, error);
      throw error;
    }
  },

  async joinMenu(menuId: string, userId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    const normalizedMenuId = menuId.toUpperCase();
    console.log(`MenuService(FS): User ${userId} attempting to join ${normalizedMenuId}`);
    try {
      const menuRef = getDocRef(MENUS_COLLECTION, normalizedMenuId);
      const menuDoc = await getDoc(menuRef);
      if (!menuDoc.exists()) {
        console.log(`MenuService(FS): Menu ${normalizedMenuId} not found.`);
        return false;
      }
      const menuData = menuDoc.data() as FirestoreMenu;
      if (menuData.participants.includes(userId)) {
        console.log(`MenuService(FS): User ${userId} already in menu ${normalizedMenuId}.`);
        return true; // Already joined
      }
      await updateDoc(menuRef, { participants: arrayUnion(userId) });
      console.log(`MenuService(FS): Added user ${userId} to menu ${normalizedMenuId}.`);
      // Note: Adding menu to user's list is handled by UserService
      return true;
    } catch (error) {
      console.error(`MenuService(FS): Error joining menu ${normalizedMenuId}:`, error);
      throw error;
    }
  },

  async getUserMenus(userId: string): Promise<Menu[]> {
    if (!db) throw new Error("Firestore not initialized");
    console.log(`MenuService(FS): Getting menus for user ${userId}`);
    try {
      const q = query(getCollectionRef(MENUS_COLLECTION), where("participants", "array-contains", userId));
      const querySnapshot = await getDocs(q);
      const menus: Menu[] = [];
      querySnapshot.forEach((doc) => {
        // Cast needed because Firestore data might not perfectly match Menu type initially
        menus.push({ ...doc.data(), menu_id: doc.id } as unknown as Menu);
      });
      console.log(`MenuService(FS): Found ${menus.length} menus for user ${userId}`);
      return menus;
    } catch (error) {
      console.error(`MenuService(FS): Error getting menus for user ${userId}:`, error);
      throw new Error("Failed to fetch user menus.");
    }
  },

  async getMenuParticipants(menuId: string): Promise<string[]> {
    if (!db) throw new Error("Firestore not initialized");
    console.log(`MenuService(FS): Getting participants for menu ${menuId}`);
    try {
      const menuDoc = await getDoc(getDocRef(MENUS_COLLECTION, menuId));
      if (!menuDoc.exists()) return [];
      const menuData = menuDoc.data() as FirestoreMenu;
      // Return only participant IDs. Getting names is responsibility of UserService/UI.
      return menuData.participants || [];
    } catch (error) {
      console.error(`MenuService(FS): Error getting participants for menu ${menuId}:`, error);
      throw error;
    }
  },
  
  // Renamed from removeMenuFromUser for clarity - this is LEAVING
  async leaveMenu(userId: string, menuId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    console.log(`MenuService(FS): User ${userId} leaving menu ${menuId}`);
    try {
      const menuDocRef = getDocRef(MENUS_COLLECTION, menuId);
      await updateDoc(menuDocRef, { participants: arrayRemove(userId) });
      console.log(`MenuService(FS): Removed user ${userId} from menu ${menuId}.`);
      // Note: Removing menu from user's list should ideally happen too (maybe via UserService?)
    } catch (error) {
      console.error(`MenuService(FS): Error leaving menu ${menuId} for user ${userId}:`, error);
      throw new Error("Failed to leave menu.");
    }
  },
  
  // Deletes the entire menu document - intended for creator
  async deleteMenuDocument(menuId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    console.log(`MenuService(FS): Deleting menu document ${menuId}`);
    try {
      await deleteDoc(getDocRef(MENUS_COLLECTION, menuId));
      console.log(`MenuService(FS): Deleted menu document ${menuId}.`);
      // TODO: Consider removing this menuId from all participants' user docs? (Complex/Costly)
    } catch (error) {
      console.error(`MenuService(FS): Error deleting menu document ${menuId}:`, error);
      throw new Error("Failed to delete menu document.");
    }
  },

  async menuExists(menuId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    const normalizedMenuId = menuId.toUpperCase();
    console.log(`MenuService(FS): Checking existence of menu ${normalizedMenuId}`);
    try {
      const menuDoc = await getDoc(getDocRef(MENUS_COLLECTION, normalizedMenuId));
      const exists = menuDoc.exists();
      console.log(`MenuService(FS): Menu ${normalizedMenuId} ${exists ? 'exists' : 'does not exist'}.`);
      return exists;
    } catch (error) {
      console.error(`MenuService(FS): Error checking menu existence ${normalizedMenuId}:`, error);
      return false; // Assume not exists on error
    }
  },

  async updateMenu(menu: Menu): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    if (!menu || !menu.menu_id) throw new Error('Invalid menu data for update');
    console.log(`MenuService(FS): Updating menu ${menu.menu_id}`);
    try {
      const menuRef = getDocRef(MENUS_COLLECTION, menu.menu_id);
      // Prepare data, ensuring matches field has the correct structure (string arrays)
      const dataToUpdate: Partial<FirestoreMenu> = {
        start_date: menu.start_date,
        end_date: menu.end_date,
        participants: menu.participants,
        matches: menu.matches, // Already string[]
        status: menu.status,
        // Exclude createdAt, createdBy, menu_id as they shouldn't be updated here
      };
      await updateDoc(menuRef, dataToUpdate);
      console.log(`MenuService(FS): Updated menu ${menu.menu_id}.`);
    } catch (error) {
      console.error(`MenuService(FS): Error updating menu ${menu.menu_id}:`, error);
      throw error;
    }
  },
  
  subscribeToMenuUpdates(
    menuId: string, 
    callback: (menu: Menu | null) => void
  ): Unsubscribe {
    if (!db) {
      console.error("MenuService(FS): Firestore not initialized for subscription.");
      return () => {}; // Return no-op unsubscribe
    }
    const normalizedMenuId = menuId.toUpperCase();
    console.log(`MenuService(FS): Subscribing to updates for menu ${normalizedMenuId}`);
    try {
      const menuRef = getDocRef(MENUS_COLLECTION, normalizedMenuId);
      const unsubscribe = onSnapshot(menuRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const menuData = docSnapshot.data() as FirestoreMenu;
          console.log(`MenuService(FS): Received update for menu ${normalizedMenuId}`);
          // Matches are already string[]
          const appMenu = { ...menuData, matches: menuData.matches } as unknown as Menu;
          callback(appMenu); 
        } else {
          console.log(`MenuService(FS): Menu ${normalizedMenuId} deleted or does not exist.`);
          callback(null);
        }
      }, (error) => {
        console.error(`MenuService(FS): Error in subscription for menu ${normalizedMenuId}:`, error);
        callback(null); // Notify error
      });
      return unsubscribe;
    } catch (error) {
      console.error(`MenuService(FS): Failed to set up subscription for ${normalizedMenuId}:`, error);
      return () => {}; 
    }
  },
}; 