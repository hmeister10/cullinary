import { db } from './firebase';
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
  serverTimestamp
} from 'firebase/firestore';
import type { Menu, Dish, MenuMatches } from './mock-data';

// Collection references
const MENUS_COLLECTION = 'menus';
const USERS_COLLECTION = 'users';
const SWIPES_COLLECTION = 'swipes';

export interface FirestoreMenu extends Omit<Menu, 'matches'> {
  matches: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snack: string[];
  };
  created_at: any; // Firestore timestamp
}

export interface FirestoreUser {
  user_id: string;
  menu_ids: string[];
  created_at: any; // Firestore timestamp
}

export interface FirestoreSwipe {
  user_id: string;
  dish_id: string;
  menu_id: string;
  is_liked: boolean;
  created_at: any; // Firestore timestamp
}

export const firestoreService = {
  // Create a new menu
  async createMenu(startDate: string, endDate: string, userId: string): Promise<string> {
    try {
      // Generate a random menu ID (6 characters)
      const menuId = Math.random().toString(36).substring(2, 8).toUpperCase();
      
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
      await setDoc(doc(db, MENUS_COLLECTION, menuId), menuData);
      
      // Add menu to user's menu list
      await this.addMenuToUser(userId, menuId);
      
      return menuId;
    } catch (error) {
      console.error('Error creating menu in Firestore:', error);
      throw error;
    }
  },
  
  // Get a menu by ID
  async getMenu(menuId: string): Promise<Menu | null> {
    try {
      const menuDoc = await getDoc(doc(db, MENUS_COLLECTION, menuId));
      
      if (!menuDoc.exists()) {
        return null;
      }
      
      const menuData = menuDoc.data() as FirestoreMenu;
      
      // Convert Firestore format to app format
      return {
        menu_id: menuData.menu_id,
        start_date: menuData.start_date,
        end_date: menuData.end_date,
        participants: menuData.participants,
        status: menuData.status,
        matches: await this.getMenuMatches(menuId, menuData.matches)
      };
    } catch (error) {
      console.error('Error getting menu from Firestore:', error);
      throw error;
    }
  },
  
  // Join an existing menu
  async joinMenu(menuId: string, userId: string): Promise<boolean> {
    try {
      const menuDoc = await getDoc(doc(db, MENUS_COLLECTION, menuId));
      
      if (!menuDoc.exists()) {
        return false;
      }
      
      // Add user to participants
      await updateDoc(doc(db, MENUS_COLLECTION, menuId), {
        participants: arrayUnion(userId)
      });
      
      // Add menu to user's menu list
      await this.addMenuToUser(userId, menuId);
      
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
      await setDoc(doc(db, SWIPES_COLLECTION, swipeId), swipeData);
    } catch (error) {
      console.error('Error recording swipe in Firestore:', error);
      throw error;
    }
  },
  
  // Check for a match
  async checkForMatch(menuId: string, dishId: string): Promise<boolean> {
    try {
      // Get the menu
      const menuDoc = await getDoc(doc(db, MENUS_COLLECTION, menuId));
      
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
        collection(db, SWIPES_COLLECTION),
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
        await updateDoc(doc(db, MENUS_COLLECTION, menuId), {
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
  async addMenuToUser(userId: string, menuId: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      
      if (!userDoc.exists()) {
        // Create user if not exists
        await setDoc(doc(db, USERS_COLLECTION, userId), {
          user_id: userId,
          menu_ids: [menuId],
          created_at: serverTimestamp()
        });
      } else {
        // Update existing user
        await updateDoc(doc(db, USERS_COLLECTION, userId), {
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
    // This would normally fetch dish details from a dishes collection
    // For now, we'll use the mock data
    // In a real app, you'd fetch the dish details from Firestore
    
    // Placeholder implementation
    return {
      breakfast: firestoreMatches.breakfast.map(id => ({ 
        dish_id: id,
        name: `Breakfast Dish ${id}`,
        category: 'Breakfast',
        is_healthy: true,
        preference: 'Veg',
        image_url: `https://source.unsplash.com/random/300x300/?breakfast-${id}`
      })),
      lunch: firestoreMatches.lunch.map(id => ({ 
        dish_id: id,
        name: `Lunch Dish ${id}`,
        category: 'Lunch',
        is_healthy: true,
        preference: 'Veg',
        image_url: `https://source.unsplash.com/random/300x300/?lunch-${id}`
      })),
      dinner: firestoreMatches.dinner.map(id => ({ 
        dish_id: id,
        name: `Dinner Dish ${id}`,
        category: 'Dinner',
        is_healthy: true,
        preference: 'Veg',
        image_url: `https://source.unsplash.com/random/300x300/?dinner-${id}`
      })),
      snack: firestoreMatches.snack.map(id => ({ 
        dish_id: id,
        name: `Snack Dish ${id}`,
        category: 'Snack',
        is_healthy: true,
        preference: 'Veg',
        image_url: `https://source.unsplash.com/random/300x300/?snack-${id}`
      }))
    };
  },
  
  // Get user's menus
  async getUserMenus(userId: string): Promise<Menu[]> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      
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
  }
}; 