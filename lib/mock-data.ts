// Import DietaryPreferences from local-storage
import { DietaryPreferences } from "./local-storage";
import { dishes, Dish } from "./dishes";
export type MenuStatus = "pending" | "in_progress" | "completed"

export interface MenuMatches {
  breakfast: Dish[]
  lunch: Dish[]
  dinner: Dish[]
  snack: Dish[]
}

export interface Menu {
  menu_id: string
  start_date: string
  end_date: string
  participants: string[]
  matches: MenuMatches
  status: MenuStatus
}

export interface UserData {
  user_id: string
  menu_id?: string
  swipes: Record<string, boolean>
}

// Mock database
class MockDatabase {
  private menus: Record<string, Menu> = {}
  private users: Record<string, UserData> = {}
  private dishes: Dish[] = []

  constructor() {
    // Check if dishes are already initialized
    if (this.dishes.length === 0) {
      this.dishes = dishes
    }
  }


  // Create a new user
  async createUser(userId: string): Promise<UserData> {
    console.log(`MockDB: Creating new user with ID: ${userId}`);
    
    const userData: UserData = {
      user_id: userId,
      swipes: {},
    }
    this.users[userId] = userData
    
    console.log(`MockDB: User created successfully. Total users: ${Object.keys(this.users).length}`);
    return userData
  }

  // Get user data
  async getUser(userId: string): Promise<UserData | null> {
    console.log(`MockDB: Getting user with ID: ${userId}`);
    const user = this.users[userId] || null;
    console.log(`MockDB: User found: ${user !== null}`);
    return user;
  }

  // Create a new menu
  async createMenu(startDate: string, endDate: string, userId: string): Promise<Menu> {
    const menuId = Math.random().toString(36).substring(2, 8).toUpperCase()

    const newMenu: Menu = {
      menu_id: menuId,
      start_date: startDate,
      end_date: endDate,
      participants: [userId],
      matches: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      },
      status: "pending",
    }

    this.menus[menuId] = newMenu

    // Update user with menu ID
    if (!this.users[userId]) {
      await this.createUser(userId)
    }
    this.users[userId].menu_id = menuId

