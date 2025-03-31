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
  type Unsubscribe
} from 'firebase/firestore';
import { mockDB, type Dish, type Menu, type MenuMatches } from './mock-data';

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

export interface FirestoreMenu extends Omit<Menu, 'matches'> {
  matches: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snack: string[];
  };
  created_at: Timestamp | FieldValue; // Firestore timestamp or server timestamp
  player1Id?: string; // Example: Creator ID
  player2Id?: string; // Example: Partner ID
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
    try {
      // Generate a random menu ID (6 characters)
      const menuId = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log(`Firestore: Generated menu ID: ${menuId}`);
      
      const menuData: FirestoreMenu = {
        menu_id: menuId,
        start_date: startDate,
        end_date: endDate,
        participants: [userId],
        matches: {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: []
        },
        status: 'pending',
        created_at: serverTimestamp()
      };
      
      // Save to Firestore
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
      
      // Convert Firestore format to app format
      return {
        menu_id: menuData.menu_id,
        start_date: menuData.start_date,
        end_date: menuData.end_date,
        participants: menuData.participants,
        status: menuData.status,
        matches: await this.getMenuMatches(normalizedMenuId, menuData.matches)
      };
    } catch (error) {
      console.error('Error getting menu from Firestore:', error);
      throw error;
    }
  },
  
  // Join an existing menu
  async joinMenu(menuId: string, userId: string, userName?: string): Promise<boolean> {
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
  async checkForMatch(menuId: string, dishId: string): Promise<boolean> {
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
        // Add to matches in the appropriate category
        // First, get the dish category
        const dishCategory = dishId.charAt(0);
        let category: keyof typeof menuData.matches;
        
        switch (dishCategory) {
          case 'b':
            category = 'breakfast';
            break;
          case 'l':
            category = 'lunch';
            break;
          case 'd':
            category = 'dinner';
            break;
          case 's':
            category = 'snack';
            break;
          default:
            throw new Error(`Unknown dish category: ${dishCategory}`);
        }
        
        // Update the menu with the match
        await updateDoc(getDocRef(MENUS_COLLECTION, menuId), {
          [`matches.${category}`]: arrayUnion(dishId)
        });
      }
      
      return isMatch;
    } catch (error) {
      console.error('Error checking for match in Firestore:', error);
      throw error;
    }
  },
  
  // Helper: Add menu to user's menu list
  async addMenuToUser(userId: string, menuId: string, userName?: string): Promise<void> {
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
  
  // Helper: Get full menu matches with dish details
  async getMenuMatches(menuId: string, firestoreMatches: FirestoreMenu['matches']): Promise<MenuMatches> {
    const allDishes = await mockDB.getAllDishes();
    const dishMap = new Map<string, Dish>();
    allDishes.forEach((dish: Dish) => {
      dishMap.set(dish.dish_id, dish);
    });
    
    // Helper function to safely map and filter IDs to Dishes
    const mapAndFilterDishes = (ids: string[]): Dish[] => {
      return ids
        .map(id => dishMap.get(id)) // Map ID to Dish object (or undefined)
        .filter((dish): dish is Dish => dish !== undefined); // Filter out undefined results
    };

    return {
      breakfast: mapAndFilterDishes(firestoreMatches.breakfast),
      lunch: mapAndFilterDishes(firestoreMatches.lunch),
      dinner: mapAndFilterDishes(firestoreMatches.dinner),
      snack: mapAndFilterDishes(firestoreMatches.snack)
    };
  },
  
  // Get user's menus
  async getUserMenus(userId: string): Promise<Menu[]> {
    try {
      const userDoc = await getDoc(getDocRef(USERS_COLLECTION, userId));
      
      if (!userDoc.exists()) {
        return [];
      }
      
      const userData = userDoc.data() as FirestoreUser;
      const menuIds = userData.menu_ids || [];
      
      // Fetch all menus
      const menus: Menu[] = [];
      
      for (const menuId of menuIds) {
        const menu = await this.getMenu(menuId);
        if (menu) {
          menus.push(menu);
        }
      }
      
      return menus;
    } catch (error) {
      console.error('Error getting user menus from Firestore:', error);
      throw error;
    }
  },
  
  // Update user name
  async updateUserName(userId: string, name: string): Promise<void> {
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
    try {
      const userDoc = await getDoc(getDocRef(USERS_COLLECTION, userId));
      
      if (!userDoc.exists()) {
        return; // User doesn't exist, nothing to remove
      }
      
      const userData = userDoc.data() as FirestoreUser;
      const updatedMenuIds = userData.menu_ids.filter(id => id !== menuId);
      
      // Update user document with filtered menu list
      await updateDoc(getDocRef(USERS_COLLECTION, userId), {
        menu_ids: updatedMenuIds
      });
      
      console.log(`Removed menu ${menuId} from user ${userId}'s menu list`);
    } catch (error) {
      console.error('Error removing menu from user in Firestore:', error);
      throw error;
    }
  },
  
  // Check if a menu exists
  async menuExists(menuId: string): Promise<boolean> {
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
    if (!isFirebaseAvailable() || !menu || !menu.menu_id) {
      throw new Error('Firestore is not available or invalid menu');
    }

    try {
      const menuRef = getDocRef(MENUS_COLLECTION, menu.menu_id);
      
      // Convert Menu to FirestoreMenu format
      const firestoreMatches = {
        breakfast: menu.matches.breakfast.map(dish => dish.dish_id),
        lunch: menu.matches.lunch.map(dish => dish.dish_id),
        dinner: menu.matches.dinner.map(dish => dish.dish_id),
        snack: menu.matches.snack.map(dish => dish.dish_id)
      };
      
      // Get the existing menu to preserve created_at
      const menuDoc = await getDoc(menuRef);
      if (!menuDoc.exists()) {
        throw new Error(`Menu with ID ${menu.menu_id} not found`);
      }
      
      const existingMenu = menuDoc.data() as FirestoreMenu;
      
      // Update the menu document
      await updateDoc(menuRef, {
        start_date: menu.start_date,
        end_date: menu.end_date,
        participants: menu.participants,
        matches: firestoreMatches,
        status: menu.status,
        // Preserve created_at from existing menu
        created_at: existingMenu.created_at
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
    try {
      const normalizedMenuId = menuId.toUpperCase();
      console.log(`Firestore: Setting up listener for menu ID: ${normalizedMenuId}`);
      const menuRef = getDocRef(MENUS_COLLECTION, normalizedMenuId);

      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(menuRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
          console.log(`Firestore: Received update for menu: ${normalizedMenuId}`);
          const menuData = docSnapshot.data() as FirestoreMenu;
          
          // Convert Firestore format to app format (including potential player IDs)
          const appMenu: Menu = {
            menu_id: menuData.menu_id,
            start_date: menuData.start_date,
            end_date: menuData.end_date,
            participants: menuData.participants,
            status: menuData.status,
            // Map Firestore fields to your Menu type fields
            // Ensure these fields exist on your Menu type in mock-data.ts
            player1Id: menuData.player1Id, 
            player2Id: menuData.player2Id, 
            // Fetch and include matches
            matches: await this.getMenuMatches(normalizedMenuId, menuData.matches)
          };
          callback(appMenu); // Pass the formatted data to the callback
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
}; 