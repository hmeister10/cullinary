export type MenuStatus = "pending" | "in_progress" | "completed"
export type MealCategory = "Breakfast" | "Lunch" | "Dinner" | "Snack"
export type DietPreference = "Veg" | "Non-Veg"

export interface Dish {
  dish_id: string
  name: string
  category: MealCategory
  is_healthy: boolean
  preference: DietPreference
  image_url: string
}

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
    this.initializeDishes()
  }

  // Initialize with sample dishes
  private initializeDishes() {
    // Single placeholder image for all dishes
    const placeholderImage = "/assets/food-placeholder.svg";
    
    this.dishes = [
      // Breakfast dishes
      {
        dish_id: "b1",
        name: "Veg Sandwich",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b2",
        name: "Boiled Egg Sandwich",
        category: "Breakfast",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b3",
        name: "Boiled Chicken Sandwich",
        category: "Breakfast",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b4",
        name: "Tuna Sandwich",
        category: "Breakfast",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b5",
        name: "Toasters",
        category: "Breakfast",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b6",
        name: "Ham Sandwich",
        category: "Breakfast",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b7",
        name: "French Toast",
        category: "Breakfast",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b8",
        name: "Scrambled Eggs",
        category: "Breakfast",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b9",
        name: "Pancake (Oats and Banana)",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b10",
        name: "Kheema Pav",
        category: "Breakfast",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b11",
        name: "Baked Beans and Toast",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b12",
        name: "Sabudana Khichdi",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b13",
        name: "Aloo Poha",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b14",
        name: "OG Dosa",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b15",
        name: "Salsa Chappie",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b16",
        name: "Upma",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b17",
        name: "Vermicelli",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b18",
        name: "Omelette",
        category: "Breakfast",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b19",
        name: "Masoor Dal Dosa",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b20",
        name: "Oats Dosa",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b21",
        name: "Sai Bhaji Ki Tikki",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "b22",
        name: "Cereal and Milk",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },

      // Lunch dishes
      {
        dish_id: "l1",
        name: "Boneless Chicken in Malvani Masala",
        category: "Lunch",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l2",
        name: "Boneless Chicken in Green Masala",
        category: "Lunch",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l3",
        name: "Mutton Kheema",
        category: "Lunch",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l4",
        name: "Chicken Biryani",
        category: "Lunch",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l5",
        name: "Chicken Tikka Masala",
        category: "Lunch",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l6",
        name: "Chicken Afghani Masala",
        category: "Lunch",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l7",
        name: "Chicken Achari Masala",
        category: "Lunch",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l8",
        name: "Aloo Paratha",
        category: "Lunch",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l9",
        name: "Paneer Paratha",
        category: "Lunch",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l10",
        name: "Methi Thepla",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l11",
        name: "Dal Thepla",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l12",
        name: "Bhindi Aloo",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l13",
        name: "Methi Rice",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l14",
        name: "Methi Matar Malai",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l15",
        name: "Methi Aloo",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l16",
        name: "Jeera Aloo",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l17",
        name: "Parathe Walla Aloo Sabzi",
        category: "Lunch",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l18",
        name: "Dum Aloo",
        category: "Lunch",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l19",
        name: "Brown Rice and Jeera Aloo",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l20",
        name: "Chawli and Roti",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l21",
        name: "Channa and Roti",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l22",
        name: "Rajma and Rice",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l23",
        name: "Tomato Potato and Roti",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l24",
        name: "Gobi Aloo",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l25",
        name: "Dudhi Thepla",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l26",
        name: "Paneer ka Sabzi",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l27",
        name: "Gobi Peas",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l28",
        name: "Cabbage Carrot ka Sabzi",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l29",
        name: "Bhindi Masala Sukka",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "l30",
        name: "Bhindi Basar",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },

      // Dinner dishes
      {
        dish_id: "d1",
        name: "Creamy Garlic Grilled Chicken",
        category: "Dinner",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d2",
        name: "Spaghetti Aglio Olio",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d3",
        name: "Pasta in Pumpkin Red Sauce",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d4",
        name: "Pasta in Bell Pepper White Sauce",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d5",
        name: "Hakka Noodles in Chilli Oil",
        category: "Dinner",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d6",
        name: "Thai Curry and Rice",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d7",
        name: "Chicken Kheema",
        category: "Dinner",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d8",
        name: "Pasta in Cauliflower White Sauce",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d9",
        name: "Spaghetti Bolognese",
        category: "Dinner",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d10",
        name: "Spaghetti and Meatballs",
        category: "Dinner",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d11",
        name: "Paneer Frankie",
        category: "Dinner",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d12",
        name: "Dahi Kadi",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d13",
        name: "Rai ki Bhaji",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d14",
        name: "Moong Dal and Jowari Roti",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d15",
        name: "Tur Dal and Rice",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d16",
        name: "Thick Dal and Roti",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d17",
        name: "Missal Pav",
        category: "Dinner",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d18",
        name: "Pav Bhaji",
        category: "Dinner",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d19",
        name: "Grilled Chicken and Veggies",
        category: "Dinner",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d20",
        name: "Kofta Curry",
        category: "Dinner",
        is_healthy: false,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d21",
        name: "Baked Fish and Veggies",
        category: "Dinner",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "d22",
        name: "Prawn Curry Rice",
        category: "Dinner",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: placeholderImage,
      },

      // Snack dishes (a few from your list that could be snacks)
      {
        dish_id: "s1",
        name: "Boiled Arbi",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "s2",
        name: "Bhindi Dahi Masala",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "s3",
        name: "French Beans ka Sabzi",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "s4",
        name: "Sukkha Karela",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "s5",
        name: "Karela Sabzi",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "s6",
        name: "Sukka Dudhi",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "s7",
        name: "Dudhi in Coconut Gravy",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "s8",
        name: "Meha ka Sabzi",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "s9",
        name: "Mushroom ka Sabzi",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
      {
        dish_id: "s10",
        name: "Sukka Pumpkin",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: placeholderImage,
      },
    ]
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
  async getDishes(category: string, userId: string): Promise<Dish[]> {
    // Make sure we have dishes initialized
    if (this.dishes.length === 0) {
      this.initializeDishes();
    }
    
    // Get user or create if not exists
    let user = this.users[userId];
    if (!user) {
      user = await this.createUser(userId);
    }
    
    // Filter dishes by category
    const categoryDishes = this.dishes.filter(
      (dish) => dish.category.toLowerCase() === category.toLowerCase()
    );
    
    // Return all dishes for this category
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

