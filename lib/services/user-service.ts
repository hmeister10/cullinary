import { type DietaryPreferences, type User } from "@/lib/types/user-types";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  type Timestamp, 
  type FieldValue,
  collection,
  type Firestore,
} from "firebase/firestore";

// --- Local Storage Keys (kept internal to this service) ---
const USER_ID_KEY = 'cullinary_user_id';
const USER_NAME_KEY = 'cullinary_user_name';
const USER_PREFERENCES_KEY = 'cullinary_user_preferences';
const USER_FAVORITES_KEY = 'cullinary_user_favorites';

// --- Firestore Constants ---
const USERS_COLLECTION = "users";

// --- Firestore Type Definition ---
export interface FirestoreUser {
  user_id: string;
  name?: string;
  menu_ids: string[];
  created_at: Timestamp | FieldValue; // Firestore timestamp or server timestamp
}

// --- Helper Functions (Specific to User Service or use general utils) ---
const getCheckedDb = (): Firestore => {
  if (!db) {
    throw new Error("Firestore database instance is not available.");
  }
  return db;
};

const getCollectionRef = () => collection(getCheckedDb(), USERS_COLLECTION);
const getDocRef = (userId: string) => doc(getCheckedDb(), USERS_COLLECTION, userId);

// --- Service Logic ---
export const userService = {

  // --- Local Storage Functions (from local-storage.ts) ---
  getUserId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const userId = localStorage.getItem(USER_ID_KEY);
      console.log("UserService(LS): getUserId - retrieved userId:", userId ? "exists" : "not found");
      return userId;
    } catch (error) {
      console.error("UserService(LS): Error getting userId:", error);
      return null;
    }
  },

  saveUserId(userId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_ID_KEY, userId);
      console.log("UserService(LS): saveUserId - saved userId:", userId);
    } catch (error) {
      console.error("UserService(LS): Error saving userId:", error);
    }
  },

  getUserNameFromStorage(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const userName = localStorage.getItem(USER_NAME_KEY);
      console.log("UserService(LS): getUserNameFromStorage - retrieved userName:", userName ? "exists" : "not found");
      return userName;
    } catch (error) {
      console.error("UserService(LS): Error getting userName:", error);
      return null;
    }
  },

  saveUserNameToStorage(name: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_NAME_KEY, name);
      console.log("UserService(LS): saveUserNameToStorage - saved name:", name);
    } catch (error) {
      console.error("UserService(LS): Error saving userName:", error);
    }
  },
  
  hasStoredUserName(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(USER_NAME_KEY);
  },

  getUserPreferences(): DietaryPreferences | null {
    if (typeof window === 'undefined') return null;
    try {
      const prefsString = localStorage.getItem(USER_PREFERENCES_KEY);
      if (prefsString) {
        return JSON.parse(prefsString) as DietaryPreferences;
      }
      return null;
    } catch (error) {
      console.error("UserService(LS): Error getting preferences:", error);
      return null;
    }
  },

  saveUserPreferences(preferences: DietaryPreferences): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("UserService(LS): Error saving preferences:", error);
    }
  },

  getUserFavorites(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const favoritesString = localStorage.getItem(USER_FAVORITES_KEY);
      return favoritesString ? JSON.parse(favoritesString) : [];
    } catch (error) {
      console.error("UserService(LS): Error getting favorites:", error);
      return [];
    }
  },

  saveUserFavorites(favorites: string[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("UserService(LS): Error saving favorites:", error);
    }
  },
  
  // --- Firestore Functions (from firestore-service.ts) ---
  
  /**
   * Ensures a user document exists in Firestore, creating/updating as needed.
   * Returns the user data.
   */
  async ensureUserExists(userId: string, userName?: string): Promise<FirestoreUser | null> {
    const userDocRef = getDocRef(userId);
    try {
      const userDoc = await getDoc(userDocRef);
      let userData: FirestoreUser;

      if (!userDoc.exists()) {
        console.log(`UserService(FS): User ${userId} not found. Creating...`);
        userData = {
          user_id: userId,
          name: userName,
          menu_ids: [],
          created_at: serverTimestamp()
        };
        await setDoc(userDocRef, userData);
        console.log(`UserService(FS): Created user ${userId}`);
      } else {
        userData = userDoc.data() as FirestoreUser;
        console.log(`UserService(FS): Found user ${userId}. Name: ${userData.name}`);
        // Optionally update name if provided and different
        if (userName !== undefined && userName !== userData.name) {
          console.log(`UserService(FS): Updating user ${userId} name to ${userName}`);
          await updateDoc(userDocRef, { name: userName });
          userData.name = userName;
        }
      }
      return userData;
    } catch (error) {
      console.error(`UserService(FS): Error ensuring user ${userId} exists:`, error);
      return null;
    }
  },

  /**
   * Updates the user's name in Firestore.
   * Calls ensureUserExists first to handle creation/update consistently.
   */
  async updateUserName(userId: string, name: string): Promise<void> {
    console.log(`UserService(FS): updateUserName called for ${userId}`);
    await this.ensureUserExists(userId, name); // ensureUserExists handles the update
  },

  /**
   * Adds a menu ID to the user's list in Firestore.
   * Calls ensureUserExists first.
   */
  async addMenuToUser(userId: string, menuId: string, userName?: string | null): Promise<void> {
    // Ensure user exists first, doesn't matter if name is updated here
    await this.ensureUserExists(userId, userName ?? undefined);
    try {
      const userDocRef = getDocRef(userId);
      await updateDoc(userDocRef, {
        menu_ids: arrayUnion(menuId)
      });
      console.log(`UserService(FS): Added menu ${menuId} to user ${userId}'s list.`);
    } catch (error) {
      console.error(`UserService(FS): Error adding menu ${menuId} to user ${userId}:`, error);
      throw error; // Re-throw
    }
  },

  /**
   * Gets a user's name from Firestore by their ID.
   */
  async getUserNameById(userId: string): Promise<string | null> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      console.log(`UserService(FS): Getting name for user ID: ${userId}`);
      const userDoc = await getDoc(getDocRef(userId));
      
      if (!userDoc.exists()) {
        console.log(`UserService(FS): User ${userId} not found.`);
        return null;
      }
      
      const userData = userDoc.data() as FirestoreUser;
      console.log(`UserService(FS): Found user ${userId}, name: ${userData.name}`);
      return userData.name || null; 
    } catch (error) {
      console.error(`UserService(FS): Error getting name for user ${userId}:`, error);
      return null; 
    }
  },

  /**
   * Gets multiple user names from Firestore by their IDs.
   */
  async getUserNamesByIds(userIds: string[]): Promise<Map<string, string | null>> {
    if (!db) throw new Error("Firestore not initialized");
    const namesMap = new Map<string, string | null>();
    if (!userIds || userIds.length === 0) return namesMap;

    console.log(`UserService(FS): Getting names for IDs: ${userIds.join(', ')}`);
    const promises = userIds.map(id => this.getUserNameById(id)); // Reuse single fetch
    const names = await Promise.all(promises);
    
    userIds.forEach((id, index) => {
      namesMap.set(id, names[index]);
    });
    
    console.log(`UserService(FS): Fetched names map:`, namesMap);
    return namesMap;
  },

  /**
   * Updates the user's profile in Firestore (e.g., preferences).
   * Currently only updates preferences in localStorage, need to extend for Firestore.
   */
  async updateUserProfile(userId: string, profileData: Partial<User>): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    // TODO: Implement actual Firestore update for preferences if needed
    // Currently, preferences are only saved to localStorage via saveUserPreferences
    // Example Firestore update (if storing preferences on user doc):
    /*
    const userDocRef = getDocRef(USERS_COLLECTION, userId);
    const dataToUpdate: Partial<FirestoreUser> = {};
    if (profileData.name) dataToUpdate.name = profileData.name;
    if (profileData.dietaryPreferences) dataToUpdate.dietaryPreferences = profileData.dietaryPreferences;
    
    try {
      await updateDoc(userDocRef, dataToUpdate);
      console.log(`UserService(FS): Updated profile for user ${userId}`);
    } catch (error) {
      console.error(`UserService(FS): Error updating profile for user ${userId}:`, error);
      throw error;
    }
    */
    console.warn("UserService: updateUserProfile currently only affects localStorage via provider. Firestore update not implemented.");
    // Note: The UserProvider currently calls saveUserName/saveUserPreferences (LS)
    // and firestoreService.updateUserName (which calls ensureUserExists here).
    // This function in the service might become the single source for profile updates.
  },

  /**
   * Removes a specific menu ID from the user's menu_ids list in Firestore.
   */
  async removeMenuFromUserList(userId: string, menuId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    console.log(`UserService(FS): Removing menu ${menuId} from user ${userId}'s list.`);
    try {
      const userDocRef = getDocRef(userId);
      // Use arrayRemove to remove the menuId
      await updateDoc(userDocRef, {
        menu_ids: arrayRemove(menuId)
      });
      console.log(`UserService(FS): Successfully removed menu ${menuId} from user ${userId}'s list.`);
    } catch (error) {
      // Log error but don't necessarily throw, deleting the menu doc is the primary action
      console.error(`UserService(FS): Error removing menu ${menuId} from user ${userId}'s list:`, error);
    }
  },

}; 