    return newMenu
  }

  // Get menu by ID
  async getMenu(menuId: string): Promise<Menu | null> {
    return this.menus[menuId] || null
  }

  // Join an existing menu
  async joinMenu(menuId: string, userId: string): Promise<Menu | null> {
    console.log(`MockDB: Attempting to join menu with ID: ${menuId}`);
    
    // Normalize menu ID to uppercase
    const normalizedMenuId = menuId.toUpperCase();
    
    // Try to find the menu with the normalized ID
    const menu = this.menus[normalizedMenuId];
    
    if (!menu) {
      console.log(`MockDB: Menu with ID ${normalizedMenuId} not found`);
      return null;
    }
    
    console.log(`MockDB: Found menu with ID: ${normalizedMenuId}`);

    // Add user to participants if not already there
    if (!menu.participants.includes(userId)) {
      menu.participants.push(userId)
      menu.status = "in_progress"
      console.log(`MockDB: Added user ${userId} to menu ${normalizedMenuId}`);
    } else {
      console.log(`MockDB: User ${userId} is already a participant in menu ${normalizedMenuId}`);
    }

    // Update user with menu ID
    if (!this.users[userId]) {
      await this.createUser(userId)
    }
    this.users[userId].menu_id = normalizedMenuId
    console.log(`MockDB: Updated user ${userId} with menu ID ${normalizedMenuId}`);

    return menu
  }

  // Record a swipe
  async recordSwipe(userId: string, dishId: string, isLiked: boolean): Promise<boolean> {
    const user = this.users[userId]
    if (!user) return false

    user.swipes[dishId] = isLiked
    return true
  }

  // Check for matches and update menu
  async checkForMatch(menuId: string, dishId: string): Promise<boolean> {
    const menu = this.menus[menuId]
    if (!menu || menu.participants.length < 2) return false

    // Check if both users liked the dish
    const [user1, user2] = menu.participants
    const user1Liked = this.users[user1]?.swipes[dishId]
    const user2Liked = this.users[user2]?.swipes[dishId]

    if (user1Liked && user2Liked) {
      // Find the dish
      const dish = this.dishes.find((d) => d.dish_id === dishId)
      if (!dish) return false

      // Add to matches
      const category = dish.category.toLowerCase() as keyof MenuMatches
      if (!menu.matches[category]) {
        menu.matches[category] = []
      }

      // Only add if not already in matches
      if (!menu.matches[category].some((d) => d.dish_id === dishId)) {
        menu.matches[category].push(dish)
      }

      return true
    }

    return false
  }

  // Get dishes by category
  async getDishes(category: string, userId: string, userPreferences?: DietaryPreferences): Promise<Dish[]> {
    // Get user or create if not exists
    let user = this.users[userId];
    if (!user) {
      user = await this.createUser(userId);
    }
    
    // Filter dishes by category
    let categoryDishes = this.dishes.filter(
      (dish) => dish.category.toLowerCase() === category.toLowerCase()
    );
    
    // If user preferences are provided, filter dishes based on preferences
    if (userPreferences) {
      // Filter by vegetarian preference
      if (userPreferences.isVegetarian) {
        categoryDishes = categoryDishes.filter(dish => dish.preference === "Veg");
      }
      
      // Filter by diet type
      if (userPreferences.dietType) {
        switch (userPreferences.dietType) {
          case "pure-veg":
            categoryDishes = categoryDishes.filter(dish => dish.preference === "Veg");
            break;
          case "egg-veg":
            // Allow egg dishes (which would be marked as Veg in our data)
            categoryDishes = categoryDishes.filter(dish => dish.preference === "Veg");
            break;
          case "vegan":
            // For simplicity, we'll just use Veg since we don't have vegan flag
            categoryDishes = categoryDishes.filter(dish => dish.preference === "Veg");
            break;
          case "jain":
            // For Jain, we'd need more detailed data, but for now just use Veg
            categoryDishes = categoryDishes.filter(dish => dish.preference === "Veg");
            break;
          case "sattvic":
            // For Sattvic, we'd need more detailed data, but for now just use Veg
            categoryDishes = categoryDishes.filter(dish => dish.preference === "Veg");
            break;
          case "non-veg":
            // Allow all dishes, no filtering needed
            break;
          case "flexible":
            // Allow all dishes, no filtering needed
            break;
        }
      }
      
      // Filter out dishes with avoided ingredients
      // This is a simple implementation - in a real app, we'd have ingredient lists for each dish
      if (userPreferences.avoidances && userPreferences.avoidances.length > 0) {
        categoryDishes = categoryDishes.filter(dish => {
          // Check if dish name contains any avoided ingredient
          return !userPreferences.avoidances.some((avoidance: string) => 
            dish.name.toLowerCase().includes(avoidance.toLowerCase())
          );
        });
      }
      
      // Prioritize dishes based on health tags
      if (userPreferences.healthTags && userPreferences.healthTags.includes("fitness")) {
        // Sort healthy dishes first
        categoryDishes.sort((a, b) => {
          if (a.is_healthy && !b.is_healthy) return -1;
          if (!a.is_healthy && b.is_healthy) return 1;
          return 0;
        });
      }
    }
    
    // Return filtered dishes for this category
    return categoryDishes;
  }

  // Update an existing menu
  async updateMenu(menu: Menu): Promise<boolean> {
    if (!menu || !menu.menu_id || !this.menus[menu.menu_id]) {
      return false;
    }
    
    this.menus[menu.menu_id] = menu;
    return true;
  }

  // Get all dishes
  async getAllDishes(): Promise<Dish[]> {
    return this.dishes;
  }
}

// Create and export a singleton instance
export const mockDB = new MockDatabase()

