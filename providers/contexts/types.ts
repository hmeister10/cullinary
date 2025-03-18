import type { Dish } from "@/lib/types/dish-types"
import type { Menu } from "@/lib/types/menu-types"
import type { User, DietaryPreferences } from "@/lib/types/user-types"

// User context types
export interface UserSwipes {
  [dishId: string]: boolean // true for right swipe, false for left swipe
}

export interface UserContextType {
  user: User | null
  loading: boolean
  hasSetName: boolean
  setUserName: (name: string) => Promise<void>
  updateUserProfile: (profile: Partial<User>) => Promise<boolean>
  updateUser: (user: User) => void
}

// Menu context types
export interface MenuContextType {
  activeMenu: Menu | null
  loading: boolean
  createMenu: (startDate: Date, endDate: Date) => Promise<string>
  joinMenu: (menuId: string) => Promise<boolean>
  loadMenu: (menuId: string) => Promise<boolean>
  deleteMenu: (menuId: string) => Promise<boolean>
  getMenuParticipants: (menuId: string) => Promise<string[]>
}

// Swipe context types
export interface SwipeContextType {
  userSwipes: UserSwipes
  swipeOnDish: (dish: Dish, isLiked: boolean) => Promise<boolean>
  fetchDishesToSwipe: (category: string) => Promise<Dish[]>
  removeDishFromShortlist: (dish: Dish, category: string) => Promise<boolean>
} 