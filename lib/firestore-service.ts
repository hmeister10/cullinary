import { db, isFirebaseAvailable } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  onSnapshot,
  type Firestore,
  type DocumentReference,
  type CollectionReference,
  type Timestamp,
  type FieldValue,
  type Unsubscribe,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';
// import { mockDB, type Dish, type Menu, type MenuMatches } from './mock-data';
// import { type Dish as FirestoreDish } from "./dishes"; // Assuming Dish type is defined/exported here

// Import necessary types using alias paths again
import { type Menu, type MenuMatches } from "@/lib/types/menu-types"; 
import { type Dish } from "@/lib/types/dish-types"; 
import { type User } from "@/lib/types/user-types";

// Define UserSwipes interface here
interface UserSwipes {
  [dishId: string]: boolean // true for right swipe, false for left swipe
}

// Collection references
const MENUS_COLLECTION = 'menus';
const USERS_COLLECTION = 'users';
const SWIPES_COLLECTION = 'swipes';

// Helper function to ensure Firestore is available
function getFirestore(): Firestore {
  if (!db || !isFirebaseAvailable()) {
    throw new Error('Firestore is not available');
  }
  return db;
}

// Helper function to get a document reference
function getDocRef(collection: string, id: string): DocumentReference {
  return doc(getFirestore(), collection, id);
}

// Helper function to get a collection reference
function getCollectionRef(collectionName: string): CollectionReference {
  return collection(getFirestore(), collectionName);
}

// Define FirestoreMenu interface (includes createdBy)
export interface FirestoreMenu extends Omit<Menu, 'matches' | 'createdBy'> { // Omit fields handled differently
  matches: { // Store matches as string arrays
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snack: string[];
  };
  createdBy: string; // Creator's user ID
  createdAt: Timestamp | FieldValue; // Use Firestore timestamp types
  // Remove player1Id, player2Id unless actually used
}

export interface FirestoreUser {
  user_id: string;
  name?: string;
  menu_ids: string[];
  created_at: Timestamp | FieldValue; // Firestore timestamp or server timestamp
}

export interface FirestoreSwipe {
  user_id: string;
  dish_id: string;
  menu_id: string;
  is_liked: boolean;
  created_at: Timestamp | FieldValue; // Firestore timestamp or server timestamp
}

