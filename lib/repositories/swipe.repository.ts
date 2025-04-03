import { setDoc, serverTimestamp } from 'firebase/firestore';
import { BaseRepository } from './base.repository';
import type { FirestoreSwipe } from '../types/firestore-types';

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
    
    // Use a compound ID to ensure uniqueness
    const swipeId = `${userId}_${dishId}_${menuId}`;
    await setDoc(this.getDocRef(swipeId), swipeData);
  }

  async checkForMatch(menuId: string, dishId: string): Promise<boolean> {
    // Get all swipes for this dish in this menu
    const swipesSnapshot = await this.getDocsByField('menu_id', menuId);
    const dishSwipes = swipesSnapshot.docs
      .map(doc => doc.data() as FirestoreSwipe)
      .filter(swipe => swipe.dish_id === dishId);

    // Count likes
    const likeCount = dishSwipes.filter(swipe => swipe.is_liked).length;
    
    // Get menu participants
    const menuDoc = await this.getDoc(menuId);
    if (!menuDoc.exists()) {
      return false;
    }
    
    const menuData = menuDoc.data() as {participants: string[]};
    const participants = menuData.participants;
    
    if (participants.length < 2) {
      return false; // Need at least 2 participants for a match
    }
    
    // If all participants liked it, it's a match
    return likeCount === participants.length;
  }
} 