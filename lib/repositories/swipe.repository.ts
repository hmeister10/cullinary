import { setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, Firestore } from 'firebase/firestore';
import { BaseRepository } from './base.repository';
import type { FirestoreSwipe } from '../types/firestore-types';
import { db } from '../firebase'; // Assuming db is exported from your firebase config

export class SwipeRepository extends BaseRepository {
  constructor() {
    super('swipes');
  }

  async recordSwipe(userId: string, dishId: string, menuId: string, isLiked: boolean): Promise<void> {
    const swipeData: FirestoreSwipe = {
      user_id: userId,
      dish_id: dishId,
      menu_id: menuId,
      is_liked: isLiked,
      created_at: serverTimestamp()
    };
    
    // Use a compound ID to ensure uniqueness if a user can only swipe once per dish per menu
    const swipeId = `${userId}_${dishId}_${menuId}`;
    await setDoc(this.getDocRef(swipeId), swipeData);
  }

  async checkForMatch(menuId: string, dishId: string, participants: string[]): Promise<boolean> {
    console.log(`Checking for match: Menu=${menuId}, Dish=${dishId}, Participants=${participants.length}`);
    
    // Need at least 2 participants for a match
    if (!participants || participants.length < 2) {
      console.log('Not enough participants for a match.');
      return false;
    }
    
    // Ensure db is available
    if (!db) {
      console.error("Firestore database instance is not available.");
      return false;
    }

    // Query for all LIKE swipes for this specific dish in this menu
    const swipesRef = collection(db as Firestore, 'swipes'); // Use the collection name directly
    const q = query(swipesRef, 
      where('menu_id', '==', menuId), 
      where('dish_id', '==', dishId),
      where('is_liked', '==', true) // Only fetch likes
    );
    
    const swipesSnapshot = await getDocs(q);
    const likeCount = swipesSnapshot.size;
    console.log(`Found ${likeCount} like(s) for Dish=${dishId} in Menu=${menuId}`);

    // If the number of likes equals the number of participants, it's a match
    const isMatch = likeCount === participants.length;
    console.log(`Match result: ${isMatch}`);
    return isMatch;
  }

  // New method to get all dish IDs swiped by a user for a specific menu
  async getUserSwipedDishIds(userId: string, menuId: string): Promise<Set<string>> {
    console.log(`%c[SwipeRepository] Fetching swiped dish IDs for User=${userId}, Menu=${menuId}`, 'color: magenta;');
    if (!db) {
      console.error("Firestore database instance is not available.");
      return new Set();
    }
    if (!userId || !menuId) {
      console.warn("[SwipeRepository] Missing userId or menuId for fetching swipes.");
      return new Set();
    }
    
    const swipedDishIds = new Set<string>();
    try {
      const swipesRef = collection(db as Firestore, 'swipes');
      const q = query(swipesRef, 
        where('user_id', '==', userId),
        where('menu_id', '==', menuId)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreSwipe;
        if (data.dish_id) {
          swipedDishIds.add(data.dish_id);
        }
      });
      console.log(`%c[SwipeRepository] Found ${swipedDishIds.size} swiped dishes for User=${userId}, Menu=${menuId}`, 'color: magenta;');
    } catch (error) {
      console.error(`[SwipeRepository] Error fetching user swipes for Menu=${menuId}:`, error);
      // Return empty set on error, maybe add toast?
    }
    return swipedDishIds;
  }
} 