export const firestoreService = {
  // Create a new menu
  async createMenu(startDate: string, endDate: string, userId: string, userName?: string): Promise<string> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      const menuId = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log(`Firestore: Generated menu ID: ${menuId}`);
      
      const menuData: FirestoreMenu = { // Use FirestoreMenu type
        menu_id: menuId,
        start_date: startDate,
        end_date: endDate,
        participants: [userId],
        matches: { breakfast: [], lunch: [], dinner: [], snack: [] },
        status: 'pending',
        createdBy: userId, // Add creator ID
        createdAt: serverTimestamp() // Corrected field name
      };
      
      await setDoc(getDocRef(MENUS_COLLECTION, menuId), menuData);
      console.log(`Firestore: Saved menu with ID: ${menuId}`);
      
      // Add menu to user's menu list
      await this.addMenuToUser(userId, menuId, userName);
      console.log(`Firestore: Added menu ${menuId} to user ${userId}`);
      
      return menuId;
    } catch (error) {
      console.error('Error creating menu in Firestore:', error);
      throw error;
    }
  },
  
  // Get a menu by ID
  async getMenu(menuId: string): Promise<Menu | null> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      // Normalize menu ID to uppercase
      const normalizedMenuId = menuId.toUpperCase();
      console.log(`Firestore: Attempting to get menu with ID: ${normalizedMenuId}`);
      
      const menuDoc = await getDoc(getDocRef(MENUS_COLLECTION, normalizedMenuId));
      
      if (!menuDoc.exists()) {
        console.log(`Firestore: Menu with ID ${normalizedMenuId} not found`);
        return null;
      }
      
      console.log(`Firestore: Found menu with ID: ${normalizedMenuId}`);
      const menuData = menuDoc.data() as FirestoreMenu;
      
      // Get raw match IDs
      const rawMatches = await this.getMenuMatches(normalizedMenuId, menuData.matches);

      // Convert Firestore format to app format (Menu type)
      return {
        menu_id: menuData.menu_id,
        start_date: menuData.start_date,
        end_date: menuData.end_date,
        participants: menuData.participants,
        status: menuData.status,
        matches: rawMatches,
        createdBy: menuData.createdBy, // Add createdBy field
        createdAt: menuData.createdAt // Add createdAt field
      };
    } catch (error) {
      console.error('Error getting menu from Firestore:', error);
      throw error;
    }
  },
  
  // Join an existing menu
  async joinMenu(menuId: string, userId: string, userName?: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      // Normalize menu ID to uppercase
      const normalizedMenuId = menuId.toUpperCase();
      console.log(`Firestore: Attempting to join menu with ID: ${normalizedMenuId} for user: ${userId}`);
      
      const menuDoc = await getDoc(getDocRef(MENUS_COLLECTION, normalizedMenuId));
      
      if (!menuDoc.exists()) {
        console.log(`Firestore: Menu with ID ${normalizedMenuId} not found during join attempt`);
        return false;
      }
      
      // Check if user is already a participant
      const menuData = menuDoc.data() as FirestoreMenu;
      if (menuData.participants.includes(userId)) {
        console.log(`Firestore: User ${userId} is already a participant in menu ${normalizedMenuId}`);
        return true; // User is already joined, consider this a success
      }
      
      // Add user to participants
      await updateDoc(getDocRef(MENUS_COLLECTION, normalizedMenuId), {
        participants: arrayUnion(userId)
      });
      console.log(`Firestore: Added user ${userId} to menu ${normalizedMenuId} participants`);
      
      // Add menu to user's menu list
      await this.addMenuToUser(userId, normalizedMenuId, userName);
      console.log(`Firestore: Added menu ${normalizedMenuId} to user ${userId}'s menu list`);
      
      return true;
    } catch (error) {
      console.error('Error joining menu in Firestore:', error);
      throw error;
    }
  },
  
  // Record a swipe
  async recordSwipe(userId: string, dishId: string, menuId: string, isLiked: boolean): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      const swipeData: FirestoreSwipe = {
        user_id: userId,
        dish_id: dishId,
        menu_id: menuId,
        is_liked: isLiked,
        created_at: serverTimestamp()
      };
      
      // Use a compound ID to ensure uniqueness
      const swipeId = `${userId}_${dishId}_${menuId}`;
      await setDoc(getDocRef(SWIPES_COLLECTION, swipeId), swipeData);
    } catch (error) {
      console.error('Error recording swipe in Firestore:', error);
      throw error;
    }
  },
  
  // Check for a match
  async checkForMatch(menuId: string, dishId: string, category: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      // Get the menu
      const menuDoc = await getDoc(getDocRef(MENUS_COLLECTION, menuId));
      
      if (!menuDoc.exists()) {
        return false;
      }
      
      const menuData = menuDoc.data() as FirestoreMenu;
      
      // Get all participants
      const participants = menuData.participants;
      
      if (participants.length < 2) {
        return false; // Need at least 2 participants for a match
      }
      
      // Check if all participants liked this dish
      const swipesQuery = query(
        getCollectionRef(SWIPES_COLLECTION),
        where('menu_id', '==', menuId),
        where('dish_id', '==', dishId)
      );
      
      const swipesSnapshot = await getDocs(swipesQuery);
      
      // Count likes
      let likeCount = 0;
      swipesSnapshot.forEach(doc => {
        const swipeData = doc.data() as FirestoreSwipe;
        if (swipeData.is_liked) {
          likeCount++;
        }
      });
      
      // If all participants liked it, it's a match
      const isMatch = likeCount === participants.length;
      
      if (isMatch) {
        // --- Use the passed-in category --- 
        // REMOVE: const dish = await this.getDishById(dishId); 
        // REMOVE: if (!dish || !dish.category) { ... } 
        
        // Use the provided category string directly
        const dishCategoryName = category.toLowerCase();
        // ----------------------------------
        
        // Determine which matches field to update
        let categoryKey: keyof FirestoreMenu['matches'] | null = null; // Use FirestoreMenu type here
        switch (dishCategoryName) {
          case 'breakfast': categoryKey = 'breakfast'; break;
          case 'lunch': categoryKey = 'lunch'; break;
          case 'dinner': categoryKey = 'dinner'; break;
          case 'snack': categoryKey = 'snack'; break;
          default:
            // Log error but don't throw, maybe the category from CSV is slightly different?
            console.error(`checkForMatch Error: Received unexpected dish category name: ${dishCategoryName} for dishId: ${dishId}`);
            return false; // Cannot update matches
        }
        
        // Update the menu with the match ID (not the full dish object)
        await updateDoc(getDocRef(MENUS_COLLECTION, menuId), {
          [`matches.${categoryKey}`]: arrayUnion(dishId)
        });
        console.log(`Firestore: Added match ${dishId} to category ${categoryKey} for menu ${menuId}`);
      }
      
      return isMatch;
    } catch (error) {
      console.error('Error checking for match in Firestore:', error);
      throw error;
    }
  },
  
  // Helper: Add menu to user's menu list
  async addMenuToUser(userId: string, menuId: string, userName?: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      const userDoc = await getDoc(getDocRef(USERS_COLLECTION, userId));
      
      if (!userDoc.exists()) {
        // Create user if not exists
        await setDoc(getDocRef(USERS_COLLECTION, userId), {
          user_id: userId,
          name: userName || null,
          menu_ids: [menuId],
          created_at: serverTimestamp()
        });
      } else {
        // Update existing user
        await updateDoc(getDocRef(USERS_COLLECTION, userId), {
          menu_ids: arrayUnion(menuId)
        });
      }
    } catch (error) {
      console.error('Error adding menu to user in Firestore:', error);
      throw error;
    }
  },
  
  // Helper: Get menu matches (returns only dish IDs)
  async getMenuMatches(menuId: string, firestoreMatches: FirestoreMenu['matches']): Promise<FirestoreMenu['matches']> {
    // Simply return the string arrays from Firestore
    return firestoreMatches; 
  },
  
  // Get user's menus
  async getUserMenus(userId: string): Promise<Menu[]> {
    if (!db) throw new Error("Firestore not initialized");
    console.log(`Firestore: Getting menus for user: ${userId}`);
    try {
      const menusCollection = collection(db, MENUS_COLLECTION);
      const q = query(menusCollection, where("participants", "array-contains", userId));
      
      const querySnapshot = await getDocs(q);
      const menus: Menu[] = [];
      querySnapshot.forEach((doc) => {
        menus.push({ ...doc.data(), menu_id: doc.id } as Menu);
      });
      
      console.log(`Firestore: Found ${menus.length} menus for user ${userId}`);
      return menus;
    } catch (error) {
      console.error(`Error fetching menus for user ${userId}:`, error);
      throw new Error("Failed to fetch user menus from Firestore.");
    }
  },
  
  // Update user name
  async updateUserName(userId: string, name: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      const userDoc = await getDoc(getDocRef(USERS_COLLECTION, userId));
      
      if (!userDoc.exists()) {
        // Create user if not exists
        await setDoc(getDocRef(USERS_COLLECTION, userId), {
          user_id: userId,
          name: name,
          menu_ids: [],
          created_at: serverTimestamp()
        });
      } else {
        // Update existing user
        await updateDoc(getDocRef(USERS_COLLECTION, userId), {
          name: name
        });
      }
    } catch (error) {
      console.error('Error updating user name in Firestore:', error);
      throw error;
    }
  },
  
  // Get menu participants
  async getMenuParticipants(menuId: string): Promise<string[]> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      const menuDoc = await getDoc(getDocRef(MENUS_COLLECTION, menuId));
      
      if (!menuDoc.exists()) {
        return [];
      }
      
      const menuData = menuDoc.data() as FirestoreMenu;
      const participants: string[] = [];
      
      // Get participant names
      for (const userId of menuData.participants) {
        try {
          const userDoc = await getDoc(getDocRef(USERS_COLLECTION, userId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as FirestoreUser;
            participants.push(userData.name || userId);
          } else {
            participants.push(userId);
          }
        } catch (error) {
          console.error(`Error getting user ${userId}:`, error);
          participants.push(userId);
        }
      }
      
      return participants;
    } catch (error) {
      console.error('Error getting menu participants from Firestore:', error);
      throw error;
    }
  },
  
  // Remove a menu from a user's menu list
  async removeMenuFromUser(userId: string, menuId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    console.log(`Firestore: Removing user ${userId} from menu ${menuId}`);
    try {
      const menuDocRef = doc(db, MENUS_COLLECTION, menuId);
      await updateDoc(menuDocRef, {
        participants: arrayRemove(userId)
      });
      console.log(`Firestore: Successfully removed user ${userId} from menu ${menuId}`);
    } catch (error) {
      console.error(`Error removing user ${userId} from menu ${menuId}:`, error);
      throw new Error("Failed to remove user from menu in Firestore.");
    }
  },
  
  // Check if a menu exists
  async menuExists(menuId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      // Normalize menu ID to uppercase
      const normalizedMenuId = menuId.toUpperCase();
      console.log(`Firestore: Checking if menu with ID: ${normalizedMenuId} exists`);
      
      const menuDoc = await getDoc(getDocRef(MENUS_COLLECTION, normalizedMenuId));
      const exists = menuDoc.exists();
      
      console.log(`Firestore: Menu with ID ${normalizedMenuId} ${exists ? 'exists' : 'does not exist'}`);
      return exists;
    } catch (error) {
      console.error('Error checking if menu exists in Firestore:', error);
      return false;
    }
  },

  // Add updateMenu method to the FirestoreService class
  async updateMenu(menu: Menu): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    if (!isFirebaseAvailable() || !menu || !menu.menu_id) {
      throw new Error('Firestore is not available or invalid menu');
    }

    try {
      const menuRef = getDocRef(MENUS_COLLECTION, menu.menu_id);
      
      // The menu object already contains string arrays in matches
      // No conversion needed here
      const firestoreMatches = menu.matches; 
      
      const menuDoc = await getDoc(menuRef);
      if (!menuDoc.exists()) {
        throw new Error(`Menu with ID ${menu.menu_id} not found`);
      }
      
      const existingMenu = menuDoc.data() as FirestoreMenu;
      
      await updateDoc(menuRef, {
        start_date: menu.start_date,
        end_date: menu.end_date,
        participants: menu.participants,
        matches: firestoreMatches, // Pass the string arrays directly
        status: menu.status,
        created_at: existingMenu.createdAt 
      });
    } catch (error) {
      console.error('Error updating menu in Firestore:', error);
      throw error;
    }
  },

  // ADD subscribeToMenuUpdates function
  subscribeToMenuUpdates(
    menuId: string, 
    callback: (menu: Menu | null) => void
  ): Unsubscribe {
    if (!db) throw new Error("Firestore not initialized");
    try {
      const normalizedMenuId = menuId.toUpperCase();
      console.log(`Firestore: Setting up listener for menu ID: ${normalizedMenuId}`);
      const menuRef = getDocRef(MENUS_COLLECTION, normalizedMenuId);

      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(menuRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
          console.log(`Firestore: Received update for menu: ${normalizedMenuId}`);
          const menuData = docSnapshot.data() as FirestoreMenu;
          
          // Get raw match IDs
          const rawMatches = await this.getMenuMatches(normalizedMenuId, menuData.matches);

          // Convert Firestore format to app format (Menu type)
          const appMenu: Menu = {
            menu_id: menuData.menu_id,
            start_date: menuData.start_date,
            end_date: menuData.end_date,
            participants: menuData.participants,
            status: menuData.status,
            matches: rawMatches, 
            createdBy: menuData.createdBy, // Add createdBy
            createdAt: menuData.createdAt // Add createdAt
          };
          callback(appMenu); 
        } else {
          console.log(`Firestore: Menu ${normalizedMenuId} does not exist or was deleted.`);
          callback(null); // Notify the caller that the menu doesn't exist
        }
      }, (error) => {
        console.error(`Firestore: Error in onSnapshot listener for menu ${normalizedMenuId}:`, error);
        // Propagate error or handle as needed
        callback(null); // Indicate an issue by passing null
      });

      // Return the unsubscribe function provided by onSnapshot
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up menu subscription in Firestore:', error);
      // Return a no-op function if setup fails, so the caller doesn't crash
      return () => { console.warn("Firestore subscription setup failed, returning no-op unsubscribe.") }; 
    }
  },
  // END subscribeToMenuUpdates function

  // GET USER NAME BY ID
  async getUserNameById(userId: string): Promise<string | null> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      console.log(`Firestore: Attempting to get user name for ID: ${userId}`);
      const userDoc = await getDoc(getDocRef(USERS_COLLECTION, userId));
      
      if (!userDoc.exists()) {
        console.log(`Firestore: User with ID ${userId} not found`);
        return null;
      }
      
      const userData = userDoc.data() as FirestoreUser;
      console.log(`Firestore: Found user ${userId}, name: ${userData.name}`);
      return userData.name || null; // Return name or null if not set
    } catch (error) {
      console.error(`Error getting user name for ID ${userId} from Firestore:`, error);
      // Don't throw, just return null to indicate failure
      return null; 
    }
  },
  // END GET USER NAME BY ID

  // GET USER NAMES BY IDS
  async getUserNamesByIds(userIds: string[]): Promise<Map<string, string | null>> {
    if (!db) throw new Error("Firestore not initialized");
    const namesMap = new Map<string, string | null>();
    if (!userIds || userIds.length === 0) {
      return namesMap; // Return empty map if no IDs provided
    }

    console.log(`Firestore: Attempting to get user names for IDs: ${userIds.join(', ')}`);
    
    // Fetch user documents in parallel for efficiency
    const promises = userIds.map(async (id) => {
      try {
        const userDoc = await getDoc(getDocRef(USERS_COLLECTION, id));
        if (userDoc.exists()) {
          const userData = userDoc.data() as FirestoreUser;
          namesMap.set(id, userData.name || null); // Store name or null
        } else {
          namesMap.set(id, null); // User not found
        }
      } catch (error) {
        console.error(`Error getting user name for ID ${id} from Firestore:`, error);
        namesMap.set(id, null); // Set null on error
      }
    });

    await Promise.all(promises); // Wait for all fetches to complete
    
    console.log(`Firestore: Fetched names map:`, namesMap);
    return namesMap;
  },
  // END GET USER NAMES BY IDS

  // GET USER SWIPES FOR A MENU
  async getUserSwipesForMenu(userId: string, menuId: string): Promise<UserSwipes> {
    if (!db) throw new Error("Firestore not initialized");
    const userSwipes: UserSwipes = {};
    try {
      console.log(`Firestore: Getting swipes for user ${userId} on menu ${menuId}`);
      const swipesQuery = query(
        getCollectionRef(SWIPES_COLLECTION),
        where('user_id', '==', userId),
        where('menu_id', '==', menuId)
      );
      
      const swipesSnapshot = await getDocs(swipesQuery);
      
      swipesSnapshot.forEach(doc => {
        const swipeData = doc.data() as FirestoreSwipe;
        userSwipes[swipeData.dish_id] = swipeData.is_liked;
      });
      
      console.log(`Firestore: Found ${swipesSnapshot.size} swipes for user ${userId} on menu ${menuId}`);
      return userSwipes;
    } catch (error) {
      console.error(`Error getting user swipes for menu ${menuId} from Firestore:`, error);
      // Return empty object on error, so the app doesn't crash
      return {}; 
    }
  },
  // END GET USER SWIPES FOR A MENU

  // GET DISH BY ID FROM FIRESTORE
  async getDishById(dishId: string): Promise<Dish | null> {
    if (!db) throw new Error("Firestore not initialized");
    try {
      console.log(`Firestore: Getting dish by ID: ${dishId}`);
      const dishRef = getDocRef('dishes', dishId); // Use 'dishes' collection
      const dishDoc = await getDoc(dishRef);
      
      if (!dishDoc.exists()) {
        console.warn(`Firestore: Dish with ID ${dishId} not found.`);
        return null;
      }
      
      // Assuming the document data matches the Dish type
      const dishData = dishDoc.data() as Dish;
      console.log(`Firestore: Found dish: ${dishData.name}`);
      return dishData;
    } catch (error) {
      console.error(`Error getting dish ${dishId} from Firestore:`, error);
      return null; // Return null on error
    }
  },
  // END GET DISH BY ID

  // GET DISHES BY CATEGORY FROM FIRESTORE
  async getDishesByCategory(category: string): Promise<Dish[]> {
    if (!db) throw new Error("Firestore not initialized");
    const dishes: Dish[] = [];
    try {
      const lowerCaseCategory = category.toLowerCase();
      console.log(`Firestore: Getting dishes for category: ${lowerCaseCategory}`);
      
      const dishesQuery = query(
        getCollectionRef('dishes'),
        where('category', '==', lowerCaseCategory) // Ensure case-insensitive query matches field in Firestore
        // Add other potential filters like preference later if needed via query or client-side
      );
      
      const querySnapshot = await getDocs(dishesQuery);
      
      querySnapshot.forEach((doc) => {
        // Assuming document data matches the Dish type
        dishes.push(doc.data() as Dish);
      });
      
      console.log(`Firestore: Found ${dishes.length} dishes for category ${category}`);
      return dishes;
    } catch (error) {
      console.error(`Error getting dishes for category ${category} from Firestore:`, error);
      return []; // Return empty array on error
    }
  },
  // END GET DISHES BY CATEGORY

  // Deletes a menu document entirely.
  // Should only be called by the menu creator.
  async deleteMenuDocument(menuId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    console.log(`Firestore: Attempting to delete menu document: ${menuId}`);
    try {
      const menuDocRef = doc(db, MENUS_COLLECTION, menuId);
      await deleteDoc(menuDocRef);
      console.log(`Firestore: Successfully deleted menu document: ${menuId}`);
    } catch (error) {
      console.error(`Error deleting menu document ${menuId}:`, error);
      throw new Error("Failed to delete menu document in Firestore.");
    }
  },
}; 