import { setDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { BaseRepository } from './base.repository';
import type { FirestoreMenu } from '../types/firestore-types';
import type { Dish } from '@/lib/types/dish-types'; // Assuming Dish type is needed

export class MenuRepository extends BaseRepository {
  constructor() {
    super('menus');
  }

  async createMenu(startDate: Date, endDate: Date, userId: string): Promise<string> {
    const menuId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const menuData: FirestoreMenu = {
      menu_id: menuId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      participants: [userId],
      status: 'pending',
      matches: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
      },
      created_at: serverTimestamp()
    };
    
    await setDoc(this.getDocRef(menuId), menuData);
    return menuId;
  }

  async getMenu(menuId: string): Promise<FirestoreMenu | null> {
    const doc = await this.getDoc(menuId);
    return doc.exists() ? doc.data() as FirestoreMenu : null;
  }

  async joinMenu(menuId: string, userId: string): Promise<boolean> {
    const menu = await this.getMenu(menuId);
    if (!menu) {
      return false;
    }

    if (!menu.participants.includes(userId)) {
      await updateDoc(this.getDocRef(menuId), {
        participants: arrayUnion(userId)
      });
    }

    return true;
  }

  async addMatch(menuId: string, dishId: string, category: string): Promise<boolean> {
    try {
      const fieldPath = `matches.${category}`;
      await updateDoc(this.getDocRef(menuId), {
        [fieldPath]: arrayUnion(dishId)
      });
      console.log(`Atomically added match ${dishId} to ${category} for menu ${menuId}`);
      return true;
    } catch (error) {
      console.error(`Error adding match ${dishId} to menu ${menuId}:`, error);
      return false;
    }
  }

  async removeMatch(menuId: string, dishId: string, category: string): Promise<boolean> {
    try {
      const fieldPath = `matches.${category}`;
      await updateDoc(this.getDocRef(menuId), {
        [fieldPath]: arrayRemove(dishId)
      });
      console.log(`Atomically removed match ${dishId} from ${category} for menu ${menuId}`);
      return true;
    } catch (error) {
      console.error(`Error removing match ${dishId} from menu ${menuId}:`, error);
      return false;
    }
  }

  async getMenuParticipants(menuId: string): Promise<string[]> {
    const menu = await this.getMenu(menuId);
    return menu?.participants || [];
  }

  async menuExists(menuId: string): Promise<boolean> {
    const menu = await this.getMenu(menuId);
    return menu !== null;
  }

  async updateMenu(menuId: string, data: Partial<FirestoreMenu>): Promise<FirestoreMenu | null> {
    try {
      await updateDoc(this.getDocRef(menuId), data);
      return await this.getMenu(menuId);
    } catch (error) {
      console.error(`Error updating menu ${menuId}:`, error);
      return null;
    }
  }

  async deleteMenu(menuId: string): Promise<boolean> {
    try {
      await updateDoc(this.getDocRef(menuId), {
        status: 'completed'
      });
      return true;
    } catch (error) {
      console.error('Error deleting menu:', error);
      return false;
    }
  }
} 