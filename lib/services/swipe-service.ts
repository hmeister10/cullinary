import { type Menu, type MenuMatches } from "@/lib/types/menu-types";
import { type UserSwipes, type SwipeStatus } from "@/lib/types/swipe-types";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion,
  serverTimestamp,
  type Timestamp, 
  type FieldValue
} from "firebase/firestore";

// --- Firestore Constants ---
const USER_MENU_SWIPES_COLLECTION = "userMenuSwipes";
const MENUS_COLLECTION = "menus"; // Needed for checkForMatch

// --- Helper Functions (Consider moving to utils) ---
function getDocRef(collectionName: string, id: string) {
  if (!db) throw new Error("Firestore not initialized");
  return doc(db, collectionName, id);
}

// --- Types ---
// Represents the document in the userMenuSwipes collection
export interface FirestoreUserMenuSwipeDoc {
  userId: string;
  menuId: string;
  swipedDishes: UserSwipes; // Map of dishId to 'like'|'dislike'
  lastUpdated: Timestamp | FieldValue;
}

// Minimal representation of Menu needed for checkFotMatch
interface MenuParticipantInfo {
    participants: string[];
}

// --- Service Logic ---
export const swipeService = {

  /**
   * Records a swipe action (like/dislike) for a user on a specific dish within a menu.
   * Stores swipes in a single document per user/menu combination.
   */
  async recordSwipe(userId: string, dishId: string, menuId: string, swipeStatus: SwipeStatus): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    const docId = `${userId}_${menuId}`; // Document ID is user_menu
    const docRef = getDocRef(USER_MENU_SWIPES_COLLECTION, docId);
    console.log(`SwipeService(FS): Recording swipe for user ${userId} menu ${menuId}, dish ${dishId} as ${swipeStatus}. Doc ID: ${docId}`);
    try {
      await setDoc(docRef, { 
          userId: userId, 
          menuId: menuId, 
          [`swipedDishes.${dishId}`]: swipeStatus, 
          lastUpdated: serverTimestamp() 
      }, { merge: true }); 
      console.log(`SwipeService(FS): Successfully recorded swipe in ${docId}`);
    } catch (error) {
      console.error(`SwipeService(FS): Error recording swipe in doc ${docId}:`, error);
      throw new Error("Failed to record swipe.");
    }
  },

  /**
   * Gets all swipes (like/dislike map) for a specific user on a specific menu.
   * Reads a single document: userMenuSwipes/userId_menuId.
   */
  async getUserSwipesForMenu(userId: string, menuId: string): Promise<UserSwipes> {
    if (!db) throw new Error("Firestore not initialized");
    const docId = `${userId}_${menuId}`;
    const docRef = getDocRef(USER_MENU_SWIPES_COLLECTION, docId);
    console.log(`SwipeService(FS): Getting swipes for user ${userId}, menu ${menuId}. Doc ID: ${docId}`);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as FirestoreUserMenuSwipeDoc;
        return data.swipedDishes || {}; 
      } else {
        return {}; // No swipes recorded yet
      }
    } catch (error) {
      console.error(`SwipeService(FS): Error getting swipes for doc ${docId}:`, error);
      return {}; // Return empty on error
    }
  },

  /**
   * Checks if a match has occurred for a specific dish in a menu.
   * A match occurs if all participants have 'liked' the dish.
   */
  async checkForMatch(menuId: string, dishId: string, category: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    console.log(`SwipeService(FS): Checking match for menu ${menuId}, dish ${dishId}`);
    try {
      // 1. Get menu participants (only need participant list)
      const menuRef = getDocRef(MENUS_COLLECTION, menuId);
      const menuSnap = await getDoc(menuRef);
      if (!menuSnap.exists()) {
        console.warn(`SwipeService(FS): Menu ${menuId} not found during match check.`);
        return false;
      }
      const menuData = menuSnap.data() as MenuParticipantInfo; // Use minimal interface
      const participants = menuData.participants || [];
      if (participants.length < 2) {
         console.log(`SwipeService(FS): Not enough participants (${participants.length}) for match check.`);
         return false; // Need >= 2 for a match
      }
      console.log(`SwipeService(FS): Found ${participants.length} participants.`);

      // 2. Fetch swipe documents for all participants
      const swipePromises = participants.map(userId => {
        const docId = `${userId}_${menuId}`;
        return getDoc(getDocRef(USER_MENU_SWIPES_COLLECTION, docId));
      });
      const swipeSnapshots = await Promise.all(swipePromises);

      // 3. Check if all participants liked this dish
      let allLiked = true;
      for (const docSnap of swipeSnapshots) {
        if (!docSnap.exists()) {
          console.log(`SwipeService(FS): Participant swipe doc ${docSnap.id} missing. No match.`);
          allLiked = false; break;
        }
        const swipeData = docSnap.data() as FirestoreUserMenuSwipeDoc;
        if (!swipeData.swipedDishes || swipeData.swipedDishes[dishId] !== 'like') {
          console.log(`SwipeService(FS): Participant ${swipeData.userId} did not like dish ${dishId}. No match.`);
          allLiked = false; break;
        }
      }
      console.log(`SwipeService(FS): Match check result: ${allLiked}`);

      // 4. Update menu if match found
      if (allLiked) {
        const categoryKey = category.toLowerCase() as keyof MenuMatches;
        try {
          await updateDoc(menuRef, { [`matches.${categoryKey}`]: arrayUnion(dishId) });
          console.log(`SwipeService(FS): Match found! Updated menu ${menuId} for category ${categoryKey}.`);
        } catch (updateError) {
          console.error(`SwipeService(FS): Error updating menu ${menuId} after match:`, updateError);
        }
      }
      return allLiked;
    } catch (error) {
      console.error(`SwipeService(FS): Error checking for match on menu ${menuId}, dish ${dishId}:`, error);
      return false;
    }
  },
}; 