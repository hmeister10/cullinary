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
    this.dishes = [
      // Breakfast dishes
      {
        dish_id: "b1",
        name: "Avocado Toast",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?avocado-toast",
      },
      {
        dish_id: "b2",
        name: "Pancakes with Maple Syrup",
        category: "Breakfast",
        is_healthy: false,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?pancakes",
      },
      {
        dish_id: "b3",
        name: "Eggs Benedict",
        category: "Breakfast",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?eggs-benedict",
      },
      {
        dish_id: "b4",
        name: "Greek Yogurt with Berries",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?yogurt-berries",
      },
      {
        dish_id: "b5",
        name: "Breakfast Burrito",
        category: "Breakfast",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?breakfast-burrito",
      },
      {
        dish_id: "b6",
        name: "Oatmeal with Fruits",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?oatmeal",
      },
      {
        dish_id: "b7",
        name: "French Toast",
        category: "Breakfast",
        is_healthy: false,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?french-toast",
      },
      {
        dish_id: "b8",
        name: "Breakfast Sandwich",
        category: "Breakfast",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?breakfast-sandwich",
      },
      {
        dish_id: "b9",
        name: "Smoothie Bowl",
        category: "Breakfast",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?smoothie-bowl",
      },
      {
        dish_id: "b10",
        name: "Shakshuka",
        category: "Breakfast",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?shakshuka",
      },

      // Lunch dishes
      {
        dish_id: "l1",
        name: "Chicken Caesar Salad",
        category: "Lunch",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?caesar-salad",
      },
      {
        dish_id: "l2",
        name: "Veggie Wrap",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?veggie-wrap",
      },
      {
        dish_id: "l3",
        name: "Beef Burger with Fries",
        category: "Lunch",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?burger-fries",
      },
      {
        dish_id: "l4",
        name: "Quinoa Bowl",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?quinoa-bowl",
      },
      {
        dish_id: "l5",
        name: "Tuna Sandwich",
        category: "Lunch",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?tuna-sandwich",
      },
      {
        dish_id: "l6",
        name: "Pasta Primavera",
        category: "Lunch",
        is_healthy: false,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?pasta-primavera",
      },
      {
        dish_id: "l7",
        name: "Chicken Wrap",
        category: "Lunch",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?chicken-wrap",
      },
      {
        dish_id: "l8",
        name: "Falafel Plate",
        category: "Lunch",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?falafel",
      },
      {
        dish_id: "l9",
        name: "Beef Stir Fry",
        category: "Lunch",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?beef-stir-fry",
      },
      {
        dish_id: "l10",
        name: "Margherita Pizza",
        category: "Lunch",
        is_healthy: false,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?margherita-pizza",
      },

      // Dinner dishes
      {
        dish_id: "d1",
        name: "Grilled Salmon",
        category: "Dinner",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?grilled-salmon",
      },
      {
        dish_id: "d2",
        name: "Vegetable Curry",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?vegetable-curry",
      },
      {
        dish_id: "d3",
        name: "Steak with Mashed Potatoes",
        category: "Dinner",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?steak-potatoes",
      },
      {
        dish_id: "d4",
        name: "Eggplant Parmesan",
        category: "Dinner",
        is_healthy: false,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?eggplant-parmesan",
      },
      {
        dish_id: "d5",
        name: "Grilled Chicken with Vegetables",
        category: "Dinner",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?grilled-chicken",
      },
      {
        dish_id: "d6",
        name: "Mushroom Risotto",
        category: "Dinner",
        is_healthy: false,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?mushroom-risotto",
      },
      {
        dish_id: "d7",
        name: "Fish Tacos",
        category: "Dinner",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?fish-tacos",
      },
      {
        dish_id: "d8",
        name: "Vegetable Lasagna",
        category: "Dinner",
        is_healthy: false,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?vegetable-lasagna",
      },
      {
        dish_id: "d9",
        name: "Beef Stew",
        category: "Dinner",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?beef-stew",
      },
      {
        dish_id: "d10",
        name: "Stuffed Bell Peppers",
        category: "Dinner",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?stuffed-peppers",
      },

      // Snack dishes
      {
        dish_id: "s1",
        name: "Mixed Nuts",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?mixed-nuts",
      },
      {
        dish_id: "s2",
        name: "Chocolate Chip Cookies",
        category: "Snack",
        is_healthy: false,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?chocolate-cookies",
      },
      {
        dish_id: "s3",
        name: "Beef Jerky",
        category: "Snack",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?beef-jerky",
      },
      {
        dish_id: "s4",
        name: "Fruit Salad",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?fruit-salad",
      },
      {
        dish_id: "s5",
        name: "Cheese and Crackers",
        category: "Snack",
        is_healthy: false,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?cheese-crackers",
      },
      {
        dish_id: "s6",
        name: "Protein Bar",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?protein-bar",
      },
      {
        dish_id: "s7",
        name: "Chicken Wings",
        category: "Snack",
        is_healthy: false,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?chicken-wings",
      },
      {
        dish_id: "s8",
        name: "Hummus with Veggies",
        category: "Snack",
        is_healthy: true,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?hummus-veggies",
      },
      {
        dish_id: "s9",
        name: "Ice Cream",
        category: "Snack",
        is_healthy: false,
        preference: "Veg",
        image_url: "https://source.unsplash.com/random/300x300/?ice-cream",
      },
      {
        dish_id: "s10",
        name: "Shrimp Cocktail",
        category: "Snack",
        is_healthy: true,
        preference: "Non-Veg",
        image_url: "https://source.unsplash.com/random/300x300/?shrimp-cocktail",
      },
    ]
  }

  // Create a new user
  async createUser(userId: string): Promise<UserData> {
    const userData: UserData = {
      user_id: userId,
      swipes: {},
    }
    this.users[userId] = userData
    return userData
  }

  // Get user data
  async getUser(userId: string): Promise<UserData | null> {
    return this.users[userId] || null
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
    const menu = this.menus[menuId]
    if (!menu) return null

    // Add user to participants if not already there
    if (!menu.participants.includes(userId)) {
      menu.participants.push(userId)
      menu.status = "in_progress"
    }

    // Update user with menu ID
    if (!this.users[userId]) {
      await this.createUser(userId)
    }
    this.users[userId].menu_id = menuId

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
    const user = this.users[userId]
    if (!user) return []

    // Filter dishes by category and not already swiped
    let availableDishes = this.dishes.filter(
      (dish) =>
        dish.category.toLowerCase() === category.toLowerCase() &&
        !Object.prototype.hasOwnProperty.call(user.swipes, dish.dish_id),
    )

    // If no dishes are available, recycle dishes that were previously swiped
    if (availableDishes.length === 0) {
      // Reset swipes for this category
      const categoryDishes = this.dishes.filter(
        (dish) => dish.category.toLowerCase() === category.toLowerCase()
      )
      
      // Clear swipes for this category to recycle dishes
      categoryDishes.forEach(dish => {
        delete user.swipes[dish.dish_id]
      })
      
      // Return all dishes for this category
      availableDishes = categoryDishes
    }

    return availableDishes
  }
}

// Create and export a singleton instance
export const mockDB = new MockDatabase()

