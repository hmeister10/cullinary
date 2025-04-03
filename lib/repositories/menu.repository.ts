import { setDoc, serverTimestamp } from 'firebase/firestore';
import { BaseRepository } from './base.repository';
import type { FirestoreMenu } from '../types/firestore-types';

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
      await this.updateDoc(menuId, {
        participants: [...menu.participants, userId]
      });
    }

    return true;
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
    await this.updateDoc(menuId, data);
    return await this.getMenu(menuId);
  }

  async deleteMenu(menuId: string): Promise<boolean> {
    try {
      await this.updateDoc(menuId, {
        status: 'completed'
      });
      return true;
    } catch (error) {
      console.error('Error deleting menu:', error);
      return false;
    }
  }
} 