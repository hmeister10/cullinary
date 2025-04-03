import { setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { BaseRepository } from './base.repository';
import type { FirestoreUser } from '../types/firestore-types';
import type { DietaryPreferences } from '../types/user-types';

export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async createUser(userId: string, name?: string, preferences?: DietaryPreferences, favorites?: string[]): Promise<void> {
    const userData: FirestoreUser = {
      user_id: userId,
      name: name || null,
      dietary_preferences: preferences || null,
      favorites: favorites || [],
      created_at: serverTimestamp()
    };
    
    await setDoc(this.getDocRef(userId), userData);
  }

  async addMenuToUser(userId: string, menuId: string, userName?: string): Promise<void> {
    const userRef = this.getDocRef(userId);
    
    // If user doesn't exist, create them
    const userDoc = await this.getDoc(userId);
    if (!userDoc.exists()) {
      await this.createUser(userId, userName);
    }
    
    // Add menu to user's menu list
    await updateDoc(userRef, {
      menu_ids: arrayUnion(menuId)
    });
  }

  async removeMenuFromUser(userId: string, menuId: string): Promise<void> {
    const userRef = this.getDocRef(userId);
    await updateDoc(userRef, {
      menu_ids: arrayRemove(menuId)
    });
  }

  async updateUserName(userId: string, name: string): Promise<void> {
    await this.updateDoc(userId, {
      name: name || null
    });
  }

  async updateUserPreferences(userId: string, preferences: DietaryPreferences): Promise<void> {
    await this.updateDoc(userId, {
      dietary_preferences: preferences || null
    });
  }

  async getUser(userId: string): Promise<FirestoreUser | null> {
    const doc = await this.getDoc(userId);
    return doc.exists() ? doc.data() as FirestoreUser : null;
  }

  async getUserMenus(userId: string): Promise<string[]> {
    const user = await this.getUser(userId);
    return user?.menu_ids || [];
  }
} 